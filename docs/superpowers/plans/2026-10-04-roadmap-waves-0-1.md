# Roadmap Waves 0–1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land wave 0 (the internal icon module) and wave 1 (roadmap entries 1–9: `Surface` first and alone, then eight mutually independent components) of the component roadmap.

**Architecture:** One subagent per roadmap entry, each in its own git worktree off `main`, each bound to `AGENTS.md` and the internal skills. The orchestrator writes the wave plan, fills the per-entry brief, integrates each wave on `main` (merge → `pnpm registries` → one `component-groups.ts` commit → gates), and never implements a component itself.

**Tech Stack:** React 19 + `react-aria-components`, `tailwind-variants` → BEM, Tailwind v4 CSS in `@peakui/styles`, vitest + `@testing-library/react`, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-04-component-roadmap-design.md` (the roadmap — *what*, *in what order*). Standard: `AGENTS.md` + `.agents/skills/peakui-component-standards/SKILL.md` (+ `references/`) + `.agents/skills/peakui-docs/SKILL.md`.

## Global Constraints

Copied from `AGENTS.md` and the roadmap spec; every task implicitly includes all of them.

- **Reference similarity is the default posture (human directive, 2026-10-04):** every component is ported from the vendored reference as closely as possible — same public API (props, parts, variants), same BEM classes, same CSS, stories/demos adapted from its stories. The deliberate PeakUI divergences stay as recorded in the specs and the component-standards skill (icons internal, `InputOtp` casing, `forced-colors`, `--color-` token prefix, no data fetching, test location, English docs). Where neither a recorded divergence nor the roadmap spec answers a detail, the reference wins and any remaining difference is reported, not silently invented.

- Stage 5 (changesets/codemods) is **switched off** — write no changeset, no codemod; a task is done at the end of stage 4. (The roadmap's "definition of done" lists a changeset; `AGENTS.md` suspends it and `AGENTS.md` is authoritative inside this repo.)
- Every entry starts from `pnpm add:component <Name> [--rac <Primitive>] [--category <category>]`; no hand-created component directory.
- Never hand-edit the five files `pnpm registries` generates: `packages/react/src/components/index.ts`, `packages/styles/src/components/index.ts`, `packages/styles/components/index.css`, `apps/docs/src/demos/index.ts`, `apps/docs/content/docs/en/react/components/meta.json`.
- A parallel agent never edits `apps/docs/src/lib/component-groups.ts`, `packages/styles/themes/default/variables.css`, or `packages/styles/presets/default.ts`. It reports the category/route-group or token it needs and stops at that boundary.
- Conventions: named exports only; no `forwardRef`; no `any` outside the commented `DOMRenderProps` spread; kebab-case files; `data-slot` everywhere; state via `data-*` not `is-*`; no Tailwind in JSX or `tv()`; polymorphism via `render` prop; WCAG 2.2 AA + `forced-colors`; all documents and UI text in English.
- Nothing a visitor or agent reads names the reference library; read `../heroui/` freely, write nothing there.
- Port 6007 is occupied on this machine: e2e runs must set `STORYBOOK_PORT` to a free port (e.g. `STORYBOOK_PORT=6017 pnpm test:e2e`).
- Test names in Russian (jsdom suites); story titles ASCII `Components/<Name>`; SSR suite via `ssrSmoke()` from `@peakui/testing/helpers`.
- Gates per worktree before hand-back, output pasted: `pnpm lint`, `pnpm typecheck`, `pnpm test`, plus `pnpm test:e2e` (with `STORYBOOK_PORT`) when the entry ships a Playwright spec. Docs-touching work also runs `pnpm --filter @peakui/docs typecheck` and `pnpm --filter @peakui/docs test`.
- CodeGraph: `pnpm codegraph explore <area>` before reading code; quote the first result verbatim in the summary. `pnpm codegraph:sync` after scaffold/create/move/delete.

## Review Focus

Failure modes this plan's per-entry tests do not fully pin, most likely first:

1. **Scaffold output shipped as the implementation** — a bare `<div>` with the component name, tests asserting nothing real. Countermeasure: reviewer checks that jsdom tests assert roles/behaviour, and that stories/demos render real parts. The roadmap spec's "scaffold output is not an implementation" rule.
2. **Hand edits to generated or shared files** — countermeasure: `pnpm registries --check`, `git diff` on the six shared files reviewed at integration; `pnpm test:ai`.
3. **Icons leaking into the public barrel** (`export * from "./icons"`) or `@gravity-ui/icons` becoming a runtime dependency — countermeasure: Task 1's dedicated checks.
4. **A P1 entry shipping while its hand-rolled `apps/docs` counterpart still stands** — countermeasure: sixth-stage file deletions verified in review; `git grep` for the deleted filenames.
5. **Merge order corrupting the generated registries** — countermeasure: `.gitattributes` union merge + `pnpm registries` after every merge, `pnpm test:ai` green before the wave is declared joined.

---

## Orchestration protocol (repeats for every wave)

1. Confirm `main` clean; note `git rev-parse --short HEAD` as the wave base.
2. For each parallel entry: `git worktree add .worktrees/<branch> -b <branch>` off the wave base; agent runs `pnpm bootstrap` there first.
3. Dispatch one subagent per entry with the filled brief (template at the end of this plan).
4. Join: merge each branch into `main` (conventional merge commit); after **every** merge run `pnpm registries` and commit its output if it changes anything; run `pnpm test:ai`.
5. Apply the wave's `component-groups.ts` entries (categories + route-group paths collected from the agents' reports) in one commit.
6. Apply any reported token changes (generator edit + `pnpm tokens:build`, committed output) once per wave — orchestrator only.
7. Full gates on `main`: `pnpm lint && pnpm typecheck && pnpm test && pnpm registries --check && pnpm test:ai`, plus `STORYBOOK_PORT=<free> pnpm test:e2e` when the wave shipped Playwright specs.
8. Code review of the joined wave (`superpowers:requesting-code-review`), fixes applied, then the wave is closed and the next wave's plan is written.

Branch naming: `roadmap/<entry>-<kebab-name>` (e.g. `roadmap/02-close-button`), one branch per worktree.

---

### Task 1: Wave 0 — the internal icon module `icons.tsx`

**Files:**
- Create: `packages/react/src/components/icons.tsx`
- Create: `packages/react/tests/components/icons.test.tsx`
- Create: the third-party licence block in `packages/react` (e.g. `packages/react/THIRD-PARTY-NOTICES.md` or equivalent placement the repository prefers — agent verifies no existing notices file)
- Does **not** touch any barrel, any generated file, or any styles file.

**Interfaces:**
- Produces: named arrow-function icon components, one per glyph, **named exactly as the reference names them** (`IconChevronDown`, `IconChevronUp`, `IconChevronLeft`, `IconChevronRight`, `CloseIcon`, `IconPlus`, `IconMinus`, `IconSearch`, `IconCalendar`, `ExternalLinkIcon`, `InfoIcon`, `WarningIcon`, `DangerIcon`, `SuccessIcon`, `CircleDashedIcon` — verify each against `../heroui/packages/react/src/components/icons.tsx`), so later ported components import them by the reference's own names. Path data is inlined from `@gravity-ui/icons` per the spec's licensing decision (human-confirmed 2026-10-04): the glyph set maps `xmark`→`CloseIcon`, `magnifier`→`IconSearch`, `arrow-up-right-from-square`→`ExternalLinkIcon`, `circle-info`→`InfoIcon`, `triangle-exclamation`→`WarningIcon`, `circle-xmark`→`DangerIcon`, `circle-check`→`SuccessIcon`, `circle-dashed`→`CircleDashedIcon`; the reference's `ExternalLinkIcon` defaults `width={9} height={9}` — copy that default.
- Each glyph: `viewBox="0 0 16 16"`, `width={16}`, `height={16}`, `fill="none"` on the `svg`, `fill="currentColor"` + `fillRule="evenodd"`/`clipRule="evenodd"` on the path, `aria-hidden="true"`, `role="presentation"`, props spread last. Path data inlined verbatim from `@gravity-ui/icons@2.22.0` `svgs/` at `node_modules/.pnpm/@gravity-ui+icons@2.22.0_react@19.3.0/node_modules/@gravity-ui/icons/svgs/`.
- Not exported from `packages/react/src/components/index.ts` — internal module, verified by a test.

**Steps:**

- [ ] **Step 1: Worktree + bootstrap.** `.worktrees/roadmap-00-icons`, branch `roadmap/00-icons`, `pnpm bootstrap`, `pnpm codegraph explore "icons module"`.
- [ ] **Step 2: Write the failing tests first (TDD).** `packages/react/tests/components/icons.test.tsx`: renders each of the 15 glyphs with a `viewBox="0 0 16 16"` svg, `aria-hidden="true"`, `currentColor` fill inheritance (assert attribute presence, not computed color); asserts the components barrel does **not** export any icon name (import `* as Components from "@/components"` — no `Icon*`/`*Icon` key matching the glyph set).
- [ ] **Step 3: Run tests to verify they fail** (module absent). `pnpm test -- packages/react/tests/components/icons.test.tsx` — expected FAIL.
- [ ] **Step 4: Implement `icons.tsx`** by inlining the 15 glyphs from the located `svgs/` directory, with the MIT notice block retained (copyright + permission notice from `@gravity-ui/icons` LICENSE) in the package-level notices file.
- [ ] **Step 5: Tests pass; gates.** `pnpm lint && pnpm typecheck && pnpm test`. No Playwright spec (not an overlay/portal). No stories (internal module, not a component — roadmap: "not a component, no documentation page"). No docs page, no `pnpm add:component` (that scaffolds a component directory; `icons.tsx` is a single internal module — the one deliberate exception to "no entry is hand-created", recorded here because the roadmap creates it as an internal module, not a roadmap entry).
- [ ] **Step 6: Commit** on the branch; report back with quoted CodeGraph result, pasted gate output, skills cited.

**Integration:** merge to `main` first (everything downstream waits on it), `pnpm registries` (expected: no change — no component added), `pnpm test:ai`.

### Task 2: Entry 1 `Surface` — stage 0 (spec) with human review gate

**Files:**
- Create: `docs/superpowers/specs/2026-10-04-surface-design.md`
- Then: `docs/superpowers/plans/2026-10-04-surface.md`

**Orchestrator's own work, not a dispatched agent.** Sequence (roadmap: "brainstorm, spec, human review, plan, then implement"):

- [ ] **Step 1: Brainstorm.** Study `../heroui/packages/react/src/components/surface/` (API: levels, props, context), the token specs `2026-10-03-on-surface-tokens-design.md` (PeakUI has CSS `on-surface-*` tokens where the reference uses a React `SurfaceContext`) and `2026-10-01-design-tokens-design.md`, plus `apps/docs` hand-written `bg-surface`/`shadow-surface` usage in `component-preview-container.tsx`. Enumerate the open API questions.
- [ ] **Step 2: Ask the human** the load-bearing questions (via AskUserQuestion): surface level API surface, how the level re-bases nested control tokens (context vs `data-surface` attribute + CSS), which 13 dependents' needs constrain the API.
- [ ] **Step 3: Write the spec** in the shape of the existing specs (task, decisions, API, styling/token integration, gates, risks, out of scope).
- [ ] **Step 4: Human review gate.** Present the spec for approval; wait; revise. **Do not start implementation before approval.**
- [ ] **Step 5: Write the Surface implementation plan** (`superpowers:writing-plans`), bite-sized, from the approved spec.

### Task 3: Entry 1 `Surface` — implementation (single agent, alone)

Runs only after Task 1 is merged **and** Task 2's spec is approved. One agent, one worktree, branch `roadmap/01-surface`.

- Standard five stages (component+styles via `pnpm add:component Surface --category layout`, stories, tests, docs page+demos). Expected RAC relationship: verify against the reference's `surface/` — if it wraps no RAC primitive, ours does not either; if it establishes context, the approved spec decides PeakUI's mechanism (token-based, per the on-surface spec).
- P1 sixth stage: replace hand-written `bg-surface` / `shadow-surface` in `apps/docs/src/components/component-preview-container.tsx` with `<Surface>`.
- Reports category `Layout`, route group `(layout)/surface`, any token needs.
- Gates: lint, typecheck, test, docs typecheck+test. No Playwright spec expected (no overlay/portal).

### Tasks 4–11: wave 1 fan-out (entries 2–9, parallel, after Task 3 merges)

Each: one agent, one worktree off the post-`Surface` `main`, branch `roadmap/0<n>-<kebab>`, brief template below. Mutually independent; all can run concurrently.

| Task | Entry | Component | Category | RAC primitive (verify against reference) | P1 sixth stage — `apps/docs` migration | Playwright spec |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | 2 | `CloseButton` | buttons | `Button` | none (6 later dependents) | no |
| 5 | 3 | `Chip` | data-display | leaf `div` (verify) | delete `components/status-chip.tsx` + `components/version-badge.tsx`, migrate their consumers | no |
| 6 | 4 | `Separator` | layout | `Separator` | replace `<hr className="w-full border-separator">` in the docs layout sidebar banner | no |
| 7 | 5 | `Link` | navigation | `Link` | migrate `components/github-link.tsx`, `components/component-item.tsx`, `not-found.tsx` button-class links | no |
| 8 | 6 | `Kbd` | typography | plain `<kbd>` leaf | replace raw `<kbd>` in `components/fumadocs/ui/search-toggle.tsx` (`LargeSearchToggle`) | no |
| 9 | 7 | `Tooltip` | overlays | `Tooltip` + `TooltipTrigger` | replace the `<span title={shortcut}>` wrapper in `search-toggle.tsx` | **yes** (overlay) |
| 10 | 8 | `Skeleton` | feedback | leaf `div` (verify) | replace `animate-pulse rounded-lg border bg-muted/30` at `components/component-preview.tsx:22` | no |
| 11 | 9 | `ScrollShadow` | utilities | `ScrollShadow` | sidebar/TOC overflow (verify what the docs app can consume now) | decide per `references/testing.md` (measured geometry) |

Per-entry steps (identical shape, executed inside each agent under TDD):

- [ ] worktree + `pnpm bootstrap` + CodeGraph explore (quote verbatim)
- [ ] read AGENTS.md, both internal skills + references, the spec's wave-1 row for the entry
- [ ] failing jsdom tests → scaffold (`pnpm add:component`) → implement component + styles → tests pass
- [ ] stories; SSR suite; Playwright spec where marked
- [ ] docs page + demos (`peakui-docs` shape; `pnpm registries`)
- [ ] P1 sixth stage: migrate the named `apps/docs` file(s), delete the hand-rolled counterparts
- [ ] gates with pasted output; report category/route-group/token needs; cite skills

### Task 12: wave 1 join and review

- [ ] Merge branches in entry order (3…9); after each: `pnpm registries` + commit if changed; `pnpm test:ai`.
- [ ] One commit applying all reported `component-groups.ts` entries (new categories: Layout, Navigation, Overlays, Data Display, Typography, Utilities — Buttons exists).
- [ ] Apply any reported token changes once (generator + `pnpm tokens:build`).
- [ ] Full gates on `main` incl. `STORYBOOK_PORT=<free> pnpm test:e2e` (Tooltip spec shipped).
- [ ] `superpowers:requesting-code-review` on the joined wave; address findings; then close the wave and write the wave 2 plan (`docs/superpowers/plans/2026-10-04-roadmap-wave-2.md`).

---

## Subagent brief template (filled per entry at dispatch)

```
Entry <n> from docs/superpowers/specs/2026-10-04-component-roadmap-design.md: <Component>.

