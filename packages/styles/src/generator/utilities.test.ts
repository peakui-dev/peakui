import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

describe("concentric nesting utilities", () => {
  const css = readFileSync("utilities/index.css", "utf8");

  it("объявляет обе утилиты контракта", () => {
    expect(css).toMatch(/@utility concentric-host\b/);
    expect(css).toMatch(/@utility concentric-inner\b/);
  });

  it("зажимает радиус в нуль, а не уходит в отрицательный", () => {
    // R_inner = max(0, R_outer - padding - border); без max() вложенный радиус станет
    // отрицательным, и браузер отбросит объявление целиком.
    expect(css).toMatch(/max\(\s*0px/);
  });

  it("считает оси раздельно — скаляр ломается о padding-inline != padding-block", () => {
    expect(css).toContain("--concentric-inline:");
    expect(css).toContain("--concentric-block:");
    expect(css).toMatch(/--concentric-pad-inline/);
    expect(css).toMatch(/--concentric-pad-block/);
  });

  it("применяет эллиптический радиус ко всем четырём углам через логические свойства", () => {
    for (const corner of [
      "border-start-start-radius",
      "border-start-end-radius",
      "border-end-start-radius",
      "border-end-end-radius",
    ]) {
      expect(css, corner).toContain(corner);
    }
  });

  it("у каждого входа есть дефолт, чтобы хост задавал только отличия", () => {
    expect(css).toMatch(/var\(--concentric-border,\s*[^)]+\)/);
    expect(css).toMatch(/var\(--concentric-pad-block,\s*var\(--concentric-pad-inline/);
  });
});
