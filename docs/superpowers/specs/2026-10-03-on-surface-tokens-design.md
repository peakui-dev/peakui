# The `on-surface` token family and the Color System page

PeakUI derives `--surface-hover` against `--surface` alone. A control nested inside a second- or
third-level surface therefore gets a hover colour computed for a different background. This spec
adds the token family that fixes it, and the Storybook page that makes the whole colour set
inspectable.

## Task

Two deliverables, in this order:

1. **Nine `on-surface` tokens** — a neutral control fill, its foreground and its hover, for each of
   the three surface levels. Three further tokens (`-focus` per level) are deliberately deferred;
   section 6 says why.
2. **A `Foundations/Color System` Storybook page** listing every colour token with its CSS variable
   and its computed value, in the shape of the reference's own `Color System` page.

### What the reference actually ships

The request was framed as porting the reference's page. Verification changes that framing, so it is
recorded here.

`heroui/packages/storybook/.storybook/stories/colors.stories.tsx` lists 74 tokens. **Twelve of them
do not exist in the reference at all.** They are absent from `heroui/packages/styles` and absent from
the live site: `getComputedStyle(document.documentElement).getPropertyValue("--color-on-surface")`
returns the empty string on `storybook-v3.heroui.com`, and 62 of the 74 rows show a computed value —
exactly twelve blanks. The reference implements the *concept* through a React `SurfaceContext`
(`packages/react/src/components/card/card.tsx:61`, `accordion.tsx:63`), not through CSS tokens.

So this is not a port. PeakUI is the first of the two to have these as tokens, and their semantics
are decided here rather than copied.

## Decisions made before this spec

- **Reading A for `on-surface`:** it is `--default` re-derived against a surface level — the neutral
  fill for a control sitting *on* that surface, with its own foreground and hover. Not a second name
  for the surface colour itself.
- **`--snow` and `--eclipse` are not adopted.** The reference declares them as fixed primitives and
  points `--foreground` at them. PeakUI already has those two values and derives them per theme with
  the theme's own hue: light `--foreground: oklch(0.2103 0.006 275)` against the reference's
  `--eclipse: oklch(0.2103 0.0059 285.89)`, dark `oklch(0.9911 0.006 275)` against
  `--snow: oklch(0.9911 0 0)`. Same lightness and chroma, different hue, and ours follows the accent.
  Naming them as primitives would freeze that hue and defeat the generator. The page shows
  `--color-white` and `--color-black`, which PeakUI does declare.
- **Percentage mix, not new anchors.** Approach chosen over six explicit lightness anchors and over
  aliasing existing tokens.
- **The existing `Foundations/Colors` stays.** It is a role showcase — base/hover/soft triplets, what
  a component author picks from. The new page is an inventory with computed values. Different jobs,
  and `apps/storybook/e2e/foundations.a11y.spec.ts` already audits `foundations-colors--roles`.

## 1. The family

Nine tokens: three surface levels times three members. Names follow the reference,
`on-surface-{level}-{member}`:

```
on-surface            on-surface-foreground            on-surface-hover
on-surface-secondary  on-surface-secondary-foreground  on-surface-secondary-hover
on-surface-tertiary   on-surface-tertiary-foreground   on-surface-tertiary-hover
```

`on-surface-secondary` reads as "the secondary variant of on-surface" rather than "on-surface for the
secondary level". That ambiguity is the reference's naming and is kept for alignment; it is recorded
here so the next reader does not have to guess.

## 2. Derivation

`L` is a surface level (`surface`, `surface-secondary`, `surface-tertiary`) and `fgL` is that level's
existing foreground. All three pairs are already in `FOREGROUND_PAIRS`, so `fgL` is never invented.

| Member | Derivation |
| --- | --- |
| `on-surface-L` | `mix(L, 100 − p, fgL, p)` with `p = 4` light, `p = 12` dark |
| `on-surface-L-foreground` | `ensureContrast({token, fg: fgL, bg: fill, min: TEXT_MIN})` |
| `on-surface-L-hover` | `mix(fill, 96, fgL, 4)` |

