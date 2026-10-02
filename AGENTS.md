# PeakUI Design System — AI Context

PeakUI is the UI component library of the PeakUI Design System: a pnpm workspaces monorepo.

Follow **HeroUI v3**, vendored read-only at `../heroui` — beside this repository, not inside it.
Your training data is mostly HeroUI v2, whose architecture is the opposite of ours: never write a
component from memory.

## First run

Fresh clone, or something in the harness does not work? Read
[`.agents/rules/onboarding.md`](.agents/rules/onboarding.md) first; do not improvise setup from
this file. Run `pnpm bootstrap --check` to diagnose, but never run setup on your own
initiative — report what is missing and stop.

## CodeGraph

Query CodeGraph before you read code. Structure, call sites and impact are CodeGraph work; Grep
and Read serve files you already know. The MCP server is registered in `.mcp.json`, so
`codegraph_explore` and `codegraph_node` are ordinary tools — prefer them over the CLI.

| At this moment | Run |
| --- | --- |
| Starting a task that touches code | `pnpm codegraph explore <area>` |
| Before editing an exported symbol | `pnpm codegraph callers <symbol>` |
| Before renaming or moving anything | `pnpm codegraph impact <symbol>` |
| Looking for where something lives | `pnpm codegraph query <search>` |

**Completion criterion:** quote the first query's result in your plan or task summary. Context
work with no quoted CodeGraph result is not done.

Red flags — stop and run the query: "the repo is small, I'll just read the files"; "I already know
where this lives"; "Grep is faster here"; "I'll run it after I look around".

| Excuse | Reality |
| --- | --- |
| "Only two packages exist" | Then the query costs a second and you have cited it. |
| "Grep already found it" | Grep finds text. `impact` finds the blast radius you did not grep for. |
| "The index may be stale" | `pnpm codegraph:sync`, then query. Staleness is a sync, not an exemption. |

If the index is missing, the CLI refuses and tells you not to index. That is a setup failure,
not permission to skip: report it and stop.

## Commands

| Action | Command |
| --- | --- |
| Set up a clone / diagnose | `pnpm bootstrap` / `pnpm bootstrap --check` |
| Dev Storybook | `pnpm dev:storybook` (port **6007**) |
| Build Storybook | `pnpm build:storybook` |
| Unit tests | `pnpm test` |
| Coverage | `pnpm test:coverage` |
| Build packages | `pnpm build` / `pnpm build:packages` |
| Lint / format | `pnpm lint` / `pnpm format` / `pnpm format:fix` |
| Agent hook + script tests | `pnpm test:ai` |
| E2E | `pnpm test:e2e` / `pnpm test:e2e:ci` (builds Storybook first) |
| Typecheck | `pnpm typecheck` |
| Token gates / package export gates | `pnpm check:tokens` / `pnpm lint:package` |
| CodeGraph | `pnpm codegraph` / `codegraph:sync` / `codegraph:status` |

Port 6007 is a default, not a guarantee: `storybook dev` asks for another when it is taken and
exits under `--ci`. `STORYBOOK_PORT=<free> pnpm test:e2e` works, because Playwright starts its own
server; `pnpm dev:storybook` ignores it, so a manual server elsewhere is `pnpm exec storybook dev --port <n>`.

**Behavioral smoke (agent-browser)** — text only, never screenshots; visual regression is VRT's
job. Open the story **iframe**, not the manager: `agent-browser open <iframe-url>` →
`snapshot -i` → act on refs → `snapshot --delta` → `errors` / `console` / `a11y`. There is no
`agent-browser axe`. Protocol: [`apps/storybook/AGENTS.md`](apps/storybook/AGENTS.md).

MCP servers are declared twice — `.mcp.json` (Claude Code) and `.zcode/config.json` (ZCode);
formats differ, so change both. Agent hooks are wired separately: `.claude/settings.json` and the
`hooks` block of `.zcode/config.json`. `.mcp.json` holds no hooks. `pnpm bootstrap --check` reports
what all three actually wire, not merely that they exist.

## Architecture

**Mandatory standard:** implementing, reviewing or refactoring a UI component goes through the
[`peakui-component-standards`](.agents/skills/peakui-component-standards/SKILL.md) skill and its
`references/`. The skill opens with the v2→v3 correction table.

- **Compose the primitive** — a thin styled composition over a `react-aria-components`
  primitive; never re-derive what RAC provides.
- **Compound, namespace-first** — Context + Root + parts in one file; `Object.assign` onto the
  Root yields `<Select>`, `<Select.Trigger>` and `<SelectTrigger>` from one set of parts. There
  is no assembled wrapper.
