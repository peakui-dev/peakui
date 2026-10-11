import type {ThemePreset} from "./preset.ts";

import {describe, expect, it} from "vitest";

import {deriveTheme} from "./derive.ts";
import {emitVariablesCss} from "./emit.ts";

const preset: ThemePreset = {
  id: "test",
  accent: "oklch(0.52 0.2 275)",
  grayChroma: 0.006,
  radius: "medium",
  formRadius: "large",
};

describe("emitVariablesCss", () => {
  const css = emitVariablesCss(preset, deriveTheme(preset));

  it("оборачивает всё в @layer base", () => {
    expect(css.startsWith("@layer base {")).toBe(true);
  });

  it("объявляет инварианты на :root и :host", () => {
    expect(css).toMatch(/:root,\s*:host\s*\{/);
  });

  it("даёт светлой теме и класс, и атрибут, и :host-формы", () => {
    expect(css).toContain('[data-theme="test-light"]');
    expect(css).toContain(':host([data-theme="test-light"])');
  });

  it("объявляет color-scheme в каждой схеме", () => {
    expect(css.match(/color-scheme: light/g)?.length).toBe(1);
    expect(css.match(/color-scheme: dark/g)?.length).toBe(1);
  });

  it("эмитит один блок forced-colors на тему", () => {
    expect(css.match(/@media \(forced-colors: active\)/g)?.length).toBe(1);
    expect(css).toContain("--surface: Canvas");
    expect(css).toContain("--accent: Highlight");
  });

  it("не содержит ни hex, ни rgb(", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\brgb\(/);
  });

  it("детерминирован", () => {
    expect(emitVariablesCss(preset, deriveTheme(preset))).toBe(css);
  });
});

describe("emitVariablesCss with scope", () => {
  const derived = deriveTheme(preset);
  const scoped = emitVariablesCss(preset, derived, {scope: "#tb-preview"});

  it("anchors invariants on the scope instead of :root/:host", () => {
    expect(scoped).toContain("#tb-preview {");
    expect(scoped).not.toContain(":root");
    expect(scoped).not.toContain(":host");
  });

  it("prefixes class and attribute selectors with the scope", () => {
    expect(scoped).toContain("#tb-preview.test-light");
    expect(scoped).toContain('#tb-preview[data-theme="test-light"]');
    expect(scoped).toContain("#tb-preview.test-dark");
    expect(scoped).toContain('#tb-preview[data-theme="test-dark"]');
  });

  it("keeps color-scheme and forced-colors content", () => {
    expect(scoped.match(/color-scheme: light/g)?.length).toBe(1);
    const media = scoped.slice(scoped.indexOf("@media (forced-colors"));

    expect(media).toContain("#tb-preview {");
    expect(media).toContain("--accent: Highlight");
  });

  it("leaves the unscoped output byte-identical", () => {
    expect(emitVariablesCss(preset, derived)).toBe(emitVariablesCss(preset, derived, {}));
  });
});
