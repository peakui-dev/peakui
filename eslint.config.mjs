/*
 * Корневой конфиг — пресет из @peakui/standard плюс блоки приложений: пакетные конфиги делают то
 * же самое для своих файлов, а приложение с собственным конфигом при запуске из корня читает
 * только этот файл. Блок приложения живёт здесь, а не в общем пресете.
 */
import {demoRules, nextRules} from "@peakui/standard/eslint/next-rules.mjs";
import reactConfig from "@peakui/standard/eslint/react.mjs";
import {defineConfig} from "eslint/config";

const config = defineConfig([
  {
    // Consumer code the evals show to an agent, known-bad reference solutions and agent output:
    // none of it is this repository's source. Agent worktrees and the SDD workspace are full
    // copies of this repository, not source either — without these entries a root lint run
    // during a parallel wave scans every worktree copy and fails on files the per-path ignores
    // below no longer match.
    ignores: [
      "evals/fixtures/*/**",
      "evals/tasks/*/overlay/**",
      "evals/tasks/*/solutions/**",
      "evals/results/**",
      ".worktrees/**",
      ".superpowers/**",
    ],
  },
  ...reactConfig,
  {
    /*
     * The docs app is a Next.js app. Run from its own directory it uses next.mjs; this block gives
     * the same overrides to a run from the repository root, which reads only the root config.
     */
    files: ["apps/docs/**/*.{js,mjs,ts,tsx}"],
    rules: nextRules,
    /*
     * The app's `@/*` aliases live in its own tsconfig. Without this a root run cannot resolve
     * them, import/order sorts them into a different group than a run inside the app does, and
     * the two produce contradictory autofixes.
     */
    settings: {
      "import/resolver": {
        node: true,
        typescript: {
          project: "apps/docs/tsconfig.json",
        },
      },
    },
  },
  {
    files: ["apps/docs/src/demos/**/*.{ts,tsx}"],
    rules: demoRules,
  },
]);

export default config;
