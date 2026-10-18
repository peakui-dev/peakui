# Wave 3.1 — `Badge`, `Typography`, `ProgressCircle`, `Meter`

Roadmap P3, wave 3.1 ([`2026-10-04-component-roadmap-design.md`](2026-10-04-component-roadmap-design.md)).
`Avatar` + `AvatarGroup` and `ProgressBar`, the other two entries of the wave, already landed; this
spec closes the wave with the four that remain.

## Task

Port four leaf components from the vendored reference into `@peakui/react` and `@peakui/styles`,
each through the full pipeline (scaffold, component, styles, stories, tests, documentation page,
browser tier), stage 5 off (no changeset, no codemod).

**Posture is unchanged since the roadmap: maximally similar to the vendored reference.** Same
variants, same context, same BEM classes, same export contract. PeakUI diverges only where a
decision is already recorded (`peakui-component-standards`, "Where PeakUI differs on purpose"):
`data-slot` after the props spread, the `--color-` token prefix, `forced-colors` support, English
docs, test location.

**Success** is the roadmap's definition of done for each of the four, plus: the four land
independently (any one can merge without the others), and no consumer-visible string names the
reference library.

**Out of scope.** `Pagination`, `Toolbar`, `Drawer`, `AlertDialog` (wave 3.2, own cycle); the
`Spinner` / `Button.isPending` announcement defect in `docs/ecosystem/backlog.md` (see
*ProgressCircle*, below, for how this spec avoids deepening it); the token-layer findings in the
same backlog.

## Shape of the work

One spec, one plan, **four independent tasks**, one worktree and one branch per task
(`feat/badge`, `feat/typography`, `feat/progress-circle`, `feat/meter`), each cut from `main` and
merged on its own. Nothing is shared between the four except what already exists in `main`, so the
tasks can run in parallel lanes; the only coordination point is the generated registries
(`pnpm registries`), which each branch regenerates and which merge cleanly because they are
append-ordered by name.

Why not one branch: the four have different risk. `Meter` and `ProgressCircle` are near-copies of
the landed `ProgressBar`; `Typography` touches the token layer's vocabulary; `Badge` is the only one
with a positioning contract. One slow review should not hold three finished components.

## The reference, measured

Read from `heroui/packages/react/src/components/` and `heroui/packages/styles/{src/components,components}/`
(read-only). Line counts of the stylesheet: `badge.css` 167, `meter.css` 112,
`progress-circle.css` 105, `typography.css` ~140.

### `Meter`

RAC `Meter` primitive; compound parts `Meter.Output`, `Meter.Track`, `Meter.Fill`, sharing a
context of `{slots, state}`. Variants: `color` (accent, danger, default, success, warning, default
`accent`), `size` (sm, md, lg, default `md`). `Output` defaults its content to RAC's `valueText`.
Role and `aria-valuenow` come from RAC; PeakUI adds nothing.

### `ProgressCircle`

RAC `ProgressBar` primitive (not `Meter`), parts `Track` (an `svg`), `TrackCircle`,
`FillCircle`. Geometry constants (`STROKE_WIDTH 4`, `CENTER 18`) and `strokeDashoffset` derived from
RAC's `percentage`; indeterminate parks the arc at 25%. Same two variant axes as `Meter`.

### `Badge`

Not a RAC primitive: three plain parts, `Badge.Anchor` (a `span` wrapper, class `badge-anchor`),
`Badge` (the indicator) and `Badge.Label`. Variants: `color` (five roles), `placement`
(top-right default, top-left, bottom-left, bottom-right), `size` (sm, md, lg), `variant`
(primary default, secondary, soft). A string or number child is wrapped in `Badge.Label`
automatically. **It positions an indicator over a sibling inside an anchor** (an avatar with a
count, an icon with a dot); it is not an inline status label, which is `Chip`.

### `Typography`

RAC `Text` as the primitive, polymorphic through `elementType`. One root plus three presets:
`Heading` (`level` 1–6), `Paragraph` (`size` base | sm | xs), `Code`, and a `Prose` wrapper that
styles descendant elements. Variants: `type` (h1–h6, body, body-sm, body-xs, code), `align`,
`color` (default | muted), `weight`, `truncate`. The stylesheet is plain `@apply` over Tailwind's
`text-*` scale, `font-mono`, `text-foreground`, `text-link`, `bg-default`, `border-border`.

## Design decisions

**D1. The four mirror their landed siblings.** `Meter` and `ProgressCircle` copy `ProgressBar`'s
file layout, context shape and export contract line for line; the diff against `ProgressBar` is the
review aid. If `ProgressBar` deviated from the reference somewhere on purpose, the two follow
`ProgressBar`, not the reference, and the deviation is listed at the end of the new `.css` with its
reason, as `chip.css` does.

**D2. `ProgressCircle` is a RAC `ProgressBar`, and says so in its page.** That is the reference's
choice and also the cheap half of the backlog's `isPending` finding: a circle that already is a
`ProgressBar` primitive can later be what `Button` consumes through `ProgressBarContext` without a
public-surface change to `ProgressCircle`. This spec does **not** wire it into `Button` or `Spinner`
and does not close the backlog item; the docs page for `ProgressCircle` carries a one-line pointer
to it so an author reaching for a pending indicator is told which component is the accessible one.

