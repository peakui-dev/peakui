import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

/*
 * references/react-aria-components.md, раздел «Import style: deep subpaths»: примитив
 * импортируется только из своего подпути, никогда из корня пакета. Корневой импорт тянет в граф
 * модулей всю библиотеку — а per-component tree-shaking ровно для этого и выбирался unbundle-режим
 * сборки, см. спеку, раздел 5. То есть нарушение здесь работает против собственной сборки.
 *
 * Правило словесное, ESLint его не проверяет, и первая версия Button и compose.ts его нарушала.
 */

const walk = (dir: string): string[] =>
  readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(path);
    }

    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

const sources = walk("src");

describe("import style", () => {
  it("не проходит вхолостую на пустом наборе", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources)("%s импортирует react-aria-components только подпутями", (path) => {
    const code = readFileSync(path, "utf8");
    const rootImports = [...code.matchAll(/from\s+"react-aria-components"/g)];

    expect(rootImports).toHaveLength(0);
  });
});
