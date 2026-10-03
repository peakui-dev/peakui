import {existsSync} from "node:fs";

import {describe, expect, it} from "vitest";

import {fixtures} from "../fixtures/index.ts";
import {readFiles, walkFiles} from "../src/files.ts";
import {overlayDirOf} from "../src/workspace/workspace.ts";
import {tasks} from "../tasks/index.ts";

import {readExpectation, solutionFilesDir, solutionsOf} from "./helpers/solutions.ts";

const OTHER_LIBRARIES =
  /hero\s?ui|next\s?ui|shadcn|radix|material[- ]ui|\bmui\b|chakra|mantine|ant design|\bantd\b|daisy\s?ui|headless ui|bootstrap/i;
const ANSWER_LEAKS =
  /isPending|onPress\b|isRequired|isDisabled|isInvalid|FieldError|InputGroup|data-slot|buttonVariants|\btv\(|@source|render prop|use client|classNames|@layer/;

describe("task set", () => {
  it("has unique ids and known fixtures", () => {
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);

    for (const task of tasks) expect(fixtures, task.id).toHaveProperty(task.fixture);
  });

  it.each(tasks)("$id: the prompt names no other library and no answer", (task) => {
    expect(task.prompt.length).toBeGreaterThan(60);
    expect(task.prompt).not.toMatch(OTHER_LIBRARIES);
    expect(task.prompt).not.toMatch(ANSWER_LEAKS);
  });

  it.each(tasks)("$id: the overlay names no other library", (task) => {
    const dir = overlayDirOf(task);
    const files = dir ? readFiles(dir, walkFiles(dir)) : [];

    expect(
      files.filter((file) => OTHER_LIBRARIES.test(file.text)).map((file) => file.path),
    ).toEqual([]);
  });

  it.each(tasks)(
    "$id: has a good solution and at least one bad one, each with files and an expectation",
    (task) => {
      const solutions = solutionsOf(task);

      expect(solutions).toContain("good");
      expect(solutions.filter((name) => name.startsWith("bad-")).length).toBeGreaterThan(0);

      for (const solution of solutions) {
        expect(existsSync(solutionFilesDir(task, solution)), solution).toBe(true);

        const expectation = readExpectation(task, solution);
        const statuses = Object.values(expectation.layers);

        if (solution === "good") expect(statuses).not.toContain("fail");
        else expect(statuses, solution).toContain("fail");
      }
    },
  );
});

describe("pitfall coverage", () => {
  it("exercises every pitfall with at least one task, and has twelve tasks", () => {
    const covered = new Set(tasks.flatMap((task) => task.pitfalls));

    expect([...covered].sort()).toEqual([
      "composition",
      "css-order",
      "fields",
      "imports",
      "no-provider",
      "peers-rsc",
      "rac-props",
      "styling",
      "tailwind-scanning",
      "variants",
    ]);
    expect(tasks).toHaveLength(12);
  });
});
