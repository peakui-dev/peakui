import {describe, expect, it} from "vitest";

import type {ThemePreset} from "./preset.ts";

import {contrastRatio, parseOklch} from "./color.ts";
import {compositeOver} from "./contrast.ts";
import {deriveTheme} from "./derive.ts";

const preset: ThemePreset = {
  id: "test",
  accent: "oklch(0.58 0.2 275)",
  grayChroma: 0.006,
  radius: "medium",
  formRadius: "large",
};

describe("deriveTheme", () => {
  it("объявляет полный набор в обеих схемах", () => {
    const {light, dark} = deriveTheme(preset);

    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());

    for (const name of [
      "background", "foreground", "surface", "overlay", "muted", "default",
      "accent", "accent-foreground", "border", "separator", "focus", "backdrop",
    ]) {
      expect(light[name], name).toBeDefined();
    }
  });

  it("выводит soft-токены как полупрозрачные", () => {
    expect(deriveTheme(preset).light["accent-soft"]).toMatch(/\/ 0\.15\)$/);
  });

  it("нейтрали несут тон акцента", () => {
    const muted = parseOklch(deriveTheme(preset).light["muted"]!);

    expect(muted?.h).toBeCloseTo(275, 0);
    expect(muted?.c).toBeLessThanOrEqual(0.03);
  });

  it("стеки гарнитур попадают в инварианты темы", () => {
    const {invariant} = deriveTheme({
      ...preset,
      typography: {sans: ["Inter", "sans-serif"], mono: ["JetBrains Mono", "monospace"]},
    });

    expect(invariant["sans"]).toBe("Inter, sans-serif");
    expect(invariant["mono"]).toBe("JetBrains Mono, monospace");
  });

  it("без typography в пресете подставляет дефолтные стеки", () => {
    expect(deriveTheme(preset).invariant["sans"]).toMatch(/Inter/);
  });

  it("radius берётся из RADIUS_BASE", () => {
    expect(deriveTheme(preset).invariant["radius"]).toBe("0.5rem");
    expect(deriveTheme(preset).invariant["field-radius"]).toBe("0.75rem");
  });

  it("semanticOverrides побеждают выведенное значение", () => {
    const {light} = deriveTheme({
      ...preset,
      semanticOverrides: {light: {danger: {color: "oklch(0.48 0.19 27.64)"}}},
    });

    expect(light["danger"]).toBe("oklch(0.48 0.19 27.64)");
  });

  it("darkAccent используется в тёмной схеме", () => {
    const {dark} = deriveTheme({...preset, accent: "oklch(0 0 0)", darkAccent: "oklch(0.98 0 0)"});

    expect(parseOklch(dark["accent"]!)?.l).toBeCloseTo(0.98, 2);
  });

  it("каждая текстовая пара держит 4.5:1 после вывода", () => {
    const {light, dark} = deriveTheme(preset);

    for (const scheme of [light, dark]) {
      const base = parseOklch(scheme["background"]!)!;

      for (const [name, value] of Object.entries(scheme)) {
        if (!name.endsWith("-foreground")) continue;

        const bgName = name.replace(/-foreground$/, "");
        const bg = parseOklch(scheme[bgName] ?? scheme["background"]!)!;

        expect(contrastRatio(parseOklch(value)!, compositeOver(bg, base)), name)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
