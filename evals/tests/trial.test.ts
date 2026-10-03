import type {ScoreResult} from "../src/scoring/score.ts";
import type {LayerId, LayerResult} from "../src/types.ts";

import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {cleanTrials, createTrial, formatList, scoreTrial, trialBatch} from "../src/trial.ts";
import {tasks} from "../tasks/index.ts";

const task = tasks.find((candidate) => candidate.id === "pending-button")!;
let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "trial-"));
  process.env.PEAKUI_EVALS_HOME = join(root, "home");
  write(join(root, "template/package.json"), '{"name":"t"}\n');
  write(join(root, "template/.gitignore"), "node_modules\n");
  write(join(root, "template/src/main.tsx"), "export {};\n");
  write(join(root, "template/node_modules/.bin/tsc"), "#!/bin/sh\n");
});

afterEach(() => {
  delete process.env.PEAKUI_EVALS_HOME;
  rmSync(root, {force: true, recursive: true});
});

function write(path: string, text: string): void {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, text);
}

function gitLog(dir: string): string {
  return execFileSync("git", ["log", "--format=%s"], {cwd: dir, encoding: "utf8"}).trim();
}

function prepare(label = "a", setupDir?: string) {
  return createTrial({label, setupDir, task, templateDir: join(root, "template")});
}

function layerResult(layer: LayerId, findings: LayerResult["findings"] = []): LayerResult {
  const failed = findings.some((finding) => finding.gate && !finding.pass);

  return {durationMs: 5, findings, layer, status: failed ? "fail" : "pass"};
}

function fakeScore(findings: LayerResult["findings"] = []): ScoreResult {
  return {
    layers: {
      build: layerResult("build"),
      render: layerResult("render"),
      static: layerResult("static", findings),
      typecheck: layerResult("typecheck"),
    },
    mistakes: [],
    passed: findings.length === 0,
  };
}

describe("createTrial", () => {
  it("returns the task, label, workspace, prompt and fixture, and commits the initial state", async () => {
    const out = await prepare("run1");

    expect(out).toEqual({
      fixture: "vite-app",
      label: "run1",
      prompt: task.prompt,
      task: "pending-button",
      workspace: out.workspace,
    });
    expect(out.workspace).toContain(join("workspaces", trialBatch("run1")));
    expect(out.workspace.endsWith(`${join("pending-button", "app")}`)).toBe(true);
    expect(existsSync(join(out.workspace, "src/components/SaveBar.tsx"))).toBe(true);
    expect(gitLog(out.workspace)).toBe("Initial commit");
  });

  it.each(["../x", "a/b", "", ".hidden", "a b"])("rejects the label %j", async (label) => {
    await expect(prepare(label)).rejects.toThrow(/invalid workspace/);
  });

  it("copies the setup directory before the initial commit", async () => {
    write(join(root, "setup/AGENTS.md"), "block\n");
    write(join(root, "setup/.peakui/pages/a.md"), "page\n");

    const out = await prepare("s", join(root, "setup"));

    expect(readFileSync(join(out.workspace, "AGENTS.md"), "utf8")).toBe("block\n");
    expect(existsSync(join(out.workspace, ".peakui/pages/a.md"))).toBe(true);
    expect(
      execFileSync("git", ["status", "--porcelain"], {cwd: out.workspace, encoding: "utf8"}),
    ).toBe("");
    expect(execFileSync("git", ["ls-files"], {cwd: out.workspace, encoding: "utf8"})).toContain(
      "AGENTS.md",
    );
  });

  it("refuses a setup that mentions the reference library, in a path or in a text", async () => {
    write(join(root, "bad-text/AGENTS.md"), "see HeroUI docs\n");
    write(join(root, "bad-path/notes/heroui.md"), "x\n");

    await expect(prepare("t", join(root, "bad-text"))).rejects.toThrow(/heroui/i);
    await expect(prepare("p", join(root, "bad-path"))).rejects.toThrow(/heroui/i);
    expect(existsSync(join(root, "home/workspaces", trialBatch("t")))).toBe(false);
  });

  it("refuses a missing setup directory", async () => {
    await expect(prepare("m", join(root, "nope"))).rejects.toThrow(/setup/);
  });
});

