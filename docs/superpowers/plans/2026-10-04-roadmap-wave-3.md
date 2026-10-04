# Roadmap Wave 3 Implementation Plan (entries 19–25 — the menu and overlay block)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land wave 3: the menu/overlay block that ends with replacing the fumadocs search dialog — entries 19–25 plus the dialog integration project, each a 1:1 reference port with all pipeline stages.

**Architecture:** Three stages. Stage A: six mutually independent entries in parallel worktrees. Stage B: Dropdown (needs menu-item merged). Stage C: the search-dialog integration — ONE agent assembling entries 21–25 into our own dialog, per the roadmap's "entries 21–25 are a project, not a component" note. Waves are barriers; stages join before the next begins.

**Spec:** `docs/superpowers/specs/2026-10-04-component-roadmap-design.md` (wave-3 table + risks). Standard: `AGENTS.md` + the component-standards and docs skills (data-slot-after-spread is now scaffold-emitted).

## Global Constraints

Carried verbatim from wave 2: port the reference maximally close; stage 5 off; scaffold via `pnpm add:component`; registries generated never hand-edited; agents never touch `component-groups.ts`/`variables.css`/`presets/default.ts` — report and stop; gates pasted (lint, typecheck, test, `STORYBOOK_PORT=<assigned>` e2e when a spec ships, docs typecheck+test); CodeGraph quoted; Russian test names, ASCII story titles; nothing names the reference library; **no `git stash`** (stashes are shared across worktrees — wave-2 incident); distinct e2e ports per worktree (6017–6023).

Wave-3-specific:
- **Modal's brief carries the overlay/surface forced-colors policy pass** (wave-2 review): decide the pattern once for the overlay family (Popover gap + Surface precedent) and apply it to Modal + Popover + the overlays' css in that one task.
- **Modal's e2e audits the OPEN state** (wave-2 review: overlay audits so far cover closed state only).
- The **search-dialog integration is cuttable** as a unit (roadmap risk note) — if it runs long or hits an engine boundary, report and stop rather than force it.

## Review Focus

1. Stage C reaching into fumadocs search internals — the engine boundary (search index, keyboard shortcut handling owned by fumadocs) must be mapped before replacing anything.
2. Toast's mount (the roadmap says app/custom-root-provider.tsx lacks the Toast mount — a docs-app change riding the component).
3. `tag` ships with no upstream page — same EmptyState treatment (API from source, page per the docs skill, nothing invented).
4. menu-item/menu-section are internal parts (no pages of their own) — verify no docs pages are scaffolded for them, and the barrel exports stay internal per the reference.
5. ListBox virtualization/filtering honesty — port what the reference does, no TanStack additions (that's wave 3.6's Table).

---

### Task 1: Entry 19 `menu-item` + `menu-section`

MUTUAL PAIR, one agent. Internal parts: **no docs pages of their own** — scaffold with `pnpm add:component` then REMOVE the scaffolded page/demos if the generator creates them (check what it does without `--category`; do not register pages). Stories still ship (internal parts need VRT surfaces). Depends on: icons (`IconChevronRight`). Sixth stage: none (they exist for entry 20). No e2e (inline parts).

### Task 2: Entry 21 `ListBox` + `list-box-item` + `list-box-section`

MUTUAL GROUP, one agent. Collections category, `(collections)/list-box`. Port the reference's three parts; selection semantics per the reference. Depends on: nothing new. e2e: decide per testing.md (selection+focus is keyboard-testable in jsdom; geometry only if the reference scrolls internally). Sixth stage: none yet — the consumer is the Stage-C dialog.

### Task 3: Entry 22 `Modal`

Overlays, `(overlays)/modal`. Composes RAC Modal/Dialog per the reference; CloseButton + Surface in tree. **Bundles the overlay forced-colors policy pass** (decide once, apply to modal.css + popover.css + surface.css per the decided pattern; record the decision in the task report for the wave review). **e2e: yes — port 6017 — and the axe audits run on the OPEN dialog** (open first, then audit; both themes). Sixth stage: none until Stage C (the dialog container).

### Task 4: Entry 23 `SearchField`

Forms, `(forms)/search-field`. CloseButton + IconSearch. RAC SearchField per the reference. No e2e expected (inline; verify). Sixth stage: none until Stage C.

### Task 5: Entry 24 `Tag` + `TagGroup`

MUTUAL PAIR, one agent. Collections; `tag` has NO upstream page (EmptyState treatment); `tag-group` has one — follow the reference's page split. CloseButton dependency. No e2e. Sixth stage: none until Stage C (the dialog filters).

### Task 6: Entry 25 `Toast`

Overlays, `(overlays)/toast`. Button + CloseButton + icons (4 status glyphs) + Spinner. RAC/Toast per the reference (verify its actual mechanism — region/queue). **Sixth stage now:** add the Toast mount `app/custom-root-provider.tsx` lacks (the roadmap names this), and replace the manual `checked` timeout in `apps/docs/src/components/ai/page-actions.tsx` with a Toast (the roadmap's entry-25 line). e2e: decide per testing.md (portal → likely yes; port 6018; OPEN-state axe like Modal).

### Task 7 (Stage B): Entry 20 `Dropdown`

Collections, `(collections)/dropdown`. Needs Tasks 1 merged. Composes the reference's menu primitives over menu-item/menu-section + Surface. Sixth stage: the raw RAC `Menu`/`MenuTrigger`/`Popover`/`Text` in `apps/docs/src/components/ai/page-actions.tsx` becomes our Dropdown; also `fumadocs-ui/components/sidebar/tabs/dropdown` (verify current shape). e2e: overlay — port 6019, OPEN-state axe.

### Task 8 (Stage C): The search-dialog integration

ONE agent, after Tasks 2–7 join. The project: replace the default fumadocs search dialog with our own assembled from Modal + SearchField + ListBox + Tag(+Group) + Spinner (the roadmap's entries-21–25 consumer). Steps: map the boundary first (where fumadocs' search context, index and keyboard shortcut live; what is engine vs chrome), then build the dialog on our components behind the existing toggle (`LargeSearchToggle`/`SearchToggle` already ours), preserving the shortcut and i18n behaviour. If the engine boundary blocks clean replacement, report exactly where and stop — the unit is cuttable by design. e2e on the docs app is out of scope (its infra is Storybook-based); verify via docs build + typecheck + tests and a text-mode browser smoke of the dialog's open/filter/navigate loop if feasible.

### Task 9: Wave 3 join

Same protocol: merges in dependency order (19 before 20; stage A otherwise free), registries after each, `component-groups.ts` single commit ((collections) is a NEW category; (overlays)/modal + toast; (forms)/search-field; no pages for menu parts or tag unless the reference split says otherwise), token applications once, full gates + e2e, wave review, close.
