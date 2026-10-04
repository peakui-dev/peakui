# Roadmap Wave 2 Implementation Plan (entries 10–18)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land wave 2 of the component roadmap: nine entries (10–18), each ported 1:1 from the vendored reference with all pipeline stages and its P1 sixth-stage migration, preceded by a mechanical standards sweep.

**Architecture:** Same orchestration as wave 1 — one subagent per entry in its own worktree off `main`, briefs from this plan, orchestrator merges/joins. Task 0 (the sweep) lands first, alone, so every wave-2 agent copies corrected patterns.

**Tech Stack:** unchanged from wave 1 (React 19, RAC, `tailwind-variants` → BEM, Tailwind v4 CSS, vitest, Playwright).

**Spec:** `docs/superpowers/specs/2026-10-04-component-roadmap-design.md` (wave-2 table). Standard: `AGENTS.md` + `.agents/skills/peakui-component-standards/SKILL.md` (now carrying the data-slot-after-spread rule) + `.agents/skills/peakui-docs/SKILL.md`.

## Global Constraints

Everything from the wave-1 plan carries over verbatim:
- Port the reference maximally close (API, BEM, CSS, stories); recorded PeakUI divergences only. The new **data-slot-after-props-spread rule** applies to every part written this wave.
- Stage 5 switched off (no changeset). Scaffold via `pnpm add:component`; registries generated never hand-edited; agents never touch `component-groups.ts`, `variables.css`, `presets/default.ts` — report and stop at those boundaries instead.
- Gates per worktree, output pasted: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `STORYBOOK_PORT=<assigned> pnpm test:e2e` when a Playwright spec ships, `pnpm --filter @peakui/docs typecheck` + `pnpm --filter @peakui/docs test`.
- CodeGraph explore quoted verbatim per agent; `pnpm codegraph:sync` after scaffold.
- Test names Russian; stories ASCII `Components/<Name>`; SSR via `ssrSmoke()`; e2e only for overlays/portals (and geometry-risk entries per `references/testing.md`).
- Nothing visitor/agent-readable names the reference library.
- Port 6007 occupied: distinct `STORYBOOK_PORT` per e2e-shipping worktree (6017, 6018, …).

## Decisions made before dispatch

