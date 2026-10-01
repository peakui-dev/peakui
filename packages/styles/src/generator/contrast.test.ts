import {describe, expect, it} from "vitest";

import type {Oklch} from "./color.ts";

import {relativeLuminance} from "./color.ts";
import {TRANSPARENT, compositeOver, ensureContrast, mix} from "./contrast.ts";

const white: Oklch = {l: 1, c: 0, h: 0, a: 1};
const black: Oklch = {l: 0, c: 0, h: 0, a: 1};
const accent: Oklch = {l: 0.58, c: 0.2, h: 275, a: 1};

describe("mix", () => {
  it("нормализует проценты, не дающие 100", () => {
    expect(mix(white, 90, black, 2).l).toBeCloseTo(mix(white, 97.826, black, 2.174).l, 3);
  });

  it("смешивание с transparent снижает альфу, не светлоту", () => {
    const soft = mix(accent, 15, TRANSPARENT, 85);

    expect(soft.a).toBeCloseTo(0.15, 3);
    expect(soft.l).toBeCloseTo(0.58, 3);
  });

  it("равные доли дают середину", () => {
    expect(mix(white, 50, black, 50).l).toBeCloseTo(0.5, 3);
  });

  it("идёт по короткой дуге тона", () => {
    const a: Oklch = {l: 0.5, c: 0.1, h: 350, a: 1};
    const b: Oklch = {l: 0.5, c: 0.1, h: 10, a: 1};

    // Короткая дуга 350 -> 10 проходит через 0, а не через 180.
    expect(mix(a, 50, b, 50).h).toBeCloseTo(0, 3);
  });
});

describe("compositeOver", () => {
  it("полупрозрачный чёрный на белом даёт серый с альфой 1", () => {
    const result = compositeOver({l: 0, c: 0, h: 0, a: 0.5}, white);

    expect(result.a).toBe(1);
    expect(relativeLuminance(result)).toBeLessThan(1);
    expect(relativeLuminance(result)).toBeGreaterThan(0);
  });

  it("непрозрачный передний план не меняется", () => {
    expect(compositeOver(accent, white)).toEqual(accent);
  });
});

describe("ensureContrast", () => {
  it("не трогает пару, которая уже проходит", () => {
    const {color, fix} = ensureContrast({token: "foreground", fg: black, bg: white, min: 4.5});

    expect(fix).toBeUndefined();
    expect(color.l).toBe(0);
  });

  it("двигает светлоту до прохождения и отчитывается", () => {
    const {color, fix} = ensureContrast({
      token: "accent-foreground",
      fg: {l: 0.62, c: 0.02, h: 275, a: 1},
      bg: accent,
      min: 4.5,
    });

    expect(fix).toBeDefined();
    expect(fix?.token).toBe("accent-foreground");
    expect(fix?.ratio).toBeGreaterThanOrEqual(4.5);
    expect(color.c).toBeCloseTo(0.02, 6);
    expect(color.h).toBeCloseTo(275, 6);
  });

  it("бросает, когда 40 шагов не хватает", () => {
    expect(() =>
      ensureContrast({
        token: "impossible",
        fg: {l: 0.5, c: 0, h: 0, a: 1},
        bg: {l: 0.5, c: 0, h: 0, a: 1},
        min: 21,
      }),
    ).toThrow(/impossible/);
  });
});
