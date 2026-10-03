import type {FileChanges, ProjectFile, StaticContext, TaskDefinition} from "../types.ts";

import {createHash} from "node:crypto";
import {existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync} from "node:fs";
import {basename, dirname, isAbsolute, join, relative, resolve, sep} from "node:path";

import {SNAPSHOT_IGNORE} from "../../fixtures/index.ts";
import {runCommand} from "../exec.ts";
import {cloneDir, copyDir, readEntry, readFiles, walkFiles} from "../files.ts";
import {PACKAGE_DIR, evalsHome, workspacesDir} from "../paths.ts";
import {SOURCE_FILE} from "../scoring/ast.ts";

export const AGENT_FILES: readonly string[] = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  ".claude",
  ".mcp.json",
  ".cursor",
  ".cursorrules",
  ".windsurf",
  ".windsurfrules",
  ".clinerules",
  ".agents",
  ".github/copilot-instructions.md",
  ".github/instructions",
];

export interface Workspace {
  dir: string;
  scratchDir: string;
  /** Hash of the toolchain files at creation; see `toolchainChanged`. */
  toolchain: string;
}

function exists(path: string): boolean {
  try {
    // lstat: a dangling link named like an agent file still counts.
    lstatSync(path);

    return true;
  } catch {
    return false;
  }
}

/**
 * An absolute path with every symlink resolved: the real path of the nearest existing ancestor,
 * then the segments that do not exist yet. This is the chain a process started in `path` sees.
 */
export function realResolve(path: string): string {
  const absolute = resolve(path);
  const rest: string[] = [];
  let current = absolute;

  for (;;) {
    try {
      return join(realpathSync(current), ...rest);
    } catch {
      const parent = dirname(current);

      if (parent === current) return absolute;
      rest.unshift(basename(current));
      current = parent;
    }
  }
}

