"use client";

import type {BuilderState} from "./url-codec";
import type {Scheme, ThemePreset} from "@peakui/styles/generator";

import {deriveTheme, emitVariablesCss} from "@peakui/styles/generator";
import {useDeferredValue, useMemo} from "react";

import {toPreset} from "./presets";

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

  /*
   * The builder themes the whole page: the emission is the standard one a theme ships with —
   * `:root` carries the light scheme, `[data-theme="builder-dark"]` the dark one — and the
   * page sets that attribute on <html>. No scoping, no derived-variable re-declarations: at
   * :root the shared theme's own calc() chains re-resolve against the winning tokens.
   */
  const themeCss = useDeferredValue(
    useMemo(() => emitVariablesCss(preset, derived), [preset, derived]),
  );

  return {preset, derived, themeCss, scheme: scheme as Scheme};
}
