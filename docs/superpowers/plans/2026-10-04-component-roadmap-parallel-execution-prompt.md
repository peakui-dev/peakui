# Orchestrator prompt: build the component roadmap with parallel agents

Paste the block below as the opening message of an orchestrator session. It assumes
`docs/superpowers/specs/2026-10-04-component-roadmap-design.md` is committed.

---

Build out the `@peakui/react` component roadmap using parallel subagents. You are the
orchestrator: you plan waves, fan out, integrate, and you do not implement components yourself.

## 0. Before anything else

**Change directory into `peakui` first.** An edit written to a product folder while the working
directory is `peakui-company` lands in no repository and is lost without an error — those folders
are gitignored there. Move first, then read or edit.

Invoke `superpowers:using-superpowers`. Then read, in this order, before planning anything:

1. `peakui/AGENTS.md` — **mandatory**. It is the authoritative file for all work inside this
   repository; the ecosystem router neither repeats nor overrides it.
2. `peakui/.agents/skills/peakui-component-standards/SKILL.md` and its `references/`. The skill
   opens with the v2 to v3 correction table; read that table before writing any component.
3. `peakui/.agents/skills/peakui-docs/SKILL.md`.
4. `peakui/apps/storybook/AGENTS.md` — stories, e2e, visual regression.
5. `docs/superpowers/specs/2026-10-04-component-roadmap-design.md` — the roadmap. It is the source
   of *what* and *in what order*. `AGENTS.md` is the source of *to what standard*.

## 1. Clear the working tree before you fan out

Check the state first. At the time the roadmap was written, `peakui` sat on `feat/cobalt-accent`
with roughly 28 uncommitted files, among them scaffold output in
`packages/react/src/components/{input-otp,scaffold-link,scaffold-probe}/`. Each of those renders a
bare `<div>` with its own name as text, and all three are exported from the public barrel.

Do not fan out over a dirty tree. Two decisions belong to your human partner, not to you:

- the base branch for the roadmap work, and what happens to the in-flight changes;
- what happens to the three scaffold stubs — `input-otp` in particular collides with roadmap
  entry 34, and all three currently leak out of the public API.

If those are undecided, report and stop. Do not guess, and do not start wave 0 around them.

## 2. Skills are not optional

**Process skills** (superpowers plugin) — these set the approach, then the internal skills carry it
out:

- `superpowers:using-superpowers` — first, in every session, yours and every subagent's
- `superpowers:writing-plans` — each wave becomes a written plan before any code is written
- `superpowers:using-git-worktrees` — isolation for every parallel agent
- `superpowers:dispatching-parallel-agents` — the fan-out itself
- `superpowers:subagent-driven-development` and `superpowers:executing-plans` — executing a wave
- `superpowers:test-driven-development` — every component and every fix, test first
- `superpowers:systematic-debugging` — any failure, before proposing a fix
- `superpowers:verification-before-completion` — before any claim that something is done
- `superpowers:requesting-code-review` and `superpowers:receiving-code-review` — once per wave
- `superpowers:finishing-a-development-branch` — integrating a finished wave

**Internal skills** (`peakui/.agents/`) — everything under `.agents/` is binding:

- `peakui-component-standards` — **mandatory** for implementing, reviewing or refactoring any UI
  component
- `peakui-docs` — **mandatory** for writing, updating or reviewing any page or demo
- `playwright-e2e` — required for an overlay or a portal
- `changeset-release` — the changeset, and the codemod that a breaking public API change ships with
  in the same pull request
- `karpathy-guidelines` — surgical diffs, minimum code, explicit assumptions
- rule `.agents/rules/onboarding.md` — setting up a clone, or diagnosing a harness that does not work

Every task summary cites every skill it used. A summary that cites no skill is not done, and you
reject it when a subagent returns one.

## 3. CodeGraph

Query CodeGraph before reading code. This is a completion criterion, not advice.

- `codegraph explore <area>` before reading files for a task that touches code
- `codegraph callers <symbol>` before editing an exported symbol
- `codegraph impact <symbol>` before renaming or moving anything
- `codegraph query <search>` before grepping for where something lives

**Quote the first query's result verbatim** in the plan or the task summary. Context work with no
quoted CodeGraph result is not done.

Each index belongs to its own clone, so a fresh worktree has none: run `pnpm bootstrap`, which
installs and runs `codegraph index`. If the CLI refuses and tells you not to index, that is a setup
failure, not permission to skip — report it and stop. Never route around a missing index by
grepping instead.

