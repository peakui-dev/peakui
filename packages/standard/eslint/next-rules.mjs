/*
 * Rule overrides for a Next.js app. They live apart from the presets because two configs need
 * them: next.mjs applies them when eslint runs inside the app, and react.mjs applies them to
 * apps/docs when eslint runs from the repository root, where only the root config is read.
 */

export const nextRules = {
  // Server routes and build-time code report failures on stderr; stray console.log is still caught.
  "no-console": ["warn", {allow: ["error", "warn"]}],
  /*
   * A Vite HMR rule. Next route files must export `metadata`, `generateStaticParams` and friends
   * next to the component, and Next's own Fast Refresh handles that.
   */
  "react-refresh/only-export-components": "off",
};

// Demos are documentation: they log to the console to show that a handler fired.
export const demoRules = {
  "no-console": "off",
};
