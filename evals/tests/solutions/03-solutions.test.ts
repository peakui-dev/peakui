import type {TemplateInfo} from "../../src/fixtures/prepare.ts";

import {mkdirSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {fixtures, getFixture} from "../../fixtures/index.ts";
import {copyDir} from "../../src/files.ts";
import {prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";
import {scoreWorkspace} from "../../src/scoring/score.ts";
import {LAYERS} from "../../src/types.ts";
import {
  createWorkspace,
  diffSnapshots,
  overlayDirOf,
  removeWorkspace,
  snapshot,
} from "../../src/workspace/workspace.ts";
import {tasks} from "../../tasks/index.ts";
import {readExpectation, solutionFilesDir, solutionsOf} from "../helpers/solutions.ts";

// EVAL_TASKS=sign-in-form,pending-button narrows the run.
const only = process.env.EVAL_TASKS?.split(",");
const cases = tasks
  .filter((task) => !only || only.includes(task.id))
  .flatMap((task) => solutionsOf(task).map((solution) => ({solution, task})));

const templates = new Map<string, TemplateInfo>();

beforeAll(async () => {
  const pack = await packLibrary();

  for (const fixture of Object.values(fixtures)) {
    templates.set(fixture.id, await prepareTemplate(fixture, pack, {force: false}));
  }
});

describe("reference solutions through the real scorer", () => {
  it.each(cases)("$task.id / $solution", async ({solution, task}) => {
    const expectation = readExpectation(task, solution);
    const workspace = createWorkspace({
      batch: "solutions-test",
      key: `${task.id}__${solution}`,
      overlayDir: overlayDirOf(task),
      templateDir: templates.get(task.fixture)!.dir,
    });

    try {
      const before = snapshot(workspace.dir);

      copyDir(solutionFilesDir(task, solution), workspace.dir);

      const logsDir = join(workspace.scratchDir, "logs");

      mkdirSync(logsDir, {recursive: true});

      const score = await scoreWorkspace({
        changes: diffSnapshots(before, snapshot(workspace.dir)),
        dir: workspace.dir,
        fixture: getFixture(task.fixture),
        logsDir,
        task,
      });

      for (const layer of LAYERS) {
        const failed = score.layers[layer].findings.filter(
          (finding) => finding.gate && !finding.pass,
        );

        expect(
          score.layers[layer].status,
          `${layer}: ${failed.map((f) => `${f.rule} (${f.message})`).join("; ")}`,
        ).toBe(expectation.layers[layer]);
        expect(failed.map((finding) => finding.rule)).toEqual(
          expect.arrayContaining(expectation.rules[layer] ?? []),
        );
      }

      if (solution === "good") {
        expect(score.mistakes).toEqual([]);
        expect(score.passed).toBe(true);
      } else {
        expect(score.passed).toBe(false);
      }
    } finally {
      removeWorkspace(workspace);
    }
  });
});