**Why those percentages.** They are not taste. They reproduce the relationship `--default` already
has to `--background`, which is 1.09:1 in the light theme and 1.36:1 in the dark. At `p = 4` the
light fills sit at 1.09:1 against their level on all three levels; at `p = 12` the dark fills sit at
1.32:1, 1.36:1 and 1.37:1. Measured with `contrastRatio` and `mix` from `src/generator`.

**Why the hover step is 4% in both schemes.** That is exactly how `default-hover` is derived
(`mix(c.default, 96, fg("default"), 4)`), and `on-surface` is `default` re-based.

**Text contrast is never at risk.** Measured on the real derived theme: 17.82:1, 15.53:1 and 14.86:1
light; 12.76:1, 10.94:1 and 10.38:1 dark. The `ensureContrast` guard on `-foreground` will therefore
never fire — it is there so that a later change to the surface anchors fails the build instead of
passing silently.

**The family does not promise a 3:1 boundary.** The fill sits at ~1.1-1.4:1 against its surface, by
design, because `--default` sits at 1.09:1 against the page and PeakUI's neutral controls are
identified by their label and shape rather than by a contrast boundary — which WCAG 2.2 SC 1.4.11
permits. This is stated explicitly because the ecosystem backlog now carries a 3:1 obligation for
*identifying* boundaries (`.button--outline`), and applying that obligation here by mistake would
outline every neutral fill in the system.

## 3. Gates

`check:tokens` gate 2 does not measure pairs itself. It runs `deriveTheme(preset)` and fails if the
derivation applied **any** contrast fix: `ensureContrast` exists to detect a wrong palette, not to
repair one quietly. Two consequences:

- Adding the three `on-surface` pairs to `FOREGROUND_PAIRS` is what enforces text contrast, and the
  measurements above say no fix will be needed.
- Anything whose contrast does not already hold cannot be added without failing the build. That is
  what defers `-focus`; see section 6.

The completeness gate needs no change: it computes its required set as
`Object.keys(themes[0]?.tokens ?? {})`, so the set grows with the generator's output.

**A new gate for the page.** The dangling-token gate reads `var()` out of shipped CSS. The Storybook
page names tokens as strings in `.tsx`, which that gate cannot see, so a page naming a token that
does not exist renders an empty swatch in silence — the exact defect the reference ships. The gate is
therefore a Playwright test: **no row shows an empty computed value, in either theme**. It catches
all three causes at once — token absent from the theme, mapping absent from `theme.css`, name
misspelled on the page.

## 4. Emission, forced colors, drift

The nine tokens are scheme-dependent, so they are emitted from `deriveScheme` into `light` and
`dark`, not into `invariant`. Three further places, each mandatory:

**`theme.css` — nine mappings**, `--color-on-surface-*: var(--on-surface-*)`. Without one of them
`--color-on-surface…` resolves to nothing on the page, and the dangling-token gate will not catch it:
it checks the `var()` references inside `theme.css`, not that every declared token is exposed.

**`FORCED_COLORS` in `emit.ts` — nine entries.** `on-surface` is `default` in a different place, and
the map already holds the right pair for that role:

| Token | System colour | Reason |
| --- | --- | --- |
| `on-surface`, `-secondary`, `-tertiary` | `ButtonFace` | same role as `default: ButtonFace` |
| `on-surface-*-foreground` | `ButtonText` | pairs with `default-foreground: ButtonText` |
| `on-surface-*-hover` | `ButtonFace` | in forced colors the system owns hover; the colour must not move |

**The drift gate** compares the committed `variables.css` against
`emitVariablesCss(preset, deriveTheme(preset))`, so `pnpm tokens:build` runs and its output is
committed in the same commit as the `derive.ts` change.

## 5. The Color System page

`apps/storybook/src/stories/color-system.stories.tsx`, `title: "Foundations/Color System"`, one story
`AllColors`, `layout: "fullscreen"`, container `max-w-4xl`. A row carries a 48×48 swatch, a human
name, the CSS variable and the computed value.

