# PeakUI React Consumer Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `skills/peakui-react` with a redesigned consumer skill whose scripts fetch
component documentation from the docs site, and verify it in the stand on three composite tasks.

**Architecture:** The skill holds the stable contract by hand (`SKILL.md`, `references/`) and three
dependency-free Node scripts that read versioned facts from the docs site over its HTTP contract.
The stand gains three composite tasks and two `trial` subcommands that install the skill into a
clean consumer project and run Claude Code in it. Offline gates keep the skill valid, compiling and
free of internal traces.

**Tech Stack:** Node.js 18+ ESM scripts with `node:test`; TypeScript run natively by Node 22 in
`evals/` with vitest; Next.js + Fumadocs MDX in `apps/docs`; Claude Code CLI headless.

**Spec:** `docs/superpowers/specs/2026-10-11-peakui-react-skill-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Branch:** work on `feat/peakui-react-skill`, never on `main`.
- **CodeGraph:** run `pnpm codegraph:sync` at the start of each task and query before reading
  code; quote the first query's result in the task summary.
- **Language:** every file written is English. Existing Russian content is left alone.
- **Consumer text names nothing internal.** No file under `skills/peakui-react/`, no task prompt,
  no overlay and no docs page may name the reference library, another component library, a path
  inside this monorepo, or a process document. Task prompts must also pass `ANSWER_LEAKS` in
  `evals/tests/tasks.gate.test.ts`.
- **Skill scripts:** Node.js 18 or later, `.mjs`, no dependency, no build step, no file writes.
  Agent output to stdout, diagnostics to stderr.
- **Default docs origin:** `https://peakui.dev`. Override: `PEAKUI_DOCS_URL`.
- **Skill frontmatter:** only `name`, `description`, `compatibility`, `metadata`. `name` is
  `peakui-react`. No `license` until the repository has one.
- **Docs page:** written through the `peakui-docs` contributor skill.
- **Agent runs cost money.** Cap `--max-budget-usd 2` per run. No agent run outside Tasks 10–12,
  and none beyond the counts those tasks state.
- **Pipeline stage 5 is off:** no changeset.
- **Commits:** Conventional Commits, one per task unless a task says otherwise.

## Review Focus

Conditions the spec implies and a consumer will meet. Each is pinned by a test in the task named.

1. `PEAKUI_DOCS_URL` with a trailing slash or a path prefix (`https://mirror.test/peakui/`) — pages
   still resolve under that prefix. Task 1.
2. The script runs from a workspace package whose `@peakui/react` is hoisted to the workspace root,
   or from a subdirectory of the project — the installed version is still found. Task 1.
3. The origin answers `200` with HTML (a proxy or captive portal) instead of the JSON index — exit
   code 2 with the contract message, not a parse stack trace. Task 2.
4. The index lists a page whose `.md` returns `404` with an empty body — the other requested pages
   are still printed and the exit code is 1. Task 2.
5. The CSS entry uses `@import url("tailwindcss")`, an `@import … layer(…)` suffix, comments
   between imports, or `@import "@peakui/styles"` instead of `/css` — `doctor` still recognises
   both imports and their order. Task 3.

---

## File Structure

```
skills/peakui-react/
  SKILL.md                     rewritten (Task 9 skeleton, Task 11 content)
  references/setup.md          Task 11, only if the baseline calls for it
  references/composition.md    Task 11, same condition
  references/styling.md        Task 11, same condition
  scripts/lib.mjs              Task 1 — origin, fetch, contract, name resolution, installed version
  scripts/docs.mjs             Task 2 — `list` and page output
  scripts/doctor.mjs           Task 3 — project context and setup findings
scripts/skills/
  helpers.mjs                  Task 1 — contract-shaped test server, temp project builder
  lib.test.mjs                 Task 1
  docs.test.mjs                Task 2
  doctor.test.mjs              Task 3
  skill.gate.test.mjs          Task 9 — validity, compilation, no internal traces
evals/
  tasks/profile-settings/      Task 4 — task.ts, overlay/, solutions/
  tasks/team-members/          Task 5
  tasks/first-setup-action/    Task 6
  tasks/index.ts               Tasks 4–6
  src/agent/claude.ts          Task 7 — argv, environment, transcript summary
  src/setup.ts                 Task 7 — builds the `skill` and `skill-pointer` setup directories
  scripts/trial.ts             Task 7 — `setup` and `run` subcommands
  tests/agent.test.ts          Task 7
  tests/setup.test.ts          Task 7
  results/peakui-react/journal.md   Tasks 10–12
apps/docs/content/docs/en/react/getting-started/
  (ui-for-agents)/agent-skills.mdx  Task 8
  meta.json                         Task 8
```

---

### Task 1: `lib.mjs` — the docs site client

**Files:**
- Create: `skills/peakui-react/scripts/lib.mjs`
- Create: `scripts/skills/helpers.mjs`
- Test: `scripts/skills/lib.test.mjs`

**Interfaces:**
- Produces, from `lib.mjs`:
  - `DEFAULT_ORIGIN = "https://peakui.dev"`, `SKILL_VERSION = "0.9.0"`, `SUPPORTED_SCHEMA = 1`,
    `REQUEST_TIMEOUT_MS = 15_000`, `RETRIES = 1`
  - `class DocsError extends Error` with `code: "unreachable" | "contract" | "not-found"`
  - `resolveOrigin(env: Record<string, string | undefined>): URL` — always ends with `/`
  - `fetchText(url: URL, options?: {fetchImpl?: typeof fetch, timeoutMs?: number}): Promise<string>`
  - `fetchIndex(origin: URL, options?): Promise<{library: {name: string, version: string}, components: Entry[], guides: Entry[]}>`
    where `Entry` is `{name, title, description, markdownUrl}`
  - `normalizeName(name: string): string`
  - `resolvePage(index, name: string): Entry | undefined` — components before guides
  - `closestNames(index, name: string, limit?: number): string[]` — default limit 3
  - `pageUrl(origin: URL, entry: Entry): URL`
  - `splitProjectFlag(argv: string[], cwd: string): {project: string, rest: string[]}`
  - `installedVersion(project: string, packageName: string): string | undefined`
  - `versionLine(docsVersion: string, installed: string | undefined): string`
- Produces, from `helpers.mjs`:
  - `startDocsServer(routes: Record<string, {status?: number, body?: string, headers?: Record<string, string>, delayMs?: number}>): Promise<{origin: string, close(): Promise<void>}>`
  - `makeProject(files: Record<string, string>): string` — writes the files into a fresh directory
    under `os.tmpdir()` and returns its path
  - `SAMPLE_INDEX` — an index object in the contract's shape with components `button`,
    `button-group`, `text-field` and guide `quick-start`, built for origin `https://docs.example.test`

- [ ] **Step 1: Write `helpers.mjs`** to the interface above. The server uses `node:http`, listens
  on port 0 and answers `404` with an empty body for any route not listed.

