import nextConfig from "@peakui/standard/eslint/next.mjs";
import {defineConfig} from "eslint/config";

const config = defineConfig([
  ...nextConfig,
  {
    // Generated output of the two builds. next.mjs already ignores .next and .source; the
    // vinext build adds .cloudflare (30 MB of worker output), .vinext and dist — without
    // these entries eslint scans the build output and a lint run takes minutes.
    ignores: [".cloudflare/**", ".vinext/**", "dist/**", ".source-vitest/**"],
  },
  {
    // Pin the tsconfig so the `@/*` aliases resolve the same way whether eslint runs from
    // apps/docs or from the repository root; otherwise import/order groups them differently.
    settings: {
      "import/resolver": {
        node: true,
        typescript: {
          project: new URL("./tsconfig.json", import.meta.url).pathname,
        },
      },
    },
  },
]);

export default config;
