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

  it("даёт ОДИН радиус, а не эллипс: Figma не умеет выражать эллиптический угол", () => {
    expect(css).toContain("--concentric-inner:");
    expect(css).not.toContain("--concentric-inline:");
    expect(css).not.toContain("--concentric-block:");
  });

  it("при разных отступах берёт БОЛЬШИЙ — меньший радиус скорее квадратит, чем защемляет", () => {
    // Вывод из меньшего отступа даёт радиус больше посадочного места на тесной оси, и внутренняя
    // дуга подходит к внешней — это и есть исходный дефект. Больший отступ безопасен всегда.
    expect(css).toMatch(/max\(\s*var\(--concentric-pad-inline[\s\S]*?var\(--concentric-pad-block/);
  });

  it("применяет радиус ко всем четырём углам через логические свойства", () => {
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
    expect(css).toMatch(/var\(--concentric-radius,\s*var\(--radius-lg\)\)/);
  });
});

describe("field focus utilities", () => {
  const css = readFileSync("utilities/index.css", "utf8");

  it("объявляет оба кольца полей", () => {
    expect(css).toMatch(/@utility status-focused-field\b/);
    expect(css).toMatch(/@utility status-invalid-field\b/);
  });

  it("прижимает кольцо поля вплотную, иначе оно рисуется поверх границы соседнего слота", () => {
    expect(css).toMatch(/@utility status-focused-field\s*\{[^}]*outline-offset:\s*0\b/);
  });

  it("оставляет общему кольцу его отступ — два кольца, а не одно", () => {
    expect(css).toMatch(
      /@utility status-focused\s*\{[^}]*outline-offset:\s*var\(--ring-offset-width\)/,
    );
  });

  it("красит невалидное поле danger-soft-foreground, а не danger: 2.95:1 против заливки в тёмной теме", () => {
    const invalid = /@utility status-invalid-field\s*\{(?:[^{}]|\{[^{}]*\})*\}/.exec(css)?.[0];

    expect(invalid).toBeDefined();
    expect(invalid).toContain("var(--color-danger-soft-foreground)");
    expect(invalid).not.toMatch(/var\(--color-danger\)/);
  });

  it("утолщает кольцо невалидности и по псевдоклассу, и по data-атрибуту", () => {
    const invalid = /@utility status-invalid-field\s*\{(?:[^{}]|\{[^{}]*\})*\}/.exec(css)?.[0];

    for (const form of [":focus", ":focus-visible", ":focus-within"]) {
      expect(invalid, form).toContain(`&${form}`);
    }
    for (const form of ["data-focused", "data-focus-visible", "data-focus-within"]) {
      expect(invalid, form).toContain(`[${form}]`);
    }
  });
});
