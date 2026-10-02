import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import {uiConfig} from "@peakui/testing/configs/react";
import react from "@vitejs/plugin-react";
import {defineConfig, mergeConfig} from "vitest/config";

const srcDir = join(dirname(fileURLToPath(import.meta.url)), "src");

/*
 * Один проект, а не два. У эталона рядом с jsdom живёт ярус vitest-browser; в peakui браузерные
 * проверки — Playwright в apps/storybook/e2e, см. спеку 2026-10-02-react-package-button-design,
 * раздел 12.
 */
export default mergeConfig(
  uiConfig,
  defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": srcDir,
      },
    },
    test: {
      exclude: ["**/node_modules/**", "**/dist/**"],
      include: ["tests/**/*.{test,ssr.test}.{ts,tsx}"],
      passWithNoTests: false,
    },
  }),
);
