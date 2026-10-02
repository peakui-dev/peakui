import {readFileSync, readdirSync} from "node:fs";

/*
 * Гейт полноты бочки, портирован из packages/styles/src/components/index.test.ts. «Компонент есть,
 * в бочке забыли» не ловит ничто само: сборка проходит, а компонент просто недостижим из корня
 * пакета.
 *
 * Читается файловая система, а не граф модулей: забытая строка видна только так.
 *
 * Комментарии срезаются до сверки, иначе гейт проходит на ВЫКЛЮЧЕННОМ экспорте — строка
 * `// export * from "./spinner/index.ts";` содержит искомую подстроку целиком. В пакете стилей
 * первая версия этого файла именно так и прошла на заведомо сломанной бочке.
 *
 * Парный CSS здесь не проверяется: он живёт в @peakui/styles, и его гейт уже там.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[^\n\S]*\/\/.*$/gm, "");

const componentDirs = readdirSync("src/components", {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const barrel = stripComments(readFileSync("src/components/index.ts", "utf8"));

describe("бочка компонентов", () => {
  /*
   * Объявлено первым и не случайно: it.each([]) не регистрирует ни одного теста, поэтому на
   * пустом наборе гейт ниже прошёл бы, не проверив ничего.
   */
  it("не проходит вхолостую на пустом наборе", () => {
    expect(componentDirs.length).toBeGreaterThan(0);
  });

  it.each(componentDirs)("реэкспортирует %s из бочки", (name) => {
    expect(barrel).toContain(`export * from "./${name}/index.ts";`);
  });
});
