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

describe("focus ring utilities", () => {
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

  const forcedColorsPart = (body: string): string => {
    const at = body.indexOf("@media (forced-colors: active)");

    expect(at).toBeGreaterThan(-1);

    return body.slice(at);
  };

  it("объявляет три утилиты состояния фокуса", () => {
    expect(css).toMatch(/@utility status-focused \{/);
    expect(css).toMatch(/@utility status-focused-field \{/);
    expect(css).toMatch(/@utility status-invalid-field \{/);
  });

  /*
   * Оба кольца отдают форму тенью через --focus-ring и не объявляют box-shadow сами: объявление
   * затёрло бы собственную тень компонента вместо наложения. Это и есть разница с эталоном по
   * форме записи при том же результате — у него композицией занимается Tailwind.
   */
  it("отдаёт оба кольца тенью через --focus-ring, не рисуя outline", () => {
    for (const name of ["status-focused", "status-focused-field"]) {
      const body = utility(name);

      expect(body, name).toMatch(/--focus-ring:/);
      expect(body, name).toMatch(/outline:\s*none/);
      expect(body, name).not.toMatch(/\n\s*box-shadow:/);
    }
  });

  /*
   * Общее кольцо — ДВА слоя, как ring-offset-background у эталона: сначала отступ цветом фона
   * страницы, затем само кольцо шире на ту же величину. Один слой означал бы кольцо без отступа.
   */
  it("даёт общему кольцу отступ цветом фона и кольцо поверх него", () => {
    const body = utility("status-focused");

    expect(body).toMatch(/0 0 0 var\(--ring-offset-width\) var\(--color-background\)/);
    expect(body).toMatch(/0 0 0 calc\(var\(--ring-offset-width\) \+ 2px\) var\(--color-focus\)/);
  });

  /* Кольцо поля сидит вплотную: ровно ring-2 ring-offset-0 у эталона. */
  it("даёт кольцу поля нулевой отступ", () => {
    expect(utility("status-focused-field")).toMatch(
      /--focus-ring:\s*0 0 0 2px var\(--color-focus\)/,
    );
  });

  /*
   * В forced-colors тени не рисуются вовсе, поэтому каждое кольцо обязано падать на outline — иначе
   * контрол остаётся без индикатора фокуса в режиме, где отличить его цветом нельзя.
   */
  it("падает на outline в forced-colors у всех трёх утилит", () => {
    expect(forcedColorsPart(utility("status-focused"))).toMatch(
      /outline:\s*2px solid var\(--color-focus\)/,
    );
    expect(forcedColorsPart(utility("status-focused-field"))).toMatch(
      /outline:\s*2px solid var\(--color-focus\)/,
    );
    expect(forcedColorsPart(utility("status-invalid-field"))).toMatch(/outline:\s*2px solid/);
  });

  /*
   * Невалидное поле: в покое outline в 1px, в фокусе тень в 2px — форма эталона целиком. В его
   * собственном коде outline в фокусе не снимается, и кольцо выходит двойным; здесь выполнено его
   * обещание «remove outline», а не его код.
   */
  it("рисует невалидное поле outline в покое и тенью в фокусе", () => {
    const body = utility("status-invalid-field");
    const resting = body.slice(0, body.indexOf("&:focus"));

    expect(resting).toMatch(/outline:\s*1px solid var\(--color-danger-soft-foreground\)/);
    expect(body).toMatch(/--focus-ring:\s*0 0 0 2px var\(--color-danger-soft-foreground\)/);
  });

  it("красит невалидное поле danger-soft-foreground, а не danger: 2.95:1 против заливки в тёмной теме", () => {
    const body = utility("status-invalid-field");

    expect(body).toContain("var(--color-danger-soft-foreground)");
    expect(body).not.toMatch(/var\(--color-danger\)/);
  });

  it("переключает невалидное кольцо и по псевдоклассу, и по data-атрибуту", () => {
    const body = utility("status-invalid-field");

    for (const form of [":focus", ":focus-visible", ":focus-within"]) {
      expect(body, form).toContain(`&${form}`);
    }
    for (const form of ["data-focused", "data-focus-visible", "data-focus-within"]) {
      expect(body, form).toContain(`[${form}]`);
    }
  });
});