- [ ] **Step 2: Write the failing tests** in `scripts/skills/lib.test.mjs`:

```js
test("resolveOrigin: default, override, trailing slash", () => {
  assert.equal(resolveOrigin({}).href, "https://peakui.dev/");
  assert.equal(resolveOrigin({PEAKUI_DOCS_URL: "http://localhost:3100"}).href, "http://localhost:3100/");
  assert.equal(resolveOrigin({PEAKUI_DOCS_URL: "https://mirror.test/peakui"}).href, "https://mirror.test/peakui/");
});
test("resolveOrigin: a malformed override throws a contract error naming the variable", () => {
  assert.throws(() => resolveOrigin({PEAKUI_DOCS_URL: "not a url"}), /PEAKUI_DOCS_URL/);
});
test("pageUrl takes the path of markdownUrl and keeps the origin's prefix", () => {
  const entry = {markdownUrl: "https://docs.example.test/en/docs/react/components/button.md"};
  assert.equal(pageUrl(new URL("http://localhost:3100/"), entry).href,
    "http://localhost:3100/en/docs/react/components/button.md");
  assert.equal(pageUrl(new URL("https://mirror.test/peakui/"), entry).href,
    "https://mirror.test/peakui/en/docs/react/components/button.md");
});
test("normalizeName", () => {
  assert.equal(normalizeName("Button"), "button");
  assert.equal(normalizeName("TextField"), "text-field");
  assert.equal(normalizeName("text-field"), "text-field");
  assert.equal(normalizeName(" ButtonGroup "), "button-group");
});
test("resolvePage and closestNames", () => {
  assert.equal(resolvePage(SAMPLE_INDEX, "TextField").name, "text-field");
  assert.equal(resolvePage(SAMPLE_INDEX, "quick-start").name, "quick-start");
  assert.equal(resolvePage(SAMPLE_INDEX, "buton"), undefined);
  assert.deepEqual(closestNames(SAMPLE_INDEX, "buton"), ["button", "button-group"]);
});
test("fetchIndex: schemaVersion 2 is a contract error telling the user to update the skill", async () => { /* route /api/components → {...SAMPLE_INDEX, schemaVersion: 2}; rejects with code "contract", message /update the skill/i */ });
test("fetchIndex: an HTML body is a contract error", async () => { /* body "<html>", status 200 → code "contract" */ });
test("fetchText: a stalled response times out as unreachable after one retry", async () => { /* delayMs 200, timeoutMs 50 → code "unreachable"; the server saw exactly 2 requests */ });
test("fetchText: a redirect to another origin is unreachable, not followed", async () => { /* 302 Location: https://elsewhere.test/ → code "unreachable", message names the redirect */ });
test("fetchText: 404 is not-found and is not retried", async () => { /* 1 request */ });
test("fetchText sends the skill user agent and no query string", async () => { /* header equals `peakui-react-skill/${SKILL_VERSION}` */ });
test("installedVersion resolves upward from a subdirectory and from a workspace package", () => {
  const root = makeProject({
    "package.json": "{}",
    "node_modules/@peakui/react/package.json": '{"name":"@peakui/react","version":"1.2.0","exports":{"./package.json":"./package.json"}}',
    "packages/web/package.json": "{}",
    "src/pages/.keep": "",
  });
  assert.equal(installedVersion(join(root, "packages/web"), "@peakui/react"), "1.2.0");
  assert.equal(installedVersion(join(root, "src/pages"), "@peakui/react"), "1.2.0");
  assert.equal(installedVersion(root, "@peakui/styles"), undefined);
});
test("versionLine", () => {
  assert.match(versionLine("1.5.0", "1.5.0"), /1\.5\.0/);
  assert.match(versionLine("1.5.0", "1.2.0"), /another version.*node_modules/s);
  assert.match(versionLine("1.5.0", undefined), /not installed/);
});
test("splitProjectFlag", () => {
  assert.deepEqual(splitProjectFlag(["list", "--project", "/a"], "/b"), {project: "/a", rest: ["list"]});
  assert.deepEqual(splitProjectFlag(["button"], "/b"), {project: "/b", rest: ["button"]});
});
```

Fill the four commented tests with `startDocsServer`; each asserts exactly what its comment states.

- [ ] **Step 3: Run them to verify they fail**

Run: `node --test scripts/skills/lib.test.mjs`
Expected: FAIL — `lib.mjs` does not exist.

- [ ] **Step 4: Implement `lib.mjs`** to the interface.

  - `fetchText` uses `redirect: "manual"`; a `3xx` whose `Location` resolves to the same origin is
    followed once, any other is `unreachable`.
  - `closestNames` ranks by Levenshtein distance, ties by name, and keeps names within distance 3
    or sharing the query as a prefix.
  - `installedVersion` walks up from `project` reading
    `node_modules/<packageName>/package.json`; it does not use `require.resolve`, so a package
    whose `exports` hides `package.json` still resolves.
  - Each constant carries a one-line comment giving its reason (spec 6.3).

- [ ] **Step 5: Run the tests**

Run: `node --test scripts/skills/lib.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/peakui-react/scripts/lib.mjs scripts/skills/helpers.mjs scripts/skills/lib.test.mjs
git commit -m "feat(skills): docs site client for the peakui-react scripts"
```

---

### Task 2: `docs.mjs` — page index and pages

**Files:**
- Create: `skills/peakui-react/scripts/docs.mjs`
- Test: `scripts/skills/docs.test.mjs`

**Interfaces:**
- Consumes: everything `lib.mjs` produces (Task 1); `startDocsServer`, `makeProject`, `SAMPLE_INDEX`.
- Produces: `main(argv: string[], io: {env, cwd: string, stdout: {write(s: string): void}, stderr: {write(s: string): void}, fetchImpl?: typeof fetch}): Promise<number>` — the exit code. The file calls `main` with the process's own values when run directly.

- [ ] **Step 1: Write the failing tests.** Each runs `main` against `startDocsServer` with
  `env.PEAKUI_DOCS_URL` set to the server and collects stdout and stderr in arrays.

| Test name | Input | Asserts |
| --- | --- | --- |
| `list prints the version line, then components, then guides` | `["list"]` | exit 0; first stdout line matches `/@peakui\/react/`; `button — ` line precedes `quick-start — ` line; one line per entry |
| `list --json` | `["list", "--json"]` | exit 0; stdout parses; keys are exactly `library`, `installed`, `components`, `guides` |
| `pages print in the order asked, exactly as served` | `["text-field", "Button"]` | exit 0; stdout contains the `text-field` body before the `button` body, each byte-identical to the served body |
| `an unknown name exits 1, names the closest pages, and still prints the rest` | `["buton", "button"]` | exit 1; stderr is `Unknown page "buton". Closest: button, button-group. Run "list" to see every page.`; stdout contains the `button` body |
| `a listed page whose markdown is gone exits 1 and still prints the rest` | `["button", "text-field"]`, no route for `text-field.md` | exit 1; stderr names `text-field`; stdout contains the `button` body |
| `no argument is wrong usage` | `[]` | exit 1; stderr contains `usage:` |
| `an unreachable site exits 2 and prints the fallback` | server closed before the call | exit 2; stderr contains `node_modules/@peakui/react/dist/` and `node_modules/@peakui/styles/components/` |
| `an HTML index exits 2 with the contract message` | `/api/components` → `<html>` | exit 2; stderr does not contain `SyntaxError` or `at ` stack frames |
| `the version line warns when the installed version differs` | project with `@peakui/react` 1.2.0, index version 1.5.0 | first stdout line matches `/another version/` |

