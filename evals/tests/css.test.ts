import {describe, expect, it} from "vitest";

import {
  atRuleParams,
  classRuleExists,
  declarationValues,
  importTargets,
  layerOrder,
  rulesWithSelector,
  tryParseCss,
} from "../src/scoring/css.ts";

describe("css helpers", () => {
  it("tryParseCss returns undefined for broken CSS", () => {
    expect(tryParseCss(".a { color: red")).toBeUndefined();
    expect(tryParseCss(".a { color: red }")).toBeDefined();
  });

  it("importTargets strips quotes and keeps order", () => {
    const root = tryParseCss(
      `@import "tailwindcss";\n@import '@peakui/styles/css';\n@import url("./x.css") layer(base);`,
    )!;

    expect(importTargets(root)).toEqual(["tailwindcss", "@peakui/styles/css", "./x.css"]);
  });

  it("layerOrder is first appearance at the top level", () => {
    const correct = tryParseCss(
      "@layer properties{a{b:c}}@layer theme{a{b:c}}@layer base{a{b:c}}@layer components{.button{b:c}}@layer base{d{e:f}}@layer utilities{a{b:c}}",
    )!;
    const reversed = tryParseCss(
      "@layer theme{a{b:c}}@layer components{.button{b:c}}@layer base{a{b:c}}@layer utilities{a{b:c}}",
    )!;
    const statement = tryParseCss("@layer theme, base, components;\n@layer components{a{b:c}}")!;

    expect(layerOrder(correct)).toEqual(["properties", "theme", "base", "components", "utilities"]);
    expect(layerOrder(reversed)).toEqual(["theme", "components", "base", "utilities"]);
    expect(layerOrder(statement)).toEqual(["theme", "base", "components"]);
  });

  it("rulesWithSelector reports the layer and normalized declarations", () => {
    const root = tryParseCss(
      "@layer components{.button--primary{--button-bg: #16A34A; --button-bg-hover:#15803d}}\n.other{color:red}",
    )!;

    expect(rulesWithSelector(root, "button--primary")).toEqual([
      {
        declarations: {"--button-bg": "#16a34a", "--button-bg-hover": "#15803d"},
        layer: "components",
        selector: ".button--primary",
      },
    ]);
  });

  it("classRuleExists matches whole class names, escaped ones included", () => {
    const root = tryParseCss(
      ".rounded-sm{border-radius:2px}.ring-emerald-600\\/20{--x:1}.bg-emerald-1000{color:red}",
    )!;

    expect(classRuleExists(root, "rounded-sm")).toBe(true);
    expect(classRuleExists(root, "ring-emerald-600/20")).toBe(true);
    expect(classRuleExists(root, "rounded")).toBe(false);
    expect(classRuleExists(root, "bg-emerald-100")).toBe(false);
  });

  it("atRuleParams and declarationValues", () => {
    const root = tryParseCss(
      `@source "../node_modules/@acme/status";\n:root{--color-accent: #16A34A}`,
    )!;

    expect(atRuleParams(root, "source")).toEqual([`"../node_modules/@acme/status"`]);
    expect(declarationValues(root, "--color-accent")).toEqual(["#16a34a"]);
  });
});

describe("classRuleExists with escaped continuations", () => {
  it("does not match a class that only continues with an escaped character", () => {
    const root = tryParseCss(".ring\\/20{--x:1}")!;

    expect(classRuleExists(root, "ring")).toBe(false);
  });
});