Before anything: cd into <worktree path>, invoke superpowers:using-superpowers, read peakui/AGENTS.md,
then .agents/skills/peakui-component-standards/SKILL.md with its references/, then
.agents/skills/peakui-docs/SKILL.md. Read the spec's entry row for <Component>.

Worktree: <path>. Run `pnpm bootstrap` first. Port 6007 is taken: e2e must set STORYBOOK_PORT —
use `STORYBOOK_PORT=<port> pnpm test:e2e`.
CodeGraph: run `pnpm codegraph explore <area>` before reading code and quote its first result
verbatim in your summary; `pnpm codegraph:sync` after the scaffold. If the CLI refuses, report
and stop — do not index, do not grep instead.

Dependencies, already landed: <list>. Do not re-implement them.
Scaffold with `pnpm add:component <Name> [--rac <Primitive>] [--category <category>]`; never
create the directory by hand.

Deliver stages 1–4: component + @peakui/styles, stories, tests (<name>.test.tsx +
<name>.ssr.test.tsx<, plus a Playwright spec in apps/storybook/e2e/>), docs page + demos.
Stage 5 (changeset) is switched off per AGENTS.md — write none.
Sixth stage (P1): migrate <exact apps/docs file(s)> and delete <exact hand-rolled files>.

Do NOT edit: apps/docs/src/lib/component-groups.ts, packages/styles/themes/default/variables.css,
packages/styles/presets/default.ts, or any of the five files `pnpm registries` generates. If you
need a change in one of them, report the change you need and stop at that boundary.

Reference: ../heroui/packages/react/src/components/<name>/ is read-only; port from it as closely as
possible — same public API (props, parts, variants), same BEM classes, same CSS, stories/demos
adapted from its stories. The recorded PeakUI divergences (component-standards skill, specs) still
apply; where neither a recorded divergence nor the roadmap spec answers a detail, the reference
wins and you report any remaining difference instead of inventing one. Write nothing there.
Nothing you ship may name the reference library.

Gates before you return, with output pasted: pnpm lint, pnpm typecheck, pnpm test, and
STORYBOOK_PORT=<port> pnpm test:e2e if you shipped a Playwright spec; plus
pnpm --filter @peakui/docs typecheck and pnpm --filter @peakui/docs test for the docs stage.
Cite every skill you used in your summary. TDD applies: tests first.
Report at the end: your docs category, your route group path (e.g. (layout)/surface), and any
token you needed but could not add.
```