1. **Navigation pattern (settles the wave-1 backlog item):** components stay reference-faithful (plain RAC Link semantics); the docs app wires client-side routing at call sites via the render prop — `<Link render={(p) => <NextLink {...p} />}>`. Entry 17 (Breadcrumbs) establishes the pattern in its own migration, and Task 0 retrofit applies it to `component-item.tsx` and `not-found.tsx`.
2. **Entry 14 carries the parked ScrollShadow sidebar swap** (wave-1 entry 9's deferred sixth stage): one coordinated chrome pass over the docs sidebar/TOC as part of Tabs' migration window.
3. **Entry 12 replaces `FDCallout` wholesale** — the wave-1 parked visual artifact (Surface wrapping FDCallout) resolves here; the Callout wrapper in `mdx-components.tsx` becomes `<Alert>` and the wrapper goes.

## Review Focus

1. The sweep (Task 0) silently changing behavior, not just attribute order — pinned by full suite + e2e green.
2. Entry 14 (Tabs + sidebar pass) reaching into fumadocs engine internals — the boundary the spec does not cross; watch for it.
3. Entry 18 (EmptyState) inventing API — no reference page exists; its shape must follow the docs skill's page order with no invented sections.
4. Navigation retrofits breaking RSC: `not-found.tsx` is a server component — NextLink wiring must respect that (client boundary where needed).
5. Mutual pair 15 splitting across concerns despite one agent — ToggleButton and ToggleButtonGroup stay one PR, one worktree.

---

### Task 0: The mechanical standards sweep (before fan-out, one agent)

**Files (modify only):** the seven wave-1 components whose parts place `data-slot` before the props spread (surface, close-button, separator, link, kbd, tooltip, scroll-shadow, skeleton — find each with `grep -rn 'data-slot' packages/react/src/components | grep -B1 '\.\.\.'`), plus: `kbd.stories.tsx` + `link.stories.tsx` (story names → Russian), `close-button.ssr.test.tsx:6,14` (names → Russian), Russian comments → English in `tooltip.tsx`, `separator.stories.tsx`, `utils/assertion.ts`, `utils/css.ts`, `tooltip.styles.ts`, and the merge note at `search-toggle.tsx:33-36`; plus the navigation retrofit (`component-item.tsx`, `not-found.tsx` → `render={(p) => <NextLink {...p} />}`, respecting RSC boundaries); plus a 3-line render test for `ExternalLinkIcon`'s 9×9 default override (backlog item).

- [ ] Worktree + bootstrap + CodeGraph explore "data-slot attribute order" (quote verbatim).
- [ ] Reorder `data-slot` after every `{...props}`-style spread in the listed components (Chip already complies; do not touch it). No other changes to those files.
- [ ] Names and comment translations as listed — translations faithful, not google-literal; drop comments that state the obvious instead of translating them.
- [ ] Navigation retrofit with RSC care.
- [ ] Gates: full `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm --filter @peakui/docs typecheck` + `test`. Commit; report; review; merge BEFORE any wave-2 entry dispatches.

### Task 1: Entry 10 `Card`

Category layout, `(layout)/card`. Scaffold `pnpm add:component Card --category layout` (verify the reference for a RAC flag; expected none — composes Surface). Depends on: `Surface` ✓. Sixth stage: `fumadocs-ui/components/card` (`Card`, `Cards`) in `apps/docs/src/mdx-components.tsx:6` — replace with our Card, preserving the MDX mapping shape (`Cards` may become a plain list wrapper if the reference has no equivalent — say so in the report if so). No e2e.

### Task 2: Entry 11 `Popover`

Category overlays, `(overlays)/popover`. Scaffold `--rac Popover --category overlays`. Depends on: `Surface` ✓. **Playwright spec: yes (overlay), port 6017.** Sixth stage: `fumadocs-ui/components/ui/popover` (`Popover, PopoverContent, PopoverTrigger`) in `apps/docs/src/components/fumadocs/layouts/notebook/client.tsx:12` (verified current at wave-1 join).

### Task 3: Entry 12 `Alert`

Category feedback, `(feedback)/alert`. Scaffold `--rac Alert` if the reference composes RAC Alert (verify). Depends on: icons ✓, `Surface` ✓. Sixth stage: replace the `Callout as FDCallout` mapping in `apps/docs/src/mdx-components.tsx:5` — the wave-1 Surface-wraps-FDCallout wrapper becomes `<Alert>` directly; delete the wrapper's FDCallout import. No e2e.

### Task 4: Entry 13 `Disclosure` + `DisclosureGroup`

Category navigation, `(navigation)/disclosure`. **Mutual pair — one agent, never split.** Depends on: icons ✓. Sixth stage: `fumadocs-ui/components/ui/collapsible` in `apps/docs/src/components/fumadocs/layouts/notebook/page/client.tsx` (verify current shape at dispatch). No e2e (disclosure is inline, not a portal — verify; if the reference portals, add spec on 6019).

### Task 5: Entry 14 `Tabs`

Category navigation, `(navigation)/tabs`. Depends on: icons ✓, `ScrollShadow` ✓. Sixth stage, three parts: (a) `fumadocs-ui/components/tabs` in `apps/docs/src/mdx-components.tsx:8`; (b) the same in `apps/docs/src/mdx-components/package-managers.tsx`; (c) the coordinated sidebar/TOC chrome pass taking `ScrollShadow` into the docs sidebar (the parked entry-9 sixth stage — if the fumadocs engine boundary blocks it, report exactly where). **Playwright spec: port 6018** (decide per testing.md — tabs' scroll+selection behaviour is geometry-adjacent).

### Task 6: Entry 15 `ToggleButton` + `ToggleButtonGroup`

Category buttons, `(buttons)/toggle-button`. **Mutual pair — one agent.** Depends on: mutual. Sixth stage: delete ALL of `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx` and rebuild the theme switch on ToggleButton/ToggleButtonGroup (three raw `<button>`s today). The theme wiring (what the buttons DO) is preserved exactly — only the controls change. No e2e.

### Task 7: Entry 16 `ButtonGroup`

Category buttons, `(buttons)/button-group`. Depends on: `Button` ✓. Sixth stage: the faked split button (`rounded-e-none` / `rounded-s-none`) in `apps/docs/src/components/ai/page-actions.tsx` becomes a real ButtonGroup. No e2e.

### Task 8: Entry 17 `Breadcrumbs`

Category navigation, `(navigation)/breadcrumbs`. Depends on: icons ✓, `Link` ✓. Sixth stage: the docs page breadcrumb + **establish the navigation pattern**: `<Link render={(p) => <NextLink {...p} />}>` at its call sites (Task 0 retrofitted the wave-1 sites; this entry's page documents the pattern in the docs app's own usage). No e2e.

### Task 9: Entry 18 `EmptyState`

Category — decide: the reference has **no documentation page**; place under `(feedback)/empty-state` unless implementation shape argues otherwise (report the choice). Depends on: nothing. Sixth stage: the body of `apps/docs/src/app/[lang]/not-found.tsx` rebuilt on EmptyState. Page shape follows the docs skill's section order like any other; no Anatomy (expected leaf/Root+few parts — verify). No e2e.

### Task 10: Wave 2 join

Identical to wave 1: sequential merges with `pnpm registries` after each and conflict resolution by hand (expected collision sites: `mdx-components.tsx` — entries 10, 12, 14 all touch it; dispatch order 10→12→14 minimizes overlap), one `component-groups.ts` commit ((layout)/card, (overlays)/popover, (feedback)/alert, (navigation)/disclosure|tabs|breadcrumbs, (buttons)/toggle-button|button-group, EmptyState's group), any token applications once, full gates incl. e2e ports, wave review, close.

## Subagent brief template

Same as the wave-1 plan's template (worktree path, brief file, bootstrap, CodeGraph quote, scaffold command, dependencies landed, stages 1–4 + sixth stage, forbidden files, gates with assigned ports, report contract, no-subagents rule, port-from-reference posture) — fill per task above.