- [ ] **Step 2: Run to verify they fail**

Run: `node --test scripts/skills/docs.test.mjs`
Expected: FAIL — `docs.mjs` does not exist.

- [ ] **Step 3: Implement `main`.** Usage text:

```
usage:
  node scripts/docs.mjs list [--json] [--project <dir>]
  node scripts/docs.mjs <name> [<name>…] [--project <dir>]
```

The version line is the first line of stdout in every successful mode except `--json`, where the
same facts are the `library` and `installed` keys.

- [ ] **Step 4: Run the tests**

Run: `node --test scripts/skills/docs.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/peakui-react/scripts/docs.mjs scripts/skills/docs.test.mjs
git commit -m "feat(skills): docs.mjs lists pages and prints them as markdown"
```

---

### Task 3: `doctor.mjs` — project context and setup findings

**Files:**
- Create: `skills/peakui-react/scripts/doctor.mjs`
- Test: `scripts/skills/doctor.test.mjs`

**Interfaces:**
- Consumes: `installedVersion`, `splitProjectFlag` (Task 1); `makeProject`.
- Produces:
  - `inspect(project: string): {context: {react?: string, tailwind?: string, peakuiReact?: string, peakuiStyles?: string, framework: "next" | "vite" | "unknown", cssEntry?: string}, findings: {id: string, what: string, where?: string, fix: string}[]}`
  - `main(argv, io): Promise<number>` with the `io` shape of Task 2
- Finding ids: `not-a-project`, `missing-package`, `missing-peer`, `version-too-old`,
  `styles-not-imported`, `css-import-order`, `styles-imported-from-script`.

- [ ] **Step 1: Write the failing tests.** A helper `consumer(overrides)` returns a `makeProject`
  map for a healthy Vite project — `package.json` depending on `vite`, installed
  `@peakui/react` 1.0.0 (peers `react`, `react-aria-components`), `@peakui/styles` 1.0.0, `react`
  19.1.0, `react-aria-components` 1.21.1, `tailwindcss` 4.1.0, and `src/index.css` holding
  `@import "tailwindcss";` then `@import "@peakui/styles/css";` — with `overrides` merged in; a
  value of `null` removes the file.

| Test name | Change to the healthy project | Asserts |
| --- | --- | --- |
| `a healthy project has no finding` | none | `findings` is `[]`; `context.framework` is `"vite"`; `context.cssEntry` is `"src/index.css"`; `main` exits 0 |
| `next is recognised` | `package.json` depends on `next` | `context.framework` is `"next"` |
| `a missing package` | remove `node_modules/@peakui/styles/package.json` | one finding `missing-package` whose `fix` contains `@peakui/styles`; exit 1 |
| `a missing peer` | remove `react-aria-components` | finding `missing-peer` naming it |
| `react 18` | `react` version `18.3.1` | finding `version-too-old` whose `what` contains `18.3.1` and `19` |
| `tailwind 3` | `tailwindcss` version `3.4.0` | finding `version-too-old` containing `3.4.0` and `4` |
| `styles never imported` | `src/index.css` is `@import "tailwindcss";` | finding `styles-not-imported` |
| `reversed order` | the two imports swapped | finding `css-import-order` with `where` equal to `src/index.css:1` |
| `order is read through comments, url() and layer()` | `/* a */\n@import url("tailwindcss") layer(base);\n/* b */\n@import "@peakui/styles/css";` | no finding |
| `the root stylesheet specifier counts` | second import is `@import "@peakui/styles";` | no finding |
| `styles imported from a script` | add `src/main.tsx` with `import "@peakui/styles/css";` on line 2 | finding `styles-imported-from-script` with `where` equal to `src/main.tsx:2` |
| `node_modules and build output are not scanned` | add `dist/x.css` and `node_modules/y/z.css` with reversed imports | no finding |
| `a directory without package.json` | empty directory | `main` exits 2; stderr contains `package.json` |
| `output shape` | reversed order | stdout has a context block listing all four versions, then each finding as three labelled lines: `what`, `where`, `fix` |

- [ ] **Step 2: Run to verify they fail**

Run: `node --test scripts/skills/doctor.test.mjs`
Expected: FAIL — `doctor.mjs` does not exist.

- [ ] **Step 3: Implement `inspect` and `main`.**

  - Peers are read from the installed `@peakui/react/package.json` `peerDependencies`, not
    hard-coded.
  - Versions compare by major number only.
  - The scan skips `node_modules`, `dist`, `build`, `out`, `.next`, `.git` and any dot-directory.
  - `@import` lines are found after stripping `/* … */` comments while keeping line numbers.
  - The script makes no network request and imports nothing from `lib.mjs` that does.

- [ ] **Step 4: Run the tests, then all script tests**

