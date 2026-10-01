/**
 * The generator's public API.
 *
 * Exported from `@peakui/styles/generator` so `peakui-pro` can generate its premium themes with the
 * same pipeline. The dependency runs the right way: the core publishes, Pro consumes.
 */

import type {ThemePreset} from "./preset.ts";

import {deriveTheme} from "./derive.ts";
import {emitVariablesCss} from "./emit.ts";

export type {ContrastFix} from "./contrast.ts";
export type {RadiusId, Scheme, SemanticSet, ThemePreset, TokenSet} from "./preset.ts";
export type {Oklch} from "./color.ts";

export {contrastRatio, formatOklch, parseOklch, relativeLuminance} from "./color.ts";
export {TRANSPARENT, compositeOver, ensureContrast, mix} from "./contrast.ts";
export {RADIUS_BASE} from "./preset.ts";
export {deriveTheme} from "./derive.ts";
export {emitVariablesCss} from "./emit.ts";

export type GeneratedFile = {path: string; css: string};

const INDEX_CSS = `/* Тема «%ID%». Сгенерировано: pnpm tokens:build — не править руками. */

/* Публичная поверхность токенов для Tailwind */
@import "../shared/theme.css";

/* Значения этой темы */
@import "./variables.css" layer(theme);

/* Проход два: правки внутренностей компонентов этой темой */
@import "./components/index.css" layer(components);
`;

const COMPONENTS_CSS = `/*
 * Проход два контракта темы: правки внутренностей компонентов.
 *
 * Здесь живёт характер, невыразимый токеном — капслок на лейблах, хайрлайн-границы на конкретных
 * вариантах. Правила пишутся против BEM-классов и data-slot, поэтому они и объявлены публичным
 * контрактом в api-evolution.md: переименование слота ломает тему.
 *
 * У темы default этот слой пуст — она и есть базовый вид.
 */
`;

export function buildTheme(preset: ThemePreset): GeneratedFile[] {
  const derived = deriveTheme(preset);

  return [
    {path: `themes/${preset.id}/variables.css`, css: emitVariablesCss(preset, derived)},
    {path: `themes/${preset.id}/index.css`, css: INDEX_CSS.replaceAll("%ID%", preset.id)},
    {path: `themes/${preset.id}/components/index.css`, css: COMPONENTS_CSS},
  ];
}
