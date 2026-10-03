import {describe, expect, it} from "vitest";

import {
  builtLayerOrder,
  classRuleExists,
  importTargets,
  rulesWithSelector,
  tryParseCss,
} from "../src/scoring/css.ts";

describe("importTargets keeps the modifiers", () => {
  it("reads layer() and source() after a quoted or url() target", () => {
    const root = tryParseCss(
      [
        `@import "tailwindcss" layer(theme) source(none);`,
        `@import url("./x.css") layer(base);`,
        `@import '@peakui/styles/css' source("../src");`,
        `@import "./y.css" layer;`,
        `@import "./z.css";`,
      ].join("\n"),
    )!;

    expect(importTargets(root)).toEqual([
      {
        layer: "theme",
        params: `"tailwindcss" layer(theme) source(none)`,
        source: "none",
        target: "tailwindcss",
      },
      {layer: "base", params: `url("./x.css") layer(base)`, target: "./x.css"},
      {
        params: `'@peakui/styles/css' source("../src")`,
        source: "../src",
        target: "@peakui/styles/css",
      },
      {layer: "", params: `"./y.css" layer`, target: "./y.css"},
      {params: `"./z.css"`, target: "./z.css"},
    ]);
  });
});

describe("rulesWithSelector matches whole class tokens", () => {
  const root = tryParseCss(
    [
      `.button--primary{color:red}`,
      `.button--primary-x{color:blue}`,
      `.button--primary:hover{color:green}`,
      `.card .button--primary{color:pink}`,
      `[data-x=".button--primary"]{color:black}`,
      `.my-button--primary{color:white}`,
      `.button--primary\\/20{color:gray}`,
    ].join("\n"),
  )!;

  it("does not match a longer class", () => {
    expect(rulesWithSelector(root, "button--primary").map((rule) => rule.selector)).toEqual([
      ".button--primary",
      ".button--primary:hover",
      ".card .button--primary",
    ]);
  });

  it("accepts the fragment with its leading dot", () => {
    expect(rulesWithSelector(root, ".button--primary")).toHaveLength(3);
  });
});

describe("classRuleExists", () => {
  it("does not match inside an attribute-selector string", () => {
    const root = tryParseCss(
      `[data-x=".foo"]{a:b}a[href$='.foo']{a:b}[class*=".foo bar"]{a:b}.bar{a:b}`,
    )!;

    expect(classRuleExists(root, "foo")).toBe(false);
    expect(classRuleExists(root, "bar")).toBe(true);
  });

  it("still matches a class next to an attribute selector", () => {
    const root = tryParseCss(`.foo[data-x="a]b"]{a:b}`)!;

    expect(classRuleExists(root, "foo")).toBe(true);
  });
});

describe("builtLayerOrder", () => {
  const parse = (css: string) => tryParseCss(css)!;

  it("reads the order of a single file", () => {
    expect(builtLayerOrder([parse("@layer theme, base, components, utilities;")])).toEqual({
      available: true,
      order: ["theme", "base", "components", "utilities"],
    });
  });

  it("accepts several files that declare the same order, whichever loads first", () => {
    const one = parse("@layer theme, base, components;\n.a{b:c}");
    const two = parse("@layer theme, base, components;\n.d{e:f}");

    expect(builtLayerOrder([one, two])).toEqual({
      available: true,
      order: ["theme", "base", "components"],
    });
    expect(builtLayerOrder([two, one])).toEqual(builtLayerOrder([one, two]));
  });

  it("is unavailable when several files declare different orders", () => {
    const one = parse("@layer theme, base, components;");
    const two = parse("@layer components, base;");

    expect(builtLayerOrder([one, two])).toMatchObject({available: false});
  });

  it("is unavailable without CSS", () => {
    expect(builtLayerOrder([])).toMatchObject({available: false});
  });

  it("is available and empty when no file uses layers", () => {
    expect(builtLayerOrder([parse(".a{b:c}"), parse(".d{e:f}")])).toEqual({
      available: true,
      order: [],
    });
  });
});
