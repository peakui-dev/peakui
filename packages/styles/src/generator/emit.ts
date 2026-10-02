/**
 * Token sets → `variables.css`.
 *
 * Output is byte-stable: tokens are sorted within each block, so a diff in a pull request shows
 * what actually changed about the theme rather than an incidental reordering.
 */

import type {deriveTheme} from "./derive.ts";
import type {Scheme, ThemePreset, TokenSet} from "./preset.ts";

type Derived = ReturnType<typeof deriveTheme>;

const INDENT = "  ";

/**
 * Roles mapped to CSS system colours for forced-colors mode.
 *
 * One block per theme means every component that honours the token layer degrades correctly for
 * free; a component is then left with only its structural part, keeping a boundary visible.
 */
const FORCED_COLORS: TokenSet = {
  background: "Canvas",
  foreground: "CanvasText",
  surface: "Canvas",
  "surface-foreground": "CanvasText",
  "surface-secondary": "Canvas",
  "surface-tertiary": "Canvas",
  overlay: "Canvas",
  "overlay-foreground": "CanvasText",
  muted: "GrayText",
  default: "ButtonFace",
  "default-foreground": "ButtonText",
  accent: "Highlight",
  "accent-foreground": "HighlightText",
  border: "ButtonBorder",
  separator: "ButtonBorder",
  focus: "CanvasText",
  link: "LinkText",
  "field-background": "Field",
  "field-foreground": "FieldText",
  "field-border": "ButtonBorder",
};

const declarations = (tokens: TokenSet, indent: string): string =>
  Object.keys(tokens)
    .sort()
    .map((name) => `${indent}--${name}: ${tokens[name]};`)
    .join("\n");

/** A theme's scheme matches a bare class, a `data-theme` attribute, and both inside a shadow tree. */
const selectorsFor = (id: string, scheme: Scheme): string => {
  const name = `${id}-${scheme}`;
  const selectors = [
    `.${name}`,
    `[data-theme="${name}"]`,
    `:host(.${name})`,
    `:host([data-theme="${name}"])`,
  ];

  // The light scheme is also the unqualified default, so bare `:root` resolves without a theme class.
  if (scheme === "light") selectors.unshift(":root", ":host");

  return selectors.join(",\n");
};

export function emitVariablesCss(preset: ThemePreset, derived: Derived): string {
  const parts: string[] = [];

  parts.push(
    `${INDENT}/* Тема «${preset.id}». Сгенерировано: pnpm tokens:build — не править руками. */`,
  );

  // `:root` matches nothing inside a shadow tree, so scheme-invariant tokens are declared on both.
  parts.push(
    `${INDENT}:root,\n${INDENT}:host {\n${declarations(derived.invariant, INDENT.repeat(2))}\n${INDENT}}`,
  );

  for (const scheme of ["light", "dark"] as const) {
    const tokens = scheme === "light" ? derived.light : derived.dark;
    const selector = selectorsFor(preset.id, scheme)
      .split("\n")
      .map((line) => `${INDENT}${line}`)
      .join("\n");

    parts.push(
      `${selector} {\n${INDENT.repeat(2)}color-scheme: ${scheme};\n\n${declarations(tokens, INDENT.repeat(2))}\n${INDENT}}`,
    );
  }

  const forced = Object.keys(FORCED_COLORS)
    .sort()
    .map((name) => `${INDENT.repeat(3)}--${name}: ${FORCED_COLORS[name]};`)
    .join("\n");

  parts.push(
    `${INDENT}@media (forced-colors: active) {\n` +
      `${INDENT.repeat(2)}:root,\n${INDENT.repeat(2)}:host {\n${forced}\n${INDENT.repeat(2)}}\n` +
      `${INDENT}}`,
  );

  return `@layer base {\n${parts.join("\n\n")}\n}\n`;
}
