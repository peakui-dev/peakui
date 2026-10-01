/**
 * The token layer's CI gates.
 *
 * Each gate catches a failure that is silent otherwise: a token that resolves to nothing renders an
 * element unstyled with no error anywhere, and a stale committed CSS file means the preset and the
 * shipped theme disagree with nobody noticing.
 *
 * Fixtures are injectable so each gate can be driven in a test without touching the real tree.
 */

import {readFileSync, readdirSync} from "node:fs";
import {join, resolve} from "node:path";

import type {TokenSet} from "./preset.ts";

import {presets} from "../../presets/index.ts";
import {deriveTheme} from "./derive.ts";
import {emitVariablesCss} from "./emit.ts";

const ROOT = resolve(import.meta.dirname, "../..");

export type CheckFixtures = {
  /** Overrides the committed CSS read from disk, keyed by path relative to the package root. */
  committed?: Record<string, string>;
  /** Overrides `themes/shared/theme.css`. */
  themeCss?: string;
  /** An additional theme to check for completeness. */
  extraTheme?: {id: string; tokens: TokenSet};
  /** Extra component CSS files, keyed by file name. */
  componentCss?: Record<string, string>;
};

const readOr = (relative: string, override: string | undefined): string => {
  if (override !== undefined) return override;

  return readFileSync(join(ROOT, relative), "utf8");
};

export function checkTokens(fixtures: CheckFixtures = {}): {errors: string[]} {
  const errors: string[] = [];

  // Gate 1 — the committed CSS matches what the preset generates.
  for (const preset of presets) {
    const relative = `themes/${preset.id}/variables.css`;
    const expected = emitVariablesCss(preset, deriveTheme(preset));
    const actual = readOr(relative, fixtures.committed?.[relative]);

    if (actual !== expected) {
      errors.push(
        `Дрейф токенов: ${relative} не совпадает с выводом пресета «${preset.id}». ` +
          `Запустите pnpm tokens:build и закоммитьте результат.`,
      );
    }
  }

  // Gate 2 — contrast still holds for every preset.
  for (const preset of presets) {
    const {fixes} = deriveTheme(preset);

    for (const fix of fixes) {
      errors.push(
        `Контраст: пресет «${preset.id}» требует правки «${fix.token}» ` +
          `(светлота ${fix.from.toFixed(3)} → ${fix.to.toFixed(3)}). Палитра выбрана неверно.`,
      );
    }
  }

  // Gates 3 and 4 — every var() in theme.css resolves, and every theme declares the full set.
  const themeCss = readOr("themes/shared/theme.css", fixtures.themeCss);
  const referenced = [...themeCss.matchAll(/--[\w-]+:\s*var\(--([\w-]+)[,)]/g)].map((m) => m[1]!);

  const themes: {id: string; tokens: TokenSet}[] = presets.map((preset) => {
    const {invariant, light, dark} = deriveTheme(preset);

    return {id: preset.id, tokens: {...invariant, ...light, ...dark}};
  });

  if (fixtures.extraTheme) themes.push(fixtures.extraTheme);

  const required = new Set(Object.keys(themes[0]?.tokens ?? {}));

  for (const theme of themes) {
    const declared = new Set(Object.keys(theme.tokens));

    for (const name of referenced) {
      if (!declared.has(name)) {
        errors.push(`Висящий токен: theme.css ссылается на --${name}, тема «${theme.id}» его не объявляет.`);
      }
    }

    const missing = [...required].filter((name) => !declared.has(name));

    if (missing.length > 0) {
      errors.push(
        `Неполная тема «${theme.id}»: не объявлено ${missing.length} токенов ` +
          `(${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}). ` +
          `Пропущенный токен молча резолвится в пустоту, а не в фолбэк.`,
      );
    }
  }

  // Gate 5 — no literal colours and no numbered tokens in component CSS.
  const componentFiles: Record<string, string> = {};

  try {
    for (const name of readdirSync(join(ROOT, "components"))) {
      if (name.endsWith(".css")) {
        componentFiles[name] = readFileSync(join(ROOT, "components", name), "utf8");
      }
    }
  } catch {
    // No components yet; the gate simply has nothing to check.
  }

  Object.assign(componentFiles, fixtures.componentCss ?? {});

  for (const [name, css] of Object.entries(componentFiles)) {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");

    if (/#[0-9a-fA-F]{3,8}\b/.test(stripped)) {
      errors.push(`Литеральный цвет: ${name} содержит hex. Ссылайтесь на семантический токен.`);
    }

    if (/\b(?:rgb|rgba|hsl|hsla)\(/.test(stripped)) {
      errors.push(`Литеральный цвет: ${name} содержит rgb()/hsl(). Ссылайтесь на семантический токен.`);
    }

    const numbered = stripped.match(/--color-[\w-]*?-\d+\b/g);

    if (numbered) {
      errors.push(
        `Числовой токен: ${name} ссылается на ${[...new Set(numbered)].join(", ")}. ` +
          `Набор семантический — числовых шкал в нём нет.`,
      );
    }
  }

  return {errors};
}
