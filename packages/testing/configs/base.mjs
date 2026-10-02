import {defineConfig} from "vitest/config";

/** Общие настройки vitest. Покрытие включается только скриптом test:coverage. */
export const baseConfig = defineConfig({
  test: {
    coverage: {
      enabled: false,
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
    },
    passWithNoTests: true,
  },
});
