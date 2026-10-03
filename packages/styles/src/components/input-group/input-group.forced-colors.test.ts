import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

/*
 * Контентный гейт в той же форме, что button.pending.test.ts: пакет работает в окружении node и
 * вычислить стиль не может. Поведенческого доказательства у forced-colors нет вовсе — Playwright не
 * умеет включать режим принудительных цветов, — поэтому этот тест единственный, кто держит правило.
 *
 * Правило: --field-border-width равен 0px, а блок forced-colors темы его НЕ переопределяет — он
 * задаёт только цвет границы. Значит ширину поднимает каждый элемент, несущий опознающую границу
 * поля: само поле, оболочка группы и оба её слота. У слотов это разделительная линия, без которой
 * «https://» сливается с введённым текстом в один неразделённый прямоугольник — ровно в том режиме,
 * где опознавать контрол по цвету нельзя.
 *
 * Найдено ревью ветки: у слотов блока не было, хотя и спека, и план называют все четыре селектора.
 */

/*
 * Комментарии срезаются до разбора: в них есть и запятые, и фигурные скобки, и первая версия этого
 * гейта принимала за список селекторов хвост предыдущего комментария.
 */
const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, "");

const inputCss = stripComments(readFileSync("components/input.css", "utf8"));
const inputGroupCss = stripComments(readFileSync("components/input-group.css", "utf8"));

/*
 * Все правила верхнего уровня, в списке селекторов которых есть нужный. Их больше одного:
 * .input-group__suffix объявлен и в общем блоке со префиксом, и в своём. Гейт спрашивает «поднимает
 * ли поставляемый CSS ширину», а не «в каком именно правиле» — поэтому перебираются все.
 */
function rulesFor(css: string, selector: string): string[] {
  const rules: string[] = [];
  let index = 0;

  while (index < css.length) {
    const open = css.indexOf("{", index);

    if (open === -1) break;

    const selectorList = css.slice(index, open);
    let depth = 0;
    let close = open;

    for (let i = open; i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") {
        depth -= 1;

        if (depth === 0) {
          close = i;
          break;
        }
      }
    }

    const names = selectorList
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    if (names.includes(selector)) {
      rules.push(css.slice(open, close + 1));
    }

    index = close + 1;
  }

  return rules;
}

function raisesBorderInForcedColors(css: string, selector: string): boolean {
  return rulesFor(css, selector).some((body) => {
    const at = body.indexOf("@media (forced-colors: active)");

    return at !== -1 && /border-width:\s*1px/.test(body.slice(at));
  });
}

describe("опознающая граница поля в forced-colors", () => {
  it("не проходит вхолостую: селекторы найдены в своих файлах", () => {
    expect(rulesFor(inputCss, ".input").length).toBeGreaterThan(0);
    expect(rulesFor(inputGroupCss, ".input-group").length).toBeGreaterThan(0);
    expect(rulesFor(inputGroupCss, ".input-group__prefix").length).toBeGreaterThan(0);
    expect(rulesFor(inputGroupCss, ".input-group__suffix").length).toBeGreaterThan(0);
  });

  it("поднимает ширину границы у .input", () => {
    expect(raisesBorderInForcedColors(inputCss, ".input")).toBe(true);
  });

  it("поднимает ширину границы у .input-group", () => {
    expect(raisesBorderInForcedColors(inputGroupCss, ".input-group")).toBe(true);
  });

  it("поднимает ширину разделительной линии у .input-group__prefix", () => {
    expect(raisesBorderInForcedColors(inputGroupCss, ".input-group__prefix")).toBe(true);
  });

  it("поднимает ширину разделительной линии у .input-group__suffix", () => {
    expect(raisesBorderInForcedColors(inputGroupCss, ".input-group__suffix")).toBe(true);
  });
});