## 4. The unit of work

One subagent per roadmap entry, with two exceptions.

**Mutual pairs go to one agent, never two.** These components import each other, so splitting them
across agents deadlocks both:

- entry 13 `Disclosure` + `DisclosureGroup`
- entry 15 `ToggleButton` + `ToggleButtonGroup`
- entry 19 `menu-item` + `menu-section`
- entry 21 `ListBox` + `list-box-item` + `list-box-section`
- entry 24 `Tag` + `TagGroup`
- entry 26 `Checkbox` + `CheckboxGroup`
- entry 27 `Radio` + `RadioGroup`
- entry 28 `Switch` + `SwitchGroup`

**Entry 1 `Surface` goes alone, first, and gets its own written spec before implementation.**
Thirteen components depend on it and a wrong public API is expensive to undo. Give it the same
treatment `button` and the input field family already received: brainstorm, spec, human review,
plan, then implement.

Each entry passes all five pipeline stages from `AGENTS.md`, in order:

1. the component in `packages/react/src/components/<name>/`, styles in `@peakui/styles`
2. `<name>.stories.tsx` beside the component
3. tests in `packages/react/tests/components/<name>/` — `<name>.test.tsx` (jsdom) and
   `<name>.ssr.test.tsx` via `ssrSmoke()` from `@peakui/testing/helpers`, plus a Playwright spec in
   `apps/storybook/e2e/` for an overlay or a portal
4. the documentation page and its demos, registered so the components index picks them up
5. a changeset

Stage 1 starts from `pnpm add:component`, which scaffolds the directory, the stories, the tests, the
styles entry and the barrel export. No entry is hand-created. Stage 4 is not optional: a component
whose page and demos do not match its source is not done, in the same pull request.

**P1 entries carry a sixth stage.** Migrate the `apps/docs` file the spec names for that entry and
delete the hand-rolled equivalent. The P1 tables in the spec give the exact file per entry — for
example entry 3 `Chip` deletes `components/status-chip.tsx` and `components/version-badge.tsx`
outright, and entry 15 deletes all of `components/fumadocs/ui/theme-toggle.tsx`. A component that
ships while its hand-rolled counterpart still stands has not achieved the thing P1 exists for.

## 5. How to parallelize, and the hard limit on it

Waves are barriers. Fan out inside a wave; join before starting the next.

- **Wave 0, `icons.tsx` — alone, no parallelism.** 15 glyphs inlined from `@gravity-ui/icons`
  (MIT), internal module, not exported from the package root. The spec's wave 0 section gives the
  glyph list and the reasoning. Everything downstream waits on it.
- **Wave 1, entries 1 to 9.** `Surface` lands first and alone; the remaining eight are mutually
  independent and can run fully in parallel.
- **Wave 2, entries 10 to 18.** Needs `Surface`, `ScrollShadow` and `Link` from wave 1. Fan out
  only after wave 1 has joined.
- **Wave 3, entries 19 to 25.** Needs `Surface`, `CloseButton`, `Button`, `Spinner` and the icons.
  Entries 21 to 25 are one project — replacing the search dialog — so keep them inside one wave and
  review them together rather than merging them piecemeal.
- **P2, entries 26 to 34**, then **P3, waves 3.1 to 3.6**, same shape. 3.1 and 3.2 are the widest
  fan-out in the whole roadmap, because every dependency they have landed back in P1.

### Six shared files set the real ceiling

`pnpm registries` generates five files, and **every component touches all five**:

```
packages/react/src/components/index.ts
packages/styles/src/components/index.ts
packages/styles/components/index.css
apps/docs/src/demos/index.ts
apps/docs/content/docs/en/react/components/meta.json
```

A sixth, `apps/docs/src/lib/component-groups.ts`, is **hand-edited and not generated**.

The rules that follow are not negotiable:

- **Never hand-edit the five generated files**, and never resolve a merge conflict inside them by
  hand. After merging a wave, re-run `pnpm registries` and commit its output. Completeness is gated
  by `packages/react/tests/components/index.test.ts`, so a hand-patched barrel fails loudly but
  late.
- **A parallel agent does not touch `component-groups.ts`.** It reports its category and its route
  group path instead, and you apply every entry of the wave in a single commit at integration. P1
  introduces new categories — Layout, Navigation, Overlays, Data Display, Typography, Utilities,
  Collections — and the first component in a group brings its group with it.
