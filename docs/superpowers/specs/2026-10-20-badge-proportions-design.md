# Badge proportions — a text badge must read as a rounded rectangle

`Badge` at its default size renders short text as a stretched circle. The fix is geometric: lower
the height of `md` and `lg`, and give `.badge__label` real horizontal padding. No prop, variant,
export or class name changes.

## Task

Re-proportion the three size variants in `packages/styles/components/badge.css`, then bring the
stories, demos, page and browser tier along with them. Pipeline stages 0, 2, 3 and 4.

## The defect, measured

Measured in the browser on `components/(data-display)/badge.mdx` and on the reference's own
published page, same content in both:

| Content | Reference, `sm` | PeakUI, `md` (the default) |
| --- | --- | --- |
| `New` | 27.6 × 16, ratio 1.73 | 31.9 × 28, **ratio 1.14** |
| `5` | 16 × 16, a circle | 28 × 28, a circle |

A ratio of 1.14 is a circle someone sat on. Two causes compound:

1. **`min-width` equals the height.** `.badge` is `min-h-7 min-w-7` — a 28px floor on both axes.
2. **The label has almost no padding.** `.badge__label` is `px-0.5`, 2px a side.

`New` at `text-xs` measures about 28px, so with 4px of padding it reaches 32px against a 28px
floor. The text never earns enough width to escape the circle. The border radius is not involved:
`rounded-3xl` is 24px, and on a 28px-tall box the browser already clamps it to 14px, a semicircle.

**Why the reference does not show this.** Every demo on its published page passes `size="sm"`.
At 16px tall with 10px text, `New` measures 23.6px against a 16px floor and clears it comfortably.
Its `md` has the same defect; it is simply never on screen. So this is a divergence from the
reference, not a port error — recorded as difference 4 in `badge.css`.

## Decisions

### D1 — The size scale

The base class keeps carrying the `md` values and `.badge--md` stays empty, per the rule in
`css-authoring.md`.

| size | `min-h` / `min-w` | font | `.badge__label` padding |
| --- | --- | --- | --- |
| `sm` | 16px (`min-h-4 min-w-4`) | `text-[10px]` | 4px (`px-1`) |
| `md` | **20px** (`min-h-5 min-w-5`), was 28 | `text-xs` (12px), unchanged | **6px** (`px-1.5`), was 2 |
| `lg` | **24px** (`min-h-6 min-w-6`), was 32 | `text-sm` (14px), unchanged | **8px** (`px-2`) |

`md` keeps `text-xs` rather than taking an 11px arbitrary value: `css-authoring.md` allows an
arbitrary value only where the scale has no entry, and 12px is on the scale. `sm` keeps its
existing `text-[10px]`, which the port already carries.

The resulting ratios for `New` are 1.98 / 2.04 / 2.04 across `sm` / `md` / `lg` — one shape at
three sizes, where today the same content is a different shape at every size. A single character
stays a circle at every size, because its width still falls short of the floor. That is the
behaviour a notification count wants, and it is kept deliberately.

A 20px badge over the 40px avatar it is usually anchored to covers a quarter of it; the 28px badge
covers half, which is what made the initials unreadable in the placements example.

### D2 — One radius, spelled once

`rounded-3xl` / `rounded-2xl` / `rounded-xl` on base / `--lg` / `--sm` become `rounded-full`
everywhere. This changes no pixel: at 20, 24 and 16px tall the browser clamps each of the three
old values to exactly half the height already. Three different numbers that produce one result
read as three different intentions, and the next author has to measure to find out they do not.

### D3 — Size-dependent padding nests inside the size class

The size modifiers sit on `.badge`, the padding belongs to `.badge__label`, so `.badge--sm` and
`.badge--lg` nest a `.badge__label` rule. `avatar.css` already nests `.avatar__fallback` inside
`.avatar--sm` and `.avatar--lg` for the same reason; this follows it rather than inventing a
second shape for the same problem.

### D4 — The public surface does not move

`badge.styles.ts` and `badge.tsx` are untouched. Variant names, defaults, class names, `data-slot`
values and props are all unchanged, so no codemod is owed and the API table's contents stay true.
Only the pixels the existing classes produce change.

### D5 — Defaults stay where they are

`size: "md"` and `color: "default"` remain the defaults. Changing `size` to `sm` was considered
and rejected: it would hide the defect rather than fix it, and it would silently resize every
badge a consumer already renders. The demos stop leaning on `color="default"` over a dark surface
because a near-invisible grey disc is a poor first impression, not because the default is wrong.

## Stories, demos and the page

The proportion change is only visible where a badge holds more than one character, and no story
held one. A `Content` story is added — `5`, `99+`, `New`, and an icon — and `### With Content`
follows it onto the page as `with-content.tsx`. Every Examples section on the page traces to a
story, as `peakui-docs` requires.

The existing demos are rewritten against the same skill: they repeat `Badge.Anchor` by hand where
a `map` reads shorter, label nothing in the placements example, and show a single colour under a
heading that promises variants. Content, not just layout, changes: `default` over a dark surface
gives way to colours that can be seen.

## Testing

Unit tests assert class names and need no change; they cannot see geometry, which is why this
regression reached the page unchallenged. The browser tier gains the missing assertion:

- A badge whose label is several characters is measurably wider than it is tall (ratio ≥ 1.5).
- A badge holding one character is square within a pixel.
- The existing placement and `forced-colors` tests keep passing unchanged.

## Files

- `packages/styles/components/badge.css` — the whole change, plus difference 4 in the tail
- `packages/react/src/components/badge/badge.stories.tsx` — the `Content` story
- `apps/docs/src/demos/badge/*.tsx` — seven rewritten, `with-content.tsx` added
- `apps/docs/content/docs/en/react/components/(data-display)/badge.mdx` — the new section
- `apps/storybook/e2e/Badge.spec.ts` — the proportion assertions
- `pnpm registries` after the new demo file

## Boundaries

Nothing outside Badge. CodeGraph puts no consumer of `Badge` or `badgeVariants` anywhere but its
own stories, demos and page, and no other component stylesheet references a `.badge` class.

## Follow-ups, explicitly out of scope

- A `shape` prop (circle / rectangle), `isInvisible`, number truncation to `99+`, an entry
  animation. None exist in the reference either; each is a feature, not a proportion.
- A smaller dot for a childless badge. The reference sizes a dot at the badge's full size and this
  keeps that, but 20px is arguably heavy for a status dot. Worth its own look.
- Avatar imagery in the demos. The examples run on initials fallbacks because the project hosts no
  avatar assets; sourcing them is a separate decision.
