import {readdirSync} from "node:fs";

import {describe, expect, it} from "vitest";

import {COMPONENT_GROUPS} from "@/lib/component-groups";

/*
 * Gate: every component page is listed in COMPONENT_GROUPS. The sidebar is built from meta.json
 * and works without it, but the components index and the llms category listing are built from
 * the groups alone, so a page that is missing there exists and cannot be found from either.
 */
const ROOT = "content/docs/en/react/components";

const pages = readdirSync(ROOT, {withFileTypes: true})
  .filter((entry) => entry.isDirectory() && /^\(.+\)$/.test(entry.name))
  .flatMap((group) =>
    readdirSync(`${ROOT}/${group.name}`)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => `${group.name}/${file.replace(/\.mdx$/, "")}`),
  )
  .sort();

const listed = COMPONENT_GROUPS.flatMap((group) => group.components as readonly string[]);

describe("component groups", () => {
  it("is not vacuous", () => {
    expect(pages.length).toBeGreaterThan(0);
    expect(listed.length).toBeGreaterThan(0);
  });

  it("lists every component page", () => {
    expect(pages.filter((page) => !listed.includes(page))).toEqual([]);
  });

  it("lists only pages that exist", () => {
    expect(listed.filter((entry) => !pages.includes(entry))).toEqual([]);
  });

  it("lists nothing twice", () => {
    expect(listed.filter((entry, index) => listed.indexOf(entry) !== index)).toEqual([]);
  });
});
