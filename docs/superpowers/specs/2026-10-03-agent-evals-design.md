# Agent Evals Harness — Design

**Date:** 2026-10-03
**Scope:** `peakui` — a new private workspace package, `evals/` (`@peakui/evals`)
**Status:** design; implementation plan in `docs/superpowers/plans/2026-10-03-agent-evals.md`
**Binding architecture:** `peakui-company/docs/superpowers/specs/2026-10-03-agent-experience-design.md`
— its Decisions table, section "5. Evals", section "2. Consumer skill" (authoring process) and
"Known consumer pitfalls" are inputs to this document and are not restated here.

## 1. Purpose

The harness is a measuring instrument with two jobs.

1. **Test rig for the consumer skill.** `superpowers:writing-skills` forbids writing a skill before
   watching an agent fail without it. The harness runs an agent with no help on realistic consumer
   tasks and records, verbatim, what it wrote wrong and what it said while doing so. Later it runs
   the same tasks with the skill and compares.
2. **Channel comparison.** The same tasks run under the configurations `none`, `agents-md`,
   `skill` and `mcp`, and the result is a count per layer, not an opinion.

The first implementation plan delivers the harness core, the `none` configuration, the Claude Code
adapter, twelve tasks with reference solutions and scorers, and reporting. `agents-md`, `skill` and
`mcp` are specified here as setup contracts and built when their artifacts exist.

## 2. Decisions

| # | Decision | Value | Why |
| --- | --- | --- | --- |
| E1 | Location | `evals/` at the repository root, package `@peakui/evals`, private, added to `pnpm-workspace.yaml` | It is neither a library (`packages/`) nor an app (`apps/`). A top-level directory keeps fixtures and results out of both globs. |
| E2 | Language and runtime | TypeScript, ESM, run with `node src/cli.ts` (Node >= 22.18 strips types natively, as `packages/styles/scripts` already does). Erasable syntax only: no enums, no parameter properties. | No build step for a tool that only runs in the repository. |
| E3 | Dependencies | Exact pins, and only versions already in the lockfile where one exists: `typescript` 5.9.3, `postcss` 8.5.28, `jsdom` 30.0.1, `tsdown` 0.23.0, `vitest` 3.2.7, `@types/node` 24.19.0, `@types/jsdom` 30.0.0 | Matches `apps/docs`; a harness whose own toolchain drifts cannot compare runs across weeks. |
| E4 | How the fixture consumes the unpublished packages | **Staged, dist-based tarballs** installed with `file:` — see section 4 | Verified by spike. The alternatives were rejected on evidence, section 4.3. |
| E5 | Fixture package manager | npm, with exact versions and a lockfile generated at prepare time | It ships with Node, it is what an agent reaches for, and a flat `node_modules` copies without symlink surgery. |
| E6 | Fixtures | Two: `vite-app` (Vite 8 + React 19 + Tailwind v4, PeakUI already wired) and `next-app` (Next.js 16 App Router + Tailwind v4, PeakUI installed but not wired) | Vite type-checks and builds in about 7 s and can server-render a single component for the render layer. Next.js is the only way to exercise the server-component pitfall and is the architecture's setup scenario. |
| E7 | Per-task starting state | A task names a fixture and may carry an `overlay/` directory copied over it | One prepared template serves many tasks; the overlay is the only per-task state. |
| E8 | Workspace location | A fresh copy under `os.tmpdir()/peakui-evals/` — never under the repository or `$HOME` | Claude Code discovers `CLAUDE.md` in ancestor directories. This repository's `CLAUDE.md` names HeroUI, which would break D6 and contaminate the run. The harness refuses to run when any ancestor of the workspace holds an agent file. |
| E9 | Workspace is a git repository | `git init` plus one commit before the agent starts | Real projects are repositories, and agents run `git status` and `git diff`. The harness does not trust git for the change list: it snapshots file hashes itself. |
| E10 | Agent adapter | An interface with a normalized transcript; adapters: `claude-code` (real) and `reference` (applies a stored solution, spends no tokens) | The `reference` adapter makes the whole pipeline testable without an agent and powers re-scoring. |
| E11 | Agent isolation | A throwaway `CLAUDE_CONFIG_DIR`, `--setting-sources project`, `--strict-mcp-config`, an allow-listed environment, authentication from the environment | Verified by spike, section 6.3. What still leaks is listed there and recorded per run. |
| E12 | Tools given to the agent | `Bash, Read, Edit, Write, Glob, Grep`. No web tools, no subagents. | Nothing about PeakUI is on the web yet, so web access is noise and cost; a configuration may add tools (`Skill`, MCP tools). |
| E13 | Scoring layers | Four, each reported on its own: type-check, production build, static assertions, rendered output | Required by the brief. A layer never short-circuits another. |
| E14 | Static assertions | TypeScript compiler API for TS/TSX, PostCSS for CSS. Regex only for classifying compiler and bundler messages. | `color="danger"` on a line is not the same as a `color` attribute on a PeakUI `Button`; the AST knows the difference. |
| E15 | Rendered output layer | Server-render the agent's component through the workspace's own Vite and React, parse with jsdom; for Next.js read the prerendered HTML the build emitted; for CSS tasks inspect the built CSS | Verified by spike. No interaction: see section 8.4. |
| E16 | Oracles prefer outcome over technique | A check asserts what the DOM or the built CSS is, and asserts a technique only where the documentation calls the alternative wrong | Several correct solutions exist for most tasks; a key that demands one of them is a wrong key. |
| E17 | Mistake list | Every failed gating finding becomes a mistake with pitfall, rule, file, line, source excerpt and, where found, the agent's own words before it wrote that file | This list is what the skill author reads. |
| E18 | Run status | `completed` or `infra-error`. An infrastructure failure (not authenticated, API error, spawn failure, contaminated environment) is never counted in a pass rate and is retried on resume. | A "Not logged in" run must not become a 0/5. Observed in the spike. |
| E19 | Repetitions | Five per task and configuration by default | Architecture section 5. |
| E20 | Statistics | Raw counts everywhere (`3/5`), a Wilson 95% interval on per-configuration aggregates, per-task spread listed as a result | Five samples invite over-reading; the interval makes the uncertainty visible. |
| E21 | Cost guard | A real-agent command that would launch more than one run refuses unless `--yes` is passed; `--dry-run` prints the matrix; per-run `--max-budget-usd` (default 3) and timeout (default 15 min) | Every run spends real tokens. |
| E22 | Resumability | A run is done when its `record.json` exists with status `completed`; `run --batch <id>` launches only what is missing or `infra-error` | Batches get interrupted. |
| E23 | Re-scoring | `score --batch <id>` rebuilds each workspace from the template plus the saved changed files and scores again, with no agent call | Answer keys will be corrected after reading baseline transcripts; that must not cost tokens. |
| E24 | Results in git | Committed: `batch.json`, `summary.md`, each run's `record.json` and its changed files. Ignored: `transcript.jsonl`, logs. Every committed string is redacted of local paths. | The baseline is evidence for the skill and must be reviewable; transcripts are large and full of local paths. |
| E25 | Tests | `pnpm --filter @peakui/evals test` is fast and offline. `test:solutions` needs the prepared templates and runs every reference solution through the real scorer. | `pnpm -r test` must not install 600 MB of fixtures. |
| E26 | D6 enforcement | Two gates: the staged tarballs are scanned for the reference library's name and the pack step fails on a hit; a unit test scans every prompt, fixture and overlay for that name and for any other UI library's name | Nothing the eval puts in front of the agent may name HeroUI. |
| E27 | Default model | `sonnet` alias, overridable with `--model`; the resolved model id reported by the CLI is stored in every record | A batch must say exactly what it measured. |

