"use client";

import {useIsSSR} from "@react-aria/ssr";
import {useMemo} from "react";

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
