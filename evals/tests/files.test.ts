import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {hashFiles, redact, walkFiles} from "../src/files.ts";

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
