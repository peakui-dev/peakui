import type {LayerId, LayerStatus, StaticContext, TaskDefinition} from "../../src/types.ts";

import {existsSync, readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

import {SNAPSHOT_IGNORE, getFixture} from "../../fixtures/index.ts";
import {readFiles, walkFiles} from "../../src/files.ts";
import {PACKAGE_DIR} from "../../src/paths.ts";
import {SOURCE_FILE} from "../../src/scoring/ast.ts";
import {diffSnapshots, overlayDirOf} from "../../src/workspace/workspace.ts";

export interface Expectation {
  layers: Record<LayerId, LayerStatus>;
  rules: Partial<Record<LayerId, string[]>>;
}

function solutionsDir(task: TaskDefinition): string {
  return join(PACKAGE_DIR, "tasks", task.id, "solutions");
}

export function solutionsOf(task: TaskDefinition): string[] {
  const dir = solutionsDir(task);

  if (!existsSync(dir)) return [];

  return readdirSync(dir, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function solutionFilesDir(task: TaskDefinition, solution: string): string {
  return join(solutionsDir(task), solution, "files");
}

export function readExpectation(task: TaskDefinition, solution: string): Expectation {
  return JSON.parse(
    readFileSync(join(solutionsDir(task), solution, "expect.json"), "utf8"),
  ) as Expectation;
}

function textsOf(dir: string): Map<string, string> {
  return new Map(
    readFiles(dir, walkFiles(dir, SNAPSHOT_IGNORE)).map((file) => [file.path, file.text]),
  );
}

/**
 * The static context of a solution without a workspace: the fixture's files, then the task's
 * overlay, are the base; the solution's `files/` laid over it are the result, and `changes` is the
 * difference between the two.
 */
export function inMemoryContext(task: TaskDefinition, solution: string): StaticContext {
  const base = textsOf(getFixture(task.fixture).dir);
  const overlay = overlayDirOf(task);

  if (overlay) for (const [path, text] of textsOf(overlay)) base.set(path, text);

  const result = new Map(base);

  for (const [path, text] of textsOf(solutionFilesDir(task, solution))) result.set(path, text);

  // `diffSnapshots` compares values; whole texts compare as well as hashes do.
  const changes = diffSnapshots(base, result);
  const files = [...result]
    .filter(([path]) => SOURCE_FILE.test(path) || path.endsWith(".css"))
    .map(([path, text]) => ({path, text}))
    .sort((a, b) => (a.path < b.path ? -1 : 1));

  return {changes, file: (path) => files.find((file) => file.path === path), files};
}
