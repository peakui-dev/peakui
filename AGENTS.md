# PeakUI Design System — AI Context

## Overview

PeakUI is the UI component library of the PeakUI Design System.
A pnpm + Turborepo monorepo.

Reference for best practices: HeroUI v3, vendored locally at `/heroui` (gitignored, read-only).

## Install Dependency

The dependencies live in a closed namespace (Nexus). The repo already contains a working `.npmrc` (`link-workspace-packages=true`) — local dev and builds work out of the box. Publishing requires access see `publishConfig` in the target package's package.json.

## Repository Structure

> **Status: pre-code.** The repository currently contains only `AGENTS.md`, `.agents/`, `scripts/` and `.npmrc`. Everything below is the **target** structure — do not assume a path exists; create it, or check first.

```
peakui/
├── apps/
│   ├── storybook/             # port 6007; stories in src/stories/; e2e/; VRT harness
│   └── docs/                  # PeakUI Docs
├── packages/
│   ├── react/                 # core UI
│   ├── standard/              # Standardized code style & lint rules
│   ├── codemodes/             # codemods migrating @oeakui/react consumers (@peakui/codemodes, jscodeshift; CLI: npx @peakui/codemodes)
│   └── styles/                # PeakUI core styles and Tailwind plugin
├── scripts/ai/                # agent hook scripts (protected-files, post-edit)
├── .agents/skills/            # agent skills (Agent Skills format)
├── .claude/agents/            # subagent roles (see AI Resources)
├── .claude/guides/            # deep-dive guides for agents (BEM CSS guide)
└── docs/superpowers/          # specs / plans / reports (+ README index)
```

## Architecture

**Mandatory standard:** When implementing, reviewing, or refactoring UI components, strictly follow the [`peakui-component-standards`](.agents/skills/peakui-component-standards/SKILL.md) skill and its `references/` files.

PeakUI follows **HeroUI v3** conventions. The vendored reference is read-only at `/heroui`.

> **Your training data is mostly HeroUI v2, whose architecture is the opposite of ours.** Do not write a component from memory — the skill above opens with the v2→v3 correction table, and the reference is there to be read.

Key patterns:

- **Compose the primitive** — a component is a thin styled composition over a `react-aria-components` primitive; nothing RAC provides is re-derived by hand
- **Compound, namespace-first** — Context + Root + parts in one file; `Object.assign` onto the Root gives `<Select>`, `<Select.Trigger>` and `<SelectTrigger>` from one set of parts. There is no assembled wrapper.
- **`data-slot` + BEM** — `tv()` emits BEM class names only; the Tailwind lives in `@peakui/styles` CSS, with per-component CSS custom properties as the theming seam. No `classNames` prop.
- **React 19** — `ref` is an ordinary prop (no `forwardRef`), `use(Context)`, `"use client"` on every component

## CodeGraph

CodeGraph is the code analytics tool for navigating the project. **Project context runs through CodeGraph**: discovering structure, call sites, and impact is CodeGraph work; Grep and Read serve files you already know.

**When it fires — check at the moment of action, not in the abstract:**

- Starting a task that touches code: `pnpm codegraph explore <area>` first — map the ground before walking it.
- Before editing an exported symbol: `pnpm codegraph callers <symbol>` — know the blast radius.
- Before renaming or moving anything: `pnpm codegraph impact <symbol>`.
- Finding where a feature, component, or hook lives: `pnpm codegraph query <search>` before grepping.

**Completion criterion:** the first query's result belongs in your plan or task summary (cite what callers/impact/explore returned). Context work without a cited CodeGraph result is not done.

**Index upkeep:**

```bash
npx codegraph init      # initial indexing
pnpm codegraph:sync     # sync after structural changes (automatic on git pull via the post-merge hook)
pnpm codegraph:status   # index status
```

| Command                           | Description                             |
| --------------------------------- | --------------------------------------- |
| `pnpm codegraph query <search>`   | Search symbols in the codebase          |
| `pnpm codegraph callers <symbol>` | Find all call sites of a symbol         |
| `pnpm codegraph callees <symbol>` | Find all dependencies of a symbol       |
| `pnpm codegraph impact <symbol>`  | Analyze the impact of changing a symbol |
| `pnpm codegraph explore <query>`  | Explore an area: symbols + call paths   |

**Index:** `.codegraph/codegraph.db` (SQLite).

## Commands

| Action                           | Command                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev Storybook                    | `pnpm dev:storybook` (port **6007**)                                                                                                                       |
| Build all                        | `pnpm build`                                                                                                                                               |
| Build elements                   | `pnpm build:packages`                                                                                                                                      |
| Run tests                        | `pnpm test`                                                                                                                                                |
| Test with coverage               | `pnpm test:coverage`                                                                                                                                       |
| Agent hook scripts               | `pnpm test:ai`                                                                                                                                             |
| E2E                              | `pnpm test:e2e` / `pnpm test:e2e:ci` (builds Storybook first)                                                                                              |
| Lint / Format check / Format fix | `pnpm lint` / `pnpm format` / `pnpm format:fix`                                                                                                            |
| Typecheck (elements)             | `pnpm typecheck`                    |
| CodeGraph                        | `pnpm codegraph query/callers/callees/impact/explore` (see the CodeGraph section)                                                                          |
| Add changeset                    | `pnpm changeset add`                                                                                                                                       |
| Commit (commitizen)              | `pnpm commit`                                                                                                                                              |
| Clean install                    | `pnpm clean:install`                                                                                                                                       |

