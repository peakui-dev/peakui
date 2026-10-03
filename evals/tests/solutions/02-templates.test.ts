import type {TemplateInfo} from "../../src/fixtures/prepare.ts";

import {existsSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {fixtures} from "../../fixtures/index.ts";
import {prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";

describe.each(Object.values(fixtures))("template $id", (fixture) => {
  let template: TemplateInfo;

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
});
