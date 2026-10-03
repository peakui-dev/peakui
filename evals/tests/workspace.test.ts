import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {runCommand} from "../src/exec.ts";
import {
  assertIsolated,
  commitInitialState,
  createWorkspace,
  diffSnapshots,
  projectFiles,
  removeWorkspace,
  snapshot,
  staticContext,
} from "../src/workspace/workspace.ts";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ws-"));
  process.env.PEAKUI_EVALS_HOME = join(root, "home");
});

afterEach(() => {
  delete process.env.PEAKUI_EVALS_HOME;
  rmSync(root, {force: true, recursive: true});
});

function write(path: string, text: string): void {
  mkdirSync(join(path, ".."), {recursive: true});
  writeFileSync(path, text);
}

describe("assertIsolated", () => {
  it.each(["CLAUDE.md", "AGENTS.md", ".mcp.json"])("rejects an ancestor holding %s", (name) => {
    write(join(root, name), "x");

    expect(() => assertIsolated(join(root, "a/b/app"))).toThrow(name);
  });

  it("rejects an ancestor holding a .claude directory", () => {
    mkdirSync(join(root, "a/.claude"), {recursive: true});

    expect(() => assertIsolated(join(root, "a/b/app"))).toThrow(".claude");
  });

  it("accepts a clean chain and ignores agent files inside the workspace itself", () => {
    write(join(root, "a/b/app/AGENTS.md"), "written by a configuration");

    expect(() => assertIsolated(join(root, "a/b/app"))).not.toThrow();
  });
});

describe("createWorkspace", () => {
  it("copies the template, lays the overlay over it and makes a scratch directory", () => {
    write(join(root, "template/src/App.tsx"), "base");
    write(join(root, "template/src/index.css"), "css");
    write(join(root, "overlay/src/App.tsx"), "overlaid");
    write(join(root, "overlay/src/components/Hero.tsx"), "hero");

    const workspace = createWorkspace({
      batch: "b1",
      key: "t__none__r1",
      overlayDir: join(root, "overlay"),
      templateDir: join(root, "template"),
    });

    expect(workspace.dir).toBe(join(root, "home/workspaces/b1/t__none__r1/app"));
    expect(readFileSync(join(workspace.dir, "src/App.tsx"), "utf8")).toBe("overlaid");
    expect(readFileSync(join(workspace.dir, "src/index.css"), "utf8")).toBe("css");
    expect(existsSync(join(workspace.dir, "src/components/Hero.tsx"))).toBe(true);
    expect(existsSync(workspace.scratchDir)).toBe(true);
  });

  it("replaces a leftover workspace of the same key", () => {
    write(join(root, "template/a.ts"), "a");
    const options = {
      batch: "b1",
      key: "k",
      overlayDir: undefined,
      templateDir: join(root, "template"),
    };
    const first = createWorkspace(options);

    write(join(first.dir, "stale.ts"), "stale");

    expect(existsSync(join(createWorkspace(options).dir, "stale.ts"))).toBe(false);
  });
});