- **Shared style files get the same treatment.** If an entry needs a new token, the agent reports
  the token rather than editing `packages/styles/themes/default/variables.css` or
  `packages/styles/presets/default.ts`; you apply those once per wave.

## 6. Worktrees and gates

One worktree per parallel agent, via `superpowers:using-git-worktrees`. In each worktree run
`pnpm bootstrap` before anything else — it installs dependencies and builds the CodeGraph index.

Before an agent hands work back, these must pass, with output pasted rather than asserted:

```
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e      # only for an entry that ships a Playwright spec
```

`superpowers:verification-before-completion` governs this. Evidence before assertions, always: a
summary claiming green tests without the command output is rejected.

## 7. The reference is read-only

`heroui/`, `heroui-cli/`, `heroui-mcp/` and `daisyui/` are vendored for reference only.
`scripts/ai/protected-files.mjs` rejects edits to `heroui/` — hitting it means the hook is working,
not that you have found an obstacle to work around. Read them as much as you like; write nothing
there, and never try to disable the hook.

Separately, and this one reaches the product: **nothing a visitor or an agent reads may name the
reference library** — not pages, not demos, not UI text, and not the generated `llms.txt`,
`llms-components.txt`, `llms-patterns.txt`, `<page>.md` or `/api/components` output.
`apps/docs/NOTICE` is the single exception. Internal specs, plans and commit bodies may name it
freely.

The agent routes are generated from the MDX by `apps/docs/src/lib/get-llm-text.ts`. Never write
them by hand.

## 8. Conventions

Conventional Commits; Russian commit subjects are allowed and the header stays within 150
characters. TypeScript throughout, interfaces over types, named exports only, no `forwardRef`, no
`any` beyond the single commented polymorphic-spread exception, kebab-case component files matching
the BEM block and the CSS file, `data-slot` on every rendered element, state through `data-*` and
never `is-*`, no hardcoded Tailwind in JSX or inside `tv()`, polymorphism through a `render` prop
rather than an `as` prop, accessibility floor WCAG 2.2 AA plus `forced-colors`.

**Write every document in English** — plans, specs, documentation pages, skill files, UI text.
Existing Russian content is legacy: leave it alone and never translate it opportunistically.

## 9. Stop and ask rather than guess

- the working tree is dirty when you are about to fan out
- CodeGraph refuses, or an index is missing and `pnpm bootstrap` does not fix it
- an entry's dependency has not landed yet
- an entry needs a token, or a `component-groups.ts` change, that you told the agent not to make
- the reference's component contradicts the roadmap spec
- a P1 entry's named `apps/docs` file has changed shape since the spec was written, so the sixth
  stage no longer describes reality
- anything in `AGENTS.md`'s **Planned** section is what a task needs: that section is a stop, not a
  shrug. Say so, then either create the thing as part of the task or get a decision. Silently
  substituting another path, package or command is the exact failure it exists to prevent.

## 10. Brief for each subagent

Give every subagent its own copy of this brief, filled in:

```
Entry <n> from docs/superpowers/specs/2026-10-04-component-roadmap-design.md: <Component>.

Before anything: cd into peakui, invoke superpowers:using-superpowers, read peakui/AGENTS.md,
then .agents/skills/peakui-component-standards/SKILL.md with its references/, then
.agents/skills/peakui-docs/SKILL.md. Read the spec entry for <Component>.

Worktree: <path>. Run `pnpm bootstrap` first.
CodeGraph: run `codegraph explore <area>` before reading code and quote its first result
verbatim in your summary. If it refuses, report and stop — do not index, do not grep instead.

Dependencies, already landed: <list>. Do not re-implement them.
Scaffold with `pnpm add:component`; never create the directory by hand.

Deliver all five stages: component + @peakui/styles, stories, tests
(<name>.test.tsx + <name>.ssr.test.tsx, plus a Playwright spec in apps/storybook/e2e/ if this is
an overlay or a portal), docs page + demos, changeset.
<for P1 only> Sixth stage: migrate <exact apps/docs file> and delete <exact hand-rolled file>.

Do NOT edit: apps/docs/src/lib/component-groups.ts, packages/styles/themes/default/variables.css,
packages/styles/presets/default.ts, or any of the five files `pnpm registries` generates. If you
need a change in one of them, report the change you need and stop at that boundary.

Gates before you return, with output pasted: pnpm lint, pnpm typecheck, pnpm test, and
pnpm test:e2e if you shipped a Playwright spec.
Cite every skill you used in your summary. TDD applies: tests first.
```
