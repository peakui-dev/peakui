import type {
  FileChanges,
  FixtureDefinition,
  LayerId,
  LayerResult,
  Mistake,
  TaskDefinition,
} from "../types.ts";

import {join} from "node:path";

import {LAYERS} from "../types.ts";
import {staticContext} from "../workspace/workspace.ts";

import {cleanBuildOutput, runBuild, runTypecheck} from "./commands.ts";
import {runRender} from "./render.ts";
import {runStatic} from "./static.ts";

export interface ScoreResult {
  layers: Record<LayerId, LayerResult>;
  passed: boolean;
  mistakes: Mistake[];
}

/** Failed gating findings in `LAYERS` order, de-duplicated by rule, file and line. */
export function collectMistakes(layers: Record<LayerId, LayerResult>): Mistake[] {
  const mistakes: Mistake[] = [];
  const seen = new Set<string>();

  for (const layer of LAYERS) {
    for (const finding of layers[layer].findings) {
      if (!finding.gate || finding.pass) continue;

      const key = `${finding.rule}\0${finding.file ?? ""}\0${finding.line ?? ""}`;

      if (seen.has(key)) continue;
      seen.add(key);
      mistakes.push({
        layer,
        message: finding.message,
        pitfall: finding.pitfall,
        rule: finding.rule,
        ...(finding.excerpt === undefined ? {} : {excerpt: finding.excerpt}),
        ...(finding.file === undefined ? {} : {file: finding.file}),
        ...(finding.line === undefined ? {} : {line: finding.line}),
      });
    }
  }

  return mistakes;
}

export async function scoreWorkspace(options: {
  task: TaskDefinition;
  fixture: FixtureDefinition;
  dir: string;
  changes: FileChanges;
  logsDir: string;
}): Promise<ScoreResult> {
  const {changes, dir, fixture, logsDir, task} = options;

  // Output the agent or the template left behind must not be mistaken for this build's.
  cleanBuildOutput(fixture, dir);

  const typecheck = await runTypecheck(fixture, dir, join(logsDir, "typecheck.log"), {changes});
  const build = await runBuild(fixture, dir, join(logsDir, "build.log"));
  const staticLayer = runStatic(task, staticContext(dir, changes));
  const render = await runRender(task, fixture, dir, join(logsDir, "render.log"));
  const layers: Record<LayerId, LayerResult> = {
    build,
    render,
    static: staticLayer,
    typecheck,
  };

  return {
    layers,
    mistakes: collectMistakes(layers),
    passed: LAYERS.every((layer) => layers[layer].status !== "fail"),
  };
}
