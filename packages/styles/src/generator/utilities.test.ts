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

  const utility = (name: string): string => {
    const at = css.indexOf(`@utility ${name} {`);

    expect(at, name).toBeGreaterThan(-1);

    let depth = 0;

    for (let i = css.indexOf("{", at); i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") {
        depth -= 1;

        if (depth === 0) return css.slice(at, i + 1);
      }
    }

    return "";
  };

  it("объявляет оба кольца полей", () => {
    expect(css).toMatch(/@utility status-focused-field\b/);
    expect(css).toMatch(/@utility status-invalid-field\b/);
  });

  /*
   * Кольцо поля — ТЕНЬ, как у эталона: он собирает его из ring-*, то есть box-shadow. Отсюда два
   * следствия, которые и проверяются: в обычном состоянии утилита не рисует outline вовсе, а
   * передаёт форму кольца компоненту через --field-ring, чтобы тот подмешал её в свою тень.
   */
  it("отдаёт кольцо тенью через --field-ring, а не рисует outline", () => {
    const focused = utility("status-focused-field");

    expect(focused).toMatch(/--field-ring:\s*0 0 0 2px var\(--color-focus\)/);
    expect(focused).toMatch(/outline:\s*none/);
  });

  /*
   * В forced-colors тени не рисуются вовсе, поэтому там кольцо обязано падать на outline — иначе
   * поле остаётся без индикатора фокуса в режиме, где цветом отличить его нельзя.
   */
  it("падает на outline в forced-colors, где тень не рисуется", () => {
    const focused = utility("status-focused-field");
    const at = focused.indexOf("@media (forced-colors: active)");

    expect(at).toBeGreaterThan(-1);
    expect(focused.slice(at)).toMatch(/outline:\s*2px solid var\(--color-focus\)/);
  });

  it("оставляет общему кольцу его отступ — два кольца, а не одно", () => {
    expect(utility("status-focused")).toMatch(
      /outline-offset:\s*var\(--ring-offset-width\)/,
    );
  });

  it("красит невалидное поле danger-soft-foreground, а не danger: 2.95:1 против заливки в тёмной теме", () => {
    const invalid = utility("status-invalid-field");

    expect(invalid).toContain("var(--color-danger-soft-foreground)");
    expect(invalid).not.toMatch(/var\(--color-danger\)/);
  });

  it("утолщает кольцо невалидности и по псевдоклассу, и по data-атрибуту", () => {
    const invalid = utility("status-invalid-field");

    for (const form of [":focus", ":focus-visible", ":focus-within"]) {
      expect(invalid, form).toContain(`&${form}`);
    }
    for (const form of ["data-focused", "data-focus-visible", "data-focus-within"]) {
      expect(invalid, form).toContain(`[${form}]`);
    }

    expect(invalid).toMatch(/--field-ring:\s*0 0 0 2px var\(--color-danger-soft-foreground\)/);
  });
});
