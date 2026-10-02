import react from "@vitejs/plugin-react";
import {defineConfig, mergeConfig} from "vitest/config";

import {uiConfig} from "./configs/react.mjs";

/* Пакет проверяет сам себя теми же настройками, которые отдаёт наружу. */
export default mergeConfig(
  uiConfig,
  defineConfig({
    plugins: [react()],
    test: {
      include: ["tests/**/*.test.{ts,tsx}"],
      passWithNoTests: false,
    },
  }),
);
