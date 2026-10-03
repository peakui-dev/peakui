import type {PackResult} from "../../src/pack/stage.ts";

import {existsSync} from "node:fs";

import {beforeAll, describe, expect, it} from "vitest";

import {runCommand} from "../../src/exec.ts";
import {packLibrary} from "../../src/pack/stage.ts";

async function listing(tarball: string): Promise<string[]> {
  const result = await runCommand(["tar", "-tzf", tarball], {
    cwd: process.cwd(),
    timeoutMs: 30_000,
  });

  return result.stdout.trim().split("\n");
}

describe("packLibrary", () => {
  let pack: PackResult;

  beforeAll(async () => {
    pack = await packLibrary();
  });

  it("writes three tarballs and a 64-character hash", () => {
    expect(existsSync(pack.tarballs.react)).toBe(true);
    expect(existsSync(pack.tarballs.styles)).toBe(true);
    expect(existsSync(pack.tarballs.acmeStatus)).toBe(true);
    expect(pack.libraryHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ships dist and no sources in @peakui/react", async () => {
    const files = await listing(pack.tarballs.react);

    expect(files).toContain("package/dist/index.mjs");
    expect(files).toContain("package/dist/index.d.mts");
    expect(files.filter((file) => file.startsWith("package/src/"))).toEqual([]);
    expect(files.filter((file) => file.includes(".stories."))).toEqual([]);
  });

  it("ships dist and the stylesheets in @peakui/styles", async () => {
    const files = await listing(pack.tarballs.styles);

    expect(files).toContain("package/dist/index.js");
    expect(files).toContain("package/dist/index.d.ts");
    expect(files).toContain("package/index.css");
    expect(files).toContain("package/components/button.css");
    expect(files.filter((file) => file.startsWith("package/src/"))).toEqual([]);
  });

  it("is stable: a second pack has the same hash", async () => {
    expect((await packLibrary()).libraryHash).toBe(pack.libraryHash);
  });
});