## 3. Facts verified before design

Each row was measured in a throwaway directory outside the repository on 2026-10-03.

| Question | Result |
| --- | --- |
| Do staged dist-based tarballs install and work in a consumer app? | Yes. `npm install` of the two tarballs in a Vite app pulls the peers (`react-aria-components`, `@react-aria/utils`) automatically; `tsc --noEmit` passes in 4 s, `vite build` in 3 s; the built CSS holds the component rules. Same for Next.js 16.3.6: build in 12 s. |
| Does the shipped CSS mention the reference library? | **Yes.** `packages/styles/index.css` and seven files under `components/` name it in comments. Staging strips CSS comments; see 4.2. |
| Is a reversed CSS import order really silent? | Yes, and the oracle is precise. With `@peakui/styles/css` before `tailwindcss` the build succeeds, the file is the same size, but the first-appearance order of cascade layers becomes `theme, components, base, utilities` instead of `theme, base, components, utilities`, so Tailwind's preflight overrides component rules. Identical under `@tailwindcss/vite` and `@tailwindcss/postcss`. |
| Missing Tailwind import, or PeakUI CSS imported from a TS file | Not silent: `Cannot apply unknown utility class`, build fails. |
| PeakUI CSS never imported | Silent: build passes, no `.button` rule in the output. |
| What does `tsc` let through? | `color="danger"` on `Button`, `onClick` on `Button`, `prefix="https://"` on `Input`, `required` on an `Input` inside a `TextField`, `forwardRef`, and `tv` imported from `tailwind-variants` (npm hoists it) all type-check. `tsc` rejects `isLoading`, `as`, `classNames`, `label`, `startContent`, `disabled` on `Button`, `variant="bordered"`, `size="small"`, `PeakUIProvider`, `@peakui/react/button`, and a `render` on `Button` that returns `<a>`. |
| Server component passing a function to a PeakUI component | `tsc` passes. `next build` fails at prerender: `Event handlers cannot be passed to Client Component props` for `onPress`, `Functions cannot be passed directly to Client Components` for function children. `"use client"` on an async page that reads a file fails the build too. |
| Interpolated class names | `` className={`rounded-${radius}`} `` renders `rounded-sm` in the DOM and no `.rounded-sm` rule reaches the built CSS. |
| `@source` | A component from a package in `node_modules` using utilities nowhere else in the app gets no CSS; `@source "../node_modules/@acme/status";` fixes it. |
| Rendering one component of the workspace | A child process that loads Vite, React and `react-dom/server` from the workspace's `node_modules` and calls `ssrLoadModule` + `renderToStaticMarkup` works in 0.7 s and shows `data-slot`, BEM classes, `data-pending`, `data-required`, label/input linkage and `render`-replaced elements. `FieldError` does not appear (the field is valid on the server). |
| Next.js prerendered HTML | `.next/server/app/index.html` contains the page's markup, including PeakUI classes. |
| Claude Code CLI | Version `2.1.284`. Not on `PATH` on this machine: the binary lives at `~/Library/Application Support/Claude/claude-code/2.1.284/claude.app/Contents/MacOS/claude`. With a clean environment `claude auth status` reports `"loggedIn": false`. |
| Claude Code flags and output shape | All flags in 6.2 are accepted. `--output-format stream-json --verbose` emits one JSON object per line: a `system`/`init` event (`tools`, `mcp_servers`, `skills`, `slash_commands`, `plugins`, `agents`, `model`, `claude_code_version`, `memory_paths`), `assistant` events (`message.content`), and one `result` event (`is_error`, `terminal_reason`, `result`, `usage`, `total_cost_usd`, `duration_ms`, `num_turns`, `session_id`, `permission_denials`). An unauthenticated run exits 1 with `is_error: true`, `terminal_reason: "api_error"`, zero usage. |
| Isolation flags | With `CLAUDE_CONFIG_DIR` pointed at an empty directory, `--setting-sources project`, `--strict-mcp-config` and `--disable-slash-commands`, the `init` event lists exactly the six requested tools, `mcp_servers: []`, `skills: []`, `slash_commands: []`, and `memory_paths.auto` inside the throwaway config directory. The user's enabled plugin did not load. Built-in plugins `agents-md@builtin` and `telemetry@builtin` remain. |
| Copying a prepared template | `fs.cpSync` with `COPYFILE_FICLONE` and `verbatimSymlinks`: 16 s for the 444 MB Next.js template, and the copy builds. |

**Not verified:** the shape of `assistant` events that carry `tool_use` blocks and of `user` events
that carry tool results, because no authenticated run was possible. The adapter stores the raw
stream and the plan's single smoke run is where the parser meets real output.

## 4. Consuming the unpublished packages

### 4.1 The problem

`@peakui/react` and `@peakui/styles` are version `0.0.0`, their `exports` point at `src`, and the
publish-time rewrite to `dist` does not exist yet. A consumer will never see `src`: it holds
stories, contributor comments in Russian that explain the answers (`button.tsx` says in a comment
that the consumer supplies the pending indicator), and TypeScript that needs
`allowImportingTsExtensions`.

### 4.2 Staging

`pack` builds what a release would publish, without touching the packages:

1. **`@peakui/react`** — run `tsdown --out-dir <stage>/react/dist` with the package's own
   `tsdown.config.ts` and working directory. Write a `package.json` copy with `scripts` and
   `devDependencies` removed, `exports["."]` set to
   `{types: "./dist/index.d.mts", import: "./dist/index.mjs", default: "./dist/index.mjs"}`,
   `files: ["dist"]`, and the `workspace:*` dependency on `@peakui/styles` replaced by its version.
2. **`@peakui/styles`** — run
   `tsdown src/index.ts --no-config --format esm --dts --unbundle --platform neutral --out-dir <stage>/styles/dist`
   in the package directory. Copy `index.css`, `base/`, `components/`, `themes/`, `utilities/`,
   `variants/`. Write a `package.json` copy with `exports["."]` set to
   `{types: "./dist/index.d.ts", import: "./dist/index.js", style: "./index.css", default: "./dist/index.js"}`,
   the TypeScript entry points `./components/*`, `./generator` and `./presets` removed (no
   documentation page mentions them), and `files` listing `dist` and the CSS directories.
3. **Strip every comment from the staged CSS** with PostCSS.
4. **Gate:** scan every staged file for `/heroui/i`; fail the pack on a hit.
5. `npm pack` each staged directory into `<home>/tarballs/`.
6. `@acme/status` — a tiny plain-JS package committed under `evals/fixtures/packages/acme-status/`,
   packed the same way. It exists for the Tailwind scanning task.

