import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

import type {ThemePreset} from "./preset.ts";

import {deriveTheme} from "./derive.ts";

// A local preset, not the shipped `defaultPreset`: that arrives in Task 7, and this test only needs
// *some* theme to prove every mapping resolves.
const preset: ThemePreset = {
  id: "surface-probe",
  accent: "oklch(0.52 0.2 275)",
  grayChroma: 0.006,
  radius: "medium",
  formRadius: "large",
};

describe("theme.css", () => {
  const css = readFileSync("themes/shared/theme.css", "utf8");
  const mapped = [...css.matchAll(/^\s*--[\w-]+:\s*var\(--([\w-]+)[,)]/gm)].map((m) => m[1]!);

  it("каждый var() резолвится в объявленный токен", () => {
    const {invariant, light} = deriveTheme(preset);
    const declared = new Set([...Object.keys(invariant), ...Object.keys(light)]);

    expect(mapped.filter((name) => !declared.has(name))).toEqual([]);
  });

  it("объявляет шкалу радиусов множителями от --radius", () => {
    for (const step of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl"]) {
      expect(css).toContain(`--radius-${step}: calc(var(--radius) *`);
    }
  });

  it("объявляет типографику: семейства, парную шкалу и веса", () => {
    expect(css).toContain("--font-sans: var(--sans)");
    expect(css).toContain("--font-mono: var(--mono)");
    expect(css).toContain("--text-sm--line-height");
    expect(css).toMatch(/--font-weight-medium:/);
  });

  it("не поджимает трекинг заголовков по умолчанию", () => {
    expect(css).not.toMatch(/--tracking-tight/);
  });
});