The title is namespaced under `Foundations` rather than left top-level as in the reference, because
`preview.tsx` declares `storySort` order `["Foundations", "Components"]` and a top-level entry falls
outside it. The sidebar structure is PeakUI's, not the reference's.

Seventy-seven rows in nine sections:

| Section | Rows |
| --- | --- |
| Base | 5 |
| Surfaces | 9 |
| On surface | 9 |
| Accent | 6 |
| Status | 18 |
| Neutral | 9 |
| Lines and focus | 8 |
| Form fields | 8 |
| Other | 5 |

Three deliberate departures from the reference, each fixing a defect in it:

1. **The computed value is re-read when the theme changes.** The reference reads it once in the
   render body. PeakUI's `preview.tsx` has a theme global and a decorator, so after switching to the
   dark theme that approach would display light-theme values. The read moves into an effect keyed on
   the theme global.
2. **Translucent tokens are shown over a two-tone backdrop.** All four `*-soft` families and
   `backdrop` carry alpha. On the reference's single-tone card the alpha is invisible and
   `accent-soft` merely looks pale.
3. **The three deferred `-focus` tokens are not listed.** A footnote names them and cites this spec's
   section 6 — the backlog entry lives in the `peakui-company` repository, which a page in this one
   cannot link to usefully. Listing a token that does not exist is the defect this work exists to
   prevent.

## 6. Why `-focus` is deferred, and the defect found while deciding

Under reading A, `on-surface-L-focus` is the focus ring for a control on level `L`, and a ring is a
state indicator, so `BOUNDARY_MIN` — 3:1 — applies. Measured against the real derived theme:

| Dark theme, `focus` = `oklch(0.52 0.2 275)` | Against the level | Against the new fill |
| --- | --- | --- |
| `surface` | 3.01 | 2.30 |
| `surface-secondary` | **2.66** | **1.97** |
| `surface-tertiary` | **2.54** | **1.87** |

The light theme is clean throughout (5.87 down to 4.45). The cause is in the generator:
`ensureContrast` for `focus` runs against `c.background` and `c.surface` only (`derive.ts:344`), and
the second and third surface levels are not in that loop.

**So the focus ring on a second- or third-level surface already violates SC 1.4.11 in the dark theme,
today, and the gate does not see it.** This spec did not introduce that; it found it. Recorded in
`docs/ecosystem/backlog.md` with the measurements.

Adding `-focus` now would mean either failing gate 2 (because the derivation would have to apply a
fix) or weakening that gate to tolerate fixes on focus tokens. Both are worse than shipping nine
tokens and fixing the ring properly in its own task — which will likely make the three `-focus`
tokens unnecessary, since a single ring colour that clears 3:1 everywhere carries more information
than three that differ per level.

## 7. Out of scope

- The three `-focus` tokens and the global focus-ring fix.
- The `FORCED_COLORS` gaps found in passing and recorded in the backlog: no entries for
  `surface-secondary-foreground` or `surface-tertiary-foreground`, and none for `success`, `warning`
  or `danger`, so status colours do not degrade to system colours.
- `--snow` / `--eclipse`.
- Replacing or merging the existing `Foundations/Colors` page.
- Any component consuming the new family. Nothing in `@peakui/react` nests a control inside a surface
  yet; the family is being added ahead of its first consumer by explicit decision.

## 8. Risks

| Risk | Handling |
| --- | --- |
| A percentage that looks right in `oklch` arithmetic but produces a fix inside `deriveTheme`, failing gate 2 | The plan's first task asserts the derived values and runs `check:tokens` before anything else is built on them. The numbers in section 2 were measured, not estimated. |
| The page's a11y audit trips on a low-contrast token | Only swatch backgrounds carry those colours; the page's text is `--color-foreground` and `--color-muted`, and `muted` is already ensured against every background in the set. To be confirmed by running the audit, not assumed. |
| Adding nine tokens changes the committed `variables.css` by more than nine lines, hiding a real diff | The drift gate regenerates the file; review reads the generator change, not the generated output. |
| A Pro theme later declares the set without the new tokens | The completeness gate derives its required set from the first theme's keys, so a theme missing them fails. No action needed. |