describe("scoreTrial", () => {
  it("reports changed files, flags findings in them and writes result.json", async () => {
    write(join(root, "setup/AGENTS.md"), "block\n");

    const out = await prepare("r", join(root, "setup"));

    write(join(out.workspace, "src/components/SaveBar.tsx"), "changed\n");

    const result = await scoreTrial({
      scorer: () =>
        Promise.resolve(
          fakeScore([
            {
              file: "src/components/SaveBar.tsx",
              gate: true,
              line: 3,
              message: "bad",
              pass: false,
              pitfall: "rac-props",
              rule: "press-handler",
            },
            {
              file: "AGENTS.md",
              gate: false,
              line: 1,
              message: "note",
              pass: true,
              pitfall: "other",
              rule: "info",
            },
          ]),
        ),
      task,
      workspace: out.workspace,
    });

    expect(result.passed).toBe(false);
    expect(result.layers.static.status).toBe("fail");
    expect(result.layers.build).toEqual({durationMs: 5, status: "pass"});
    expect(result.changedFiles.modified).toEqual(["src/components/SaveBar.tsx"]);
    expect(result.changedFiles.added).toEqual([]);
    expect(result.toolchainChanged).toBe(false);
    expect(result.findings).toEqual([
      expect.objectContaining({
        changedDuringTrial: true,
        file: "src/components/SaveBar.tsx",
        id: "press-handler",
        layer: "static",
        line: 3,
        pitfall: "rac-props",
      }),
      expect.objectContaining({changedDuringTrial: false, file: "AGENTS.md", id: "info"}),
    ]);
    expect(JSON.parse(readFileSync(join(dirname(out.workspace), "result.json"), "utf8"))).toEqual(
      result,
    );
  });

  it("reports toolchainChanged when package.json changes", async () => {
    const out = await prepare("tc");

    write(join(out.workspace, "package.json"), '{"name":"changed"}\n');

    const result = await scoreTrial({
      scorer: () => Promise.resolve(fakeScore()),
      task,
      workspace: out.workspace,
    });

    expect(result.toolchainChanged).toBe(true);
    expect(result.changedFiles.modified).toContain("package.json");
  });

  it("refuses a directory outside the harness home", async () => {
    write(join(root, "elsewhere/app/x.ts"), "x\n");

    await expect(scoreTrial({task, workspace: join(root, "elsewhere/app")})).rejects.toThrow(
      /not a workspace created by prepare/,
    );
  });

  it("refuses a directory under the home that prepare did not create", async () => {
    mkdirSync(join(root, "home/workspaces/trial-z/pending-button/app"), {recursive: true});

    await expect(
      scoreTrial({task, workspace: join(root, "home/workspaces/trial-z/pending-button/app")}),
    ).rejects.toThrow(/not a workspace created by prepare/);
  });

  it("refuses a workspace prepared for another task", async () => {
    const out = await prepare("o");
    const other = tasks.find((candidate) => candidate.id === "sign-in-form")!;

    await expect(scoreTrial({task: other, workspace: out.workspace})).rejects.toThrow(
      /prepared for task pending-button/,
    );
  });
});

describe("cleanTrials", () => {
  it("removes the workspaces of one label only", async () => {
    const a = await prepare("keep");
    const b = await prepare("drop");

    expect(cleanTrials("drop")).toEqual([b.workspace]);
    expect(existsSync(b.workspace)).toBe(false);
    expect(existsSync(dirname(b.workspace))).toBe(false);
    expect(existsSync(a.workspace)).toBe(true);
    expect(cleanTrials("drop")).toEqual([]);
  });

  it("rejects an unsafe label", () => {
    expect(() => cleanTrials("../home")).toThrow(/invalid workspace/);
  });
});

describe("formatList", () => {
  it("prints one line per task with its title and fixture", () => {
    const lines = formatList(tasks).split("\n");

    expect(lines).toHaveLength(tasks.length);
    expect(lines).toContain("pending-button\tvite-app\tButton in a pending state");
  });
});