Run: `node --test scripts/skills/doctor.test.mjs && pnpm test:ai`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add skills/peakui-react/scripts/doctor.mjs scripts/skills/doctor.test.mjs
git commit -m "feat(skills): doctor.mjs reports project context and silent setup mistakes"
```

---

### Task 4: Composite task `profile-settings`

**Files:**
- Create: `evals/tasks/profile-settings/task.ts`
- Create: `evals/tasks/profile-settings/overlay/src/types.ts`
- Create: `evals/tasks/profile-settings/solutions/good/{expect.json,files/src/App.tsx,files/src/pages/ProfileSettings.tsx}`
- Create: `evals/tasks/profile-settings/solutions/bad-assembled/{expect.json,files/…}`
- Modify: `evals/tasks/index.ts`, `evals/tests/tasks.gate.test.ts:61-76`

**Interfaces:**
- Consumes: `TaskDefinition`, `check`, `parsedSources`, `peakuiElements`, `labelLinked`, `textOf`
  from `evals/src/`.
- Produces: `export const profileSettings: TaskDefinition` with `id: "profile-settings"`.

- [ ] **Step 1: Read the pages** the solution uses, from the MDX under
  `apps/docs/content/docs/en/react/components/`: `card`, `form`, `text-field`, `textarea`, `switch`,
  `radio-group`, `button`, `spinner`, `link`, and the guide `composition`. The `data-slot` values
  the render checks need come from these pages' Styling Reference sections.

- [ ] **Step 2: Write the overlay.** `src/types.ts` exports
  `interface Profile {displayName: string; email: string; bio: string; newsletter: boolean; plan: "free" | "pro" | "team"}`
  and `interface ProfileSettingsProps {profile: Profile; saving: boolean; onSave(profile: Profile): void}`.

- [ ] **Step 3: Write `task.ts`.** `fixture: "vite-app"`;
  `pitfalls: ["fields", "composition", "rac-props", "variants", "styling"]`;
  `title: "Profile settings page"`; prompt, verbatim:

> Build the profile settings screen in src/pages/ProfileSettings.tsx as a named export `ProfileSettings` using PeakUI, and show it from src/App.tsx. Its props are typed in src/types.ts. Put everything in a card titled "Profile". The form needs a required display name, a required email that must be a valid email address, an optional multi-line bio, a switch labelled "Email me product news", and a single choice of plan between Free, Pro and Team. Each validation message must appear under its own field. At the bottom add a "Save changes" submit button that shows a loading indicator and cannot be submitted again while `saving` is true, and next to it a "Cancel" link to /account that looks like a secondary button.

  SSR render cases: `idle` (`saving: false`) and `saving` (`saving: true`), both with a filled
  `profile` and `onSave: "__fn__"`; `exportName: "ProfileSettings"`;
  `module: "/src/pages/ProfileSettings.tsx"`.

| Rule id | Layer | Pitfall | Passes when |
| --- | --- | --- | --- |
| `card.title` | render | composition | the PeakUI card root contains a card title part whose text is `Profile` |
| `form.required-fields` | render | rac-props | exactly two text-field roots carry `data-required="true"` |
| `form.labels-linked` | render | fields | every text-field root passes `labelLinked` |
| `form.email-type` | render | fields | one `input` has `type="email"` |
| `form.bio-multiline` | render | fields | one `textarea` exists inside the form |
| `form.switch` | render | composition | one switch root exists and its text includes `Email me product news` |
| `form.plan-choice` | render | composition | one radio-group root with exactly three radio inputs |
| `submit.pending` | render | rac-props | in `saving` the submit button has `data-pending="true"` and contains a spinner; in `idle` it has neither |
| `cancel.real-link` | render | styling | an `a[href="/account"]` whose class list contains the button block class and the secondary variant class, with text `Cancel` |
| `form.error-in-each-required-field` | static | fields | at least two `FieldError` nodes have `TextField` among their ancestors |
| `page-is-mounted` | static | other | `src/App.tsx` renders `ProfileSettings` |

- [ ] **Step 4: Write the solutions.**
  - `good`: passes every layer. `expect.json`: all four layers `pass`, `rules: {}`.
  - `bad-assembled`: the label and error passed as props to the input, native `required`, a
    `Button` given `href` for Cancel, and `isLoading` for the pending state. `expect.json`:
    `typecheck` `fail`, `build` `pass`, `static` `fail` with
    `["form.error-in-each-required-field"]`, `render` `fail` with
    `["form.required-fields", "cancel.real-link"]`. If the real scorer reports a different layer
    status in Step 6, correct `expect.json` to what the scorer reports and keep the three rule ids.

- [ ] **Step 5: Register the task** in `evals/tasks/index.ts` and change the gate at
  `tasks.gate.test.ts:61-76`: test title `…and has thirteen tasks`, `toHaveLength(13)`.

- [ ] **Step 6: Run the gates and the real scorer**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=profile-settings pnpm --filter @peakui/evals test:solutions`
Expected: PASS — `profile-settings / good` and `profile-settings / bad-assembled`.

- [ ] **Step 7: Commit**

```bash
git add evals/tasks/profile-settings evals/tasks/index.ts evals/tests/tasks.gate.test.ts
git commit -m "feat(evals): add the profile-settings composite task"
```

---

### Task 5: Composite task `team-members`

**Files:**
- Create: `evals/tasks/team-members/task.ts`, `overlay/src/types.ts`,
  `solutions/good/…`, `solutions/bad-handrolled/…`
- Modify: `evals/src/scoring/detectors.ts:125`, `evals/tests/detectors.answer-key.test.ts`,
  `evals/tasks/index.ts`, `evals/tests/tasks.gate.test.ts`

**Interfaces:**
- Consumes: as Task 4, plus `libraryFacts()` from `evals/src/scoring/library.ts`.
- Produces: `export const teamMembers: TaskDefinition` with `id: "team-members"`.

- [ ] **Step 1: Fix the provider detector first.** `Toast.Provider` is a real part, and its flat
  export would be reported as a forbidden provider. Add to `detectors.answer-key.test.ts`:

```ts
it("does not report a provider the library really exports", () => {
  const exported = [...libraryFacts().components.keys()].find((name) => name.endsWith("Provider"));

  expect(exported, "the library exports a part ending in Provider").toBeDefined();
  expect(rulesFor(`import {${exported}} from "@peakui/react";`)).not.toContain("provider");
  expect(rulesFor('import {PeakUIProvider} from "@peakui/react";')).toContain("provider");
});
```

  `rulesFor` is the file's existing helper for running the detectors on one source; use its real
  name. Run it, see it fail, then change the condition at `detectors.ts:125` to also require
  `!libraryFacts().components.has(entry.imported)`. Run `pnpm --filter @peakui/evals test`. If the
  first `expect` fails because no such export exists, delete this step's test and code change and
  say so in the task summary.

- [ ] **Step 2: Read the pages** `dropdown`, `modal`, `toast`, `tooltip`, `chip`, `button`.

- [ ] **Step 3: Write the overlay.** `src/types.ts` exports
  `interface Member {id: string; name: string; role: "owner" | "admin" | "member"}` and
  `interface TeamMembersProps {members: Member[]; onRemove(id: string): void}`.

- [ ] **Step 4: Write `task.ts`.** `fixture: "vite-app"`;
  `pitfalls: ["composition", "rac-props"]`; `title: "Team members with row actions"`; prompt,
  verbatim:

> Build the team members screen in src/pages/TeamMembers.tsx as a named export `TeamMembers` using PeakUI, and show it from src/App.tsx. Its props are typed in src/types.ts. List every member with their name and their role shown as a small badge. Each row ends with an icon-only "more" button that shows the hint "Member actions" on hover and opens a menu with "Change role" and "Remove". Choosing "Remove" must first ask for confirmation in a dialog titled "Remove member?" with "Cancel" and "Remove" buttons. Only that "Remove" button calls `onRemove` with the member's id, and afterwards a notification saying "Member removed" appears.

  SSR render case `default` with three members and `onRemove: "__fn__"`.

