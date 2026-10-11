/*
 * Extracts the `@theme inline` declarations that must be re-declared on an embedded scope.
 *
 * Tailwind emits `@theme` variables on `:root`, and a custom property that references another
 * one (like `--radius-3xl: calc(var(--radius) * 3)`) is substituted once, at `:root`. A theme
 * injected onto a container therefore freezes every derived mapping: components that reference
 * `var(--radius-3xl)` or `var(--color-default)` directly keep the site-wide values no matter
 * what the scope declares. Re-declaring the same declarations on the scope element makes them
 * recompute from the scope's tokens — which is why the extraction returns exactly the
 * declarations whose value contains a `var(...)`: static ones (easings) are inherited as-is.
 */

export function extractThemeDerivations(themeCss: string): string {
  const declarations = [
    ...themeCss.matchAll(/^\s*(--[\w-]+):\s*([^;]*var\(--[^)]*\)[^;]*);/gm),
  ].map((match) => `  ${match[1]}: ${match[2]};`);

  return declarations.join("\n");
}
