import type {PackResult} from "../../src/pack/stage.ts";

import {existsSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {runCommand} from "../../src/exec.ts";
import {hashFiles, readFiles, walkFiles} from "../../src/files.ts";
import {packLibrary} from "../../src/pack/stage.ts";
import {REPO_DIR} from "../../src/paths.ts";

import {useFreshHarnessHome} from "./home.ts";

function sourceHash(): string {
  const files = ["packages/react", "packages/styles"].flatMap((name) => {
    const dir = join(REPO_DIR, name);

    return readFiles(dir, walkFiles(dir, ["node_modules"])).map((file) => ({
      path: `${name}/${file.path}`,
      text: file.text,
    }));
  });

  return hashFiles(files);
}

function exportTargets(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "object" && value !== null)
    return Object.values(value).flatMap(exportTargets);

  return [];
}

async function manifestOf(tarball: string): Promise<Record<string, unknown>> {
  const result = await runCommand(["tar", "-xzOf", tarball, "package/package.json"], {
    cwd: process.cwd(),
    timeoutMs: 30_000,
  });

  return JSON.parse(result.stdout) as Record<string, unknown>;
}

async function listing(tarball: string): Promise<string[]> {
  const result = await runCommand(["tar", "-tzf", tarball], {
    cwd: process.cwd(),
    timeoutMs: 30_000,
  });

  return result.stdout.trim().split("\n");
}

describe("packLibrary", () => {
  let pack: PackResult;
  let before = "";
  let after = "";

  useFreshHarnessHome();

  beforeAll(async () => {
    before = sourceHash();
    pack = await packLibrary();
    after = sourceHash();
  });

  it("leaves the source packages untouched", () => {
    expect(after).toBe(before);
  });

  it.each(["react", "styles", "acmeStatus"] as const)(
    "every exports target of the %s tarball exists inside it",
    async (name) => {
      const tarball = pack.tarballs[name];
      const files = (await listing(tarball)).map((file) => file.replace(/^package\//, ""));
      const manifest = await manifestOf(tarball);
      const targets = exportTargets(manifest.exports).map((target) => target.replace(/^\.\//, ""));

      expect(targets.length).toBeGreaterThan(0);

      for (const target of targets) {
        const matcher = new RegExp(
          `^${target.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".+")}$`,
        );

        expect(
          files.some((file) => matcher.test(file)),
          `${name}: ${target}`,
        ).toBe(true);
      }
    },
  );

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
