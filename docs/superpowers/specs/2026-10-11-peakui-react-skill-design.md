# PeakUI React Consumer Skill — Design

**Date:** 2026-10-11
**Scope:** `peakui` — `skills/peakui-react/` (rewritten), three tasks and one subcommand in `evals/`,
one page in `apps/docs`, gates and tests under `scripts/skills/`
**Status:** design agreed in brainstorming; awaiting review as a written document
**Binding architecture:** `peakui-company/docs/superpowers/specs/2026-10-03-agent-experience-design.md`,
as amended on 2026-10-11 (section 2 lists what this document changes in it)

## 1. Purpose

An AI coding agent working in a **consumer's** project must know how to work with PeakUI
components: find the right one, read its documentation, compose it from its parts, and wire the
styles into the app. The consumer has never seen this repository. Nothing the skill says, runs or
prints may assume knowledge of the monorepo layout, of the process documents under
`docs/superpowers/`, or of the reference library PeakUI is modelled on.

The work is staged:

| Stage | Skill | Covers |
| --- | --- | --- |
| 1 — this document | `peakui-react` | Components: discovery, per-component documentation, composition, forms, overlays, collections, style setup, restyling one component |
| 2 — its own spec, later | a separate theming skill | A project's own theme: tokens, accent colour, dark mode, presets |

Stage 1 does not teach theming. A theming question gets one line in `peakui-react`: read the
`theming` page.

## 2. Decisions

Settled with the project owner on 2026-10-08 … 2026-10-11.

| # | Decision | Value | Why |
| --- | --- | --- | --- |
| S1 | Starting point | Redesign from scratch. `skills/peakui-react` v0.3.0 is a disposable draft and is replaced, not edited. | Owner's choice after the gap audit (section 3.2). Its wording is not carried over; the stand's tasks are. |
| S2 | Readiness | Measured in the stand, on a clean consumer project built from staged tarballs. | Packages are unpublished and the docs site is not deployed; the stand is the only place a consumer's situation exists today. |
| S3 | Source of component facts | Scripts in the skill fetch them from the docs site over the HTTP contract in `peakui-company/docs/ecosystem/docs-site-contract.md`. | Owner's choice over docs inside the npm package and docs bundled in the skill. Keeps the packages untouched and the skill small. Cost: section 13. |
| S4 | Default docs origin | `https://peakui.dev`, overridable with `PEAKUI_DOCS_URL`. | Owner's answer. The override serves the stand, previews and mirrors. |
| S5 | Authoring method | The `skill-creator` loop — baseline, draft, with-skill against baseline, revise — with the stand as the grader. | Owner's recommendation. It agrees with Anthropic's best practices ("build evaluations first"). |
| S6 | Portability | Specification frontmatter fields only; scripts are plain Node. No agent-specific extension. | The skill must load in Claude Code, Codex, Cursor, Copilot and the Skills API alike (section 3.3). |
| S7 | Measured agent | Claude Code, models `sonnet` (authoring), `haiku` and `opus` (final check). | The stand has no other agent; best practices ask for a weak, a balanced and a strong model. |
| S8 | Verification volume | Three composite tasks, one run per task and model, 15–18 runs in total, 2 USD cap per run. | Owner's choice: a skill is being written, not a study. Section 8. |
| S9 | Always-on pointer | A three-line block for `AGENTS.md` / `CLAUDE.md`, documented on the install page, added to a stand project only when a transcript shows the skill was not loaded. | Unforced skill activation measures 41–53% elsewhere (section 3.3); a separate run matrix for it is not worth its cost here. |
| S10 | Install channel | `npx skills add peakui-dev/peakui`, and nothing else in this stage. | It needs only the `skills/peakui-react/` directory and installs for every agent. |
| S11 | Skill set | One skill in this stage. | Focused skills outperform exhaustive bundles (section 3.3); theming is stage 2. |

**Effect on the umbrella architecture**

| Umbrella item | Change |
| --- | --- |
| D4 — skill authoring | The method becomes S5. "Never generated" stays: every line of the skill is hand-written. |
| Section 2, how the skill reads docs | The `.peakui/docs/` snapshot written by the CLI is replaced by S3. The CLI is no longer a dependency of the skill. |
| `/.well-known/agent-skills/` and the skill archive | Demoted from a planned route to optional; not built in this stage. |
| D5, D6, D7, D8, D11, D12 | Unchanged and confirmed. |

