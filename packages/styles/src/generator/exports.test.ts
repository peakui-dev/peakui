import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

import {defaultPreset} from "../../presets/default.ts";

import {deriveTheme} from "./derive.ts";
import {emitVariablesCss} from "./emit.ts";

describe("exports", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    exports?: Record<string, unknown>;
    sideEffects?: boolean;
  };

  it("объявляет пути из спеки", () => {
    for (const key of [
      "./css",
      "./themes/default",
      "./themes/*",
      "./base",
      "./components/*",
      "./components/*.css",
      "./utilities",
      "./variants",
      "./generator",
    ]) {
      expect(pkg.exports, key).toHaveProperty([key]);
    }
  });

  /*
   * Два пространства имён на одном префиксе. Node выбирает шаблон по специфичности, а не по
   * порядку объявления, поэтому "./components/*.css" продолжает выигрывать у "./components/*" для
   * запроса CSS. Пришпилены оба, чтобы поздняя правка не свела их в один ключ: тогда
   * @peakui/styles/components/button.css отдал бы TypeScript-исходник.
   */
  it("разводит JS- и CSS-подпути одного префикса", () => {
    expect(pkg.exports?.["./components/*.css"]).toBe("./components/*.css");
    expect(pkg.exports?.["./components/*"]).toMatchObject({
      types: "./src/components/*/index.ts",
    });
  });

  it("declares CSS files as side effects so bundlers keep style imports", () => {
    expect(pkg.sideEffects).toEqual(["**/*.css"]);
  });

  it("экспортирует генератор как публичный API для Pro", () => {
    expect(pkg.exports?.["./generator"]).toBeDefined();
  });
});

describe("поверхность on-surface", () => {
  const {light} = deriveTheme(defaultPreset);
  const names = Object.keys(light).filter((name) => name.startsWith("on-surface"));

  it("не проходит вхолостую", () => {
    expect(names).toHaveLength(9);
  });

  /*
   * Направление, которого не проверяет ни один гейт: висящие токены ловят var() в theme.css, то есть
   * ссылку без объявления. Обратное — объявленный токен без отображения в @theme inline — проходит
   * молча, а потребитель и страница получают пустоту.
   */
  it.each(names)("выставляет %s через @theme inline", (name) => {
    const themeCss = readFileSync("themes/shared/theme.css", "utf8");

    expect(themeCss).toContain(`--color-${name}: var(--${name});`);
  });

  it.each(names)("даёт %s системный цвет в forced-colors", (name) => {
    const css = emitVariablesCss(defaultPreset, deriveTheme(defaultPreset));
    const block = css.slice(css.indexOf("@media (forced-colors: active)"));

    expect(block).toContain(`--${name}:`);
  });
});
