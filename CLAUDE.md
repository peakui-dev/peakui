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

**Keeping the index current is your job, not the owner's.** Run `pnpm codegraph:sync` yourself, without
asking, at these moments:

- at the start of a task, before the first query;
- after you create, move or delete files — `pnpm add:component` included;
- when a query finds nothing for something that exists on disk.

Sync updates an index that exists. If the index is missing, the CLI refuses and tells you not to
index. That is a setup failure, not permission to skip, and not something sync repairs: report it
and stop.

## Commands

| Action | Command |
| --- | --- |
| Set up a clone / diagnose | `pnpm bootstrap` / `pnpm bootstrap --check` |
| Scaffold a component | `pnpm add:component <Name> [--rac <Primitive>] [--category <category>]` |
| Rebuild the generated registries | `pnpm registries` (`--check` to verify only) |
| Dev Storybook | `pnpm dev:storybook` (port **6007**) |
| Build Storybook | `pnpm build:storybook` |
| Dev Docs | `pnpm dev:docs` (port **3000**) |
| Build Docs | `pnpm build:docs` |
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

## Releases

Publishing runs through changesets. Every PR touching a publishable package lands with a
`.changeset/*.md` file — `.agents/skills/changeset-release/` owns the routine.

The `Release` workflow tends a **Version Packages** PR on every push to `main`; merging it is
the release: npm publish (OIDC trusted publishing via the `npm-publish` environment), tag
`v<version>`, GitHub Release, and a hand-written notes page under
`apps/docs/content/docs/en/react/releases/`. Rehearse safely with the workflow's `dry_run`
input.

Design and decisions: `docs/superpowers/specs/2026-10-12-release-pipeline-design.md`.

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
names, `@tanstack/react-table` + `react-virtual`, `@internationalized/date`, vitest +
`@testing-library/react`, Playwright. Charts are not the core's: they live in `peakui-pro`, on
Recharts.

The jsdom setup those tests need, and the `render` / `setupUser` / `ssrSmoke` helpers, live in the
private `packages/testing` — never published, and not optional: without `installPointerEvent()` and
its jsdom stubs, RAC tests do not run at all. Import them from `@peakui/testing/helpers`, and take a
package's vitest defaults from `@peakui/testing/configs/react`.

## Pipeline

A component change moves through these stages in order. Each stage goes through its skill, and
the task summary cites every skill it used.

| Stage | Output | Skill |
| --- | --- | --- |
| 0. Design | A spec in `docs/superpowers/specs/`, then a plan in `docs/superpowers/plans/` | `superpowers:brainstorming`, then `superpowers:writing-plans` |
| 1. Component | `pnpm add:component`, then `packages/react/src/components/<name>/` and its styles in `@peakui/styles` | `peakui-component-standards` |
| 2. Stories | `<name>.stories.tsx` beside the component | `peakui-component-standards` |
| 3. Tests | `<name>.test.tsx`, `<name>.ssr.test.tsx`; a Playwright spec for an overlay or portal | `peakui-component-standards`, `playwright-e2e` |
| 4. Docs | The page under `apps/docs/content/` and its demos in `apps/docs/src/demos/` | `peakui-docs` |
| 5. Release | **Switched off** — see below | `changeset-release` |

**Stage 0 opens every change to what a consumer can use**: a new component, a new compound part,
or a change to a public prop, variant, export or class name. No code before the spec is approved.
A bug fix that leaves the public API alone, a docs-only task and a release enter at their own
stage.

**Stage 4 is not optional.** A new component, or a change to a prop, default, variant, compound
part, CSS class, `data-slot`, CSS variable or state, is not done until its docs page and demos
match the source — in the same PR. Docs come after stories, because demos are adapted from them.
A docs-only task enters at stage 4.

Red flags — stop and run stage 4: "the docs can follow in another PR"; "it is a small prop";
"the page is close enough"; "I updated the API table" with the demos untouched.

**Stage 5 is switched off.** Work is local and nothing is released yet: write no changeset and no
codemod, and do not stop on their absence — for these two the Planned rule below is suspended. A
task is done at the end of stage 4.

### Registries are generated

Five files list every component, and `pnpm registries` writes them from the file system:
`packages/react/src/components/index.ts`, `packages/styles/src/components/index.ts`,
`packages/styles/components/index.css`, `apps/docs/src/demos/index.ts` and
`apps/docs/content/docs/en/react/components/meta.json`.

- **Never edit one by hand** — the edit hook rejects it. Add, rename or delete the component's own
  files, then run `pnpm registries`.
- **Start a component with `pnpm add:component`.** It creates the files in both packages, the
  stories and both test suites, and runs `pnpm registries` for you.
- **After every merge or rebase, run `pnpm registries`.** `.gitattributes` merges these files with
  `merge=union`, so two branches that each added a component merge without a conflict but leave
  the lists unsorted; the generator restores them, and `pnpm test:ai` fails until it has run.

## Docs app

`apps/docs` is the documentation site (`@peakui/docs`, private): Next.js + Fumadocs, ported from the
reference's docs app — attribution in `apps/docs/NOTICE`.