## 3. Facts verified before design

### 3.1 The repository, measured 2026-10-08 … 2026-10-11

| Question | Result |
| --- | --- |
| What does the docs site serve? | `GET /api/components` on a local server: `schemaVersion: 1`, 43 components, 8 guides, `library` `@peakui/react` `0.0.0`. All component pages as markdown: 551 KB (83 KB gzipped). The Button page: 16 KB. |
| Is there a public docs origin? | No. `apps/docs` falls back to `http://localhost:3000` outside production; no domain appears in the code. S4 settles it. |
| What can the stand do today? | `pnpm --filter @peakui/evals trial prepare --task <id> --label <name> [--setup <dir>]` builds a workspace from staged tarballs and prints the prompt; `trial score --task <id> --workspace <path>` scores it in four layers and writes findings. There is **no agent adapter, no configuration registry and no batch runner**: the agent is started by hand. `--setup` copies a directory into the workspace before the initial commit and refuses any file naming the reference library. |
| What do the twelve existing tasks cover? | Buttons, text fields and style setup. No overlay, collection, card or multi-control form. |
| Does the rendered layer see overlays? | No. It server-renders static markup; a closed dialog or menu renders nothing. Overlay behaviour can only be checked statically. |
| Does the repository have a licence? | No. |
| What is in `skills/peakui-react` today? | One 127-line `SKILL.md`, version 0.3.0, no `references/`, no `scripts/`. |

### 3.2 Gap audit of v0.3.0

| Finding | Evidence |
| --- | --- |
| Its documentation step cannot run | It reads `.peakui/docs/`, which `npx @peakui/cli agents-md` creates. `peakui-cli` is an empty directory. Only the fallback — read types in `node_modules` — ever executes. |
| Its coverage is nine components of 43 | Written on 2026-10-03; its description and body name buttons, fields, forms and spinners only. |
| Its claims are not reproducible | The commit message says it was verified on six tasks with one weaker model; no result is committed and the stand has no way to install a skill except by hand. |
| Its triggering was never measured | — |
| The same rules live in three places | The skill body, the guides `composition.mdx` / `styling.mdx` / `quick-start.mdx`, and the hand-written header of `/llms.txt`. Nothing compares them. |

### 3.3 Other libraries and the standard

Collected on 2026-10-08 by two research agents reading the repositories and vendor documentation.
Rows marked † rest on a secondary source and must not be cited onward without re-checking.

