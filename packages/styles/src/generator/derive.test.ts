import type {ThemePreset} from "./preset.ts";

import {describe, expect, it} from "vitest";

import {presets} from "../../presets/index.ts";

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
    const {dark, light} = deriveTheme(preset);

    expect(Object.keys(light).sort()).toEqual(Object.keys(dark).sort());

    for (const name of [
      "background",
      "foreground",
      "surface",
      "overlay",
      "muted",
      "default",
      "accent",
      "accent-foreground",
      "border",
      "separator",
      "focus",
      "backdrop",
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
    const {dark, light} = deriveTheme(preset);

    for (const scheme of [light, dark]) {
      const base = parseOklch(scheme["background"]!)!;

      for (const [name, value] of Object.entries(scheme)) {
        if (!name.endsWith("-foreground")) continue;

        const bgName = name.replace(/-foreground$/, "");
        const bg = parseOklch(scheme[bgName] ?? scheme["background"]!)!;

        expect(
          contrastRatio(parseOklch(value)!, compositeOver(bg, base)),
          name,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("гарантии контраста покрывают весь набор, а не выборку", () => {
  /** Every token that has an `X-foreground` partner, measured the way a person sees it. */
  const checkAllPairs = (scheme: Record<string, string>, baseName: string) => {
    const base = parseOklch(scheme[baseName]!)!;
    const failures: string[] = [];

    for (const [name, value] of Object.entries(scheme)) {
      if (!name.endsWith("-foreground")) continue;

      const bgName = name.replace(/-foreground$/, "");
      const bgRaw = scheme[bgName];

      if (!bgRaw) continue;

      const ratio = contrastRatio(parseOklch(value)!, compositeOver(parseOklch(bgRaw)!, base));

      if (ratio < 4.5) failures.push(`${name} на ${bgName}: ${ratio.toFixed(2)}:1`);
    }

    return failures;
  };

  it("soft-пары тоже держат 4.5:1 — включая пресет, который раньше их ломал", () => {
    // Этот override проходил все гейты с 4.12:1 на warning-soft-foreground.
    const {dark, light} = deriveTheme({
      ...preset,
      semanticOverrides: {light: {warning: {color: "oklch(0.86 0.17 95)"}}},
    });

    expect(checkAllPairs(light, "surface")).toEqual([]);
    expect(checkAllPairs(light, "background")).toEqual([]);
    expect(checkAllPairs(dark, "surface")).toEqual([]);
  });

  it("focus держит 3:1 против фона и поверхности в обеих схемах", () => {
    const {dark, light} = deriveTheme(preset);

    for (const scheme of [light, dark]) {
      for (const against of ["background", "surface"]) {
        expect(
          contrastRatio(parseOklch(scheme["focus"]!)!, parseOklch(scheme[against]!)!),
        ).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("muted держит 4.5:1 против САМОГО невыгодного фона набора, а не только background", () => {
    const {dark, light} = deriveTheme(preset);

    for (const [name, scheme] of [
      ["light", light],
      ["dark", dark],
    ] as const) {
      const muted = parseOklch(scheme["muted"]!)!;

      for (const against of [
        "background",
        "background-secondary",
        "background-tertiary",
        "surface",
        "surface-secondary",
        "surface-tertiary",
        "default",
        "overlay",
      ]) {
        expect(
          contrastRatio(muted, parseOklch(scheme[against]!)!),
          `${name}: muted на ${against}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

describe("семья on-surface", () => {
  /** Уровень поверхности и суффикс его токенов: surface → "", surface-secondary → "-secondary". */
  const LEVELS = [
    ["surface", ""],
    ["surface-secondary", "-secondary"],
    ["surface-tertiary", "-tertiary"],
  ] as const;

  it("объявляет три члена на каждый уровень в обеих схемах", () => {
    const {dark, light} = deriveTheme(preset);

    for (const [, suffix] of LEVELS) {
      for (const member of ["", "-foreground", "-hover"]) {
        const name = `on-surface${suffix}${member}`;

        expect(light, name).toHaveProperty(name);
        expect(dark, name).toHaveProperty(name);
      }
    }
  });

  /*
   * Заливка обязана воспроизводить отношение default к background — 1.09:1 в светлой и 1.36:1 в
   * тёмной. Это НЕ граница 3:1 и не должна ею становиться: нейтральный контрол в наборе опознаётся
   * подписью и формой, а не обводкой, и SC 1.4.11 это разрешает. Проверяется коридор, а не точное
   * число, потому что якоря уровней поверхности могут сдвинуться.
   */
  it("заливка повторяет отношение default к background, а не границу 3:1", () => {
    const {dark, light} = deriveTheme(preset);

    for (const scheme of [light, dark]) {
      for (const [level, suffix] of LEVELS) {
        const ratio = contrastRatio(
          parseOklch(scheme[`on-surface${suffix}`]!)!,
          parseOklch(scheme[level]!)!,
        );

        expect(ratio, `on-surface${suffix} на ${level}`).toBeGreaterThan(1.03);
        expect(ratio, `on-surface${suffix} на ${level}`).toBeLessThan(1.5);
      }
    }
  });

  it("hover сдвигает заливку к тексту своего уровня, а не к общему foreground", () => {
    const {dark, light} = deriveTheme(preset);

    for (const scheme of [light, dark]) {
      for (const [level, suffix] of LEVELS) {
        const fill = parseOklch(scheme[`on-surface${suffix}`]!)!;
        const hover = parseOklch(scheme[`on-surface${suffix}-hover`]!)!;
        const levelFg = parseOklch(scheme[`${level}-foreground`]!)!;

        expect(hover.l, `on-surface${suffix}-hover`).not.toBe(fill.l);
        // Сдвиг идёт в сторону текста уровня: в светлой схеме темнее, в тёмной светлее.
        expect(Math.sign(hover.l - fill.l), `on-surface${suffix}-hover направление`).toBe(
          Math.sign(levelFg.l - fill.l),
        );
      }
    }
  });

  /*
   * Гейт 2 в check:tokens падает на ЛЮБОЙ применённой правке контраста: ensureContrast существует,
   * чтобы обнаруживать неверную палитру, а не чтобы молча её ремонтировать. Поэтому тест идёт по
   * поставляемым пресетам, а не по локальному: именно их проверяет гейт.
   */
  it("не требует ни одной правки контраста ни для одного поставляемого пресета", () => {
    for (const shipped of presets) {
      expect(deriveTheme(shipped).fixes, shipped.id).toEqual([]);
    }
  });
});