| Rule id | Layer | Pitfall | Passes when |
| --- | --- | --- | --- |
| `list.rows` | render | other | the three member names appear in the document |
| `list.role-badge` | render | composition | three PeakUI chip roots, one per member |
| `menu.trigger-named` | render | rac-props | three icon-only PeakUI buttons, each with a non-empty `aria-label` |
| `menu.composition` | static | composition | a `Dropdown` element whose descendants include `Dropdown.Popover`, `Dropdown.Menu` and at least two `Dropdown.Item` (canonical names, so flat exports count) |
| `menu.item-action` | static | rac-props | the handler for "Remove" is `onAction` on an item or on the menu, not `onClick` |
| `tooltip.wraps-trigger` | static | composition | a `Tooltip` element has a PeakUI `Button` and a `Tooltip.Content` among its descendants |
| `dialog.composition` | static | composition | a `Modal` element whose descendants include `Modal.Dialog` and `Modal.Heading` |
| `dialog.controlled-open` | static | rac-props | a `Modal` part carries both `isOpen` and `onOpenChange` |
| `toast.provider-mounted` | static | composition | `Toast.Provider` is rendered somewhere in `src/` |
| `toast.helper-called` | static | composition | the `toast` function imported from `@peakui/react` is called |
| `page-is-mounted` | static | other | `src/App.tsx` renders `TeamMembers` |

  The overlay rules are static because the render layer sees only the closed state (spec 3.1).
  Before writing `dialog.controlled-open` and `menu.item-action`, confirm on the `modal` and
  `dropdown` pages which part takes those props; the rule names the props, the page names the part.

- [ ] **Step 5: Write the solutions.**
  - `good`: all layers `pass`.
  - `bad-handrolled`: the menu is a `div` toggled by `useState` and `onClick`, confirmation is
    `window.confirm`, no tooltip, no toast. `expect.json`: `typecheck` `pass`, `build` `pass`,
    `static` `fail` with `["menu.composition", "dialog.composition", "tooltip.wraps-trigger", "toast.helper-called"]`,
    `render` `pass`. Correct the layer statuses to the scorer's report in Step 7 if they differ;
    keep the rule ids.

- [ ] **Step 6: Register the task**; gate title `…fourteen tasks`, `toHaveLength(14)`.

- [ ] **Step 7: Run**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=team-members pnpm --filter @peakui/evals test:solutions`
Expected: PASS for both solutions.

- [ ] **Step 8: Commit**

```bash
git add evals/tasks/team-members evals/tasks/index.ts evals/tests evals/src/scoring/detectors.ts
git commit -m "feat(evals): add the team-members composite task"
```

---

### Task 6: Composite task `first-setup-action`

**Files:**
- Create: `evals/tasks/first-setup-action/task.ts`, `solutions/good/…`,
  `solutions/bad-reversed-order/…`, `solutions/bad-handler-in-server-page/…`
- Modify: `evals/tasks/index.ts`, `evals/tests/tasks.gate.test.ts`

**Interfaces:**
- Consumes: `firstTimeSetup` from `evals/tasks/first-time-setup/task.ts` and `serverPageAction`
  from `evals/tasks/server-page-action/task.ts`.
- Produces: `export const firstSetupAction: TaskDefinition` with `id: "first-setup-action"`.

- [ ] **Step 1: Write `task.ts`.** `fixture: "next-app"`, no overlay;
  `pitfalls: ["css-order", "no-provider", "peers-rsc", "rac-props", "variants"]`;
  `title: "First setup and an interactive button on a server page"`; prompt, verbatim:

> @peakui/react and @peakui/styles are already installed in this app, but nothing is wired up yet. Finish the PeakUI setup. Then, on the home page (app/page.tsx), under the plan line, add a primary button labelled "Copy invite link" that copies https://acme.example/invite/team to the clipboard when pressed. The page must keep loading the plan on the server the way it does now.

  The checks are the two existing tasks' checks, renamed by part. Call each existing task's
  `staticChecks` and `render.check`, then map the rule ids:

| Existing rule | From | New rule id |
| --- | --- | --- |
| `styles-imported` | `first-time-setup` | `setup.styles-imported` |
| `import-order` | `first-time-setup` | `setup.import-order` |
| `component-css-present` | `first-time-setup` | `setup.component-css-present` |
| `layer-order` | `first-time-setup` | `setup.layer-order` |
| `primary-button` | `first-time-setup` | dropped — it asserts the "Get started" label |
| `page-stays-server` | `server-page-action` | `action.page-stays-server` |
| `handler-in-client-file` | `server-page-action` | `action.handler-in-client-file` |
| `press-handler` | `server-page-action` | `action.press-handler` |
| `button-rendered` | `server-page-action` | `action.button-rendered` |
| `server-data-rendered` | `server-page-action` | `action.server-data-rendered` |

  Add one rule of its own: `action.primary-variant`, render, `variants` — the "Copy invite link"
  button carries the primary variant class. `render.html` is the path `server-page-action` uses.
  Any rule either task emits that is not in the table is passed through with the prefix of its
  task (`setup.` or `action.`).

- [ ] **Step 2: Write the solutions.**
  - `good`: `app/globals.css` with the two imports in order, `app/page.tsx` still an async server
    component, the button in `components/CopyInviteButton.tsx` with `"use client"`.
  - `bad-reversed-order`: as `good` with the two CSS imports swapped. `expect.json`: `static`
    `fail` with `["setup.import-order"]`, `render` `fail` with `["setup.layer-order"]`,
    `typecheck` and `build` `pass`.
  - `bad-handler-in-server-page`: the press handler written inline in `app/page.tsx`.
    `expect.json`: `build` `fail`, `static` `fail` with `["action.handler-in-client-file"]`,
    `typecheck` `pass`, `render` as the scorer reports it.

- [ ] **Step 3: Register the task**; gate title `…fifteen tasks`, `toHaveLength(15)`.

- [ ] **Step 4: Run**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=first-setup-action pnpm --filter @peakui/evals test:solutions`
Expected: PASS for all three solutions.

- [ ] **Step 5: Commit**

```bash
git add evals/tasks/first-setup-action evals/tasks/index.ts evals/tests/tasks.gate.test.ts
git commit -m "feat(evals): add the first-setup-action composite task"
```

---

### Task 7: `trial setup` and `trial run`

**Files:**
- Create: `evals/src/agent/claude.ts`, `evals/src/setup.ts`
- Modify: `evals/scripts/trial.ts`
- Test: `evals/tests/agent.test.ts`, `evals/tests/setup.test.ts`

**Interfaces:**
- Consumes: `runCommand` from `evals/src/exec.ts`; `evalsHome`, `agentConfigDir`, `REPO_DIR` from
  `evals/src/paths.ts`; `copyDir` from `evals/src/files.ts`.
- Produces, from `agent/claude.ts`:
  - `const AGENT_TOOLS = ["Bash", "Read", "Edit", "Write", "Glob", "Grep", "Skill"]`
  - `buildClaudeArgs(options: {prompt: string; model: string; maxBudgetUsd: number; mcpConfigPath: string}): string[]`
  - `agentEnvironment(parent: NodeJS.ProcessEnv, options: {configDir?: string; docsUrl: string}): NodeJS.ProcessEnv`
  - `interface RunSummary {outcome: "ok" | "agent-error" | "infra-error"; model?: string; turns?: number; costUsd?: number; skillLoaded: boolean; scriptCalls: {docs: number; doctor: number}}`
  - `summarizeTranscript(lines: string[]): RunSummary`