| Source | Finding used here |
| --- | --- |
| shadcn/ui `skills/shadcn` | Short rule list in `SKILL.md`, each rule linking to a file of incorrect/correct pairs; a task-to-file table; evals shipped beside the skill. Its inline `` !`npx shadcn@latest info --json` `` broke skill loading in monorepos and drew security complaints (issues #11271, #11269). |
| Expo `expo/skills` | A script in the skill inspects the installed package and reports what that version offers. |
| Ant Design `ant-design-cli` | Deterministic `doctor` and `lint` commands behind the skill; JSON output everywhere. |
| Nuxt UI `skills/nuxt-ui` | The skill carries when and how to build; the API reference comes from elsewhere. A task-to-references routing table. |
| Adobe React Spectrum | Skills generated from the docs build; a CI job posts the skill diff on every pull request. |
| Vercel `web-design-guidelines`, HeroUI `heroui-react` | Fetching content from a site at run time is the cheapest pattern and the one that attracts staleness and security complaints (vercel-labs/agent-skills #91). |
| Agent Skills specification, agentskills.io | Frontmatter: `name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools` (experimental). No field was added in 2026. Body under 500 lines; references one level deep. |
| Agent documentation pages † | `.agents/skills/` is read by Codex, Cursor, Copilot, Gemini CLI, Zed and others; Claude Code reads `.claude/skills/`. `npx skills add` installs into both. No agent scans `node_modules`. |
| Skills API and claude.ai uploads † | A frontmatter key outside the specification is rejected. |
| Vercel, 2026-01-27 | A skill was not invoked in 56% of eval runs; an explicit instruction to use it raised the pass rate from 53% to 79%. Vendor-run. |
| Tessl, 2026-04-15 † | 41% skill activation unforced against 98% forced, over 2,286 tasks. |
| SkillsBench, arXiv 2602.12670 † | Focused skills of three modules or fewer beat exhaustive bundles. |
| Anthropic, "Skill authoring best practices" | Evaluations before text; only context the model lacks; one default with an escape hatch; scripts that handle their own errors; a validate–fix–repeat loop; tests on Haiku, Sonnet and Opus. |
| Anthropic `skill-creator` | With-skill against baseline on a few realistic prompts; read the transcripts, not only the outputs; explain why instead of shouting MUST; a description states what the skill does and when to use it. |

## 4. Architecture

Everything the skill tells an agent is one of two kinds of knowledge, and each kind has one home.

| Kind | Examples | Home | How it reaches the agent |
| --- | --- | --- | --- |
| Stable contract — changes rarely, and getting it wrong is silent | CSS import order, `onPress`, a field is a root with sibling parts, `render` instead of `as`, the server/client boundary | The skill, hand-written | `SKILL.md` and `references/` |
| Versioned facts | props, variants, parts, examples, CSS variables | The docs site | `scripts/` → `/api/components` → `<page>.md` |

```
Consumer project
  AGENTS.md / CLAUDE.md ── optional pointer, always in context
  .agents/skills/peakui-react/   (and .claude/skills/ for Claude Code)
     SKILL.md      workflow · rules the type-checker misses · task → what to read
     references/   stable contract, one level deep
     scripts/      Node, no dependencies: page index · page as markdown · setup check
          │  GET only: the docs origin, and for --source the repository's raw file host
          ▼
Docs site ── /api/components (schemaVersion 1) · <page>.md
```

The skill is a client of the docs site in the sense of the docs site contract. It discovers pages
through `/api/components` and reads a page through its `markdownUrl`. It never parses `/llms.txt`.

## 5. The skill

### 5.1 Layout

```
skills/peakui-react/
  SKILL.md             target 200 lines or fewer; the specification's limit is 500
  references/
    setup.md           install, CSS import order, @source, the server/client boundary
    composition.md     compound parts, fields, render, collections, overlays
    styling.md         className and state selectors, BEM classes, component variables, tv({extend})
  scripts/
    docs.mjs
    doctor.mjs
    lib.mjs
```

The three reference files are a starting hypothesis. A file exists only if the baseline showed
failures in its area; a file that passes about 300 lines is split. Every reference is linked
directly from `SKILL.md`; a file longer than 100 lines opens with a table of contents. Nothing else
lives in the directory: tests, evals and journals stay outside it, because the whole directory is
copied into the consumer's project.

### 5.2 Shape of `SKILL.md`

```markdown
# PeakUI React
<one paragraph: what PeakUI is and why habits from other libraries produce code that fails here>

## Workflow
1. Check the project      → node scripts/doctor.mjs
2. Read the pages         → node scripts/docs.mjs list | <name> [<name>…]
3. Write it the PeakUI way
4. Verify                 → the project's type-check; its build when CSS or setup changed

## Rules the type-checker will not catch
<at most about ten rules: one line of why, then a minimal correct example or a link into references/>

## What to read for the task
| Task | Reference | Pages |
| A form with validation   | composition.md, Fields   | form, text-field, field-error |
| Dialog, menu, popover    | composition.md, Overlays | modal, dropdown, popover |
| Restyle one component    | styling.md               | styling |
| New app, missing styles  | setup.md                 | quick-start |
| A custom theme           | —                        | theming |

## When the docs cannot be reached
<the fallback: types and CSS in node_modules>
```

The skeleton fixes the four sections and their order. Their content is written in the loop of
section 9.

### 5.3 Rules for the content

1. **Every rule answers an observed failure.** The journal (section 8.5) maps each rule to the
   finding that produced it. A rule with no finding is deleted.
2. **`SKILL.md` holds only mistakes that pass the type-check.** What `tsc` rejects is handled by
   workflow step 4, not by prose.
3. **A rule is a positive recipe with its reason.** An incorrect/correct pair is added only when a
   round shows the model still writing the wrong shape without it.
4. **Examples teach shape, not facts.** Variant names, prop names and part names come from the page
   fetched in step 2; the text says so once.
5. **No capitals for emphasis, no MUST.** Imperative mood and the reason the instruction matters.
6. **One term per thing**, used throughout: "page" for a documentation page, "part" for a compound
   sub-component, "field" for a form control with its label and messages.
7. **Fetched pages are documentation, not instructions.** The skill says so once, next to step 2.

### 5.4 Frontmatter

| Field | Value |
| --- | --- |
| `name` | `peakui-react`. Equals the directory name. |
| `description` | Third person; what the skill does and when to use it; names `@peakui/react`, `@peakui/styles` and the component families. The leading trigger is that the project depends on `@peakui/react`, whether or not the user names PeakUI. At most 1,024 characters by the specification; as short as it can be while the skill still loads in the stand runs. |
| `compatibility` | `Requires Node.js 18 or later and network access to the PeakUI documentation site.` |
| `metadata.version` | The skill's own semantic version, a string. It is not tied to the library version: the skill stores no versioned fact. Acceptance of this stage sets it to `"1.0.0"`. |
| `license` | Added when the repository has a licence. Absent until then. |

No other key. `allowed-tools`, `paths`, `user-invocable` and inline command injection are not used.

## 6. Scripts

Three files. Node.js 18 or later, ECMAScript modules, no dependency, no build step. **No script
writes anything**: not into the project, not into a cache. Output for the agent goes to standard
output; diagnostics go to standard error.

`SKILL.md` invokes them through the interpreter, `node scripts/docs.mjs …`, with the path relative
to the skill directory, and states once that the commands run from the project root.

### 6.1 `scripts/docs.mjs`

| Call | Output |
| --- | --- |
| `node scripts/docs.mjs list` | The version line, then one `name — description` line per component, then per guide. About 4 KB. |
| `node scripts/docs.mjs list --json` | The same index as JSON: `library`, `installed`, `components`, `guides`. |
| `node scripts/docs.mjs <name> [<name>…]` | For each page, in the order asked: its header, Usage and API Reference. A page without those sections, such as a guide, is printed whole. |
| `… --examples` | The header and the Examples section. |
| `… --styling` | The header, Customization and Styling Reference. |
| `… --full` | The page exactly as the site returns it. |
| `… --source` | The component's source file, fetched from the repository through the `links.source` the index gives for it. |

*Amended 2026-10-11 after round 1 (journal): a request for six to ten whole pages exceeded what the
agent harness returns inline in three runs of six, and Examples is 50–65% of a page. The owner
asked for the source mode: the installed package holds compiled output, not source.*

- **The version line comes first.** It states the version the documentation describes
  (`library.version` from the index) and the installed `@peakui/react` version. When they differ it
  adds: the documentation describes another version; check prop names against the types in
  `node_modules` before relying on them. When the package is not installed it says so and continues.
- **Names** resolve by the contract's rule: the `name` field, components before guides. `Button`
  and `TextField` are accepted and normalised to `button` and `text-field`.
- **`--source` reads the `main` branch.** The repository has no release tags yet, so the first
  line of the output says the file may be newer than the version in use, and names the installed
  version. With tags, the script moves to the tag of the installed version. A file that cannot be
  fetched exits 1 with a message that the repository may not be public.
- **An unknown name** exits 1 and prints the closest names: `Unknown page "buton". Closest: button,
  button-group. Run "list" to see every page.` Pages that did resolve are still printed.

### 6.2 `scripts/doctor.mjs`

Run at the start, to learn the project, and again after any change to CSS or setup. It reads files
only; it makes no network request.

It prints the context — versions of `@peakui/react`, `@peakui/styles`, React and Tailwind CSS, the
framework it recognised, the CSS entry file it found — then the findings, each as *what — where
(`file:line`) — how to fix*.

| Check | Finding when it fails |
| --- | --- |
| `@peakui/react` and `@peakui/styles` resolve from the project | Which package is missing and the install command. |
| Peer dependencies resolve; React is 19 or later; Tailwind CSS is 4 or later | The package, the version found, the version required. |
| A CSS file imports `@peakui/styles/css` | No file does: the styles are never loaded. |
| In that file `tailwindcss` is imported before `@peakui/styles/css` | The two lines and the order they must be in. |
| No TypeScript or JavaScript file imports `@peakui/styles/css` | The file and line, and that the import belongs in the CSS entry file. |

Mistakes in component code — `onClick` on a `Button`, a `color` prop — are out of the first
version: without a syntax tree they are pattern matches with false positives. A check is added only
when a stand round shows a silent failure a script could have caught.

### 6.3 `scripts/lib.mjs`

Shared by the two scripts.

| Concern | Behaviour |
| --- | --- |
| Origin | `PEAKUI_DOCS_URL` when set, otherwise `https://peakui.dev`. |
| Source host | `PEAKUI_SOURCE_URL` when set, otherwise `https://raw.githubusercontent.com/`; used by `--source` only. |
| Resolving URLs | Only the path of `markdownUrl` is used, resolved against the script's own origin, as the contract requires. |
| `schemaVersion` | A value above 1 stops the script with: the documentation index is newer than this skill understands; update the skill. |
| Timeout and retry | 15 seconds per request — pages are static and cached, so this allows for a slow connection — and one retry, because a transient failure usually clears on the second attempt. |
| Redirects | A redirect to another origin is an error, not a hop. |
| Request identity | `User-Agent: peakui-react-skill/<version>`. No query parameter, no project data. |
| The project | `process.cwd()`. The installed package is resolved upward from it, so workspaces and symlinked `node_modules` work. `--project <dir>` overrides it. |

### 6.4 Exit codes

| Code | `docs.mjs` | `doctor.mjs` |
| --- | --- | --- |
| 0 | Every requested page printed | No finding |
| 1 | Unknown page name, or wrong usage | At least one finding |
| 2 | The site could not be reached, or the index did not match the contract | The directory is not a project: no `package.json` |

On exit code 2 `docs.mjs` prints the fallback: the types are in `node_modules/@peakui/react/dist/`
and the class names in `node_modules/@peakui/styles/components/<name>.css`. When the package is not
installed either, it says so and names the install command instead.

## 7. Install and pointer

### 7.1 Install

```bash
npx skills add peakui-dev/peakui
```

The implementation verifies the channel by installing from a local path into an empty project and
checking that `.agents/skills/peakui-react/` and `.claude/skills/peakui-react/` both hold the skill.
It becomes public when the repository does.

### 7.2 Pointer

A block the consumer pastes into `AGENTS.md` and `CLAUDE.md`:

```markdown
<!-- peakui:start -->
This project uses PeakUI (`@peakui/react`, `@peakui/styles`).
Before writing or changing UI code, load the `peakui-react` skill and follow it.
Without skills: read https://peakui.dev/llms.txt first.
<!-- peakui:end -->
```

- The wording above is a draft. A stand round may change it.
- The block points; it repeats no rule.
- The markers let a future `peakui setup` replace the block idempotently. Until then the consumer
  pastes it by hand.
- The canonical text is the code block on the docs page of 7.3. The stand reads it from that page.

### 7.3 Docs page

`apps/docs/content/docs/en/react/getting-started/(ui-for-agents)/agent-skills.mdx`: what the skill
does, the install command, the pointer block, how to update, `PEAKUI_DOCS_URL` for mirrors, and a
plain statement of what the scripts do on the network — `GET` requests to the documentation origin
and, for `--source`, to the repository's raw file host; nothing sent. The page follows the `peakui-docs` contributor skill and enters `/api/components` and
`/llms.txt` automatically.

## 8. Verification

### 8.1 Tasks

Three composite tasks are added to `evals/tasks/`. Each has an overlay, a reference solution and
checks, written to the conventions of the existing tasks. The twelve existing tasks stay untouched.

| Id | Fixture | What the agent builds | What the checks cover |
| --- | --- | --- | --- |
| `profile-settings` | `vite-app` | A profile settings page in a card: required text fields with validation messages, a multi-line field, a switch, a single-choice group, a submit button that shows loading, a link that looks like a button | fields as root plus parts, React Aria prop names, button variants and pending state, card composition, a real link with button styling |
| `team-members` | `vite-app` | A member list: an actions menu on every row, a confirmation dialog before removal, a notification after it, a tooltip on the icon-only trigger | overlays, collections, controlled open state, accessible name of an icon-only control |
| `first-setup-action` | `next-app` | PeakUI wired into an app where it is installed but not set up, and a server-rendered page with an interactive button | CSS import order, no provider, the server/client boundary |

- **Prompts speak as a consumer would.** They describe the screen, not the components, and name no
  library other than PeakUI.
- **Every check carries the part it belongs to** in its id (`form.required-field`,
  `dialog.controlled-open`), so a failed composite task still says which part broke.
- **`team-members` is checked statically for its overlays.** The rendered layer sees the closed
  state only (3.1); it asserts the rows and the triggers.
- **Component facts in the reference solutions come from the docs pages**, read before the task is
  written.

### 8.2 Running an agent

`trial` gains one subcommand:

```
trial run --task <id> --workspace <path> --model <alias> [--max-budget-usd <n>]
```

It starts Claude Code headless in a prepared workspace, with the isolation of sections 6.2 and 6.3
of the evals design (a throwaway configuration directory, project settings only, no MCP server),
the tools `Bash, Read, Edit, Write, Glob, Grep` plus `Skill`, and `PEAKUI_DOCS_URL` in the
environment. It saves the raw transcript beside the workspace and prints: whether the `Skill` tool
loaded `peakui-react`, how many times each script ran, the turn count and the cost the CLI
reported. It does not score; `trial score` does.

This is deliberately not the adapter, registry and batch runner of the evals design. Those remain
deferred.

**Starting states.** A helper builds two setup directories for `trial prepare --setup`:

| Setup | Contents |
| --- | --- |
| `skill` | `.claude/skills/peakui-react/`, a copy of `skills/peakui-react/` |
| `skill-pointer` | the same, plus `CLAUDE.md` and `AGENTS.md` holding the pointer block of 7.2 |

**Docs origin for runs.** A production build of `apps/docs` made with
`NEXT_PUBLIC_SITE_URL=https://peakui.dev`, served locally with `next start`; `PEAKUI_DOCS_URL`
points at the local address. Pages therefore show the links a consumer will see.

### 8.3 Runs and budget

| Step | Setup | Model | Runs |
| --- | --- | --- | --- |
| Baseline | none | `sonnet` | 3 |
| Authoring rounds, two or three | `skill` | `sonnet` | 6–9 |
| Final check | `skill` | `haiku`, `opus` | 6 |
| **Total** | | | **15–18** |

- Cap per run: 2 USD. Ceiling for the table: 36 USD.
- **Stop after the baseline.** The measured cost and duration of the three baseline runs are
  reported to the owner before any further run.
- **Pointer rule.** When a transcript shows the skill was not loaded, that task is run again with
  the `skill-pointer` setup. If any model needs the pointer, the install page presents it as a
  required step instead of a recommended one.
- One run per task does not separate a pattern from chance. A task whose result changes between
  rounds for no reason in the skill is named in the journal and run again alone.

### 8.4 Readiness

The stage is done when all of these hold.

1. Every gating finding that failed in the baseline passes with the skill, on `sonnet`, in the last
   round.
2. No gating finding that passed in the baseline fails with the skill.
3. On `haiku` and `opus` all three tasks pass the type-check and build layers. Every other failed
   gating finding is listed in the journal with the owner's decision: fix or accept.
4. In every with-skill run the transcript shows the skill loaded and `docs.mjs` called. Which setup
   achieved it is recorded.
5. The gates of section 10 pass.
6. The owner has read the skill and the run results and accepts them.

If the baseline passes a task outright, that task discriminates nothing. It is recorded as such and
no skill text is written for it.

### 8.5 Journal

`evals/results/peakui-react/journal.md`, committed. One table per round — task, layer statuses,
failed finding ids, skill loaded or not, script calls, turns, cost — and one table mapping each
rule of the skill to the finding that justifies it. Transcripts are not committed.

## 9. Authoring process

1. Write the three tasks and prove each with its reference solution through `trial score`.
2. Run the baseline. Read every transcript; record what the agent wrote wrong and what it said
   before writing it. Stop and report the cost.
3. Write the scripts and their tests. They do not depend on the baseline.
4. Draft `SKILL.md` and the references from the baseline findings only.
5. Run the round. Read the transcripts, not only the scores: which reference was never opened,
   where a script call failed, what the agent did that led nowhere. A reference nobody opened is
   either linked badly or unnecessary.
6. The owner reviews the journal and the changed files. Revise. Repeat from 5 until the readiness
   conditions for `sonnet` hold or a round brings no progress.
7. Run the final check on `haiku` and `opus`.
8. The owner reviews the skill text. Set `metadata.version` to `"1.0.0"`.

**Optional, on the owner's word, after step 8:** the `skill-creator` description optimiser — twenty
queries, ten that should trigger and ten near misses (a project on another component library, React
Aria without PeakUI, a non-UI task in a React app, contributor work inside the library itself),
approved by the owner before the run.

## 10. Gates

Offline, on every pull request, as `node --test` files under `scripts/skills/` picked up by the
existing `pnpm test:ai`. Agent runs are never part of continuous integration.

| Gate | Asserts |
| --- | --- |
| Validity | Frontmatter holds only specification fields; `name` equals the directory; `description` is 1–1,024 characters; the body is under 500 lines; every relative link resolves to a file in the skill and no reference links to another reference; the default origin in `lib.mjs` is `https://peakui.dev`. |
| Compilation | Every `tsx` block in `SKILL.md` and `references/` type-checks against the workspace packages, and every `css` block parses and imports only specifiers `@peakui/styles` exports. No block is exempt. This is the guard against the skill drifting from the library. |
| No internal traces | No file in the skill directory names the reference library, a path inside this monorepo, a process document, or contains non-Latin text. |
| Scripts | Unit tests against a local HTTP server shaped like the contract — index, a page, a 404 with an empty body, `schemaVersion: 2`, a stalled response, a redirect to another origin — and against fixture directories for each `doctor` check. |

## 11. What happens to v0.3.0

The new skill replaces the directory's contents in the change that introduces it. Nothing of v0.3.0
is kept beside it; its history stays in git.

## 12. Not in this stage

- The theming skill (stage 2).
- Plugin manifests for any agent, the `/.well-known/agent-skills/` index and the skill archive.
- `peakui-cli`, `peakui-mcp`, telemetry, package publication, deployment of the docs site.
- Documentation inside the npm packages.
- The evals design's adapter interface, configuration registry, batch runner and statistics.
- Any change to the hand-written header of `/llms.txt`. It repeats some rules for agents without
  the skill; the duplication is known and left as it is.

Follow-up outside this repository: `peakui-company/docs/ecosystem/docs-site-contract.md` names the
CLI and the MCP servers as clients. The skill is a third; one sentence there records it.

## 13. Open risks

| Risk | Consequence | Handling |
| --- | --- | --- |
| The docs describe the latest version, the consumer may run another | An agent uses a prop that its installed version lacks | The version line of 6.1; the type-check of workflow step 4. Not eliminated: it is the price of S3. |
| The skill is unusable for a real consumer until `https://peakui.dev` is deployed | — | Accepted under S2. The stage is measured in the stand. |
| The agent's sandbox blocks network access | `docs.mjs` exits 2 | The fallback of 6.4. |
| One run per task | A pass may be luck | The rule in 8.3; the owner's review in 8.4. |
| A strong model may pass the baseline without help | The skill shows no gain on it | 8.4, last paragraph. The final check still covers the weak model, where the gain is expected. |
| Overlay behaviour is checked only statically | A dialog that compiles but does not open passes | Recorded here; an interactive layer is deferred in the evals design. |
| An agent runs a script from the wrong directory | A failed call and a wasted turn | `--project`; observed in transcripts in every round. |

## 14. CodeGraph

First query run for this work, inside `peakui`, on 2026-10-08:

```
$ pnpm exec codegraph explore "consumer skill peakui-react docs markdown route"
**Exploration: consumer skill peakui-react docs markdown route**

Found 31 symbols across 5 files.

**Blast radius — what depends on these (update/verify before editing)**

- `markdownUrl` (apps/docs/src/lib/llms-utils.ts:44) — 2 callers in `apps/docs/src/app/api/components/route.ts`; no tests found within 3 caller hops
- `markdownResponse` (apps/docs/src/app/agent-markdown/route.ts:14) — 1 caller in `apps/docs/src/app/agent-markdown/route.ts`; tested via callers: `apps/docs/tests/agent-markdown.test.ts`
```

The index held 825 files at the time. This design changes neither symbol: the skill consumes the
routes they implement.
