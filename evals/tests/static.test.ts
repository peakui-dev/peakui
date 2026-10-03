import type {StaticContext, TaskDefinition} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {check} from "../src/scoring/findings.ts";
import {runStatic} from "../src/scoring/static.ts";

const base: TaskDefinition = {
  fixture: "vite-app",
  id: "t",
  pitfalls: [],
  prompt: "p",
  staticChecks: () => [],
  title: "t",
};

function contextOf(files: Record<string, string>): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {added: list.map((file) => file.path), deleted: [], modified: []},
    file: (path) => list.find((f) => f.path === path),
    files: list,
  };
}

describe("runStatic", () => {
  it("passes with clean files and passing checks", () => {
    const task = {...base, staticChecks: () => [check("x", "other" as const, true, "ok")]};

    expect(runStatic(task, contextOf({"src/a.ts": "export const a = 1;"})).status).toBe("pass");
  });

  it("fails on a detector hit even when the task's checks pass", () => {
    const result = runStatic(
      base,
      contextOf({"src/a.ts": `import {tv} from "tailwind-variants";`}),
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.rule)).toContain("foreign-tv");
  });

  it("turns a changed CSS file that does not parse into a finding", () => {
    const result = runStatic(base, contextOf({"src/index.css": ".a { color: red"}));

    expect(result.findings).toContainEqual(
      expect.objectContaining({file: "src/index.css", pass: false, rule: "unparseable-css"}),
    );
  });

  it("turns a crashing task check into a finding instead of throwing", () => {
    const task = {
      ...base,
      staticChecks: () => {
        throw new Error("boom");
      },
    };
    const result = runStatic(task, contextOf({}));

    expect(result.status).toBe("fail");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining("boom"),
        rule: "static-check-crashed",
      }),
    );
  });
});