describe("workspace path containment", () => {
  function sentinels(): string[] {
    const paths = [
      join(root, "home/sentinel.txt"),
      join(root, "home/workspaces/sentinel.txt"),
      join(root, "home/workspaces/other/k/app/keep.ts"),
      join(root, "outside.txt"),
    ];

    for (const path of paths) write(path, "keep");
    write(join(root, "template/a.ts"), "a");

    return paths;
  }

  function create(batch: string, key: string) {
    return createWorkspace({
      batch,
      key,
      overlayDir: undefined,
      templateDir: join(root, "template"),
    });
  }

  it.each([
    ["", "k"],
    ["b", ""],
    ["", ""],
    [".", "k"],
    ["b", "."],
    ["..", "k"],
    ["b", ".."],
    ["../..", "k"],
    ["b/c", "k"],
    ["b", "k/../../.."],
    ["b\\c", "k"],
    ["b", "k\\..\\.."],
    ["b", "-rf"],
    ["b", "a b"],
    ["b", "k\0x"],
    ["b", "k".repeat(200)],
    ["/abs", "k"],
  ])("refuses batch %j and key %j without touching anything", (batch, key) => {
    const paths = sentinels();

    expect(() => create(batch, key)).toThrow(/invalid workspace/);

    for (const path of paths) expect(existsSync(path), path).toBe(true);
  });

  it("accepts the key shapes the runner produces", () => {
    sentinels();

    expect(() => create("2026-10-03T12-00-00Z", "sign-in-form__none__r1")).not.toThrow();
  });

  it("removes exactly one workspace and nothing around it", () => {
    const paths = sentinels();
    const workspace = create("b", "k");

    removeWorkspace(workspace);

    expect(existsSync(join(root, "home/workspaces/b/k"))).toBe(false);
    for (const path of paths) expect(existsSync(path), path).toBe(true);
  });

  it.each([
    ["the workspaces root", "home/workspaces"],
    ["the harness home", "home"],
    ["a batch directory", "home/workspaces/other/app"],
    ["a path outside the root", "outside-ws/app"],
    ["a path climbing out through ..", "home/workspaces/b/k/../../../../outside-ws/app"],
    ["a directory not named app", "home/workspaces/b/k/other"],
  ])("removeWorkspace refuses %s", (_label, relative) => {
    const paths = sentinels();
    const dir = join(root, relative);

    write(join(root, "outside-ws/app/x"), "x");

    expect(() => removeWorkspace({dir, scratchDir: join(dir, "../scratch")})).toThrow(
      /refusing to remove/,
    );

    for (const path of [...paths, join(root, "outside-ws/app/x")]) {
      expect(existsSync(path), path).toBe(true);
    }
  });
});

describe("snapshot and diff", () => {
  it("reports added, modified and deleted files and skips ignored paths", () => {
    const dir = join(root, "app");

    write(join(dir, "src/keep.ts"), "keep");
    write(join(dir, "src/change.ts"), "one");
    write(join(dir, "src/remove.ts"), "gone");
    write(join(dir, "node_modules/x/index.js"), "x");

    const before = snapshot(dir);

    write(join(dir, "src/change.ts"), "two");
    write(join(dir, "src/new.tsx"), "new");
    write(join(dir, "dist/out.css"), "built");
    write(join(dir, "node_modules/x/index.js"), "changed");
    rmSync(join(dir, "src/remove.ts"));

    expect(diffSnapshots(before, snapshot(dir))).toEqual({
      added: ["src/new.tsx"],
      deleted: ["src/remove.ts"],
      modified: ["src/change.ts"],
    });
  });
});

describe("projectFiles and staticContext", () => {
  it("returns only ts, tsx and css files outside ignored directories", () => {
    const dir = join(root, "app");

    write(join(dir, "src/a.tsx"), "a");
    write(join(dir, "src/b.css"), "b");
    write(join(dir, "package.json"), "{}");
    write(join(dir, "node_modules/x/index.ts"), "x");

    expect(projectFiles(dir).map((file) => file.path)).toEqual(["src/a.tsx", "src/b.css"]);

    const context = staticContext(dir, {added: ["src/a.tsx"], deleted: [], modified: []});

    expect(context.file("src/a.tsx")?.text).toBe("a");
    expect(context.file("missing.ts")).toBeUndefined();
  });
});

describe("commitInitialState", () => {
  it("leaves a repository with one commit and a clean tree", async () => {
    const dir = join(root, "app");

    write(join(dir, "src/a.ts"), "a");
    write(join(dir, ".gitignore"), "node_modules\n");
    await commitInitialState(dir);

    const log = await runCommand(["git", "log", "--oneline"], {cwd: dir, timeoutMs: 10_000});
    const status = await runCommand(["git", "status", "--porcelain"], {
      cwd: dir,
      timeoutMs: 10_000,
    });

    expect(log.stdout.trim().split("\n")).toHaveLength(1);
    expect(log.stdout).toContain("Initial commit");
    expect(status.stdout).toBe("");
  });
});
