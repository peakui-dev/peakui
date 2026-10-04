"use client";

import {useMemo, useSyncExternalStore} from "react";

/*
 * Ported from the reference's use-css-variable.ts. One substitution: the reference takes
 * `useIsSSR` from `@react-aria/ssr`, a package this workspace does not depend on, and since
 * react-aria 3.52 that hook is literally the `useSyncExternalStore` call below (see
 * dist/private/ssr/SSRProvider.mjs). The semantics are identical: true during SSR and
 * hydration, false afterwards — which is what keeps the first client render byte-equal to
 * the server markup instead of reading the DOM a hydration pass too early.
 */
const subscribeNoop = () => () => {};

const useIsSSR = (): boolean =>
  useSyncExternalStore(
    subscribeNoop,
    () => false,
    () => true,
  );

/* Cache for CSS variable values to avoid repeated DOM queries. */
const cssVariableCache = new Map<string, string | undefined>();

/**
 * Reads a CSS custom property from the document element with SSR support and an optional
 * override that takes precedence over the variable.
 *
 * @param variableName - The CSS custom property name, e.g. `'--skeleton-animation'`
 * @param override - When defined, returned instead of reading the variable
 * @param cache - Cache the read value for the lifetime of the module (default `true`)
 * @returns The variable value, the override, or `undefined`
 */
export function useCSSVariable(
  variableName: string,
  override?: string,
  cache: boolean = true,
): string | undefined {
  const isSSR = useIsSSR();

  return useMemo(() => {
    if (override !== undefined) return override;

    if (isSSR) return undefined;

    if (cache && cssVariableCache.has(variableName)) {
      return cssVariableCache.get(variableName);
    }

    try {
      const root = document.documentElement;
      const value = getComputedStyle(root).getPropertyValue(variableName).trim() || undefined;

      if (cache) {
        cssVariableCache.set(variableName, value);
      }

      return value;
    } catch {
      return undefined;
    }
  }, [variableName, override, isSSR, cache]);
}