The **library hash** is a SHA-256 over the staged files' relative paths and contents. It is stored
in the batch manifest; two batches with different hashes measured different libraries.

Stripping CSS comments is a decision, not a neutral transformation. Comments are where the
reference library is named (D6), they are contributor notes in Russian, and `index.css` opens with a
contract comment that states the import order — the answer to one task. Whether the published
package keeps that comment is a release decision. Until it is made the baseline measures the harder
case; the risk is recorded in section 13.

### 4.3 Rejected alternatives

- **`link:` or `file:` to the package directory.** The agent would read `src`, the stories and the
  comments. It also breaks under Next.js without `transpilePackages`, which no consumer needs.
- **Packing the packages as they are.** Same leak, and `tsc` in the consumer would type-check
  library sources under the consumer's own compiler options.
- **A local registry.** A moving part with no extra realism over `file:` tarballs.

When the release setup lands, step 1 and 2 are replaced by `pnpm pack` of the real packages and the
rest stays.

## 5. Fixtures and workspaces

### 5.1 `vite-app`

Name `acme-dashboard`. React 19.3.0, Vite 8.3.1, `@vitejs/plugin-react` 6.1.1, Tailwind 4.3.3 with
`@tailwindcss/vite`, TypeScript 5.9.3, strict. `src/index.css` imports `tailwindcss` then
`@peakui/styles/css`: PeakUI is wired. `src/App.tsx` renders a heading and a paragraph with no
PeakUI component, so the base state shows no prop names. Dependencies include `@acme/status`.

### 5.2 `next-app`

Name `acme-site`. Next.js 16.3.6 App Router, React 19.3.0, Tailwind 4.3.3 with
`@tailwindcss/postcss`. `app/globals.css` imports only `tailwindcss`: PeakUI is installed and not
wired. `app/page.tsx` is an async server component that awaits `getPlan()` from `lib/plan.ts`,
which reads `data/plan.json` with `node:fs` — so the page cannot simply become a client component.

### 5.3 What a fixture must not contain

No README, no agent file, no comment that explains PeakUI, no PeakUI prop in the base state. The
only PeakUI usage an agent sees before it starts is what a task's overlay needs as its starting
point, and each overlay is listed in section 7.

### 5.4 Templates

`prepare` copies a fixture to `<home>/templates/<fixture>/`, drops the tarballs into `vendor/`,
runs `npm install --no-audit --no-fund`, then the fixture's prepare commands (`next typegen` for
`next-app`). A sidecar `<home>/templates/<fixture>.json` stores the fixture hash, the library hash,
Node and npm versions. A template is reused while both hashes match.

`<home>` is `PEAKUI_EVALS_HOME` or `os.tmpdir()/peakui-evals`.

### 5.5 Workspace lifecycle

1. **Guard.** Walk from the workspace's parent to the filesystem root. If any directory holds
   `CLAUDE.md`, `AGENTS.md`, `.claude/`, `.mcp.json`, `.cursor/` or `.agents/`, refuse to run.
2. Copy the template (`COPYFILE_FICLONE`, `verbatimSymlinks`).
3. Copy the task's `overlay/`.
4. Apply the configuration (section 9).
5. `git init`, commit everything as `Acme Dev <dev@acme.example>`.
6. Snapshot: SHA-256 of every file outside `node_modules`, `dist`, `.next`, `.git`, `vendor`.
7. Run the adapter.
8. Snapshot again; the difference is `added`, `modified`, `deleted`.
9. Score.
10. Copy the changed files into the run's result directory, write the record, delete the workspace
    (kept with `--keep-workspaces`).

## 6. Agent adapters

### 6.1 Interface

```ts
interface AgentAdapter {
  readonly id: string;
  describe(): Promise<AdapterInfo>;
  run(request: AgentRunRequest): Promise<AgentRunResult>;
}
```

`AgentRunRequest` carries the workspace directory, the prompt, the model, the timeout, the budget,
the paths for the raw transcript and stderr, and an `AgentSetup` contributed by the configuration
(`tools`, `skillsEnabled`, optional `mcpConfigPath`, `allowedMcpServers`).

`AgentRunResult` carries `outcome` (`ok`, `timeout`, `budget`, `agent-error`, `infra-error`), exit
code, duration, token usage, cost, turns, resolved model, the final message, an `AgentEnvironment`
taken from the agent's own start-up report, and a **normalized transcript**:

```ts
type TranscriptEvent =
  | {kind: "text"; text: string}
  | {kind: "tool"; id: string; name: string; input: unknown; writes: string[]}
  | {kind: "tool-result"; id: string; isError: boolean; text: string};
```

`writes` lists workspace-relative paths a tool call wrote, so that mistake-to-justification
matching (section 8.6) does not know any agent's tool names.

### 6.2 Claude Code adapter — invocation

The working directory is set by the spawn call; the CLI has no flag for it.

```
<claude> -p "<prompt>"
  --output-format stream-json --verbose
  --model <model>
  --permission-mode acceptEdits --permission-prompts none
  --tools Bash,Read,Edit,Write,Glob,Grep
  --allowedTools Bash,Read,Edit,Write,Glob,Grep
  --setting-sources project
  --strict-mcp-config --mcp-config <empty-or-configured.json>
  --disable-slash-commands          (omitted when the configuration enables skills)
  --no-session-persistence
  --max-budget-usd <n>
```

- `<claude>` is `--agent-bin`, else `PEAKUI_EVALS_CLAUDE_BIN`, else `claude` on `PATH`.
- stdin is closed; stdout is written line by line to `transcript.jsonl`; stderr to `stderr.txt`.
- The process runs in its own process group, and the group is killed on timeout, because an agent
  may leave a dev server running.
- Environment: an allow-list — `PATH`, `HOME`, `TMPDIR`, `LANG`, `LC_ALL`, `USER`, `SHELL`,
  `TERM`, every `ANTHROPIC_*`, `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_USE_BEDROCK`,
  `CLAUDE_CODE_USE_VERTEX`, `AWS_*`, `GOOGLE_*` — plus `CLAUDE_CONFIG_DIR=<home>/agent-config/<batch>`.
  Nothing else from the caller's environment passes; in particular none of the `CLAUDE_CODE_*`
  session variables a parent Claude Code session exports.

Outcome classification:

| Observation | `outcome` |
| --- | --- |
| No `result` event, or spawn failed | `infra-error` |
| `result.is_error` and `terminal_reason` is `api_error` | `infra-error` |
| `init` event violates the configuration's expected environment | `infra-error` (`contaminated`) |
| Killed by the harness timeout | `timeout` |
| `result.subtype` reports the budget or turn limit | `budget` |
| `result.is_error` otherwise | `agent-error` |
| Otherwise | `ok` |

`timeout`, `budget` and `agent-error` runs are still scored: the files are what the agent left.

### 6.3 Isolation — what is blocked, what leaks

`--agent-config isolated` is the default.

