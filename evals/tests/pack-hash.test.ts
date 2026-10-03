import type {HashInputs} from "../src/pack/stage.ts";

import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {libraryInputHash} from "../src/pack/stage.ts";

function put(root: string, files: Record<string, string>): void {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, ".."), {recursive: true});
    writeFileSync(join(root, path), text);
  }
}

function inputs(): HashInputs {
  const root = mkdtempSync(join(tmpdir(), "pack-hash-"));

  put(root, {
    "acme/index.js": "export const a = 1;",
    "react/package.json": "{}",
    "react/src/index.ts": "export const x = 1;",
    "rules.ts": "rules",
    "styles/index.css": "a{}",
    "styles/package.json": "{}",
    "styles/src/index.ts": "export const y = 1;",
  });

  return {
    acmeDir: join(root, "acme"),
    reactDir: join(root, "react"),
    rulesFile: join(root, "rules.ts"),
    stylesDir: join(root, "styles"),
    tools: {tsdown: "1.0.0", typescript: "5.9.3"},
  };
}

describe("libraryInputHash", () => {
  it("is a SHA-256 of the inputs and does not change between calls", () => {
    const given = inputs();

    expect(libraryInputHash(given)).toMatch(/^[0-9a-f]{64}$/);
    expect(libraryInputHash(given)).toBe(libraryInputHash(given));
  });

  it("ignores build output, installed packages, tests and stories", () => {
    const given = inputs();
    const before = libraryInputHash(given);

    put(given.stylesDir, {
      "dist/components/fieldset/fieldset.styles.d.ts": "reordered",
      "node_modules/x/index.js": "x",
      "src/a.test.ts": "t",
    });
    put(given.reactDir, {"dist/index.mjs": "x", "src/a.stories.tsx": "s"});

    expect(libraryInputHash(given)).toBe(before);
  });

  it.each([
    [
      "a react source file",
      (i: HashInputs) => put(i.reactDir, {"src/index.ts": "export const x = 2;"}),
    ],
    [
      "a styles source file",
      (i: HashInputs) => put(i.stylesDir, {"src/index.ts": "export const y = 2;"}),
    ],
    ["a stylesheet", (i: HashInputs) => put(i.stylesDir, {"index.css": "b{}"})],
    ["the acme package", (i: HashInputs) => put(i.acmeDir, {"index.js": "export const a = 2;"})],
    ["the staging rules", (i: HashInputs) => put(join(i.rulesFile, ".."), {"rules.ts": "other"})],
    ["a build tool version", (i: HashInputs) => void (i.tools.tsdown = "1.0.1")],
  ])("changes with %s", (_name, change) => {
    const given = inputs();
    const before = libraryInputHash(given);

    change(given);

    expect(libraryInputHash(given)).not.toBe(before);
  });
});
