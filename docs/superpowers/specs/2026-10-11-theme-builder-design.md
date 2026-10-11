# Theme Builder — a visual editor over the theme generator

A page at `/themes` in the docs app where a visitor tunes a PeakUI theme with live preview and
walks away with a drop-in CSS file, a `ThemePreset` snippet, and a shareable URL. The builder is a
UI over the **existing** theme engine — it adds no color math of its own.

## Task

Add the Theme Builder to `apps/docs` (pipeline stage 4 territory: an app feature, not a component
change), plus one small, gated addition to the generator's emitter: a `scope` option. Work happens
in a separate git worktree of this repository.

## Why now, and why this shape

The generator already publishes everything a builder needs:

- `ThemePreset` (`packages/styles/src/generator/preset.ts`) is a parametric model — accent,
  `grayChroma`, two radii, `darkAccent`, `semanticOverrides`, `typography`.
- `deriveTheme(preset)` (`packages/styles/src/generator/derive.ts`) produces the full token sets in
  OKLCH with contrast **enforced** (4.5:1 foregrounds, 3:1 focus ring) and discloses its
  adjustments as `fixes: ContrastFix[]`.
- `emitVariablesCss(preset, derived)` (`packages/styles/src/generator/emit.ts`) emits byte-stable
  CSS; `checkTokens` gates it in CI.
- The generator's public API is exported "so `peakui-pro` can generate its premium themes with the
  same pipeline" (`packages/styles/src/generator/index.ts`).

The vendored reference (HeroUI v3, `apps/docs/src/app/[lang]/themes/`) built its builder the other
way around: the docs app carries ~858 lines of client-side color math
(`utils/generate-theme-colors.ts`) over a hardcoded baseline of the default theme, the preset
pipeline re-implements the same math again (`scripts/build-theme-presets.mjs`, with its own
sRGB→OKLCH converter), and nothing keeps those copies aligned. HeroUI did that because its core
has no published parametric engine — the builder **is** the engine. PeakUI has the engine, so the
builder imports it: preview, exported CSS, and the preset snippet become three outputs of one
function, and "what you see is what the engine ships" holds byte for byte.

Landscape check (October 2026): shadcn folded `/themes` into the `/create` scaffolder, leaving the
editor niche to tweakcn; daisyUI ships 35 gallery themes with three independent radius scales;
Radix sells guaranteed-contrast scales; nobody combines URL-shareable state with engine-enforced
contrast in one editor. This builder takes both: state lives in the URL, contrast comes from
`deriveTheme` and is surfaced, not assumed.

## Decisions

| # | Decision |
| --- | --- |
| D1 | The builder is a route in `apps/docs` (`/[lang]/themes`), not a separate app and not a `peakui-pro` feature. |
| D2 | v1 controls are the parametric core: accent (OKLCH sliders + hex + swatches), `grayChroma`, `radius`, `formRadius`, optional `darkAccent`, local light/dark switch. Fonts and manual semantic overrides are follow-ups. |
| D3 | Outputs: full `variables.css` (copy/download), `ThemePreset` TS snippet, shareable URL. |
| D4 | Preset gallery (5–8 entries incl. brand-inspired with pinned `semanticOverrides`) lives in the builder's own code — editor inputs, **not** shipped core themes. |
| D5 | Preview is a gallery of real PeakUI components with inline contrast-transparency chips from `deriveTheme().fixes`. |
| D6 | The engine runs in the browser: `deriveTheme`/`emitVariablesCss` imported from `@peakui/styles/generator`. No server route, no second color math. |
| D7 | URL state is hand-rolled (zod-validated codec module); `nuqs` is not a dependency and is not added. |

## Architecture

Approach considered and rejected: builder-local color math (the HeroUI way). It violates the
one-implementation rule exactly where it hurts most — derivation **is** core — and it breaks the
correspondence between preview and what `tokens:build`/`peakui-pro` would produce from the same
preset. A server API route was the runner-up (engine runs in Node exactly as at build time), but
the generator is pure TS with no Node dependencies, so client-side execution gives the same
guarantee without a round-trip per slider drag.

### Data flow

All runtime state is client-side; the route's server component is only a shell with metadata.

```
URL query (?a=<accent> &g=<grayChroma> &r=<radius> &f=<formRadius> &da=<darkAccent> &scheme=…)
  → url-codec.ts         zod validation; anything invalid falls back to defaults
  → ThemePreset {id: "builder", …} + scheme
  → deriveTheme(preset)  useMemo → {invariant, light, dark, fixes}
  → emitVariablesCss(preset, derived, {scope: "#tb-preview"})
  → <style> inside the preview container (dangerouslySetInnerHTML)
  → preview container carries data-theme="builder-light" | "builder-dark"
```

`useDeferredValue` wraps the derived CSS so slider drags stay responsive while the preview and the
code panel re-render behind them.

The URL always stores **values**, never a preset id: share links survive gallery edits. The
current preset name ("Spotify", "Custom") is computed by comparing values against the gallery,
after the reference's `findMatchingTheme` pattern.

### The one core change: scoped emission

`emitVariablesCss` gains an optional third argument:

```ts
export function emitVariablesCss(
  preset: ThemePreset,
  derived: ReturnType<typeof deriveTheme>,
  options?: {scope?: string},
): string
```

