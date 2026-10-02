import {existsSync, readdirSync, readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

/*
 * Гейт полноты. У эталона бочка — ручной список на восемьдесят строк, и «компонент есть, в бочке
 * забыли» там не ловит ничто: сборка проходит, а вариант-функция просто недостижима из корня
 * пакета. То же про парный CSS — имя класса без правила за ним рендерится молча и без стилей.
 *
 * Читается файловая система, а не граф модулей: забытая строка видна только так.
 *
 * Комментарии срезаются до сверки, иначе гейт проходит на ВЫКЛЮЧЕННОМ экспорте: строка
 * `// export * from "./button/index.ts";` содержит искомую подстроку целиком. Первая версия этого
 * файла именно так и прошла проверку на заведомо сломанной бочке.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[^\n\S]*\/\/.*$/gm, "");

const componentDirs = readdirSync("src/components", {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const barrel = stripComments(readFileSync("src/components/index.ts", "utf8"));
const cssLayer = stripComments(readFileSync("components/index.css", "utf8"));

describe("бочка компонентов", () => {
  /*
   * Объявлено первым и не случайно: it.each([]) не регистрирует ни одного теста, поэтому на пустом
   * наборе оба гейта ниже прошли бы, не проверив ничего.
   */
  it("не проходит вхолостую на пустом наборе", () => {
    expect(componentDirs.length).toBeGreaterThan(0);
  });

  it.each(componentDirs)("реэкспортирует %s из бочки", (name) => {
    expect(barrel).toContain(`export * from "./${name}/index.ts";`);
  });

  it.each(componentDirs)("даёт %s парный CSS, импортированный слоем компонентов", (name) => {
    expect(existsSync(`components/${name}.css`), `components/${name}.css`).toBe(true);
    expect(cssLayer).toContain(`@import "./${name}.css";`);
  });
});
