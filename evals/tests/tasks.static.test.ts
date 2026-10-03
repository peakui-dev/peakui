import {describe, expect, it} from "vitest";

import {runStatic} from "../src/scoring/static.ts";
import {tasks} from "../tasks/index.ts";

import {inMemoryContext, readExpectation, solutionsOf} from "./helpers/solutions.ts";

const cases = tasks.flatMap((task) => solutionsOf(task).map((solution) => ({solution, task})));

describe("static layer against reference solutions", () => {
  it.each(cases)("$task.id / $solution", ({solution, task}) => {
    const expectation = readExpectation(task, solution);
    const result = runStatic(task, inMemoryContext(task, solution));
    const failed = result.findings
      .filter((finding) => finding.gate && !finding.pass)
      .map((finding) => finding.rule);

    expect(result.status, failed.join(", ")).toBe(expectation.layers.static);
    expect(failed).toEqual(expect.arrayContaining(expectation.rules.static ?? []));

    if (solution === "good") expect(failed).toEqual([]);
  });
});