- Produces, from `setup.ts`:
  - `type SetupKind = "skill" | "skill-pointer"`
  - `readPointer(mdx: string): string` — the text from `<!-- peakui:start -->` through
    `<!-- peakui:end -->`, inclusive; throws when either marker is missing
  - `buildSetup(kind: SetupKind): string` — the directory, under `evalsHome()/setups/<kind>/`

- [ ] **Step 1: Write the failing tests.**

`agent.test.ts`:

```ts
it("builds the headless argv with skills enabled", () => {
  const args = buildClaudeArgs({maxBudgetUsd: 2, mcpConfigPath: "/x/mcp.json", model: "sonnet", prompt: "do it"});

  expect(args.slice(0, 2)).toEqual(["-p", "do it"]);
  expect(args).toEqual(expect.arrayContaining([
    "--output-format", "stream-json", "--verbose", "--model", "sonnet",
    "--permission-mode", "acceptEdits", "--setting-sources", "project",
    "--strict-mcp-config", "--mcp-config", "/x/mcp.json",
    "--no-session-persistence", "--max-budget-usd", "2",
  ]));
  expect(args[args.indexOf("--tools") + 1]).toBe(AGENT_TOOLS.join(","));
  expect(args).not.toContain("--disable-slash-commands");
});
it("passes only allow-listed variables, the config directory and the docs origin", () => {
  const env = agentEnvironment(
    {ANTHROPIC_API_KEY: "k", CLAUDE_CODE_ENTRYPOINT: "cli", HOME: "/h", PATH: "/bin", SECRET: "s"},
    {configDir: "/cfg", docsUrl: "http://localhost:3100"},
  );

  expect(env).toEqual({ANTHROPIC_API_KEY: "k", CLAUDE_CONFIG_DIR: "/cfg", HOME: "/h", PATH: "/bin", PEAKUI_DOCS_URL: "http://localhost:3100"});
});
it("omits the config directory in inherit mode", () => {
  expect(agentEnvironment({PATH: "/bin"}, {docsUrl: "u"})).not.toHaveProperty("CLAUDE_CONFIG_DIR");
});
it("summarizes a transcript", () => {
  const lines = [
    JSON.stringify({type: "system", subtype: "init", model: "claude-sonnet-x"}),
    JSON.stringify({type: "assistant", message: {content: [{type: "tool_use", name: "Skill", input: {skill: "peakui-react"}}]}}),
    JSON.stringify({type: "assistant", message: {content: [{type: "tool_use", name: "Bash", input: {command: "node .claude/skills/peakui-react/scripts/docs.mjs button"}}]}}),
    JSON.stringify({type: "assistant", message: {content: [{type: "tool_use", name: "Bash", input: {command: "node .claude/skills/peakui-react/scripts/doctor.mjs"}}]}}),
    "not json",
    JSON.stringify({type: "result", is_error: false, num_turns: 9, total_cost_usd: 0.41}),
  ];

  expect(summarizeTranscript(lines)).toEqual({
    costUsd: 0.41, model: "claude-sonnet-x", outcome: "ok",
    scriptCalls: {docs: 1, doctor: 1}, skillLoaded: true, turns: 9,
  });
});
it("classifies a missing result as infra-error and an API error as infra-error", () => {
  expect(summarizeTranscript([]).outcome).toBe("infra-error");
  expect(summarizeTranscript([JSON.stringify({type: "result", is_error: true, terminal_reason: "api_error"})]).outcome).toBe("infra-error");
  expect(summarizeTranscript([JSON.stringify({type: "result", is_error: true})]).outcome).toBe("agent-error");
});
```

`setup.test.ts`: `readPointer` returns the marked block and throws without markers; with
`PEAKUI_EVALS_HOME` pointed at a temp directory, `buildSetup("skill")` yields a directory holding
`.claude/skills/peakui-react/SKILL.md` and no `CLAUDE.md`; `buildSetup("skill-pointer")` also
holds `CLAUDE.md` and `AGENTS.md`, each exactly the pointer block plus a trailing newline;
building twice leaves no stale file from the first build.

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm --filter @peakui/evals test`
Expected: FAIL — modules missing.

- [ ] **Step 3: Implement `agent/claude.ts` and `setup.ts`.**

  - The argv and the environment allow-list are those of section 6.2 of
    `docs/superpowers/specs/2026-10-03-agent-evals-design.md`, with two differences: `Skill` is
    added to `--tools` and `--allowedTools`, and `--disable-slash-commands` is never passed.
  - `buildSetup` copies `skills/peakui-react/` from `REPO_DIR` and reads the pointer from
    `apps/docs/content/docs/en/react/getting-started/(ui-for-agents)/agent-skills.mdx`. Until Task 8
    creates that page, `buildSetup("skill-pointer")` throws the `readPointer` error — the test for
    it is marked `it.todo` here and enabled in Task 8.

- [ ] **Step 4: Add the subcommands to `evals/scripts/trial.ts`** and its `USAGE`:

```
  trial setup --kind <skill|skill-pointer>
  trial run --task <id> --workspace <path> --model <alias> --docs-url <url>
            [--max-budget-usd <n>] [--agent-config <isolated|inherit>]
```

  - `setup` prints `{"kind": …, "dir": …}`.
  - `run` defaults: budget `2`, agent config `isolated`, timeout 15 minutes. The binary is
    `PEAKUI_EVALS_CLAUDE_BIN`, else `claude`. It writes an empty MCP config beside the workspace,
    spawns with `runCommand` in the workspace, writes stdout to `transcript.jsonl` and stderr to
    `stderr.txt` in the workspace's parent directory, then prints the `RunSummary` as JSON with the
    transcript path added. It exits 1 when `outcome` is `infra-error`.
  - The prompt is the task's `prompt`, unchanged.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add evals/src/agent evals/src/setup.ts evals/scripts/trial.ts evals/tests/agent.test.ts evals/tests/setup.test.ts
git commit -m "feat(evals): trial setup and trial run for skill trials"
```

---

### Task 8: Docs page and pointer

**Files:**
- Create: `apps/docs/content/docs/en/react/getting-started/(ui-for-agents)/agent-skills.mdx`
- Modify: `apps/docs/content/docs/en/react/getting-started/meta.json`
- Modify: `evals/tests/setup.test.ts` (enable the `it.todo`)
- Test: `apps/docs/tests/api-components.test.ts`

- [ ] **Step 1: Write the failing test.** In `api-components.test.ts`, following its existing
  cases: the `guides` list contains an entry named `agent-skills` with a non-empty `description`.

Run: `pnpm --filter @peakui/docs test`
Expected: FAIL — no such guide.

