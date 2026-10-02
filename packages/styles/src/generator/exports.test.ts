import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

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

  it("держит sideEffects: false", () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it("экспортирует генератор как публичный API для Pro", () => {
    expect(pkg.exports?.["./generator"]).toBeDefined();
  });
});
