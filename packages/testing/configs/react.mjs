import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import {defineConfig, mergeConfig} from "vitest/config";

import {baseConfig} from "./base.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const setupFile = join(here, "../setup/react.ts");

/*
 * jsdom-настройки для React-пакетов. Браузерного яруса здесь нет осознанно: у эталона он собран
 * на vitest-browser, а в peakui браузерные проверки — это Playwright в apps/storybook/e2e.
 */
export const uiConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      passWithNoTests: true,
      setupFiles: [setupFile],
    },
  }),
);
