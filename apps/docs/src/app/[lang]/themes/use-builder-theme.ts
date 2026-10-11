"use client";

import type {BuilderState} from "./url-codec";
import type {Scheme, ThemePreset} from "@peakui/styles/generator";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";
import {useDeferredValue, useMemo} from "react";

import {toPreset} from "./presets";

export const PREVIEW_SCOPE = "#tb-preview";

export function useBuilderTheme(
  state: BuilderState,
  semanticOverrides?: ThemePreset["semanticOverrides"],
  themeDerivations?: string,
) {
  const {accent, darkAccent, formRadius, grayChroma, radius, scheme} = state;

  const preset = useMemo(
    () => toPreset({accent, grayChroma, radius, formRadius, darkAccent}, semanticOverrides),
    [accent, grayChroma, radius, formRadius, darkAccent, semanticOverrides],
  );
  const derived = useMemo(() => deriveTheme(preset), [preset]);
  const previewCss = useDeferredValue(
    useMemo(() => {
      const emitted = emitVariablesCss(preset, derived, {scope: PREVIEW_SCOPE});

      // The re-declared derivations recompute the shared theme's derived mappings
      // (--radius-*, --color-*, --shadow-*) from THIS theme's tokens inside the scope.
      return themeDerivations
        ? `${emitted}\n\n${PREVIEW_SCOPE} {\n${themeDerivations}\n}`
        : emitted;
    }, [preset, derived, themeDerivations]),
  );

  return {preset, derived, previewCss, scheme: scheme as Scheme};
}
