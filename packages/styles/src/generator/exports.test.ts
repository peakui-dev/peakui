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
      "./components/*.css",
      "./utilities",
      "./variants",
      "./generator",
    ]) {
      expect(pkg.exports, key).toHaveProperty([key]);
    }
  });

  it("держит sideEffects: false", () => {
    expect(pkg.sideEffects).toBe(false);
  });

  it("экспортирует генератор как публичный API для Pro", () => {
    expect(pkg.exports?.["./generator"]).toBeDefined();
  });
});
