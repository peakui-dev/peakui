# Wave 3.1 — Badge, Typography, ProgressCircle, Meter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the four remaining leaf components of roadmap wave 3.1 in `@peakui/react` and `@peakui/styles`, each through the full pipeline.

**Architecture:** Four independent tasks, one worktree and one branch each (`feat/meter`, `feat/progress-circle`, `feat/badge`, `feat/typography`), cut from `main`, merged separately. Each is a reference-maximal port following the landed `ProgressBar` (files, context shape, export contract). A fifth, last task closes the wave in the roadmap and the backlog.

**Tech Stack:** React 19, `react-aria-components` (`Meter`, `ProgressBar`, `Text`), `tailwind-variants`, Tailwind v4, vitest + jsdom, Storybook, Playwright, Fumadocs.

**Spec:** `docs/superpowers/specs/2026-10-18-roadmap-wave-3-1-design.md` (decisions D1–D7). Roadmap: `2026-10-04-component-roadmap-design.md`, P3 wave 3.1.

## Global Constraints

- **Reference-maximal port.** Read, do not recall: `../heroui/packages/react/src/components/<name>/`, `../heroui/packages/styles/src/components/<name>/`, `../heroui/packages/styles/components/<name>.css`, and the page under `../heroui/apps/docs/content/docs/en/react/components/`. The vendored tree is read-only.
- **Model to copy:** `packages/react/src/components/progress-bar/` (file, `index.ts` with Compound / Named / Variants sections), its tests and `apps/storybook/e2e/ProgressBar.spec.ts`.
- **Standards:** `AGENTS.md`, `peakui-component-standards`, `peakui-docs`. Deliberate differences stay: `data-slot` after the props spread, `--color-` prefix, `forced-colors`, English only, no `forwardRef`, no `classNames`, no Tailwind in JSX or `tv()`.
- **Scaffold with `pnpm add:component <Name> [--rac <Primitive>] [--category <category>]`;** registries only via `pnpm registries`, never by hand; run it again after every merge or rebase.
- **Stage 5 is off:** no changeset, no codemod.
- **Tests** live in `packages/react/tests/components/<name>/` (`<name>.test.tsx`, `<name>.ssr.test.tsx`); stories beside the component; stories titles ASCII.
- **Nothing a consumer reads names the reference library.** Each stylesheet ends with a note listing every deliberate difference and its reason.
- **Do not touch** `themes/default/variables.css`, `presets/default.ts`, `docs/ecosystem/*` from a component task. Report a need instead.
- **CodeGraph:** run `pnpm codegraph:sync` then `pnpm codegraph explore <Name>` at the start of each task and quote the result in its report. Known: `explore Badge` returns 23 symbols in 5 files, all `apps/docs` (`statusChipProps` and callers); `apps/docs/src/components/fumadocs/layouts/notebook/page/client.tsx` holds a hand-rolled `ProgressCircle` that is out of scope.
- **Gates, pasted in each report:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:ai`, `pnpm registries --check`, plus the docs app typecheck and tests.
- **Workspace:** `.worktrees/<name>`, branch `feat/<name>`, cut from `main`; `pnpm install` inside the worktree is part of the task. No `git stash`, no push.
- Conventional Commits; commit per step group below.

## Review Focus

1. `Meter` with `value` above `maxValue` or below `minValue`: the fill is clamped to 0–100%, never overflows the track. Test in Task 1.
2. `ProgressCircle` indeterminate: no `aria-valuenow`, and the arc does not depend on `percentage`. Test in Task 2.
3. `Badge` with child `0`: the label renders `0` (a number, not falsy-dropped); with no children renders no label element (a dot). Test in Task 3.
4. `Typography` `Heading level={3}` renders `h3`; `Paragraph size="sm"` renders `p` with `data-type="body-sm"`; `render`/`elementType` override wins over the default element. Test in Task 4.
5. All four under `forced-colors: active` and in an RTL page: fill and track (or the badge boundary) stay distinguishable and placement mirrors as the CSS defines. Browser-tier check in Tasks 1–3.

---

## File structure (per component, `<n>` = kebab name)

- `packages/react/src/components/<n>/<n>.tsx`, `index.ts`, `<n>.stories.tsx`
- `packages/styles/src/components/<n>/<n>.styles.ts` (+ `index.ts`), `packages/styles/components/<n>.css`
- `packages/react/tests/components/<n>/<n>.test.tsx`, `<n>.ssr.test.tsx`
- `apps/docs/content/docs/en/react/components/(<category>)/<n>.mdx`, `apps/docs/src/demos/<n>/*.tsx`
- `apps/storybook/e2e/<Name>.spec.ts` (Typography has none; no behaviour to drive)
- Generated, never edited: the five registries.

---

### Task 1: Meter (`feat/meter`)

**Files:** per the structure above, category `feedback` (as ProgressBar).

**Interfaces:**
- Produces: `Meter` namespace = `Object.assign(MeterRoot, {Root, Output, Track, Fill})`; named exports `MeterRoot, MeterOutput, MeterTrack, MeterFill`; types `MeterRootProps` (also `MeterProps`), `MeterOutputProps`, `MeterTrackProps`, `MeterFillProps`; `meterVariants`, `MeterVariants` from `@peakui/styles`. Variants: `color` accent|danger|default|success|warning (default `accent`), `size` sm|md|lg (default `md`).

- [ ] **Step 1:** Worktree + `pnpm install`; `pnpm add:component Meter --rac Meter --category feedback`; read the reference `meter` sources and `progress-bar.tsx`; list any place ProgressBar deviates from its reference (D1).
- [ ] **Step 2:** Write failing tests in `meter.test.tsx`: renders `role="meter"` with `aria-valuenow`; `Meter.Output` defaults to `valueText`; custom children replace it; `color`/`size` produce `meter--danger` / `meter--lg`; every part carries its `data-slot`; value above `maxValue` clamps the fill width to `100%`, below `minValue` to `0%` (Review Focus 1). `meter.ssr.test.tsx` via `ssrSmoke()`. Run `pnpm --filter @peakui/react test meter` — expect FAIL.
- [ ] **Step 3:** Port `meter.tsx` and `index.ts`, the `tv()` variants and `meter.css` (BEM `meter`, `meter__track|fill|output`, `meter--<color|size>`). Add a `forced-colors: active` block: fill takes `Highlight`, track `CanvasText` (D6). Run the tests — expect PASS.
- [ ] **Step 4:** Stories (every colour and size, custom `valueLabel`, Output with and without children; each story has an accessible name). Docs page + demos adapted from the stories; docs typecheck and tests.
- [ ] **Step 5:** `Meter.spec.ts`: axe on the stories, forced-colors fill/track distinguishable, RTL fill grows from the inline start. Run `pnpm test:e2e` for this spec only; a contrast failure is recorded in the backlog and the report (D7), not excluded silently.
- [ ] **Step 6:** `pnpm registries`, all gates; commit `feat(react): Meter`; report with the CodeGraph result and gate output.

### Task 2: ProgressCircle (`feat/progress-circle`)

**Files:** per structure, category `feedback`.

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `ProgressCircle` namespace with `Root, Track, TrackCircle, FillCircle`; types `ProgressCircleRootProps` (+ `ProgressCircleProps`), `…TrackProps`, `…TrackCircleProps`, `…FillCircleProps`; `progressCircleVariants`, `ProgressCircleVariants`. Same two variant axes and defaults as Meter. Constants `STROKE_WIDTH 4`, `CENTER 18`, derived `RADIUS`, `CIRCUMFERENCE`.

- [ ] **Step 1:** Worktree, `pnpm install`, `pnpm add:component ProgressCircle --rac ProgressBar --category feedback`; read the reference sources.
- [ ] **Step 2:** Failing tests: `role="progressbar"` with `aria-valuenow`; `FillCircle` `stroke-dashoffset` equals `CIRCUMFERENCE * (1 - p/100)` at 0, 50, 100; indeterminate has no `aria-valuenow` and a fixed offset independent of `percentage` (Review Focus 2); `color`/`size` classes; `data-slot`s; SSR smoke. Run — expect FAIL.
- [ ] **Step 3:** Port component, variants and CSS (`progress-circle`, `__track`, `__track-circle`, `__fill-circle`, `--<color|size>`), with a `forced-colors` block (D6). Run tests — expect PASS.
- [ ] **Step 4:** Stories (determinate, indeterminate, sizes, colours). Docs page and demos; the page carries a one-line pointer to the backlog's `isPending` finding as the accessible pending indicator (D2). Do not touch `Button` or `Spinner`.
- [ ] **Step 5:** `ProgressCircle.spec.ts`: axe, forced-colors, indeterminate animation absent under `prefers-reduced-motion` if the reference animates. Run it.
- [ ] **Step 6:** `pnpm registries`, gates, commit `feat(react): ProgressCircle`, report. Add the backlog entry for migrating the docs chrome's hand-rolled circle (spec "Out of this wave") in Task 5, not here.

### Task 3: Badge (`feat/badge`)

**Files:** per structure, category `data-display`.

**Interfaces:**
- Produces: `Badge` namespace = `Object.assign(BadgeRoot, {Root, Label, Anchor})`; named `BadgeRoot, BadgeLabel, BadgeAnchor`; types `BadgeRootProps` (+ `BadgeProps`), `BadgeLabelProps`, `BadgeAnchorProps`; `badgeVariants`, `BadgeVariants`. Variants: `color` accent|danger|default|success|warning (default `default`), `placement` top-right|top-left|bottom-left|bottom-right (default `top-right`), `size` sm|md|lg (default `md`), `variant` primary|secondary|soft (default `primary`). Polymorphic through `DOMRenderProps` (`render`), root default element `span`.

- [ ] **Step 1:** Worktree, `pnpm install`, `pnpm add:component Badge --category data-display` (no `--rac`); read reference sources.
- [ ] **Step 2:** Failing tests: string and number children are wrapped in `Badge.Label` and render once, with no implicit `role` (D3); child `0` renders `0`; no children renders no label element (Review Focus 3); each `placement` yields `badge--<placement>`; `Badge.Anchor` yields `badge-anchor` and `data-slot="badge-anchor"`; `render` replaces the element; SSR smoke. Run — expect FAIL.
- [ ] **Step 3:** Port component, variants and CSS. Decide logical vs physical placement offsets from the reference CSS and write the answer into the docs page (do not assume). Add the `forced-colors` block giving the badge a visible boundary (D6). Run tests — expect PASS.
- [ ] **Step 4:** Stories: every placement, an anchor around `Avatar`, dot badge, numeric badge with the accessible-name pattern from D3. Docs page and demos: state the Badge vs Chip difference in one sentence and the D3 accessibility pattern. Check that the `peakui-react` skill's component index is regenerated by the generator, not edited.
- [ ] **Step 5:** `Badge.spec.ts`: axe on every variant×colour, with `soft`×`warning` watched; forced-colors boundary visible; RTL placement mirrors as documented (Review Focus 5). Contrast failures follow D7.
- [ ] **Step 6:** `pnpm registries`, gates, commit `feat(react): Badge`, report.

### Task 4: Typography (`feat/typography`)

**Files:** per structure, category `typography` if the docs groups have it, otherwise the nearest existing one — report the choice. No e2e spec.

**Interfaces:**
- Produces: `TypographyRoot` (props `type`, `align`, `color` default|muted, `weight`, `truncate`, plus RAC `Text` props except `className`/`elementType`), `Heading` (`level` 1–6, default 1), `Paragraph` (`size` base|sm|xs, default base), `Code`, `Prose`; types `TypographyRootProps, HeadingProps, ParagraphProps, CodeProps, ProseProps`; `typographyVariants`, `TypographyVariants`. Default element by `type`: body*→`p`, code→`code`, hN→`hN`.

- [ ] **Step 1 (D4 gate, first commit of the branch, before any component code):** Worktree, `pnpm install`, `pnpm add:component Typography --rac Text`. List every utility `typography.css` applies (`text-foreground`, `text-muted`, `text-link`, `bg-default`, `border-border`, `border-separator`, `font-mono`, the `text-*` scale) and verify each resolves against the generated PeakUI theme. Write the table into the report. A missing utility is replaced by the PeakUI token it means and noted at the end of the CSS; a role with no PeakUI equivalent stops the task and is reported.
- [ ] **Step 2:** Failing tests: `Heading level={3}` renders `h3`; default level renders `h1`; `Paragraph size="sm"` renders `p` with `data-type="body-sm"`; `Code` renders `code`; `render`/`elementType` override wins (Review Focus 4); `truncate`, `align`, `weight`, `color` map to `typography--…` classes; `Prose` renders `div` with `typography-prose`; SSR smoke. Run — expect FAIL.
- [ ] **Step 3:** Port component, variants and CSS, no `forced-colors` block (D6). Run tests — expect PASS.
- [ ] **Step 4:** Stories: every `type`, `truncate`, `Prose` with representative children. Docs page and demos. Do not migrate the docs app's own prose (D5).
- [ ] **Step 5:** axe through the existing `foundations.a11y.spec.ts` pattern only if a Typography story is added to it; otherwise rely on the unit tier and say so in the report.
- [ ] **Step 6:** `pnpm registries`, gates, commit `feat(react): Typography`, report with the D4 table.

### Task 5: Close the wave

**Files:** Modify `docs/superpowers/specs/2026-10-04-component-roadmap-design.md` (wave 3.1 row), `docs/ecosystem/backlog.md` in `peakui-company`.

Runs after Tasks 1–4 are merged.

- [ ] **Step 1:** On `main`, `pnpm registries --check` and the full gate set are clean.
- [ ] **Step 2:** Annotate wave 3.1 in the roadmap as done, citing the four merge commits.
- [ ] **Step 3:** Add backlog entries: migrate the docs chrome's prose and hand-rolled `ProgressCircle` to the new components (D5); any contrast finding raised under D7 that no task fixed. Commit in each repository separately.