- **`data-slot` + BEM** — `tv()` emits BEM class names only; the Tailwind lives in
  `@peakui/styles` CSS, with per-component custom properties as the theming seam. No
  `classNames` prop.
- **React 19** — `ref` is an ordinary prop, `use(Context)`, `"use client"` on every component.

Binding library choices for the core, not a description of what is installed: RAC for behavior and
a11y (react-aria / react-stately hooks only where RAC lacks a primitive), `tailwind-variants` for BEM
names, `@tanstack/react-table` + `react-virtual`, Recharts, `@internationalized/date`, vitest +
`@testing-library/react`, Playwright.

The jsdom setup those tests need, and the `render` / `setupUser` / `ssrSmoke` helpers, live in the
private `packages/testing` — never published, and not optional: without `installPointerEvent()` and
its jsdom stubs, RAC tests do not run at all. Import them from `@peakui/testing/helpers`, and take a
package's vitest defaults from `@peakui/testing/configs/react`.

## Conventions

- TypeScript everywhere; interfaces over types; `function` for pure functions
- Named exports only. One exception, a tool contract: Storybook CSF and config files read a default
  export, and it stops there
- **No `forwardRef`** — React 19 passes `ref` as a prop; `displayName` only where not inferred
- No `any`: `unknown` plus narrowing. One scoped exception — the polymorphic spread boundary of a
  `DOMRenderProps` component, commented and lint-disabled inline. No conditional hook calls
- Component files are **kebab-case**, matching the BEM block and CSS file
  (`select.tsx` ↔ `select.css` ↔ `.select__trigger`)
- No hardcoded Tailwind in JSX, and none inside `tv()` — utilities live in `@peakui/styles` CSS
- `data-slot` on every rendered element; style state via `data-*`, never `is-*`
- Polymorphism through a `render` prop, not an `as` prop
- The library does no data fetching — no fetch/axios/TanStack Query in `@peakui/react`
- Accessibility floor is **WCAG 2.2 AA**, plus `forced-colors`
- **Write every document in English.** Existing Russian content is legacy: leave it alone and
  never translate it opportunistically — migration is a backlog item with its own task
- Conventional commits required; Russian subjects allowed, header ≤ 150 chars
- Component tests sit in `packages/react/tests/components/<component-name>/`, mirroring the component
  path: `<component-name>.test.tsx` (jsdom, the bulk of contracts) and `<component-name>.ssr.test.tsx`
  (client SSR smoke via `ssrSmoke()` from `@peakui/testing/helpers`). **Stories stay beside the
  component.** Browser tests are Playwright specs in `apps/storybook/e2e/` — overlays and high-risk
  portals, not one per component
- A breaking change to a component's public API ships with a codemod in the same PR: an automated
  transform where possible, a manifest entry with manual instructions where not. Protocol in the
  `changeset-release` skill

## AI Resources

Everything under `.agents/` is binding: a task matching a rule or skill goes through that file first,
and the plan or task summary cites it. Process skills come from the superpowers plugin.

**Rules** (`.agents/rules/`) — `onboarding`: set up a clone, diagnose the harness.

**Skills** (`.agents/skills/`) — `peakui-component-standards` (the bar for UI components),
`playwright-e2e` (E2E for Storybook), `changeset-release` (changesets, release branches, bumps),
`karpathy-guidelines` (surgical diffs, minimum code, explicit assumptions).

## Planned

Nothing here exists yet. This section holds what an agent would try to **invoke or open** —
paths, commands, files. The binding decisions above stay normative whether or not code exists.

**Reaching an item here is a stop, not a shrug.** When a task needs something listed below, do not
treat it as absent and route around it: say so, then either create it as part of the task or get a
decision. Silently substituting another path, package or command for a Planned one is the failure
this section exists to prevent.

```
packages/codemodes/    # @peakui/codemodes — jscodeshift migrations
apps/docs/             # PeakUI Docs
.claude/agents/        # docs-curator, storybook-debugger, tailwind-v4-css-expert
.claude/guides/        # styling is covered by the component-standards skill until one exists
```

`pnpm commit` and the commit-msg hook arrive with commitizen + commitlint; `pnpm changeset add` and
`pnpm clean:install` with the release setup, whose workflow is the `changeset-release` skill. The
publish-time rewrite of `@peakui/react`'s `exports` from `src` to `dist` belongs to that setup too —
in-repo the package is consumed from source, which is why Storybook and vitest need no build.
