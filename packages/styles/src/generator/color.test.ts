import {describe, expect, it} from "vitest";

import type {Oklch} from "./color.ts";

import {contrastRatio, formatOklch, parseOklch, relativeLuminance} from "./color.ts";

const white: Oklch = {l: 1, c: 0, h: 0, a: 1};
const black: Oklch = {l: 0, c: 0, h: 0, a: 1};

describe("color", () => {
  describe("parseOklch", () => {
    it("разбирает проценты и десятичную светлоту одинаково", () => {
      expect(parseOklch("oklch(62% 0.195 253.83)")?.l).toBeCloseTo(0.62, 4);
      expect(parseOklch("oklch(0.62 0.195 253.83)")?.l).toBeCloseTo(0.62, 4);
    });

    it("трактует hue none как 0", () => {
      expect(parseOklch("oklch(0.5 0 none)")?.h).toBe(0);
    });

    it("разбирает альфу", () => {
      expect(parseOklch("oklch(0.5 0.1 200 / 0.15)")?.a).toBeCloseTo(0.15, 4);
    });

    it("по умолчанию даёт альфу 1", () => {
      expect(parseOklch("oklch(0.5 0.1 200)")?.a).toBe(1);
    });

    it("возвращает null на мусоре", () => {
      expect(parseOklch("rebeccapurple")).toBeNull();
    });

    it("возвращает null на битом числе, а не NaN", () => {
      expect(parseOklch("oklch(0.5 0.1 1.2.3)")).toBeNull();
      expect(parseOklch("oklch(0.5 0.1 abc)")).toBeNull();
    });

    it("разбирает hex, как обещает тип пресета", () => {
      const black = parseOklch("#000000");
      const white = parseOklch("#ffffff");

      expect(black?.l).toBeCloseTo(0, 2);
      expect(white?.l).toBeCloseTo(1, 2);
      expect(parseOklch("#fff")?.l).toBeCloseTo(1, 2);
    });

    it("разбирает hue в градусах и отрицательный hue", () => {
      expect(parseOklch("oklch(0.5 0.1 200deg)")?.h).toBe(200);
      expect(parseOklch("oklch(0.5 0.1 -10)")?.h).toBe(350);
    });

    it("трактует none в светлоте и хроме как 0", () => {
      expect(parseOklch("oklch(none 0.1 200)")?.l).toBe(0);
      expect(parseOklch("oklch(0.5 none 200)")?.c).toBe(0);
    });
  });

  describe("relativeLuminance", () => {
    it("белый = 1, чёрный = 0", () => {
      expect(relativeLuminance(white)).toBeCloseTo(1, 3);
      expect(relativeLuminance(black)).toBeCloseTo(0, 3);
    });

    // Probes chosen so the assertion fails without the clamp: unclamped these give -0.0263 and
    // 1.1880. The previous probe (0.7 0.4 150) lands at 0.4052 unclamped and pinned nothing.
    it("зажимает цвет ниже гаммы — иначе яркость уходит в минус", () => {
      expect(relativeLuminance({l: 0.18, c: 0.48, h: 270, a: 1})).toBeGreaterThanOrEqual(0);
    });

    it("зажимает цвет выше гаммы — иначе яркость превышает единицу", () => {
      expect(relativeLuminance({l: 1, c: 0.48, h: 175, a: 1})).toBeLessThanOrEqual(1);
    });
  });

  describe("contrastRatio", () => {
    it("белый на чёрном = 21:1", () => {
      expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
    });

    it("симметричен", () => {
      expect(contrastRatio(white, black)).toBeCloseTo(contrastRatio(black, white), 6);
    });

    it("цвет с самим собой = 1", () => {
      expect(contrastRatio(white, white)).toBeCloseTo(1, 6);
    });
  });

  describe("formatOklch", () => {
    it("опускает альфу когда она 1", () => {
      expect(formatOklch({l: 0.5, c: 0.1, h: 200, a: 1})).toBe("oklch(0.5 0.1 200)");
    });

    it("печатает альфу когда она меньше 1", () => {
      expect(formatOklch({l: 0.5, c: 0.1, h: 200, a: 0.15})).toBe("oklch(0.5 0.1 200 / 0.15)");
    });

    it("округляет до четырёх знаков", () => {
      expect(formatOklch({l: 0.123456789, c: 0.1, h: 200, a: 1})).toBe("oklch(0.1235 0.1 200)");
    });
  });
});