- [ ] **Step 2: Write the page** through the `peakui-docs` skill. Frontmatter `title: Agent Skills`,
  `description`: one sentence. Sections, in order:

  1. What the skill does — three sentences.
  2. Install — `npx skills add peakui-dev/peakui`, and where it lands (`.agents/skills/`,
     `.claude/skills/`).
  3. Point your agent at it — the pointer block below, verbatim, in a `md` code fence.
  4. Update — `npx skills update`.
  5. What the scripts access — `GET` requests to the documentation origin; nothing is sent; no
     file is written.
  6. Mirrors and previews — `PEAKUI_DOCS_URL`.

```md
<!-- peakui:start -->
This project uses PeakUI (`@peakui/react`, `@peakui/styles`).
Before writing or changing UI code, load the `peakui-react` skill and follow it.
Without skills: read https://peakui.dev/llms.txt first.
<!-- peakui:end -->
```

- [ ] **Step 3: Add** `"(ui-for-agents)/agent-skills"` after `"(ui-for-agents)/llms-txt"` in
  `meta.json`.

- [ ] **Step 4: Enable the `skill-pointer` test** in `evals/tests/setup.test.ts`.

- [ ] **Step 5: Run**

Run: `pnpm --filter @peakui/docs test && pnpm --filter @peakui/docs typecheck && pnpm --filter @peakui/evals test && NEXT_PUBLIC_SITE_URL=https://peakui.dev pnpm build:docs`
Expected: PASS; the build prerenders `/en/docs/react/getting-started/agent-skills`.

- [ ] **Step 6: Commit**

```bash
git add apps/docs/content apps/docs/tests/api-components.test.ts evals/tests/setup.test.ts
git commit -m "docs: add the agent skills page with the pointer block"
```

---

### Task 9: Skill skeleton and gates

**Files:**
- Modify: `skills/peakui-react/SKILL.md` (replaced whole)
- Test: `scripts/skills/skill.gate.test.mjs`

**Interfaces:**
- Consumes: `SKILL_VERSION`, `DEFAULT_ORIGIN` from `lib.mjs`.
- Produces: gate helpers used again in Task 11 — none exported; the gate reads the directory.

- [ ] **Step 1: Write the failing gate** in `scripts/skills/skill.gate.test.mjs`. The skill
  directory is `skills/peakui-react`; "skill text" means `SKILL.md` and every file in `references/`.

| Test name | Asserts |
| --- | --- |
| `frontmatter holds only specification fields` | keys ⊆ `name`, `description`, `license`, `compatibility`, `metadata`; `name` is `peakui-react`; `description` length is 1–1,024; `metadata.version` is a string equal to `SKILL_VERSION` |
| `description is third person and names both packages` | contains `@peakui/react` and `@peakui/styles`; does not match `/\b(I|you|your)\b/i` |
| `the body is under 500 lines and has the four sections in order` | headings `## Workflow`, `## Rules the type-checker will not catch`, `## What to read for the task`, `## When the docs cannot be reached` appear in that order |
| `links resolve one level deep` | every relative markdown link in `SKILL.md` resolves to a file in the skill directory; no file in `references/` links to another file in `references/`; every file in `references/` is linked from `SKILL.md` |
| `a reference longer than 100 lines opens with a table of contents` | a `## Contents` heading within its first 15 lines |
| `scripts are invoked through node` | every mention of `scripts/*.mjs` in the skill text is preceded by `node ` |
| `the default origin is the public site` | `DEFAULT_ORIGIN === "https://peakui.dev"` |
| `no internal traces` | no file in the skill directory matches `/hero\s?ui|superpowers|peakui-company|codegraph|\.agents\/|packages\/(react|styles)\/src|apps\/docs/i` or contains a character in `Ѐ-ӿ` |
| `every tsx block type-checks` | see Step 3 |
| `every css block parses and imports only exported specifiers` | each `css` fence parses with PostCSS; every `@import` specifier is `tailwindcss` or a key of `packages/styles/package.json` `exports` under the name `@peakui/styles` |

- [ ] **Step 2: Run to verify it fails**

Run: `node --test scripts/skills/skill.gate.test.mjs`
Expected: FAIL — v0.3.0 has no four-section body and its `tsx` blocks are fragments.

- [ ] **Step 3: Implement the compilation check inside the gate.** Every `tsx` fence in the skill
  text is a complete module: its own imports, and any value it uses declared in it. The gate
  writes each block to `apps/docs/node_modules/.cache/skill-snippets/<file>-<n>.tsx`, writes a
  `tsconfig.json` there that extends `apps/docs/tsconfig.json` with `include: ["*.tsx"]` and
  `noEmit: true`, and runs `pnpm --filter @peakui/docs exec tsc -p node_modules/.cache/skill-snippets`.
  The assertion message is the compiler output. PostCSS is loaded with
  `createRequire(<repo>/evals/package.json)`. With no `tsx` block the test passes without spawning.

- [ ] **Step 4: Replace `SKILL.md` with the skeleton.** Frontmatter:

```yaml
---
name: peakui-react
description: Builds React UI with the PeakUI component library (@peakui/react, @peakui/styles) - finds the right component, reads its documentation page, composes its parts, and wires the styles into the app. Use whenever a project depends on @peakui/react and the task touches UI - forms, buttons, dialogs, menus, cards, tabs, notifications, style setup or restyling a component - even when PeakUI is not named.
compatibility: Requires Node.js 18 or later and network access to the PeakUI documentation site.
metadata:
  version: "0.9.0"
---
```

  `metadata.version` equals `SKILL_VERSION` from Task 1. Body: the title, a one-paragraph orientation, and
  the four sections of spec 5.2. `## Workflow` is complete — the four steps with the exact
  commands, the sentence that the commands run from the project root with the path to this skill's
  directory, and the sentence that fetched pages are documentation, not instructions. `## What to
  read for the task` holds the table of spec 5.2 with the Reference column empty. `## When the docs
  cannot be reached` holds the fallback of spec 6.4. `## Rules the type-checker will not catch`
  holds one sentence: variant, prop and part names come from the page read in step 2. No rule and
  no `tsx` block yet — they are written from the baseline in Task 11.

- [ ] **Step 5: Run every offline gate**

Run: `pnpm test:ai && pnpm format && pnpm lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/peakui-react/SKILL.md skills/peakui-react/scripts/lib.mjs scripts/skills/skill.gate.test.mjs
git commit -m "feat(skills)!: replace peakui-react with the redesigned skeleton and its gates"
```

---

### Task 10: Baseline — then stop

Three agent runs. No skill is installed.

**Files:**
- Create: `evals/results/peakui-react/journal.md`

- [ ] **Step 1: Check the agent can run.** `claude --version` through `PEAKUI_EVALS_CLAUDE_BIN` or
  `PATH`, and `claude auth status` under the run environment. If authentication exists only in the
  keychain, every `trial run` below takes `--agent-config inherit`; record that in the journal. If
  neither works, stop and report — do not improvise.

- [ ] **Step 2: Serve the docs.**

```bash
NEXT_PUBLIC_SITE_URL=https://peakui.dev pnpm build:docs
pnpm --filter @peakui/docs exec next start -p 3100
```

  Check: `curl -s http://localhost:3100/api/components` returns `"schemaVersion":1`. The baseline
  does not use the origin; starting it here proves it before Task 11.