/** Throws when an ancestor of `dir` holds an agent instruction file the agent would inherit. */
export function assertIsolated(dir: string): void {
  let current = dirname(realResolve(dir));

  for (;;) {
    for (const name of AGENT_FILES) {
      const found = join(current, name);

      if (exists(found)) {
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

const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._=-]{0,127}$/;

export function assertSegment(label: string, value: string): void {
  if (!SEGMENT.test(value) || value === "." || value === "..") {
    throw new Error(
      `invalid workspace ${label} ${JSON.stringify(value)}: use 1 to 128 letters, digits, ".", "_", "=" or "-", starting with a letter or digit`,
    );
  }
}

/** True when `path` is strictly inside `root` once both are resolved through symlinks. */
export function isStrictlyInside(root: string, path: string): boolean {
  const rel = relative(realResolve(root), realResolve(path));

  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

export function createWorkspace(options: {
  templateDir: string;
  overlayDir: string | undefined;
  batch: string;
  key: string;
}): Workspace {
  assertSegment("batch", options.batch);
  assertSegment("key", options.key);

  const root = workspacesDir();
  const base = join(root, options.batch, options.key);
  const dir = join(base, "app");
  const scratchDir = join(base, "scratch");

  if (!isStrictlyInside(root, base)) {
    throw new Error(`invalid workspace location ${base}: outside ${root}`);
  }

  assertIsolated(dir);
  rmSync(base, {force: true, recursive: true});
  mkdirSync(base, {recursive: true});

  try {
    cloneDir(options.templateDir, dir);
    if (options.overlayDir) copyDir(options.overlayDir, dir);
    mkdirSync(scratchDir, {recursive: true});

    return {dir, scratchDir, toolchain: toolchainHash(dir)};
  } catch (error) {
    // A half-built workspace must not be mistaken for a usable one.
    rmSync(base, {force: true, recursive: true});
    throw error;
  }
}

const TOOLCHAIN_FILES = ["package.json", "package-lock.json"];

/**
 * A hash of what executes during scoring: `node_modules/.bin` (names, link targets and, for a link
 * into `node_modules`, the script it points at), `package.json` and the lockfile. The agent may
 * change any of it; the run record carries whether it did.
 */
export function toolchainHash(dir: string): string {
  const hash = createHash("sha256");
  const bin = join(dir, "node_modules", ".bin");
  const modules = join(dir, "node_modules");

  function add(label: string, bytes: Buffer | undefined): void {
    hash.update(
      `${label}\0${bytes ? createHash("sha256").update(bytes).digest("hex") : "absent"}\0`,
    );
  }

  for (const name of TOOLCHAIN_FILES) {
    add(name, exists(join(dir, name)) ? readEntry(dir, name) : undefined);
  }

  let entries: string[] = [];

  try {
    entries = readdirSync(bin).sort();
  } catch {
    // No node_modules/.bin: hashed as an empty list.
  }

  for (const name of entries) {
    const relative = `node_modules/.bin/${name}`;

    add(relative, readEntry(dir, relative));

    // The link target is what actually runs; follow it only while it stays inside node_modules.
    try {
      const real = realpathSync(join(bin, name));

      if (isStrictlyInside(modules, real) && lstatSync(real).isFile()) {
        add(`${relative} -> script`, readEntry(dir, relativeTo(dir, real)));
      }
    } catch {
      // A dangling link has no script; its target string is already hashed above.
    }
  }

  return hash.digest("hex");
}

function relativeTo(dir: string, path: string): string {
  return relative(realResolve(dir), path);
}

/** True when the toolchain of `workspace` differs from what it was at creation. */
export function toolchainChanged(workspace: Workspace): boolean {
  return toolchainHash(workspace.dir) !== workspace.toolchain;
}

export function overlayDirOf(task: TaskDefinition): string | undefined {
  const dir = join(PACKAGE_DIR, "tasks", task.id, "overlay");

  return existsSync(dir) ? dir : undefined;
}

/** Where git looks for configuration, hooks and templates; none of it is the developer's. */
function gitEnvironment(): NodeJS.ProcessEnv {
  const home = join(evalsHome(), "git-home");
  const env: NodeJS.ProcessEnv = {};

  mkdirSync(home, {recursive: true});
  for (const name of ["PATH", "LANG", "LC_ALL", "TMPDIR"]) {
    const value = process.env[name];

    if (value !== undefined) env[name] = value;
  }

  return {
    ...env,
    GIT_AUTHOR_EMAIL: "dev@acme.example",
    GIT_AUTHOR_NAME: "Acme Dev",
    GIT_COMMITTER_EMAIL: "dev@acme.example",
    GIT_COMMITTER_NAME: "Acme Dev",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
    HOME: home,
    XDG_CONFIG_HOME: home,
  };
}

// Disables hooks and signing and fixes the author, whatever any config file says.
const GIT_PINNED = [
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "commit.gpgsign=false",
  "-c",
  "tag.gpgsign=false",
  "-c",
  "user.name=Acme Dev",
  "-c",
  "user.email=dev@acme.example",
];

async function git(dir: string, args: string[]): Promise<void> {
  const result = await runCommand(["git", ...GIT_PINNED, ...args], {
    cwd: dir,
    env: gitEnvironment(),
    timeoutMs: 60_000,
  });

  if (result.exitCode !== 0) {
    throw new Error(
      `git ${args[0]} failed in ${dir}: ${result.stderr.trim() || result.stdout.trim()}`,
    );
  }
}

export async function commitInitialState(dir: string): Promise<void> {
  // An empty template directory: no hooks or info files from a developer's git installation.
  await git(dir, ["init", "-q", "--template="]);
  await git(dir, ["add", "-A"]);
  await git(dir, ["commit", "-q", "--no-verify", "-m", "Initial commit"]);
}

export function snapshot(dir: string): Map<string, string> {
  const map = new Map<string, string>();

  for (const path of walkFiles(dir, SNAPSHOT_IGNORE)) {
    map.set(path, createHash("sha256").update(readEntry(dir, path)).digest("hex"));
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
  const paths = walkFiles(dir, SNAPSHOT_IGNORE).filter(
    (path) => SOURCE_FILE.test(path) || path.endsWith(".css"),
  );

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

/** Removes one workspace directory, and only a path of the exact shape `<root>/<batch>/<key>/app`. */
export function removeWorkspace(workspace: Workspace): void {
  const root = workspacesDir();
  const dir = resolve(workspace.dir);
  const base = dirname(dir);
  const parts = relative(resolve(root), base).split(sep);
  const shaped =
    basename(dir) === "app" &&
    isStrictlyInside(root, base) &&
    parts.length === 2 &&
    parts.every((part) => SEGMENT.test(part));

  if (!shaped) {
    throw new Error(
      `refusing to remove ${workspace.dir}: not a workspace directory inside ${root}`,
    );
  }

  rmSync(base, {force: true, recursive: true});
}