| Source | Isolated mode | How the harness controls or records it |
| --- | --- | --- |
| This repository's `CLAUDE.md`, `.claude/`, `.mcp.json` | Blocked | Workspace is outside the repository; ancestor guard (5.5). |
| User `~/.claude/settings.json` (hooks, enabled plugins, permissions) | Blocked | `CLAUDE_CONFIG_DIR` and `--setting-sources project`. Verified: the user's plugin was absent from `init`. |
| User `~/.claude/CLAUDE.md` and files it imports | Blocked by `CLAUDE_CONFIG_DIR` | Not directly observable in `init`; relies on the config directory move. |
| User skills, commands, agents | Blocked | `init.skills` and `init.slash_commands` are recorded and must be empty for `none`. |
| User and project MCP servers | Blocked | `--strict-mcp-config`; `init.mcp_servers` recorded and checked. |
| Auto-memory and session history | Blocked | `memory_paths.auto` is inside the throwaway config directory; `--no-session-persistence`. |
| Authentication | **Must come from the environment** | Moving the config directory drops a keychain login. `doctor` runs `claude auth status` under the run environment and refuses when `loggedIn` is false. |
| Claude Code's own system prompt and built-in tools | Leaks by nature | `claude_code_version` and the resolved model are recorded per run. |
| Built-in plugins `agents-md@builtin`, `telemetry@builtin` | Leak | Recorded in `environment.plugins`. |
| Built-in skills (eighteen, for example `code-review`, `design`) | Blocked for `none`, `agents-md`, `mcp`; **present for `skill`** | Recorded in `environment.skills`. |
| Admin-managed policy settings | Leak if installed | The CLI states they always apply. Recorded as a risk. |
| Machine facts in the prompt: OS, date, workspace path | Leak | Path is redacted in committed files. |
| The network, through `Bash` | Leaks | `curl` and `npm` work. Recorded in the transcript. |
| Files outside the workspace, through `Bash` and `Read` | **Readable** | `acceptEdits` with `--permission-prompts none` denies edits outside the workspace; reads are not confined. The harness scans the transcript and lists every absolute path outside the workspace under `outsideAccess`. |
| `Bash` itself | **Not sandboxed** | An open risk, section 13. |

`--agent-config inherit` uses the user's real config directory, for a machine where only a keychain
login exists. It keeps `--setting-sources project` and `--strict-mcp-config`, cannot rule out user
memory, is stored in the batch manifest, and prints a warning at the top of the summary.

## 7. Task set

Twelve tasks. A prompt is text a user would type; it names PeakUI, files and visible behavior, and
never a prop, a part name or another UI library.

### 7.1 Pitfall coverage

| Pitfall (architecture) | Id | Tasks |
| --- | --- | --- |
| CSS order | `css-order` | `first-time-setup` |
| Tailwind scanning | `tailwind-scanning` | `unstyled-shared-badge` (`@source`), `custom-button-variant` (interpolation) |
| Composition | `composition` | `sign-in-form`, `link-as-button`, `section-group-render`, `prefixed-field`, `custom-button-variant` |
| Styling | `styling` | `brand-primary-button`, `custom-button-variant`, `link-as-button` |
| Fields | `fields` | `sign-in-form`, `prefixed-field` |
| React Aria prop names | `rac-props` | `pending-button`, `press-state-label`, `server-page-action`, `sign-in-form` |
| Variants | `variants` | `destructive-actions`, `first-time-setup` |
| Peers and RSC | `peers-rsc` | `server-page-action` |
| Imports | `imports` | every task (shared detector `deep-import`) |
| No provider | `no-provider` | `first-time-setup`, every task (shared detector `provider`) |

Two sub-clauses have no task of their own, deliberately. "A nested root resets the variant": no
natural consumer task nests one `TextField` in another with nine components; it returns with
composite fields. "Peers": npm installs both peers automatically (verified), so there is nothing
for an agent to get wrong until the packages are published and installed by the agent itself.

### 7.2 Tasks

Sources are under `packages/react/src/components/`, `packages/styles/` and
`apps/docs/content/docs/en/react/`. "Docs" below names the page that states the expected answer.

#### `sign-in-form` — fixture `vite-app`

**Prompt**

> Add a sign-in form to this app using PeakUI. Put it in src/components/SignInForm.tsx as a named export `SignInForm` and show it on the home screen in src/App.tsx. It needs an email field and a password field, both required, and the password must be at least 8 characters. Validation messages should appear under the field they belong to. Add a "Sign in" submit button.

**Start:** the base fixture.
**Correct:** two `TextField` roots, each with sibling `Label`, `Input`, `FieldError`; `isRequired`
on the root; the length rule as `minLength`, `validate` or `isInvalid`; `<Button type="submit">`.
Source: `textfield/textfield.tsx`, `field-error/field-error.tsx`; docs `components/(forms)/text-field.mdx`
(Anatomy, Validation), `getting-started/(handbook)/composition.mdx` (Fields).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `field-error-in-each-field` | At least two `FieldError` elements, each inside a `TextField`. Needed because a valid field renders no error on the server. |
| static | `password-length-rule` | The `TextField` holding the password input, or that input, has `minLength={8}`, or the root has `validate` or `isInvalid`. |
| static | `form-is-mounted` | `src/App.tsx` renders `SignInForm`. |
| render | `two-required-fields` | Exactly two `[data-slot="textfield"]`, both with `data-required="true"`. Fails when `required` sits on `Input`. |
| render | `label-linked` | In each field, `label[data-slot="label"]` has `for` equal to the id of an `input` in that field. |
| render | `input-types` | One input of type `email`, one of type `password`. |
| render | `submit-button` | `form button[data-slot="button"][type="submit"]`. |

**Reference solutions:** `good`; `bad-assembled` (`<Input label="…" errorMessage="…">` — fails
type-check); `bad-native-required` (`required` on `Input`, no `FieldError` — type-checks and
builds, fails static and render).

#### `pending-button` — fixture `vite-app`

**Prompt**

> src/components/SaveBar.tsx is missing its button. Add a PeakUI "Save" button that calls `onSave`. While `saving` is true the button should show a loading spinner and must not trigger `onSave` again.