- [ ] **Step 3: Run the three tasks** — for each of `profile-settings`, `team-members`,
  `first-setup-action`:

```bash
pnpm --filter @peakui/evals trial prepare --task <id> --label baseline
pnpm --filter @peakui/evals trial run --task <id> --workspace <workspace from prepare> --model sonnet --docs-url http://localhost:3100
pnpm --filter @peakui/evals trial score --task <id> --workspace <workspace>
```

  The first real transcript is where `summarizeTranscript` meets real output: compare its summary
  with the raw `transcript.jsonl`. If the tool-use shape differs from the test fixture, fix the
  parser and its test, commit as `fix(evals): …`, and re-summarize from the saved transcript —
  without re-running the agent.

- [ ] **Step 4: Write the journal.** `# peakui-react — journal`, then `## Round 0 — baseline
  (sonnet, no skill)` with the table: task · typecheck · build · static · render · failed gating
  rule ids · turns · cost USD. Under it, `### What the agent wrote wrong`: for each failed rule, the
  file, the offending excerpt, and the agent's own sentence before writing it, from the transcript.
  Local paths are replaced by `<workspace>`.

- [ ] **Step 5: Commit**

```bash
git add evals/results/peakui-react/journal.md
git commit -m "docs(evals): record the peakui-react baseline"
```

- [ ] **Step 6: STOP.** Report to the owner: the three results, the measured cost and duration per
  run, and the projected cost of the remaining 12–15 runs. Continue only on the owner's word.

---

### Task 11: Write the skill from the baseline — rounds

Six to nine agent runs: three per round, two or three rounds.

**Files:**
- Modify: `skills/peakui-react/SKILL.md`
- Create as needed: `skills/peakui-react/references/{setup,composition,styling}.md`
- Modify: `evals/results/peakui-react/journal.md`

- [ ] **Step 1: Draft from the journal only**, by the content rules of spec 5.3. For every failed
  baseline rule decide: a rule in `SKILL.md` (it passes the type-check), a section in a reference,
  or nothing (the type-check or `doctor` already catches it). Add to the journal the table
  `## Rules and the findings behind them`: skill rule · file · baseline rule id. A reference file
  is created only when a baseline failure belongs in it; fill the Reference column of the routing
  table for the files that exist. Every `tsx` block is a complete module.

- [ ] **Step 2: Run the gates**

Run: `pnpm test:ai`
Expected: PASS.

- [ ] **Step 3: Run the round** — for each of the three tasks:

```bash
pnpm --filter @peakui/evals trial setup --kind skill
pnpm --filter @peakui/evals trial prepare --task <id> --label round-<n> --setup <dir from setup>
pnpm --filter @peakui/evals trial run --task <id> --workspace <workspace> --model sonnet --docs-url http://localhost:3100
pnpm --filter @peakui/evals trial score --task <id> --workspace <workspace>
```

  **Pointer rule:** if a summary shows `skillLoaded: false`, run that task once more with
  `--kind skill-pointer` and `--label round-<n>-pointer`, and record both.

- [ ] **Step 4: Read the transcripts**, not only the scores: which reference was never opened,
  where a script call failed or was run from the wrong directory, what led nowhere. Append
  `## Round <n>` to the journal: the table of Task 10 plus columns skill loaded · `docs.mjs` calls ·
  `doctor.mjs` calls · setup kind, and a short `### Observations` list.

- [ ] **Step 5: Commit the round**

```bash
git add skills/peakui-react evals/results/peakui-react/journal.md
git commit -m "feat(skills): peakui-react round <n>"
```

- [ ] **Step 6: Owner review.** Show the journal round and the diff of the skill. Revise on the
  feedback and repeat Steps 2–5. Stop the rounds when, on `sonnet`, every gating rule that failed
  in the baseline passes and none that passed fails — or when a round changes no result. Three
  rounds is the limit; a fourth needs the owner's word. A task whose result flips between rounds
  with no change in the skill that explains it is named in the journal and run once more alone.

---

### Task 12: Final check, install channel, version

Six agent runs.

**Files:**
- Modify: `skills/peakui-react/SKILL.md`, `skills/peakui-react/scripts/lib.mjs`,
  `evals/results/peakui-react/journal.md`, `apps/docs/…/agent-skills.mdx` (only if the pointer
  became required)

- [ ] **Step 1: Run the three tasks on `haiku` and on `opus`** with the commands of Task 11 Step 3,
  labels `final-haiku` and `final-opus`, the same pointer rule. Append `## Final check` to the
  journal.

- [ ] **Step 2: Apply the readiness conditions** of spec 8.4 and write the verdict for each of the
  six into the journal under `## Readiness`. For every gating rule still failing on `haiku` or
  `opus` beyond type-check and build, list it for the owner's decision: fix or accept. If any run
  needed the pointer, change the docs page to present the pointer as a required step.

- [ ] **Step 3: Verify the install channel.** In an empty directory under `os.tmpdir()` holding
  only a `package.json`:

```bash
npx skills add <absolute path to this repository> --skill peakui-react --yes
```

  Expected: `.agents/skills/peakui-react/SKILL.md` and `.claude/skills/peakui-react/SKILL.md` both
  exist, along with `scripts/docs.mjs` under each. If the CLI's flags differ, use what
  `npx skills add --help` documents and record the exact command in the journal.

- [ ] **Step 4: Owner review of the skill text and the journal.** On acceptance set
  `metadata.version` and `SKILL_VERSION` to `"1.0.0"`.

- [ ] **Step 5: Run every gate**

Run: `pnpm test:ai && pnpm --filter @peakui/evals test && pnpm format && pnpm lint && pnpm typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/peakui-react evals/results/peakui-react/journal.md apps/docs/content
git commit -m "feat(skills): peakui-react 1.0.0"
```

- [ ] **Step 7: Record the skill as a contract client — in the other repository.** Change
  directory to `peakui-company` first; an edit made from here is lost. In
  `docs/ecosystem/docs-site-contract.md`, first paragraph, extend the list of clients — "the CLI,
  the MCP servers, and any agent with a fetch tool" — with "the `peakui-react` skill's scripts".
  Commit there: `docs(ecosystem): name the consumer skill as a docs site client`.

---

## Self-Review Notes

- **Spec coverage:** 5.1–5.4 → Tasks 9, 11; 6.1–6.4 → Tasks 1–3; 7.1 → Task 12 Step 3; 7.2–7.3 →
  Task 8; 8.1 → Tasks 4–6; 8.2 → Task 7; 8.3–8.5 → Tasks 10–12; 9 → Tasks 10–12; 10 → Tasks 1–3, 9;
  11 → Task 9 Step 4; the follow-up of 12 → Task 12 Step 7.
- **Not planned, by the spec:** the description optimiser (spec 9, optional, on the owner's word
  after Task 12).
