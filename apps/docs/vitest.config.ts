import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

import mdx from "fumadocs-mdx/vite";
import {defineConfig} from "vitest/config";

import * as mdxConfig from "./source.config.ts";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // @ts-expect-error mdx()'s plugin is typed against vite 8 (installed for vinext), while
  // vitest resolves vite 7 declarations; runtime-compatible, declarations are not.
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
