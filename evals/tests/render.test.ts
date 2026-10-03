import type {FixtureDefinition, TaskDefinition} from "../src/types.ts";

import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {check} from "../src/scoring/findings.ts";
import {readBuiltCss, runRender} from "../src/scoring/render.ts";

const fixture: FixtureDefinition = {
  build: [],
  builtCssDir: "dist/assets",
  clean: ["dist"],
  dir: "",
  id: "x",
  prepare: [],
  typecheck: [],
};
const base: TaskDefinition = {
  fixture: "x",
  id: "t",
  pitfalls: [],
  prompt: "p",
  staticChecks: () => [],
  title: "t",
};

function workspace(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "render-"));

  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), {recursive: true});
    writeFileSync(join(dir, path), text);
  }

  return dir;
}

describe("readBuiltCss", () => {
  it("concatenates the built CSS files", () => {
    const dir = workspace({
      "dist/assets/a.css": ".a{color:red}",
      "dist/assets/b.css": ".b{color:blue}",
      "dist/assets/c.js": "x",
    });

    expect(readBuiltCss(fixture, dir)?.toString()).toContain(".b{color:blue}");
  });

  it("is undefined when the build left nothing", () => {
    expect(readBuiltCss(fixture, workspace({"src/a.ts": ""}))).toBeUndefined();
  });
});

describe("runRender", () => {
  it("is not-applicable for a task without a render spec", async () => {
    expect((await runRender(base, fixture, workspace({}), join(tmpdir(), "r.log"))).status).toBe(
      "not-applicable",
    );
  });

  it("reports render-unavailable when the module cannot be rendered", async () => {
    const task: TaskDefinition = {
      ...base,
      render: {
        check: () => [check("never", "other", true, "unreachable")],
        ssr: {cases: [{name: "default", props: {}}], exportName: "Gone", module: "/src/Gone.tsx"},
      },
    };
    const result = await runRender(
      task,
      fixture,
      workspace({"package.json": "{}"}),
      join(tmpdir(), "r.log"),
    );

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.rule)).toEqual(["render-unavailable"]);
  });

  it("reports render-unavailable when the build left no HTML", async () => {
    const task: TaskDefinition = {
      ...base,
      render: {check: () => [], html: {path: ".next/server/app/index.html"}},
    };
    const result = await runRender(
      task,
      fixture,
      workspace({"package.json": "{}"}),
      join(tmpdir(), "r.log"),
    );

    expect(result.findings).toContainEqual(
      expect.objectContaining({pass: false, rule: "render-unavailable"}),
    );
  });

  it("hands the parsed HTML and CSS to the check", async () => {
    const dir = workspace({
      "dist/assets/a.css": ".button{color:red}",
      "out/index.html": "<button class='button'>Go</button>",
    });
    const task: TaskDefinition = {
      ...base,
      render: {
        check: ({css, documents}) => [
          check(
            "has-button",
            "other",
            documents.get("html")?.querySelector("button.button") !== null,
            "button",
          ),
          check("has-css", "other", css !== undefined, "css"),
        ],
        html: {path: "out/index.html"},
      },
    };
    const result = await runRender(task, fixture, dir, join(tmpdir(), "r.log"));

    expect(result.status).toBe("pass");
    expect(result.findings).toHaveLength(2);
  });

  it("turns a crashing check into a finding", async () => {
    const task: TaskDefinition = {
      ...base,
      render: {
        check: () => {
          throw new Error("boom");
        },
      },
    };
    const result = await runRender(task, fixture, workspace({}), join(tmpdir(), "r.log"));

    expect(result.findings).toContainEqual(expect.objectContaining({rule: "render-check-crashed"}));
  });
});
