import {describe, expect, it} from "vitest";

import type {Oklch} from "./color";

import {contrastRatio, formatOklch, parseOklch, relativeLuminance} from "./color";

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
  });

  describe("relativeLuminance", () => {
    it("белый = 1, чёрный = 0", () => {
      expect(relativeLuminance(white)).toBeCloseTo(1, 3);
      expect(relativeLuminance(black)).toBeCloseTo(0, 3);
    });

    it("не выходит из [0,1] на цвете вне гаммы", () => {
      const lum = relativeLuminance({l: 0.7, c: 0.4, h: 150, a: 1});

      expect(lum).toBeGreaterThanOrEqual(0);
      expect(lum).toBeLessThanOrEqual(1);
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
