import {mkdirSync, mkdtempSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {hashFiles, readFiles, redact, walkFiles} from "../src/files.ts";
import {snapshot} from "../src/workspace/workspace.ts";

describe("walkFiles", () => {
  it("lists files sorted, relative, and skips ignored segments and suffixes", () => {
    const dir = mkdtempSync(join(tmpdir(), "walk-"));

    mkdirSync(join(dir, "src/components"), {recursive: true});
    mkdirSync(join(dir, "node_modules/x"), {recursive: true});
    writeFileSync(join(dir, "src/components/B.tsx"), "b");
    writeFileSync(join(dir, "src/a.ts"), "a");
    writeFileSync(join(dir, "node_modules/x/index.js"), "x");
    writeFileSync(join(dir, "tsconfig.tsbuildinfo"), "{}");

    expect(walkFiles(dir, ["node_modules", "*.tsbuildinfo"])).toEqual([
      "src/a.ts",
      "src/components/B.tsx",
    ]);
  });
});

describe("symlinks are recorded, never followed", () => {
  function setup() {
    const base = mkdtempSync(join(tmpdir(), "links-"));
    const dir = join(base, "app");

    mkdirSync(join(dir, "src"), {recursive: true});
    mkdirSync(join(base, "elsewhere/deep"), {recursive: true});
    writeFileSync(join(dir, "src/a.ts"), "a");
    writeFileSync(join(base, "elsewhere/deep/inner.ts"), "inner");
    writeFileSync(join(base, "secret.txt"), "TOP SECRET");
    symlinkSync(join(base, "elsewhere"), join(dir, "to-dir"));
    symlinkSync(join(base, "missing"), join(dir, "dangling.ts"));
    symlinkSync(join(base, "secret.txt"), join(dir, "to-outside.txt"));

    return {base, dir};
  }

  it("lists a link to a directory without descending into it", () => {
    const {dir} = setup();
    const paths = walkFiles(dir);

    expect(paths).toContain("to-dir");
    expect(paths.some((path) => path.startsWith("to-dir/"))).toBe(false);
    expect(readFiles(dir, paths).find((file) => file.path === "to-dir")?.text).toMatch(
      /elsewhere$/,
    );
  });

  it("reads a dangling link as its target", () => {
    const {base, dir} = setup();
    const file = readFiles(dir, walkFiles(dir)).find((entry) => entry.path === "dangling.ts");

    expect(file?.text).toBe(join(base, "missing"));
  });

  it("does not read the content a link to an outside file points at", () => {
    const {dir} = setup();
    const file = readFiles(dir, walkFiles(dir)).find((entry) => entry.path === "to-outside.txt");

    expect(file?.text).not.toContain("TOP SECRET");
  });

  it("snapshots all of them without throwing and hashes the target string", () => {
    const {base, dir} = setup();
    const before = snapshot(dir);

    writeFileSync(join(base, "secret.txt"), "CHANGED");
    expect([...before.keys()]).toEqual(["dangling.ts", "src/a.ts", "to-dir", "to-outside.txt"]);
    expect(snapshot(dir).get("to-outside.txt")).toBe(before.get("to-outside.txt"));

    symlinkSync(join(base, "other"), join(dir, "new-link"));
    expect(snapshot(dir).has("new-link")).toBe(true);
  });
});

describe("hashFiles", () => {
  it("does not depend on input order and changes with content", () => {
    const a = {path: "a", text: "1"};
    const b = {path: "b", text: "2"};

    expect(hashFiles([a, b])).toBe(hashFiles([b, a]));
    expect(hashFiles([a, b])).not.toBe(hashFiles([a, {path: "b", text: "3"}]));
    expect(hashFiles([a, b])).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("redact", () => {
  it("replaces the workspace first, then the harness home, then the user home", () => {
    const roots = {
      evalsHome: "/tmp/peakui-evals",
      home: "/Users/jo",
      workspace: "/tmp/peakui-evals/workspaces/b/k",
    };

    expect(redact("/tmp/peakui-evals/workspaces/b/k/src/App.tsx", roots)).toBe(
      "<workspace>/src/App.tsx",
    );
    expect(redact("/tmp/peakui-evals/templates/vite-app", roots)).toBe(
      "<evals-home>/templates/vite-app",
    );
    expect(redact("cat /Users/jo/.npmrc", roots)).toBe("cat ~/.npmrc");
  });
});
