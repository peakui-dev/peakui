import type {TemplateInfo} from "../../src/fixtures/prepare.ts";

import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {fixtures} from "../../fixtures/index.ts";
import {prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";
import {templatesDir} from "../../src/paths.ts";

import {useFreshHarnessHome} from "./home.ts";

describe.each(Object.values(fixtures))("template $id", (fixture) => {
  let template: TemplateInfo;

  useFreshHarnessHome();

  beforeAll(async () => {
    template = await prepareTemplate(fixture, await packLibrary(), {force: false});
  });

  it("installs the staged packages, not sources", () => {
    expect(existsSync(join(template.dir, "node_modules/@peakui/react/dist/index.mjs"))).toBe(true);
    expect(existsSync(join(template.dir, "node_modules/@peakui/react/src"))).toBe(false);
    expect(existsSync(join(template.dir, "node_modules/@peakui/styles/index.css"))).toBe(true);
  });

  it("installs the peers without the fixture declaring them", () => {
    expect(existsSync(join(template.dir, "node_modules/react-aria-components/package.json"))).toBe(
      true,
    );
    expect(existsSync(join(template.dir, "node_modules/@react-aria/utils/package.json"))).toBe(
      true,
    );
  });

  it("writes a lockfile and is reused on the second call", async () => {
    expect(existsSync(join(template.dir, "package-lock.json"))).toBe(true);
    expect((await prepareTemplate(fixture, await packLibrary(), {force: false})).reused).toBe(true);
  });

  it("records the comment inventory, the peer versions and a note in the sidecar", () => {
    const sidecar = JSON.parse(
      readFileSync(join(templatesDir(), `${fixture.id}.json`), "utf8"),
    ) as {
      commentInventory: {comments: number; files: number};
      note: string;
      peers: Record<string, string | null>;
    };

    expect(sidecar.commentInventory.files).toBeGreaterThan(0);
    expect(sidecar.note).toMatch(/CSS comments are stripped/);
    expect(Object.keys(sidecar.peers)).toEqual([
      "react-aria-components",
      "@react-aria/utils",
      "react",
      "react-dom",
      "tailwindcss",
    ]);
    expect(Object.values(sidecar.peers).filter((version) => version === null)).toEqual([]);
  });
});
