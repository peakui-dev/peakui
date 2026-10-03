import {defineConfig} from "eslint/config";

import {demoRules, nextRules} from "./next-rules.mjs";
import reactConfig from "./react.mjs";

/* The React preset plus the overrides a Next.js app needs. Used from inside the app's directory. */
const config = defineConfig([
  ...reactConfig,
  {
    rules: nextRules,
  },
  {
    files: ["src/demos/**/*.{ts,tsx}"],
    rules: demoRules,
  },
  {
    ignores: [".next/**", ".source/**", "next-env.d.ts"],
  },
]);

export default config;