**Start:** overlay `src/components/SaveBar.tsx` (props `saving`, `onSave`; an empty bar) and an
`App.tsx` that renders it.
**Correct:** `<Button isPending={saving} onPress={onSave}>` with a `Spinner` in its children while
saving. Source: `button/button.tsx` (the pending indicator is the consumer's); docs
`components/(buttons)/button.mdx` (Loading), `composition.mdx` (React Aria Props).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `press-handler` | A PeakUI `Button` has an `onPress` attribute. |
| render (saving) | `pending-state` | `button[data-slot="button"][data-pending="true"]`. Fails for `isDisabled`. |
| render (saving) | `spinner-while-pending` | That button contains `[data-slot="spinner"]`. |
| render (idle) | `idle-state` | The button has no `data-pending` and contains no spinner. |
| render (both) | `label` | The button's text contains `Save`. |

**Reference solutions:** `good`; `bad-no-spinner` (`isPending` only); `bad-is-loading`
(`isLoading` — fails type-check).

#### `custom-button-variant` — fixture `vite-app`

**Prompt**

> We want our own button for this app. Create src/components/AppButton.tsx exporting `AppButton`: it should behave exactly like the PeakUI button and accept everything it accepts, plus a `radius` option that is either "full" or "sm" (default "full") for the corner rounding. Use it for a "Get started" button in src/App.tsx.

**Start:** the base fixture.
**Correct:** any wrapper that keeps `size` and `variant` on `Button` and adds whole class strings
or CSS for the radius. The documented form is `tv` imported from `@peakui/react` with a `radius`
variant, passed as `className`. Source: `packages/react/src/index.ts` (re-export of `tv`);
docs `getting-started/(handbook)/styling.mdx` (Adding Variants and its warning),
`quick-start.mdx` (Tailwind class detection).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `button-is-used` | `src/App.tsx` renders `AppButton`. |
| static | shared `foreign-tv`, `interpolated-class`, `forward-ref` | See 8.3. |
| render | `renders-button` | Root is `button[data-slot="button"]` in every case. |
| render | `variant-classes-once` | With `variant="secondary" size="lg"`, each of `button`, `button--lg`, `button--secondary` appears exactly once. Fails for `tv({extend: buttonVariants})` in a wrapper around `Button`. |
| render | `radius-changes-output` | `radius="sm"` and `radius="full"` differ in class tokens or in `style`. |
| render | `default-radius-full` | No `radius` gives the same class tokens and `style` as `radius="full"`. |
| render | `radius-classes-have-rules` | Every class token present for only one radius has a rule in the built CSS. Fails for interpolated names. |

**Reference solutions:** `good`; `bad-interpolated`; `bad-extend-wrapper`; `bad-foreign-tv`.

#### `first-time-setup` — fixture `next-app`

**Prompt**

> @peakui/react and @peakui/styles are already installed in this app, but nothing is wired up yet. Finish the PeakUI setup and add a primary "Get started" button to the home page (app/page.tsx) so I can see it working.

**Start:** the base fixture.
**Correct:** `@import "@peakui/styles/css";` after `@import "tailwindcss";` in `app/globals.css`;
`<Button>` (primary is the default) imported from the package root; no provider. Source:
`packages/styles/index.css` (contract comment), `packages/styles/src/components/button/button.styles.ts`
(`defaultVariants`); docs `getting-started/(overview)/quick-start.mdx`.

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `styles-imported` | Some project CSS file imports `@peakui/styles/css` or `@peakui/styles`. |
| static | `import-order` | In a CSS file that imports both, `tailwindcss` comes first. |
| render | `primary-button` | The prerendered page has `button[data-slot="button"]` with class `button--primary` and text `Get started`. |
| render | `component-css-present` | The built CSS has a `.button` rule inside the `components` layer. |
| render | `layer-order` | In the built CSS, layer `base` first appears before layer `components`. |

**Reference solutions:** `good`; `bad-reversed-order` (type-checks, builds, fails static and
render); `bad-provider` (imports `PeakUIProvider` — fails type-check and build).

#### `server-page-action` — fixture `next-app`

**Prompt**

> On the home page (app/page.tsx), under the plan line, add a PeakUI button labelled "Copy invite link" that copies https://acme.example/invite/team to the clipboard when pressed. The page must keep loading the plan on the server the way it does now.

**Start:** overlay `app/globals.css` with both imports in the right order.
**Correct:** a new file starting with `"use client"` that holds the `Button` with `onPress`; the
page stays an async server component and renders it. Source: every component file starts with
`"use client"`; docs `quick-start.mdx` (Server Components).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `page-stays-server` | `app/page.tsx` has no `"use client"` directive and still calls `getPlan`. |
| static | `handler-in-client-file` | Every project file with an `onPress` attribute starts with `"use client"`. |
| static | `press-handler` | Some PeakUI `Button` has `onPress`. |
| render | `button-rendered` | The prerendered page has `button[data-slot="button"]` with text `Copy invite link`. |
| render | `server-data-rendered` | The page text contains `Plan:` and `Team`. |

**Reference solutions:** `good`; `bad-handler-in-server-page` (type-checks, build fails);
`bad-client-page` (`"use client"` on the page — build fails).

#### `link-as-button` — fixture `vite-app`

**Prompt**

> The "View pricing" link in src/components/Hero.tsx should look like a PeakUI secondary button. It has to stay a real link to /pricing.

**Start:** overlay `src/components/Hero.tsx` with a plain `<a href="/pricing">`, and an `App.tsx`
that renders it.
**Correct:** `<a className={buttonVariants({variant: "secondary"})} href="/pricing">`, or the BEM
classes written out. Source: `button/index.ts` (re-export of `buttonVariants`); docs
`composition.mdx` (Styling Another Element, Custom DOM Element).

| Layer | Rule | Asserts |
| --- | --- | --- |
| render | `still-a-link` | Exactly one `a[href="/pricing"]` with text `View pricing`. |
| render | `button-classes` | Its class tokens include `button` and `button--secondary`. |
| render | `no-nested-interactive` | No `button` is an ancestor or descendant of the link. |
| render | `not-a-pressable` | The link carries no `data-react-aria-pressable` attribute. A `Button` must render a `<button>`. |

**Reference solutions:** `good`; `bad-nested` (`<a><Button>`); `bad-as-prop` (fails type-check).

#### `destructive-actions` — fixture `vite-app`

**Prompt**

> In src/components/DangerZone.tsx add two PeakUI buttons after the paragraph: a small red "Delete account" button for the destructive action, and a small "Cancel" button that is only outlined.

**Start:** overlay `src/components/DangerZone.tsx` (heading, paragraph) and an `App.tsx`.
**Correct:** `variant="danger"` and `variant="outline"`, both `size="sm"`. Source:
`button.styles.ts` — variants `danger`, `danger-soft`, `ghost`, `outline`, `primary`, `secondary`,
`tertiary`; sizes `lg`, `md`, `sm`; there is no `color` variant.

| Layer | Rule | Asserts |
| --- | --- | --- |
| render | `danger-variant` | The button with text `Delete account` has `button--danger` or `button--danger-soft`, and `button--sm`. |
| render | `outline-variant` | The button with text `Cancel` has `button--outline` and `button--sm`. |
| static | shared `color-prop` | `color` on `Button` type-checks, so only the detector sees it. |

**Reference solutions:** `good`; `bad-utility-classes` (Tailwind color utilities instead of a
variant); `bad-color-prop` (`color="danger" variant="bordered" size="small"` — fails type-check
and the detector).

#### `prefixed-field` — fixture `vite-app`

**Prompt**

> Add two PeakUI text fields to the form in src/components/ProfileForm.tsx: "Display name" and "Website". The website input should show a fixed https:// in front of what the user types. The form sits on a gray card, so both fields should use the secondary field style.

**Start:** overlay `src/components/ProfileForm.tsx` (an empty form on a gray card) and an `App.tsx`.
**Correct:** `TextField variant="secondary"` with `Label` and `Input`; for the website,
`InputGroup` with `InputGroup.Prefix` and `InputGroup.Input`. `variant` on the control itself is
also valid API and passes. Source: `textfield/textfield.tsx` (`FieldVariantContext`),
`input-group/input-group.tsx`, `input-group.styles.ts`; docs `composition.mdx` (Fields).

| Layer | Rule | Asserts |
| --- | --- | --- |
| render | `two-labelled-fields` | Two `[data-slot="textfield"]`, labels `Display name` and `Website`, each label's `for` matching a control in its field. |
| render | `secondary-input` | The display-name control is `input.input--secondary`. |
| render | `secondary-group` | The website field holds `[data-slot="input-group"].input-group--secondary`. |
| render | `prefix-part` | That group holds `[data-slot="input-group-prefix"]` with text `https://` and `[data-slot="input-group-input"]`. |

**Reference solutions:** `good`; `bad-prefix-attribute` (`<Input prefix="https://">` —
type-checks and builds, fails render); `bad-start-content` (fails type-check).

#### `unstyled-shared-badge` — fixture `vite-app`

**Prompt**

> The status badge next to the heading comes from our shared @acme/status package. In the production build it has no background or text color — it looks like plain text. Fix it without changing the badge package or copying its classes into our code.

**Start:** overlay `src/App.tsx` rendering `<StatusBadge status="active" />`.
**Correct:** `@source "../node_modules/@acme/status";` in `src/index.css`. Source:
`packages/styles/index.css` (contract comment); docs `quick-start.mdx` (Tailwind class detection).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `source-directive` | A project CSS file has an `@source` at-rule whose parameter names `@acme/status` and is not `inline(...)`. |
| static | `classes-not-copied` | No project TS/TSX file contains `bg-emerald-100`. |
| render | `badge-classes-have-rules` | The built CSS has rules for `bg-emerald-100`, `text-emerald-800`, `bg-amber-100` and `bg-slate-100` — all three tones, which proves the package is scanned. |

**Reference solutions:** `good`; `bad-inline-safelist` (`@source inline(...)` for one tone);
`bad-copied-classes` (a safelist file in `src`).

#### `brand-primary-button` — fixture `vite-app`

**Prompt**

> Every primary PeakUI button in this app should use our brand green instead of the default color: #16a34a normally and #15803d when hovered or pressed, with white text. Do it once for the whole app — don't touch the individual buttons — and leave the other button variants alone.

**Start:** overlay `src/App.tsx` with a primary and a secondary `Button`.
**Correct:** in `src/index.css`, after the imports, a rule for `.button--primary` that sets
`--button-bg`, `--button-bg-hover`, `--button-bg-pressed`, `--button-fg`. A rule that overrides
`background-color` on `.button--primary` and its hover state also passes; the technique is recorded
as information. Overriding `--color-accent` is wrong: `spinner.css` reads it too. Source:
`packages/styles/components/button.css` (`.button--primary` block, the six variables); docs
`styling.mdx` (Component Variables), `button.mdx` (Global CSS, CSS Variables).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `only-css-changed` | Every changed or added file is a `.css` file. |
| render | `primary-is-brand` | The built CSS has a rule whose selector contains `button--primary` and whose declarations contain `16a34a`. |
| render | `primary-hover-is-brand` | Some rule whose selector contains `button--primary` contains `15803d`. |
| render | `accent-untouched` | No declaration of `--color-accent` has the value `#16a34a`. |
| render | `uses-component-variables` | Informational, never gates: whether `--button-bg` carries the color. |

**Reference solutions:** `good`; `bad-per-instance` (`className` on each button);
`bad-accent-token`.

#### `press-state-label` — fixture `vite-app`

**Prompt**

> Finish src/components/ConfirmButton.tsx: a PeakUI button whose label reads "Release to confirm" while it is being held down and "Confirm" the rest of the time. It should call `onConfirm` when the press completes, and it has to work with mouse, touch and keyboard.

**Start:** overlay `src/components/ConfirmButton.tsx` (props `onConfirm`; returns `null`) and an
`App.tsx`.
**Correct:** children as a function of `isPressed`, or `onPressChange` / `onPressStart` +
`onPressEnd` with state; `onPress={onConfirm}`. Source: `button/button.tsx` (children function is
forwarded the render props); docs `styling.mdx` (Render Props), `button.mdx` (Render Props table).

| Layer | Rule | Asserts |
| --- | --- | --- |
| static | `press-state-source` | The `Button` has a function child, or `onPressChange`, or both `onPressStart` and `onPressEnd`. |
| static | `no-pointer-handlers` | The `Button` has none of `onMouseDown`, `onMouseUp`, `onPointerDown`, `onPointerUp`, `onTouchStart`, `onTouchEnd`, `onKeyDown`, `onKeyUp`. |
| static | `press-handler` | The `Button` has `onPress`. |
| render | `idle-label` | The button's text is `Confirm`. |

**Reference solutions:** `good`; `bad-mouse-events`.

#### `section-group-render` — fixture `vite-app`

**Prompt**

> In src/components/AddressForm.tsx the group that holds the address fields is rendered as a div. Our landmark navigation needs it to be a <section> element with the accessible name "Address". Change the element itself — don't add another wrapper around it.

**Start:** overlay `src/components/AddressForm.tsx` with `Fieldset`, `Fieldset.Legend`,
`Fieldset.Group` and two text fields, and an `App.tsx`.
**Correct:** `<Fieldset.Group render={(props) => <section {...props} aria-label="Address" />}>`.
Source: `fieldset/fieldset.tsx` (`dom.div`, `data-slot="fieldset-group"`), `utils/dom.tsx`; docs
`composition.mdx` (Custom DOM Element).

| Layer | Rule | Asserts |
| --- | --- | --- |
| render | `group-is-section` | `section[data-slot="fieldset-group"]` exists and has class `fieldset__group`. |
| render | `section-is-named` | That section has `aria-label="Address"`, or `aria-labelledby` naming an element whose text is `Address`. |
| render | `no-div-group` | No `div[data-slot="fieldset-group"]`. |
| render | `fields-inside` | Both `[data-slot="textfield"]` are inside the section. |

**Reference solutions:** `good`; `bad-wrapper` (a `<section>` around the group); `bad-as-prop`
(fails type-check).

## 8. Scoring

### 8.1 Layers

| Layer | Runs | Passes when |
| --- | --- | --- |
| `typecheck` | The fixture's type-check commands (`tsc --noEmit --pretty false`; `next typegen` first for `next-app`), invoked by binary path, never through the project's `scripts` | Every command exits 0. Diagnostics are parsed into findings. |
| `build` | `vite build` or `next build`, with `CI=1` and `NEXT_TELEMETRY_DISABLED=1` | Exit 0. |
| `static` | Shared detectors over every changed or added source file, then the task's own checks | No gating finding failed. |
| `render` | The task's render spec | No gating finding failed. `not-applicable` when the task has none. |

All four always run. A render check that cannot run — the module does not load, the build left no
HTML or CSS — is a failed finding (`render-unavailable`, `built-css-unavailable`), not a skip.

A run **passes** when every applicable layer passes.

### 8.2 Findings

```ts
interface Finding {
  rule: string;
  pitfall: PitfallId;
  pass: boolean;
  gate: boolean;
  message: string;
  file?: string;
  line?: number;
  excerpt?: string;
}
```

Compiler and bundler output becomes findings through a classification table:

| Pattern in the message | Rule | Pitfall |
| --- | --- | --- |
| `Property '(as\|classNames\|label\|errorMessage\|description\|helperText\|startContent\|endContent\|labelPlacement)' does not exist` | `unknown-composition-prop` | `composition` |
| `Property '(isLoading\|loading\|disabled\|readOnly\|required\|onClick\|isDisable)' does not exist` | `unknown-state-prop` | `rac-props` |
| `Property '(color\|radius\|colorScheme)' does not exist` or `Type '"…"' is not assignable to type '"danger" \| …` | `unknown-variant` | `variants` |
| `Cannot find module '@peakui/(react\|styles)/` | `deep-import` | `imports` |
| `has no exported member '…Provider'` | `provider` | `no-provider` |
| `has no exported member` (from `@peakui/…`) | `unknown-export` | `imports` |
| `Event handlers cannot be passed to Client Component props` or `Functions cannot be passed directly to Client Components` | `function-across-server-boundary` | `peers-rsc` |
| `Cannot apply unknown utility class` | `styles-without-tailwind` | `css-order` |
| anything else | `type-error` or `build-error` | `other` |

### 8.3 Shared detectors

They run on every changed or added `.ts`/`.tsx` file, for every task, and they gate. A "PeakUI
element" is a JSX element whose tag's root identifier was imported from `@peakui/react`.

| Rule | Pitfall | Fires on |
| --- | --- | --- |
| `deep-import` | `imports` | An import from `@peakui/react/…`. |
| `provider` | `no-provider` | An imported name ending in `Provider` from `@peakui/…`. |
| `foreign-tv` | `styling` | `tv` imported from `tailwind-variants`. |
| `forward-ref` | `composition` | `forwardRef` imported from `react` or used as `React.forwardRef`. |
| `class-names-prop` | `composition` | `classNames` on a PeakUI element. |
| `as-prop` | `composition` | `as` on a PeakUI element. |
| `assembled-field-prop` | `composition` | `label`, `errorMessage`, `description` or `helperText` on `Input` or `TextField`. |
| `dom-event-on-button` | `rac-props` | `onClick` on a PeakUI `Button`. |
| `dom-state-prop` | `rac-props` | `disabled`, `loading` or `isLoading` on `Button`; `disabled`, `required` or `readOnly` on `TextField`. |
| `color-prop` | `variants` | `color` on a PeakUI `Button`. |
| `interpolated-class` | `tailwind-scanning` | A template literal with a substitution, inside a `className` value or an argument of `tv`, `cn`, `clsx` or `twMerge`, where the text next to the substitution ends or starts with `-`. |
| `type-escape` | `other` | `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `as any`. |
| `config-weakened` | `other` | `tsconfig.json` is among the changed files. |

`disabled` on a standalone `Input` and on `Fieldset` is documented API and is not flagged.

### 8.4 Rendered output

A render spec has an optional `ssr` part (module, export name, named cases with props; the string
`"__fn__"` in props becomes a no-op function), an optional `html` part (a file the build emitted),
and a `check` function that receives the parsed documents and the parsed built CSS.

The SSR runner is a child process started with the workspace as its first argument. It resolves
Vite, React and `react-dom/server` from the workspace, starts Vite with `configFile: false` so the
agent's Vite config cannot break scoring, loads the module with `ssrLoadModule` and renders each
case with `renderToStaticMarkup`.

**No interaction.** Static markup cannot press a button or submit a form. An interactive jsdom
render needs testing libraries resolved against the workspace's single React copy; that is a
separate design with its own spike. Where a contract only shows on interaction (a `FieldError`
appearing, a label changing while pressed) the static layer asserts the structure instead. This is
a stated limit, section 13.

### 8.5 Mistakes

`mistakes` is every failed gating finding across the four layers, in layer order, de-duplicated by
`rule` + `file` + `line`. Each carries `layer`, `rule`, `pitfall`, `message`, and when known `file`,
`line` and `excerpt` (the source line, trimmed).

### 8.6 Justification

For a mistake with a `file`, the harness finds the last `tool` event in the normalized transcript
whose `writes` includes that file, and takes the `text` events between the previous `tool` event
and that one. Joined, they are the mistake's `justification` — the agent's own words, verbatim.
The record also keeps `narration`: every `text` event in order, and `finalMessage`.

## 9. Configurations

```ts
interface Configuration {
  readonly id: string;
  readonly description: string;
  available(): Promise<Availability>;
  apply(context: ConfigurationContext): Promise<ConfigurationResult>;
}
```

`apply` runs after the overlay and before the initial commit, so whatever it writes into the
workspace is part of the starting state and never counted as an agent change. It returns the
`AgentSetup` additions, the environment it expects the agent to report (`mcpServers`, `skills`),
and the versions of the artifacts it installed.

| Id | Status | Writes | Agent setup | Expects | Records |
| --- | --- | --- | --- | --- | --- |
| `none` | first plan | nothing | none | `mcpServers: []`, `skills: []` | — |
| `agents-md` | later | Runs the built `peakui-cli` (`PEAKUI_EVALS_CLI_BIN`) as `peakui agents-md` non-interactively in the workspace, against a docs origin given by `PEAKUI_EVALS_DOCS_URL` (a local `next start` of `apps/docs`). The block lands in `AGENTS.md` and `CLAUDE.md`, the snapshot in its git-ignored directory. | none | as `none` | CLI version, snapshot stamp, block size in bytes |
| `skill` | later | Copies `skills/peakui-react/` to `<workspace>/.claude/skills/peakui-react/` | `skillsEnabled: true`, adds the `Skill` tool | `skills` contains `peakui-react` | skill version from its frontmatter; **whether the skill was invoked** in the run |
| `mcp` | later | An MCP config file outside the workspace that starts the built `peakui-mcp` over stdio (`PEAKUI_EVALS_MCP_CMD`), pointed at the same docs origin | `mcpConfigPath`, `allowedMcpServers: ["peakui"]` | `mcpServers` is `["peakui"]`, connected | server version, number of MCP tool calls |

The three later configurations are registered as `planned`: selecting one fails with a message that
names the missing artifact. None of them may put the reference library's name in front of the
agent; that is the artifact's own obligation under D6, and the unit gate of E26 is extended to the
files a configuration writes when it is implemented.

## 10. Results

```
evals/results/<batch>/
  batch.json                          committed
  summary.md                          committed
  runs/<task>__<configuration>__r<n>/
    record.json                       committed
    files/<changed files>             committed
    transcript.jsonl                  ignored (the agent's raw stream)
    events.json                       ignored (the normalized transcript, read by re-scoring)
    stderr.txt, typecheck.log, build.log, render.log   ignored
```

A batch id is `<YYYYMMDD-HHmmss>-<label>`.

`batch.json` holds the matrix, the adapter and its version, the requested and resolved model, the
library hash, the template hashes, Node, npm and platform, the isolation mode, the timeout and the
budget.

`record.json` holds the run key, status, the agent section (outcome, duration, turns, token usage,
cost, environment, final message, narration), the four layer results with their findings, `passed`,
`mistakes`, the change lists and `outsideAccess`.

Redaction replaces the workspace path with `<workspace>`, the harness home with `<evals-home>` and
the user's home with `~` in every string written to a committed file.

### 10.1 Summary

`summary.md` has, in order:

1. A header: batch id, date, adapter and version, model, library hash, isolation mode, and a
   warning line when the mode is `inherit` or when any run was `infra-error`.
2. **Per configuration:** for each layer and for "all layers", passes over completed runs with the
   Wilson 95% interval — `typecheck 41/60 (55%–79%)`.
3. **Per task and configuration:** one row, four layer cells and an overall cell, each `k/n`.
4. **Spread:** the tasks whose overall count is neither `0/n` nor `n/n`, because variance is a
   result.
5. **Mistakes:** rule, pitfall, number of runs, number of tasks — sorted by runs.
6. **Verbatim:** for each of the ten most frequent rules, up to three excerpts with file, line and
   justification, each linked to its `record.json`.
7. **Cost:** median, minimum and maximum of input-side tokens, output tokens, duration and turns
   per run; the batch total.

A percentage never appears without its counts.

## 11. Command line

```
pnpm evals doctor
pnpm evals prepare [--force]
pnpm evals run [--tasks a,b] [--configs none] [--reps 5] [--concurrency 2]
               [--model sonnet] [--batch <id>] [--label <text>] [--dry-run] [--yes]
               [--adapter claude-code|reference] [--solution <name>]
               [--timeout-min 15] [--max-budget-usd 3]
               [--agent-bin <path>] [--agent-config isolated|inherit] [--keep-workspaces]
pnpm evals score --batch <id> [--tasks a,b]
pnpm evals report --batch <id>
```

- `doctor` reports the agent binary, its version, authentication under the run environment, Node,
  npm, the harness home and whether templates are current. It exits non-zero when a real run could
  not start.
- `run --dry-run` prints every run of the matrix with its state (`pending`, `completed`,
  `infra-error`) and the number of agent runs it would launch. It launches nothing.
- `run` with the `claude-code` adapter and more than one run to launch exits with code 2 unless
  `--yes` is given.
- `run --batch <id>` resumes.
- `--adapter reference --solution good` runs the whole pipeline on stored solutions.

## 12. Testing

| Tier | Command | Needs | Covers |
| --- | --- | --- | --- |
| Unit | `pnpm --filter @peakui/evals test` | nothing | Manifest rewriting, CSS comment stripping, the D6 gates, hashing, the ancestor guard, snapshot diff, diagnostic parsing and classification, every shared detector, CSS and DOM helpers, each task's static checks against its reference solutions, the transcript parser on a recorded sample, the Claude Code argument and environment builders, outcome classification, the matrix, resume, the pool, statistics, the summary, redaction, the CLI's cost guard. |
| Solutions | `pnpm --filter @peakui/evals test:solutions` | `pnpm evals prepare` (network, about four minutes the first time) | For every task: `good` passes all four layers with no mistakes; each `bad-*` produces exactly the layer statuses and at least the rules its `expect.json` declares. |
| Smoke | `pnpm evals run --tasks pending-button --reps 1` | an authenticated agent | One real run, once. |

Every task has a known-good and at least one known-bad solution, and the scorer is tested to pass
the first and fail the second for the stated reason, without an agent.

## 13. Open risks

1. **The agent CLI is not authenticated outside the desktop application** on the development
   machine, and it is not on `PATH`. A baseline needs `CLAUDE_CODE_OAUTH_TOKEN` (from
   `claude setup-token`) or `ANTHROPIC_API_KEY`, and `--agent-bin`. Whether `claude auth status`
   reflects an environment token was not verified.
2. **`Bash` is not sandboxed.** The agent can read anything the user can and reach the network.
   The harness records outside access; it does not prevent it. A container is the real fix.
3. **Tool-use event shapes are unverified** (section 3). The smoke run is the check.
4. **Stripped CSS comments** make the import-order task harder than it may be after release, if
   the published stylesheet keeps its contract comment.
5. **The shipped stylesheet names the reference library** in comments. That is a D6 defect in
   `@peakui/styles` itself, outside this work; it is reported, and the pack gate protects only the
   evals.
6. **Staging imitates a release that does not exist.** When the real `exports` rewrite lands, the
   published shape may differ from the staged one (file extensions, entry points).
7. **No interaction in the render layer** (8.4). Validation behavior and press behavior are judged
   by structure.
8. **Five repetitions** separate 0/5 from 5/5 and little else. The interval is printed for that
   reason; a wording decision that rests on 3/5 against 4/5 needs more runs.
9. **Admin-managed Claude Code settings**, if a machine has them, apply to every run.
10. **Cost is estimated, not measured.** Section 14.

## 14. Cost of one baseline

Twelve tasks, five repetitions, one configuration: **60 agent runs**.

No authenticated run could be measured, so the estimate is from structure: a run of this kind is
15 to 30 turns; each turn resends the system prompt and tool definitions (roughly 15k to 20k
tokens) plus a history that grows to 30k–60k. That gives roughly 0.4M to 1.5M input-side tokens per
run, about nine tenths of them cache reads, and 4k to 12k output tokens.

| | Per run | 60 runs |
| --- | --- | --- |
| Input-side tokens (mostly cache reads) | 0.4M – 1.5M | 25M – 90M |
| Output tokens | 4k – 12k | 0.25M – 0.7M |
| Wall clock at concurrency 2 | 3 – 10 min | 1.5 – 5 h |

The hard ceiling is the per-run budget: 60 × `--max-budget-usd 3` = 180 USD. The smoke run's
measured usage replaces this table.

## 15. Not in the first plan

- Configurations `agents-md`, `skill`, `mcp` (contracts in section 9).
- Adapters for other agents.
- Interactive rendered checks.
- A container sandbox.
- The baseline run itself: it is invoked explicitly, with `--yes`, after the plan is complete.
- Fixing the reference-library mentions in `@peakui/styles` comments.

## 16. CodeGraph

First query run for this work, inside `peakui`:

```
$ codegraph explore components
**Exploration: components**

Found 18 symbols across 3 files.

**Blast radius — what depends on these (update/verify before editing)**

- `COMPONENTS_CSS` (packages/styles/src/generator/index.ts:37) — 1 caller in `packages/styles/src/generator/index.ts`; tested via callers: `packages/styles/src/generator/build.test.ts`
- `oklchToLinearSrgb` (packages/styles/src/generator/color.ts:116) — 3 callers in `packages/styles/src/generator/contrast.ts`, `packages/styles/src/generator/color.ts`; tested via callers: `packages/styles/src/generator/contrast.test.ts`, `packages/styles/src/generator/derive.test.ts` +1
```
