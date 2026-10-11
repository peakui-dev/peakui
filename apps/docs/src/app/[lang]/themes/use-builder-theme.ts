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
) {
  const {accent, darkAccent, formRadius, grayChroma, radius, scheme} = state;

  const preset = useMemo(
    () => toPreset({accent, grayChroma, radius, formRadius, darkAccent}, semanticOverrides),
    [accent, grayChroma, radius, formRadius, darkAccent, semanticOverrides],
  );
  const derived = useMemo(() => deriveTheme(preset), [preset]);
  const previewCss = useDeferredValue(
    useMemo(() => emitVariablesCss(preset, derived, {scope: PREVIEW_SCOPE}), [preset, derived]),
  );

  return {preset, derived, previewCss, scheme: scheme as Scheme};
}