**D3. `Badge` accessibility is the consumer's, and the page says it.** A badge's visual meaning
("3 new") is not announced by itself. The reference gives the indicator no role. PeakUI keeps that
(adding `role="status"` would announce every render), and the page states the pattern instead:
put the information in the anchored element's accessible name, or give the badge `aria-label` when
it is the only carrier. A test pins that a `Badge` with a numeric child renders the text exactly
once and carries no implicit live-region role.

**D4. `Typography` is gated on the token vocabulary before it is ported.** The reference stylesheet
leans on utilities the PeakUI token set may spell differently (`text-link`, `text-muted`,
`bg-default`, `border-border`, `font-mono`). Task 3 starts with a check: every utility the
stylesheet applies must resolve against PeakUI's generated theme. A utility that does not resolve
is replaced by the PeakUI token it means, listed in the stylesheet's closing difference note; it is
**not** fixed by adding a token (that is token-layer work and has its own spec cycle). If a needed
role does not exist at all, the task stops and reports; it does not invent one.

**D5. `Typography.Prose` follows the same rule as the docs chrome.** The docs app already styles
prose by hand in `apps/docs/src/app/global.css`. `Prose` is added to the component but the docs app
is **not** migrated to it in this wave: replacing the docs chrome's own prose is a separate,
visible change, and the roadmap's "deliberately not in P1" list is the precedent for leaving such
sites alone. A follow-up is recorded in the backlog instead.

**D6. Forced colors.** `Meter`, `ProgressCircle` and `Badge` must stay legible with
`forced-colors: active`: the fill and the track are distinguishable (fill takes `Highlight`, track
takes `CanvasText` at the border level), a badge keeps a visible boundary, because its fill alone is
erased. Each stylesheet gets its own `@media (forced-colors: active)` block. `Typography` needs
none.

**D7. Contrast.** Every colour pairing the new stylesheets introduce is checked with the axe pass
the browser tier already runs. A pairing that fails is not excluded in the spec file; it is
recorded in the backlog beside the other token findings and named in the task's report, because the
cause is the token layer, not the component. (`Badge`'s `soft` variant on `warning` is the pairing
to watch.)

## Per-task contract

Every task delivers, in its own worktree:

1. `pnpm add:component <name>` scaffold; `pnpm registries` regenerated, never hand-edited.
2. `packages/react/src/components/<name>/` — component, `index.ts` with the three-section export
   contract and stories (ASCII titles) beside the component; `<name>.test.tsx` and
   `<name>.ssr.test.tsx` in `packages/react/tests/components/<name>/`.
3. `packages/styles/` — `tv()` variants and the `.css` block, with the closing note listing every
   deliberate difference from the reference and its reason.
4. `apps/docs` page in English with live demos; the docs app's typecheck and tests green.
5. `apps/storybook/e2e/<Name>.spec.ts` browser tier, including the axe pass and the forced-colors
   check where D6 applies.
6. Gates pasted into the report: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:ai`,
   `pnpm registries --check`.
7. The CodeGraph query quoted in the report. First queries, run in the main checkout:
   - `codegraph explore Badge` — 23 symbols in 5 files, all in `apps/docs` (`statusChipProps` and its
     six callers); no `Badge` exists in `packages/`.
   - the equivalent for `Meter`, `ProgressCircle` and `Typography` is run at the start of each task
     and quoted as it came back. `apps/docs` has a hand-rolled `ProgressCircle` in
     `components/fumadocs/layouts/notebook/page/client.tsx`; it is out of scope and must not be
     confused with the new component by name collision in imports.

Task-specific additions:

| Task | Extra |
| --- | --- |
| `Meter` | Stories cover each colour and size, a custom `valueLabel`, and `Output` with and without children. |
| `ProgressCircle` | A story for the determinate, indeterminate and `size` cases; a unit test that the dash offset tracks `percentage`, and that indeterminate does not depend on it. |
| `Badge` | Stories for every `placement` and for an anchor around an `Avatar`; a unit test for the string-child auto-wrap (D3); RTL check that `top-right` is physical or logical, whichever the reference's CSS implements, stated in the page rather than assumed. |
| `Typography` | The D4 resolution check as the first commit of the branch, before any component code. Stories for every `type`, plus `truncate`. |

## Risks

- **`Typography` finds a missing token role.** D4 makes this a stop-and-report, which delays that
  one task but not the other three. Accepted: the alternative, inventing a role, is the failure the
  token-layer specs exist to prevent.
- **Docs groups and sidebar.** `apps/docs/src/lib/component-groups.ts` is touched by every
  component's docs task. The four branches will conflict there by a line each. Resolved by merging
  in the order they finish and having the later branches rebase; the file is append-only.
- **Name collision of `ProgressCircle`.** See task contract item 7.
- **`Badge` vs `Chip` confusion by agents.** The `peakui-react` skill and the docs pages state the
  difference in one sentence each; the skill's component index is regenerated, not hand-edited.

## Out of this wave, recorded

- Migrating the docs chrome's prose and its own `ProgressCircle` to the new components (D5, task
  contract item 7): a backlog entry is added when the first of the two components lands.
- Wiring `Button.isPending` to `ProgressBarContext` (D2): remains the backlog item it already is.

## Definition of done

For each component: the per-task contract complete, gates green, merged to `main`, the docs page
reachable from the sidebar, `pnpm registries --check` clean on `main` afterwards. The wave is closed
when all four are merged and the roadmap's wave 3.1 row is annotated as done.