**Mandatory standard:** writing, updating or reviewing a page or a demo goes through the
[`peakui-docs`](.agents/skills/peakui-docs/SKILL.md) skill.

- **Pages** — MDX under `apps/docs/content/docs/en/react/`; a component page lives at
  `components/(category)/<component-name>.mdx` and follows Usage → Examples → Customization →
  Styling Reference → API Reference. The `links` frontmatter feeds the components index.
- **Demos** — one file per example in `apps/docs/src/demos/<component-name>/`, registered in
  `apps/docs/src/demos/index.ts` by `pnpm registries` and shown with `<ComponentPreview name="…" />`. They are
  type-checked. A demo that passes a function prop starts with `"use client"`.
- **Agent routes** — `/llms.txt`, `/llms-components.txt`, `/llms-patterns.txt`, `<page>.md` and
  `/api/components` are generated from the MDX by `apps/docs/src/lib/get-llm-text.ts`. Never write
  them by hand.
- **Nothing a visitor or an agent reads may name the reference library** — pages, demos, UI text,
  generated markdown. `NOTICE` is the one exception.
- **Site URL** — `NEXT_PUBLIC_SITE_URL` (see `apps/docs/.env.example`) must be an absolute URL for
  `pnpm build:docs` and again when the production server starts (`next start`); both fail without
  it. The prerendered llms files and `/api/components` embed it, and its value is inlined at build
  time, so changing it needs a rebuild. `pnpm dev:docs` falls back to `http://localhost:3000`.
- **Deployment requirement: `Vary: Accept`** — `/en`, `/en/docs/...` and `/` answer markdown or HTML
  depending on `Accept`, but the prerendered HTML pages are served by `next start` with their own
  cache headers: `Vary: Accept` set in `next.config.ts` `headers()` or on the response in `proxy.ts`
  does not reach them (checked against `next start`). The host must vary cached HTML docs pages on
  `Accept`, or run the proxy before its cache. Without that a shared cache can hand HTML to an agent
  that asked for markdown, or the reverse.
- **Production** — Cloudflare Workers, Worker `peakui-docs`, served on
  `peakui-docs.<subdomain>.workers.dev` until the `peakui.dev` custom domain is attached. The
  `Docs deploy` workflow ships `main` (plus manual dispatch with a `base-url` override); the
  origin it builds and smokes against is the `DOCS_SITE_URL` repository variable — one value for
  both, because `NEXT_PUBLIC_SITE_URL` is inlined at build time. `pnpm --filter @peakui/docs run
  deploy` runs the vite build itself, so the workflow never builds separately. Every deploy must
  pass the contract smoke `apps/docs/scripts/verify-site-contract.mjs`; the edge purge is skipped
  while `CLOUDFLARE_ZONE_ID` is unset, and there is no automatic rollback — a red smoke leaves
  the deployed version live and says so. vinext refuses to deploy without a cache adapter on the
  `vinext()` plugin: `staticAssetsAdapter()` over the existing `ASSETS` binding, since every
  route is `revalidate = false`.
  Two dual-mode seams keep one codebase on both hosts: `src/lib/read-source.ts` (fs) is swapped
  for `read-source.worker.ts` (bundled raw sources) by a vite alias, and the proxy answers
  markdown itself instead of rewriting to an internal route. Design:
  `docs/superpowers/specs/2026-10-12-docs-deploy-design.md`.
- **Storybook stays independent** — docs never import stories, and stories never import demos.
- The app has no `@heroui/*` dependency: those styles define the same BEM classes as
  `@peakui/styles` and would collide.

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
  `changeset-release` skill. Suspended while stage 5 of the Pipeline is switched off

## AI Resources

Everything under `.agents/` is binding: a task matching a rule or skill goes through that file first,
and the plan or task summary cites it. Process skills come from the superpowers plugin.

**Rules** (`.agents/rules/`) — `onboarding`: set up a clone, diagnose the harness.

**Skills** (`.agents/skills/`) — `peakui-component-standards` (the bar for UI components),
`peakui-docs` (writing and curating docs pages and demos), `playwright-e2e` (E2E for Storybook),
`changeset-release` (changesets, release branches, bumps), `karpathy-guidelines` (surgical diffs,
minimum code, explicit assumptions).

## Planned

Nothing here exists yet. This section holds what an agent would try to **invoke or open** —
paths, commands, files. The binding decisions above stay normative whether or not code exists.

**Reaching an item here is a stop, not a shrug.** When a task needs something listed below, do not
treat it as absent and route around it: say so, then either create it as part of the task or get a
decision. Silently substituting another path, package or command for a Planned one is the failure
this section exists to prevent.

```
packages/codemodes/    # @peakui/codemodes — jscodeshift migrations
.claude/agents/        # storybook-debugger, tailwind-v4-css-expert
.claude/guides/        # styling is covered by the component-standards skill until one exists
```

`pnpm commit` and the commit-msg hook arrive with commitizen + commitlint; `pnpm changeset add` and
`pnpm clean:install` with the release setup, whose workflow is the `changeset-release` skill. The
publish-time rewrite of `@peakui/react`'s `exports` from `src` to `dist` belongs to that setup too —
in-repo the package is consumed from source, which is why Storybook and vitest need no build.