Command notes:
- **Behavioral smoke (agent-browser)** — text feedback only, never screenshots (visual regression is VRT's job): `agent-browser open <iframe-url>` → `snapshot -i` → act on refs → `snapshot --delta` → `errors` / `console` / `axe`. Protocol details in `apps/storybook/AGENTS.md`.
- MCP servers are declared twice — `.zcode/config.json` (ZCode) and `.mcp.json` (Claude Code): vendor formats differ; when changing servers, update both.

## Tech Stack

| Purpose           | Library                                        |
| ----------------- | ---------------------------------------------- |
| Framework         | React 19+ (ref as prop, `use()`, no forwardRef) |
| Behavior / a11y   | react-aria-components (primary); react-aria / react-stately hooks only where RAC has no primitive |
| Styling           | tailwind-variants (tv) → BEM class names; Tailwind v4 CSS in @peakui/styles |
| Class composition | cn / cx from tailwind-variants (tailwind-merge is its peer) |
| Tables            | @tanstack/react-table, @tanstack/react-virtual |
| Charts            | Recharts                                       |
| Dates             | @internationalized/date                        |
| i18n              | React Aria i18n (useLocalizedStringFormatter)  |
| Testing           | vitest, @testing-library/react                 |
| Linting           | ESLint 9, eslint-plugin-jsx-a11y               |
| Formatting        | Prettier                                       |
| Commit convention | commitizen, commitlint (conventional)          |
| Versioning        | changesets                                     |

## Conventions

- TypeScript for all code, interfaces over types
- `function` keyword for pure functions
- Named exports only (no default exports)
- **No `forwardRef`** — React 19 passes `ref` as an ordinary prop; `displayName` only where the name does not infer
- No `any` type, use `unknown` + type narrowing
- Component files are **kebab-case**, matching the BEM block and CSS file (`select.tsx` ↔ `select.css` ↔ `.select__trigger`)
- No hardcoded Tailwind classes in JSX, and none inside `tv()` either — utilities live in `@peakui/styles` CSS
- `data-slot` on every rendered element; state styled via `data-*` (`data-focus-visible`, `data-disabled`), never `is-*`
- Polymorphism via a `render` prop, not an `as` prop
- No conditional hook calls
- The library does no data fetching — no fetch/axios/TanStack Query in `@peakui/react`
- Accessibility floor is **WCAG 2.2 AA**, plus `forced-colors` support
- Russian language for user-facing text
- Conventional commits required (enforced by the commit-msg hook; Russian subjects allowed, header ≤ 150 chars)
- Component test suites live beside the component (`packages/react/src/components/<component-name>/`):
  - `<component-name>.test.tsx` — jsdom unit tests (the bulk of contracts)
  - `<component-name>.ssr.test.tsx` — Client SSR smoke via `ssrSmoke()` from `@/testing/ssr` (not RSC, risk-based)
  - Browser tests are Playwright `.spec.ts` in `apps/storybook/e2e/` (`<Name>.spec.ts` / `.e2e.spec.ts` / `.a11y.spec.ts`) — not per-component; overlays + high-risk portals
- Breaking change to a component's public API (renamed/removed/retyped props, exported types) must ship with a codemod in `packages/codemodes` (`@peakui/codemodes`) in the same PR: an automated transform where possible, or a manifest entry with manual instructions when it isn't — full protocol in skill changeset-release

## AI Resources

Project rules and skills live under `.agents/`, subagent roles under `.claude/agents/`, deep-dive guides under `.claude/guides/`. All are binding: a task matching a skill, rule, role, or guide goes through that file before the work starts, and the plan or task summary cites it.

### Skills (`.agents/skills/`)

- `peakui-component-standards` — the mandatory bar for UI components (architecture, variants, a11y, tests)
- `playwright-e2e` — E2E tests for Storybook components
- `changeset-release` — changesets, release branches, version bumps (task tracker: `MKI-xxxx`)
- `karpathy-guidelines` — conduct for any code change: surgical diffs, minimum code, explicit assumptions, verifiable goals (vendored from `multica-ai/andrej-karpathy-skills`)

### Subagent roles (`.claude/agents/`)

> Not yet created — the roles below are planned, not present. Treat them as protocols to write, not files to read.

- `docs-curator` — reviews/curates story docs, source-first protocol
- `storybook-debugger` — debugs Storybook, VRT, the two-pass build
- `tailwind-v4-css-expert` — BEM CSS authoring/validation, token discipline

Where a client does not natively dispatch `.claude/agents` files, apply them as protocols: read the file and follow it (or dispatch a general-purpose subagent with the file as its prompt).

### Guides (`.claude/guides/`)

- _Not yet created._ BEM CSS authoring, tokens and the tv→BEM split are covered by [`peakui-component-standards/references/styling.md`](.agents/skills/peakui-component-standards/references/styling.md) until a deeper guide exists.
Process skills (brainstorming, TDD, writing-plans, ...) come from the superpowers plugin — invoke them as needed.

## Release Process
1. `pnpm changeset add` → PR → approval → merge to master
2. CI runs `pnpm changeset version`, publishes to registry

Full workflow (release branches, bump types, task numbers): the `changeset-release` skill.
