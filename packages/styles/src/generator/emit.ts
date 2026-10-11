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
  // Затемнение не имеет системного цвета: плафон заявляет перекрытие непрозрачным Canvas,
  // и компонентам больше не нужен обходной блок на месте.
  backdrop: "Canvas",
  muted: "GrayText",
  default: "ButtonFace",
  "default-foreground": "ButtonText",
  // on-surface по роли и есть default — нейтральная заливка контрола, только на поверхности.
  // hover намеренно тот же ButtonFace: в режиме высокого контраста состояния красит система.
  "on-surface": "ButtonFace",
  "on-surface-foreground": "ButtonText",
  "on-surface-hover": "ButtonFace",
  "on-surface-secondary": "ButtonFace",
  "on-surface-secondary-foreground": "ButtonText",
  "on-surface-secondary-hover": "ButtonFace",
  "on-surface-tertiary": "ButtonFace",
  "on-surface-tertiary-foreground": "ButtonText",
  "on-surface-tertiary-hover": "ButtonFace",
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

/**
 * A scope re-anchors a theme onto a container, for embedding (the theme builder's preview).
 *
 * The scope replaces the unqualified `:root`/`:host` anchor, and the shadow-tree `:host(…)`
 * forms are dropped: they have no meaning in a document-level, scoped sheet.
 */
const scopedSelectors = (selectors: string[], scope: string): string[] =>
  selectors
    .filter((selector) => !selector.startsWith(":host"))
    .map((selector) => (selector === ":root" ? scope : `${scope}${selector}`));

/** A theme's scheme matches a bare class, a `data-theme` attribute, and both inside a shadow tree. */
const selectorsFor = (id: string, scheme: Scheme, scope?: string): string => {
  const name = `${id}-${scheme}`;
  const selectors = [
    `.${name}`,
    `[data-theme="${name}"]`,
    `:host(.${name})`,
    `:host([data-theme="${name}"])`,
  ];

  // The light scheme is also the unqualified default, so bare `:root` resolves without a theme class.
  if (scheme === "light") selectors.unshift(":root", ":host");

  return (scope === undefined ? selectors : scopedSelectors(selectors, scope)).join(",\n");
};

export function emitVariablesCss(
  preset: ThemePreset,
  derived: Derived,
  options: {scope?: string} = {},
): string {
  const anchor = (indent: string): string =>
    options.scope === undefined ? `${indent}:root,\n${indent}:host` : `${indent}${options.scope}`;

  const parts: string[] = [];

  parts.push(
    `${INDENT}/* Тема «${preset.id}». Сгенерировано: pnpm tokens:build — не править руками. */`,
  );

  // `:root` matches nothing inside a shadow tree, so scheme-invariant tokens are declared on both.
  parts.push(
    `${anchor(INDENT)} {\n${declarations(derived.invariant, INDENT.repeat(2))}\n${INDENT}}`,
  );

  for (const scheme of ["light", "dark"] as const) {
    const tokens = scheme === "light" ? derived.light : derived.dark;
    const selector = selectorsFor(preset.id, scheme, options.scope)
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
      `${anchor(INDENT.repeat(2))} {\n${forced}\n${INDENT.repeat(2)}}\n` +
      `${INDENT}}`,
  );

  return `@layer base {\n${parts.join("\n\n")}\n}\n`;
}
