import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import mdx from "fumadocs-mdx/vite";
import {defineConfig} from "vitest/config";

import * as mdxConfig from "./source.config.ts";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [mdx(mdxConfig)],
  resolve: {
    alias: [
      {find: "@/.source", replacement: join(root, ".source/server.ts")},
      {find: /^@\//, replacement: `${join(root, "src")}/`},
    ],
  },
  test: {
    environment: "node",
    /*
     * Глобалы нужны jsdom-наборам компонентов: сетап из @peakui/testing (installPointerEvent для
     * RAC) рассчитывает на глобальные beforeAll/afterAll — как в конфиге packages/react.
     */
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    testTimeout: 60_000,
  },
});
