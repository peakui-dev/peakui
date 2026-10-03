import type {FileChanges, ProjectFile, StaticContext, TaskDefinition} from "../types.ts";

import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, rmSync} from "node:fs";
import {dirname, join} from "node:path";

import {SNAPSHOT_IGNORE} from "../../fixtures/index.ts";
import {runCommand} from "../exec.ts";
import {copyDir, readFiles, walkFiles} from "../files.ts";
import {PACKAGE_DIR, workspacesDir} from "../paths.ts";

export const AGENT_FILES: readonly string[] = [
  "CLAUDE.md",
  "AGENTS.md",
  ".claude",
  ".mcp.json",
  ".cursor",
  ".agents",
];

export interface Workspace {
  dir: string;
  scratchDir: string;
}

/** Throws when an ancestor of `dir` holds an agent instruction file the agent would inherit. */
export function assertIsolated(dir: string): void {
  let current = dirname(dir);

  for (;;) {
    for (const name of AGENT_FILES) {
      const found = join(current, name);

      if (existsSync(found)) {
        throw new Error(
          `workspace location is not isolated: ${found} would be inherited by the agent; set PEAKUI_EVALS_HOME to a clean directory`,
        );
      }
    }

    const parent = dirname(current);

    if (parent === current) return;
    current = parent;
  }
}

export function createWorkspace(options: {
  templateDir: string;
  overlayDir: string | undefined;
  batch: string;
  key: string;
}): Workspace {
  const base = join(workspacesDir(), options.batch, options.key);
  const dir = join(base, "app");
  const scratchDir = join(base, "scratch");

  assertIsolated(dir);
  rmSync(base, {force: true, recursive: true});
  mkdirSync(base, {recursive: true});
  copyDir(options.templateDir, dir);
  if (options.overlayDir) copyDir(options.overlayDir, dir);
  mkdirSync(scratchDir, {recursive: true});

  return {dir, scratchDir};
}

export function overlayDirOf(task: TaskDefinition): string | undefined {
  const dir = join(PACKAGE_DIR, "tasks", task.id, "overlay");

  return existsSync(dir) ? dir : undefined;
}

async function git(dir: string, args: string[]): Promise<void> {
  const result = await runCommand(["git", ...args], {cwd: dir, timeoutMs: 60_000});

  if (result.exitCode !== 0) {
    throw new Error(
      `git ${args[0]} failed in ${dir}: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}

export async function commitInitialState(dir: string): Promise<void> {
  await git(dir, ["init", "-q"]);
  await git(dir, ["add", "-A"]);
  await git(dir, [
    "-c",
    "user.name=Acme Dev",
    "-c",
    "user.email=dev@acme.example",
    "commit",
    "-q",
    "-m",
    "Initial commit",
  ]);
}

export function snapshot(dir: string): Map<string, string> {
  const map = new Map<string, string>();

  for (const path of walkFiles(dir, SNAPSHOT_IGNORE)) {
    map.set(
      path,
      createHash("sha256")
        .update(readFileSync(join(dir, path)))
        .digest("hex"),
    );
  }

  return map;
}

export function diffSnapshots(
  before: Map<string, string>,
  after: Map<string, string>,
): FileChanges {
  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  for (const [path, hash] of after) {
    const old = before.get(path);

    if (old === undefined) added.push(path);
    else if (old !== hash) modified.push(path);
  }
  for (const path of before.keys()) if (!after.has(path)) deleted.push(path);

  return {added: added.sort(), deleted: deleted.sort(), modified: modified.sort()};
}

export function projectFiles(dir: string): ProjectFile[] {
  const paths = walkFiles(dir, SNAPSHOT_IGNORE).filter((path) => /\.(?:ts|tsx|css)$/.test(path));

  return readFiles(dir, paths);
}

export function staticContext(dir: string, changes: FileChanges): StaticContext {
  const files = projectFiles(dir);

  return {
    changes,
    file: (path) => files.find((file) => file.path === path),
    files,
  };
}

export function removeWorkspace(workspace: Workspace): void {
  rmSync(dirname(workspace.dir), {force: true, recursive: true});
}