With `scope` set (e.g. `"#tb-preview"`), every selector is prefixed: the scheme-invariant
`:root, :host` block becomes the scope itself; `.builder-light` becomes
`#tb-preview.builder-light`; `[data-theme=…]` variants are prefixed the same way; the `:host(…)`
shadow-tree variants are omitted (meaningless in a scoped, document-level sheet); the
`forced-colors` block is scoped like everything else. The **unscoped output stays byte-identical**
— the drift gate in `checkTokens` and the committed themes are untouched.

Cascade: the scoped rules (specificity `1-1-x`) override the default theme's `:root` declarations
(`0-1-0`) inside the same `@layer base`, so the builder theme reaches only the preview container.
The docs site chrome, `next-themes`, and the global theme toggle are not involved; the builder's
light/dark switch is local state mirrored into the `scheme` URL parameter.

If `@peakui/styles` has no `./generator` subpath export yet, the exports map gains one —
packaging only, no logic.

## UI composition

Full-height page outside the docs chrome, desktop-first; on narrow screens the panels stack (a
dedicated mobile bottom sheet is a follow-up).

- **Header**: link back to the docs, preset gallery selector, light/dark `SegmentedControl`
  (dogfooding the core component), Reset (disabled at defaults), Share (copies the URL), code
  panel toggle.
- **Controls panel** below the preview:
  - Accent popover — hue/chroma/lightness sliders (OKLCH, reference-style gradient tracks), hex
    input (`#rgb`/`#rrggbb`, the format `ThemePreset.accent` already accepts), swatches. Inside
    the popover, an optional "accent for the dark scheme" field (`darkAccent`), suggested when the
    accent approaches black or white and cannot invert on its own.
  - `grayChroma` slider, 0–0.03 — how much of the accent's hue the neutrals carry.
  - Two segmented controls for `radius` and `formRadius` over the six `RadiusId` values.
- **Contrast chips** rendered from `deriveTheme().fixes`: "engine adjusted accent-foreground
  L 0.65 → 0.58". The differentiator is transparency, not warnings — contrast is guaranteed by
  the engine and the builder shows what it adjusted.
- **Preview gallery** — live PeakUI components picking up the scoped theme: buttons across
  variants and sizes, an input with label and error state, select, checkbox/radio/switch, slider,
  tabs, alerts, badges, an avatar group, a login card. A static curated list of what the core
  ships today; auto-expansion from the component registry is a follow-up.
- **Undo/redo** rides the browser history: every edit is a URL push (the pattern the reference
  proves). Shuffle, variable locks, and an onboarding modal are follow-ups.

## Export

A slide-in code panel with two tabs, `useDeferredValue`-wrapped, plain styled `<pre>` in v1
(shiki highlighting is a follow-up; it is not a docs dependency today):

- **CSS** — full `emitVariablesCss(preset, derived)`, unscoped, with the theme id the user names
  in a panel field (default `custom`, slugified). A generated header comment explains usage:
  import after `@peakui/styles`, set `data-theme="<id>-light|dark"` on the root. Copy and
  download as `variables.css`.
- **Preset** — a TS literal of the `ThemePreset`, the minimal representation for teams that
  generate themes through the pipeline (`buildTheme()` / `pnpm tokens:build`).

## Testing

- **Core** (`packages/styles/src/generator/emit.test.ts`): scoped selectors carry the prefix,
  host variants are omitted, `forced-colors` is scoped, and the default output is unchanged
  byte-for-byte (the existing assertions are the regression gate).
- **Docs app** (vitest is already configured): URL codec round-trip (encode∘decode is identity,
  defaults are omitted from the URL, invalid params fall back to defaults, `darkAccent` is
  optional), preset matching (values → gallery name), and gallery fixtures deriving without error
  through `deriveTheme` (`fixes` are expected and allowed — they are the engine doing its job).
- **Manual verification** in the task: `pnpm dev:docs` → `/themes`; drag sliders; check contrast
  chips; export both artifacts; paste the CSS into a scratch page and confirm the selectors work.
  Behavioral smoke via agent-browser against the running docs server.
- **Follow-up**: E2E/VRT for the docs app (no Playwright infrastructure there today).

## Files

- `packages/styles/src/generator/emit.ts` + `emit.test.ts` — the `scope` option; possibly the
  `./generator` subpath in the package exports map.
- `apps/docs/src/app/[lang]/themes/` — `page.tsx`, builder components, `presets.ts`,
  `url-codec.ts`, `preview/`.
- A navigation entry in the docs linking to `/themes`.
- Untouched: `derive.ts`, core presets, Storybook.

## Boundaries

- Gallery presets are editor inputs, not themes of the package: the core keeps shipping exactly
  one theme (`default`), and adding shipped themes stays a separate decision.
- No second color math anywhere: everything derives through `@peakui/styles/generator`.
- The `scope` option is the only core change in this task.
- The builder names no reference library in any visitor-facing text (standing docs rule; `NOTICE`
  remains the exception).

## Follow-ups (explicitly out of v1)

Fonts (`typography` + runtime font loading), manual semantic-override editing, shuffle, variable
locks, onboarding modal, shiki highlighting, mobile bottom sheet, DTCG JSON export, docs-app
E2E/VRT, preview auto-expansion from the component registry, an AI/MCP layer (the future
`peakui-mcp`).
