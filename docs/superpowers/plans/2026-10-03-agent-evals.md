# Agent Evals Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `@peakui/evals`: a harness that runs an AI coding agent on twelve realistic PeakUI consumer tasks in an isolated copy of a fixture app, scores the result in four independent layers, and records what the agent got wrong and how it justified it.

**Architecture:** A private workspace package at `evals/`. `pack` stages dist-based tarballs of the two unpublished packages; `prepare` installs them into fixture templates outside the repository; each run copies a template, applies a task overlay and a configuration, drives an agent through an adapter, snapshots the changes and scores them (type-check, build, static AST/CSS assertions, server-rendered DOM and built CSS). A `reference` adapter applies stored solutions, so every scorer is tested without an agent.

**Tech Stack:** TypeScript 5.9.3 run natively by Node >= 22.18 (type stripping), vitest 3.2.7, the TypeScript compiler API, PostCSS 8.5.28, jsdom 30.0.1, tsdown 0.23.0, npm (inside fixtures only), Claude Code CLI 2.1.284 (headless).

**Spec:** `docs/superpowers/specs/2026-10-03-agent-evals-design.md` — read it before any task. Section numbers below refer to it.

## Global Constraints

- **No agent tokens.** No step in Tasks 1–16 may start a real agent. `pnpm evals run` with the `claude-code` adapter appears exactly once in this plan: the single smoke run in Task 17. Never pass `--yes` to a real-agent run while executing this plan. The baseline is a separate, explicitly invoked step after the plan (spec section 15).
- **D6.** Nothing under `evals/fixtures/`, no task `overlay/`, no prompt and no staged tarball may contain the name of the reference library or of any other UI library. Reference solutions under `solutions/` are never shown to an agent and are exempt.
- **Do not modify `packages/*` or `apps/*`.** Staging builds into a directory outside them. Do not edit `../heroui`.
- **Every document and every string in English.**
- **Exact-pinned dependencies** in `evals/package.json` and in both fixtures: `typescript` 5.9.3, `postcss` 8.5.28, `jsdom` 30.0.1, `@types/jsdom` 30.0.0, `tsdown` 0.23.0, `vitest` 3.2.7, `@types/node` 24.19.0, `react` and `react-dom` 19.3.0, `@types/react` and `@types/react-dom` 19.3.0, `tailwindcss`, `@tailwindcss/vite` and `@tailwindcss/postcss` 4.3.3, `vite` 8.3.1, `@vitejs/plugin-react` 6.1.1, `next` 16.3.6.
- **TypeScript rules:** ESM, named exports only, imports with the `.ts` extension, erasable syntax only (no `enum`, no parameter properties, no `namespace`), no `any` (`unknown` plus narrowing), `interface` for object shapes, `function` declarations for pure functions.
- **Code blocks fix names, values and logic, not formatting.** After creating files run `pnpm exec prettier --write evals` and `pnpm exec eslint --fix evals`; key order and import order follow the linter. `pnpm lint` and `pnpm --filter @peakui/evals typecheck` must pass before each commit.
- **Paths.** Workspaces, templates and tarballs live under `evalsHome()` = `PEAKUI_EVALS_HOME` or `os.tmpdir()/peakui-evals` — never under the repository and never under `$HOME`.
- **Tests.** Unit tests live in `evals/tests/` and run offline with `pnpm --filter @peakui/evals test`. Tests that need installed templates live in `evals/tests/solutions/` and run with `pnpm --filter @peakui/evals test:solutions` after `pnpm evals prepare`.
- **Spawn without a shell.** Every child process is started with an argument array. The Claude Code binary on the development machine sits in a path with a space.
- **CodeGraph:** run `pnpm codegraph explore evals` (or the area you touch) before reading code and quote its first lines in the task summary. If the index is missing, say so and stop; do not index on your own.
- **Conventional Commits**, header at most 150 characters.

## Deferred — not in this plan

- Configurations `agents-md`, `skill`, `mcp`: registered as `planned`, contracts in spec section 9.
- Adapters for agents other than Claude Code.
- Interactive rendered checks; a container sandbox.
- The baseline run (60 agent runs).

## Review Focus

Inputs the spec implies and no happy-path test covers. Each has its test in the named task.

1. **The agent deletes or renames the file a task targets.** The render layer must report a failed `render-unavailable` finding, not throw. Test in Task 7.
2. **The agent leaves a file that does not parse** — a truncated TSX file or broken CSS. Detectors and CSS helpers must return findings (`unparseable-css`), never crash the scorer. Tests in Task 6.
3. **Stale build output.** The agent ran a build, then broke the code; or the template carries output. The scorer must delete the fixture's output directories before building, so the render layer cannot read yesterday's HTML or CSS. Test in Task 5.
4. **An unauthenticated or failing agent CLI.** The run is `infra-error`, is retried on resume, and is absent from every denominator in the summary. Tests in Tasks 12, 14 and 15.
5. **A batch interrupted while a record was being written.** A truncated `record.json` is treated as pending, not as a crash and not as completed. Test in Task 14.

## File Structure

```
evals/
  package.json  tsconfig.json  vitest.config.ts  vitest.solutions.config.ts  .gitignore
  src/
    types.ts                    every shared interface
    paths.ts                    package, repository and home directories
    exec.ts                     run a command without a shell
    files.ts                    walk, hash, copy, redact
    pack/stage.ts               stage and pack the library tarballs
    fixtures/prepare.ts         install a fixture into a template
    workspace/workspace.ts      guard, copy, overlay, commit, snapshot, diff
    scoring/findings.ts         finding constructors
    scoring/commands.ts         typecheck and build layers, diagnostic classification
    scoring/ast.ts              TSX parsing helpers
    scoring/css.ts              CSS helpers
    scoring/dom.ts              DOM helpers
    scoring/detectors.ts        shared detectors
    scoring/static.ts           static layer
    scoring/render-runner.mjs   child process: server-render one component
    scoring/render.ts           render layer
    scoring/score.ts            four layers, mistakes
    adapters/transcript.ts      Claude stream-json to normalized events
    adapters/claude-code.ts     real adapter
    adapters/reference.ts       applies a stored solution
    configurations/index.ts     registry, none, planned
    runner/matrix.ts            run keys, states
    runner/pool.ts              bounded concurrency
    runner/justify.ts           narration, justification, outside access
    runner/record.ts            write, read, redact records
    runner/run.ts               one run end to end
    report/stats.ts             counts, Wilson interval, aggregates
    report/summary.ts           summary.md
    commands/                   doctor.ts prepare.ts run.ts score.ts report.ts
    cli.ts                      argument parsing and dispatch
  fixtures/
    index.ts                    fixture definitions
    vite-app/  next-app/        consumer apps
    packages/acme-status/       the shared-package stand-in
  tasks/
    index.ts
    <task-id>/task.ts  overlay/  solutions/<name>/{expect.json, files/}
  tests/                        unit tests
  tests/solutions/              tests that need prepared templates
  results/                      batches (partly git-ignored)
```

---

### Task 1: Package scaffold and shared types

**Files:**
- Create: `evals/package.json`, `evals/tsconfig.json`, `evals/vitest.config.ts`, `evals/vitest.solutions.config.ts`, `evals/.gitignore`
- Create: `evals/src/types.ts`, `evals/src/paths.ts`
- Modify: `pnpm-workspace.yaml` (add `- "evals"` under `packages:`)
- Modify: `eslint.config.mjs` (add an ignores entry as the first element of the `defineConfig` array)
- Modify: `.prettierignore` (append `evals/results/`)
- Test: `evals/tests/package.test.ts`, `evals/tests/paths.test.ts`

**Interfaces:**
- Produces: every type in `src/types.ts` below, used by all later tasks; `PACKAGE_DIR`, `REPO_DIR`, `RESULTS_DIR`, `evalsHome()`, `tarballsDir()`, `templatesDir()`, `workspacesDir()`, `agentConfigDir(batch)` from `src/paths.ts`.

- [ ] **Step 1: Write the failing tests**

`evals/tests/package.test.ts`:

```ts
import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {PACKAGE_DIR} from "../src/paths.ts";

const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  private: boolean;
};

describe("package manifest", () => {
  it("is private", () => {
    expect(manifest.private).toBe(true);
  });

  it("pins every dependency exactly", () => {
    const versions = Object.entries({...manifest.dependencies, ...manifest.devDependencies});

    for (const [name, version] of versions) {
      expect(version, name).toMatch(/^(workspace:\*|\d+\.\d+\.\d+)$/);
    }
  });
});
```

`evals/tests/paths.test.ts`:

```ts
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, describe, expect, it} from "vitest";

import {agentConfigDir, evalsHome, templatesDir} from "../src/paths.ts";

describe("evalsHome", () => {
  const saved = process.env.PEAKUI_EVALS_HOME;

  afterEach(() => {
    if (saved === undefined) delete process.env.PEAKUI_EVALS_HOME;
    else process.env.PEAKUI_EVALS_HOME = saved;
  });

  it("defaults to a directory under the system temp directory", () => {
    delete process.env.PEAKUI_EVALS_HOME;
    expect(evalsHome()).toBe(join(tmpdir(), "peakui-evals"));
  });

  it("honours PEAKUI_EVALS_HOME", () => {
    process.env.PEAKUI_EVALS_HOME = "/tmp/elsewhere";
    expect(evalsHome()).toBe("/tmp/elsewhere");
    expect(templatesDir()).toBe("/tmp/elsewhere/templates");
    expect(agentConfigDir("b1")).toBe("/tmp/elsewhere/agent-config/b1");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm install && pnpm --filter @peakui/evals test`
Expected: FAIL — `No projects matched the filters` before the package exists, then `Cannot find module '../src/paths.ts'`.

- [ ] **Step 3: Create the package files**

`evals/package.json`:

```json
{
  "name": "@peakui/evals",
  "version": "0.0.0",
  "private": true,
  "description": "Agent evals for PeakUI consumers. Never published.",
  "type": "module",
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "test": "vitest run",
    "test:solutions": "vitest run --config vitest.solutions.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "jsdom": "30.0.1",
    "postcss": "8.5.28",
    "tsdown": "0.23.0",
    "typescript": "5.9.3"
  },
  "devDependencies": {
    "@peakui/standard": "workspace:*",
    "@types/jsdom": "30.0.0",
    "@types/node": "24.19.0",
    "vitest": "3.2.7"
  }
}
```

`evals/tsconfig.json`:

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "erasableSyntaxOnly": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "noEmit": true,
    "types": ["node"]
  },
  "include": [
    "src",
    "tests",
    "tasks/index.ts",
    "tasks/*/task.ts",
    "fixtures/index.ts",
    "vitest.config.ts",
    "vitest.solutions.config.ts"
  ]
}
```

`evals/vitest.config.ts`: `defineConfig({test: {environment: "node", include: ["tests/**/*.test.ts"], exclude: ["tests/solutions/**"]}})`.

`evals/vitest.solutions.config.ts`: `defineConfig({test: {environment: "node", include: ["tests/solutions/**/*.test.ts"], fileParallelism: false, testTimeout: 600_000, hookTimeout: 900_000}})`.

`evals/.gitignore`:

```
results/**/transcript.jsonl
results/**/stderr.txt
results/**/*.log
```

Root `eslint.config.mjs`, first array element:

```js
{
  // Consumer code the evals show to an agent, known-bad reference solutions and agent output:
  // none of it is this repository's source.
  ignores: [
    "evals/fixtures/*/**",
    "evals/tasks/*/overlay/**",
    "evals/tasks/*/solutions/**",
    "evals/results/**",
  ],
},
```

(`evals/fixtures/index.ts` is a direct child and stays linted.)

- [ ] **Step 4: Write `evals/src/types.ts`**

```ts
import type {Root} from "postcss";

export type PitfallId =
  | "css-order"
  | "tailwind-scanning"
  | "composition"
  | "styling"
  | "fields"
  | "rac-props"
  | "variants"
  | "peers-rsc"
  | "imports"
  | "no-provider"
  | "other";

export type LayerId = "typecheck" | "build" | "static" | "render";

export const LAYERS: readonly LayerId[] = ["typecheck", "build", "static", "render"];

export type LayerStatus = "pass" | "fail" | "not-applicable";

export interface Finding {
  rule: string;
  pitfall: PitfallId;
  pass: boolean;
  /** false: informational, never fails a layer. */
  gate: boolean;
  message: string;
  /** Workspace-relative, forward slashes. */
  file?: string;
  /** 1-based. */
  line?: number;
  excerpt?: string;
}

export interface LayerResult {
  layer: LayerId;
  status: LayerStatus;
  durationMs: number;
  findings: Finding[];
}

export interface Mistake {
  layer: LayerId;
  rule: string;
  pitfall: PitfallId;
  message: string;
  file?: string;
  line?: number;
  excerpt?: string;
  justification?: string;
}

export interface ProjectFile {
  path: string;
  text: string;
}

export interface FileChanges {
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface FixtureDefinition {
  id: string;
  /** Absolute path of the fixture's source directory. */
  dir: string;
  /** Commands run once in the template after `npm install`. */
  prepare: string[][];
  typecheck: string[][];
  build: string[][];
  /** Output directories removed before scoring. */
  clean: string[];
  /** Directory, relative to the workspace, whose `.css` files are the built CSS. */
  builtCssDir: string;
}

export interface StaticContext {
  /** Every `.ts`, `.tsx` and `.css` project file after the run. */
  files: ProjectFile[];
  changes: FileChanges;
  file(path: string): ProjectFile | undefined;
}

export interface RenderCase {
  name: string;
  /** The string "__fn__" anywhere in props becomes a no-op function. */
  props: Record<string, unknown>;
}

export interface RenderContext {
  /** Keyed by case name; the document of `html` is keyed "html". */
  documents: Map<string, Document>;
  /** Parsed concatenation of the built CSS; undefined when the build left none. */
  css: Root | undefined;
}

export interface RenderSpec {
  ssr?: {module: string; exportName: string; cases: RenderCase[]};
  html?: {path: string};
  check(context: RenderContext): Finding[];
}

export interface TaskDefinition {
  id: string;
  title: string;
  fixture: string;
  pitfalls: PitfallId[];
  prompt: string;
  staticChecks(context: StaticContext): Finding[];
  render?: RenderSpec;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export type TranscriptEvent =
  | {kind: "text"; text: string}
  | {kind: "tool"; id: string; name: string; input: unknown; writes: string[]}
  | {kind: "tool-result"; id: string; isError: boolean; text: string};

export interface AgentSetup {
  tools: string[];
  skillsEnabled: boolean;
  mcpConfigPath?: string;
  allowedMcpServers: string[];
}

export interface AgentEnvironment {
  version?: string;
  model?: string;
  tools: string[];
  mcpServers: string[];
  skills: string[];
  plugins: string[];
}

export type AgentOutcome = "ok" | "timeout" | "budget" | "agent-error" | "infra-error";

export interface AgentRunRequest {
  taskId: string;
  cwd: string;
  prompt: string;
  model: string;
  timeoutMs: number;
  maxBudgetUsd: number;
  setup: AgentSetup;
  transcriptPath: string;
  stderrPath: string;
}

export interface AgentRunResult {
  outcome: AgentOutcome;
  exitCode: number | null;
  durationMs: number;
  usage?: TokenUsage;
  costUsd?: number;
  turns?: number;
  finalMessage?: string;
  error?: string;
  environment: AgentEnvironment;
  events: TranscriptEvent[];
}

export interface AdapterInfo {
  id: string;
  binary: string;
  version: string;
  authenticated: boolean;
  detail: string;
}

export interface AgentAdapter {
  readonly id: string;
  describe(): Promise<AdapterInfo>;
  run(request: AgentRunRequest): Promise<AgentRunResult>;
}

export interface ExpectedEnvironment {
  mcpServers: string[];
  skills: string[];
}

export type Availability = {ok: true} | {ok: false; reason: string};

export interface ConfigurationContext {
  workspaceDir: string;
  /** Per-run directory outside the workspace. */
  scratchDir: string;
  task: TaskDefinition;
}

export interface ConfigurationResult {
  setup: AgentSetup;
  expected: ExpectedEnvironment;
  /** Artifact name to version, stored in the record. */
  artifacts: Record<string, string>;
}

export interface Configuration {
  readonly id: string;
  readonly description: string;
  available(): Promise<Availability>;
  apply(context: ConfigurationContext): Promise<ConfigurationResult>;
}

export interface RunKey {
  task: string;
  configuration: string;
  repetition: number;
}

export type RunStatus = "completed" | "infra-error";

export interface RunRecord {
  schemaVersion: 1;
  key: string;
  batch: string;
  task: string;
  configuration: string;
  repetition: number;
  fixture: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  agent: {
    adapter: string;
    outcome: AgentOutcome;
    durationMs: number;
    turns?: number;
    usage?: TokenUsage;
    costUsd?: number;
    error?: string;
    finalMessage?: string;
    narration: string[];
    environment: AgentEnvironment;
    artifacts: Record<string, string>;
  };
  /** Absent when status is "infra-error". */
  layers?: Record<LayerId, LayerResult>;
  passed: boolean;
  mistakes: Mistake[];
  changes: FileChanges;
  outsideAccess: string[];
}

export interface BatchManifest {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  adapter: AdapterInfo;
  model: string;
  tasks: string[];
  configurations: string[];
  repetitions: number;
  libraryHash: string;
  templateHashes: Record<string, string>;
  node: string;
  npm: string;
  platform: string;
  isolation: "isolated" | "inherit";
  timeoutMs: number;
  maxBudgetUsd: number;
}
```

- [ ] **Step 5: Implement `evals/src/paths.ts`**

`PACKAGE_DIR` is `join(import.meta.dirname, "..")`; `REPO_DIR` is its parent; `RESULTS_DIR` is `join(PACKAGE_DIR, "results")`. `evalsHome(): string` returns `process.env.PEAKUI_EVALS_HOME` when set and non-empty, else `join(tmpdir(), "peakui-evals")`. `tarballsDir()`, `templatesDir()`, `workspacesDir()` are `join(evalsHome(), "tarballs" | "templates" | "workspaces")`; `agentConfigDir(batch: string)` is `join(evalsHome(), "agent-config", batch)`.

- [ ] **Step 6: Run tests, type-check and lint**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals typecheck && pnpm lint`
Expected: 4 tests pass; `tsc` and `eslint` print nothing.

- [ ] **Step 7: Commit**

```bash
git add evals pnpm-workspace.yaml pnpm-lock.yaml eslint.config.mjs .prettierignore
git commit -m "feat(evals): scaffold the @peakui/evals package and its shared types"
```

---

### Task 2: Stage and pack the library tarballs

**Files:**
- Create: `evals/src/exec.ts`, `evals/src/files.ts`, `evals/src/pack/stage.ts`
- Create: `evals/fixtures/packages/acme-status/package.json`, `index.js`, `index.d.ts`
- Test: `evals/tests/files.test.ts`, `evals/tests/stage.test.ts`, `evals/tests/solutions/01-pack.test.ts`

**Interfaces:**
- Consumes: `REPO_DIR`, `PACKAGE_DIR`, `tarballsDir()`, `evalsHome()`; `ProjectFile`.
- Produces:
  - `exec.ts`: `interface ExecResult {exitCode: number | null; stdout: string; stderr: string; durationMs: number; timedOut: boolean}`; `runCommand(argv: string[], options: {cwd: string; env?: NodeJS.ProcessEnv; timeoutMs: number}): Promise<ExecResult>` — `spawn` with `shell: false`, `detached: true`, kills the process group on timeout, never rejects for a non-zero exit.
  - `files.ts`: `walkFiles(dir: string, ignore?: readonly string[]): string[]` (relative, forward slashes, sorted; `ignore` entries match a path segment, or a suffix when they start with `*`); `readFiles(dir: string, paths: string[]): ProjectFile[]`; `hashFiles(files: ProjectFile[]): string` (SHA-256 hex over `path\0text\0` in path order); `copyDir(from: string, to: string): void` (`cpSync` with `recursive`, `verbatimSymlinks`, `mode: constants.COPYFILE_FICLONE`); `redact(text: string, roots: {workspace?: string; evalsHome: string; home: string}): string`.
  - `stage.ts`: `interface PackageManifest {[key: string]: unknown}`; `rewriteReactManifest(manifest: PackageManifest, stylesVersion: string): PackageManifest`; `rewriteStylesManifest(manifest: PackageManifest): PackageManifest`; `stripCssComments(css: string): string`; `findForbidden(files: ProjectFile[]): string[]`; `interface PackResult {libraryHash: string; tarballs: {react: string; styles: string; acmeStatus: string}}`; `packLibrary(): Promise<PackResult>`.

- [ ] **Step 1: Write the failing unit tests**

`evals/tests/files.test.ts`:

```ts
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {hashFiles, redact, walkFiles} from "../src/files.ts";

describe("walkFiles", () => {
  it("lists files sorted, relative, and skips ignored segments and suffixes", () => {
    const dir = mkdtempSync(join(tmpdir(), "walk-"));

    mkdirSync(join(dir, "src/components"), {recursive: true});
    mkdirSync(join(dir, "node_modules/x"), {recursive: true});
    writeFileSync(join(dir, "src/components/B.tsx"), "b");
    writeFileSync(join(dir, "src/a.ts"), "a");
    writeFileSync(join(dir, "node_modules/x/index.js"), "x");
    writeFileSync(join(dir, "tsconfig.tsbuildinfo"), "{}");

    expect(walkFiles(dir, ["node_modules", "*.tsbuildinfo"])).toEqual([
      "src/a.ts",
      "src/components/B.tsx",
    ]);
  });
});

describe("hashFiles", () => {
  it("does not depend on input order and changes with content", () => {
    const a = {path: "a", text: "1"};
    const b = {path: "b", text: "2"};

    expect(hashFiles([a, b])).toBe(hashFiles([b, a]));
    expect(hashFiles([a, b])).not.toBe(hashFiles([a, {path: "b", text: "3"}]));
    expect(hashFiles([a, b])).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("redact", () => {
  it("replaces the workspace first, then the harness home, then the user home", () => {
    const roots = {evalsHome: "/tmp/peakui-evals", home: "/Users/jo", workspace: "/tmp/peakui-evals/workspaces/b/k"};

    expect(redact("/tmp/peakui-evals/workspaces/b/k/src/App.tsx", roots)).toBe("<workspace>/src/App.tsx");
    expect(redact("/tmp/peakui-evals/templates/vite-app", roots)).toBe("<evals-home>/templates/vite-app");
    expect(redact("cat /Users/jo/.npmrc", roots)).toBe("cat ~/.npmrc");
  });
});
```

`evals/tests/stage.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {findForbidden, rewriteReactManifest, rewriteStylesManifest, stripCssComments} from "../src/pack/stage.ts";

const react = {
  dependencies: {"@peakui/styles": "workspace:*", "tailwind-variants": "^3.3.1"},
  devDependencies: {vitest: "^3.2.4"},
  exports: {".": {default: "./src/index.ts", import: "./src/index.ts", types: "./src/index.ts"}, "./package.json": "./package.json"},
  files: ["src"],
  name: "@peakui/react",
  peerDependencies: {react: ">=19.0.0"},
  scripts: {build: "tsdown"},
  version: "0.0.0",
};

describe("rewriteReactManifest", () => {
  const out = rewriteReactManifest(react, "0.0.0");

  it("points the root export at dist", () => {
    expect(out.exports).toEqual({
      ".": {default: "./dist/index.mjs", import: "./dist/index.mjs", types: "./dist/index.d.mts"},
      "./package.json": "./package.json",
    });
    expect(out.files).toEqual(["dist"]);
  });

  it("replaces the workspace protocol and drops scripts and devDependencies", () => {
    expect(out.dependencies).toEqual({"@peakui/styles": "0.0.0", "tailwind-variants": "^3.3.1"});
    expect(out).not.toHaveProperty("scripts");
    expect(out).not.toHaveProperty("devDependencies");
    expect(out.peerDependencies).toEqual({react: ">=19.0.0"});
  });
});

describe("rewriteStylesManifest", () => {
  const out = rewriteStylesManifest({
    exports: {
      ".": {default: "./src/index.ts", import: "./src/index.ts", style: "./index.css", types: "./src/index.ts"},
      "./components/*": {default: "./src/components/*/index.ts"},
      "./components/*.css": "./components/*.css",
      "./css": {default: "./index.css", style: "./index.css"},
      "./generator": {default: "./src/generator/index.ts"},
      "./presets": {default: "./presets/index.ts"},
    },
    files: ["src", "presets", "themes", "base", "utilities", "variants", "components", "index.css"],
    name: "@peakui/styles",
    scripts: {test: "vitest run"},
  });

  it("points the root export at dist and keeps the CSS exports", () => {
    const exports = out.exports as Record<string, unknown>;

    expect(exports["."]).toEqual({default: "./dist/index.js", import: "./dist/index.js", style: "./index.css", types: "./dist/index.d.ts"});
    expect(exports["./css"]).toEqual({default: "./index.css", style: "./index.css"});
    expect(exports["./components/*.css"]).toBe("./components/*.css");
  });

  it("drops the TypeScript-only entry points", () => {
    const exports = out.exports as Record<string, unknown>;

    expect(exports).not.toHaveProperty("./components/*");
    expect(exports).not.toHaveProperty("./generator");
    expect(exports).not.toHaveProperty("./presets");
    expect(out.files).toEqual(["dist", "themes", "base", "utilities", "variants", "components", "index.css"]);
  });
});

describe("stripCssComments", () => {
  it("removes every comment and keeps the rules", () => {
    const css = '/* contract */\n@import "./a.css";\n.button {\n  /* why */\n  color: red;\n}\n';
    const out = stripCssComments(css);

    expect(out).not.toContain("/*");
    expect(out).toContain('@import "./a.css";');
    expect(out).toContain("color: red;");
  });
});

describe("findForbidden", () => {
  it("returns the paths that name the reference library, in any case", () => {
    const hit = ["Hero", "UI"].join("");

    expect(
      findForbidden([
        {path: "index.css", text: `/* like @${hit.toLowerCase()}/styles */`},
        {path: "dist/index.js", text: "export {};"},
        {path: "dist/a.d.ts", text: `// ${hit} v3`},
      ]),
    ).toEqual(["dist/a.d.ts", "index.css"]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test`
Expected: FAIL — `Cannot find module '../src/files.ts'` and `'../src/pack/stage.ts'`.

- [ ] **Step 3: Implement `exec.ts` and `files.ts`** to the signatures in Interfaces.

`redact` replaces longest root first: `workspace` → `<workspace>`, `evalsHome` → `<evals-home>`, `home` → `~`. Each root is also replaced in its `realpathSync` form when that differs (on macOS the temp directory is reached through `/private`).

- [ ] **Step 4: Implement the pure functions of `stage.ts`**

`findForbidden` tests `/hero\s?ui/i` and returns sorted paths. `stripCssComments` parses with `postcss.parse`, removes every node from `walkComments`, and returns `root.toString()`. The manifest functions return a new object and never mutate the argument; the exact output values are the ones asserted in the tests.

- [ ] **Step 5: Create the `@acme/status` package**

`evals/fixtures/packages/acme-status/package.json`:

```json
{
  "name": "@acme/status",
  "version": "1.4.0",
  "description": "Shared status badge used across Acme apps.",
  "type": "module",
  "exports": {".": {"types": "./index.d.ts", "default": "./index.js"}},
  "files": ["index.js", "index.d.ts"],
  "peerDependencies": {"react": ">=19.0.0"}
}
```

`index.js`:

```js
import {jsx} from "react/jsx-runtime";

const tone = {
  active: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  paused: "bg-amber-100 text-amber-800 ring-amber-600/20",
  archived: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function StatusBadge({status}) {
  return jsx("span", {
    className: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tone[status]}`,
    "data-status": status,
    children: status,
  });
}
```

`index.d.ts`:

```ts
import type {JSX} from "react";

export type Status = "active" | "paused" | "archived";

export interface StatusBadgeProps {
  status: Status;
}

export declare function StatusBadge(props: StatusBadgeProps): JSX.Element;
```

- [ ] **Step 6: Write the failing pack test**

`evals/tests/solutions/01-pack.test.ts`:

```ts
import {existsSync} from "node:fs";

import {beforeAll, describe, expect, it} from "vitest";

import {runCommand} from "../../src/exec.ts";
import {type PackResult, packLibrary} from "../../src/pack/stage.ts";

async function listing(tarball: string): Promise<string[]> {
  const result = await runCommand(["tar", "-tzf", tarball], {cwd: process.cwd(), timeoutMs: 30_000});

  return result.stdout.trim().split("\n");
}

describe("packLibrary", () => {
  let pack: PackResult;

  beforeAll(async () => {
    pack = await packLibrary();
  });

  it("writes three tarballs and a 64-character hash", () => {
    expect(existsSync(pack.tarballs.react)).toBe(true);
    expect(existsSync(pack.tarballs.styles)).toBe(true);
    expect(existsSync(pack.tarballs.acmeStatus)).toBe(true);
    expect(pack.libraryHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ships dist and no sources in @peakui/react", async () => {
    const files = await listing(pack.tarballs.react);

    expect(files).toContain("package/dist/index.mjs");
    expect(files).toContain("package/dist/index.d.mts");
    expect(files.filter((file) => file.startsWith("package/src/"))).toEqual([]);
    expect(files.filter((file) => file.includes(".stories."))).toEqual([]);
  });

  it("ships dist and the stylesheets in @peakui/styles", async () => {
    const files = await listing(pack.tarballs.styles);

    expect(files).toContain("package/dist/index.js");
    expect(files).toContain("package/dist/index.d.ts");
    expect(files).toContain("package/index.css");
    expect(files).toContain("package/components/button.css");
    expect(files.filter((file) => file.startsWith("package/src/"))).toEqual([]);
  });

  it("is stable: a second pack has the same hash", async () => {
    expect((await packLibrary()).libraryHash).toBe(pack.libraryHash);
  });
});
```

Run: `pnpm --filter @peakui/evals test:solutions -- 01-pack`
Expected: FAIL — `packLibrary is not a function`.

- [ ] **Step 7: Implement `packLibrary()`**

Stage under `join(evalsHome(), "stage")`, emptied first. The `tsdown` binary is `join(PACKAGE_DIR, "node_modules/.bin/tsdown")`.

1. React: `runCommand([tsdown, "--out-dir", "<stage>/react/dist"], {cwd: "<REPO_DIR>/packages/react"})` — the package's own `tsdown.config.ts` applies.
2. Styles: `runCommand([tsdown, "src/index.ts", "--no-config", "--format", "esm", "--dts", "--unbundle", "--platform", "neutral", "--out-dir", "<stage>/styles/dist"], {cwd: "<REPO_DIR>/packages/styles"})`; copy `index.css`, `base`, `components`, `themes`, `utilities`, `variants` into `<stage>/styles`; rewrite every staged `.css` file with `stripCssComments`.
3. Write both rewritten manifests (the styles version read from its own `package.json`).
4. Copy `fixtures/packages/acme-status` to `<stage>/acme-status`.
5. Read all staged files; throw `Error("staged files name the reference library: <paths>")` when `findForbidden` returns any; `libraryHash = hashFiles(...)`.
6. `npm pack --pack-destination <tarballsDir()>` in each staged directory; the tarball path is `join(tarballsDir(), <last line of stdout>)`.

A non-zero exit of any command throws with that command's stderr.

- [ ] **Step 8: Run all tests**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals test:solutions -- 01-pack && git status --short packages apps`
Expected: unit tests pass; 4 pack tests pass; `git status` prints nothing (the packages were not touched).

- [ ] **Step 9: Commit**

```bash
git add evals
git commit -m "feat(evals): stage dist-based tarballs of the unpublished packages"
```

---

### Task 3: Fixtures and templates

**Files:**
- Create: `evals/fixtures/index.ts`
- Create: `evals/fixtures/vite-app/` — `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- Create: `evals/fixtures/next-app/` — `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `lib/plan.ts`, `data/plan.json`
- Create: `evals/src/fixtures/prepare.ts`
- Test: `evals/tests/fixtures.test.ts`, `evals/tests/solutions/02-templates.test.ts`

**Interfaces:**
- Consumes: `PackResult`, `PackageManifest`, `walkFiles`, `readFiles`, `hashFiles`, `copyDir`, `runCommand`, `templatesDir()`.
- Produces:
  - `fixtures/index.ts`: `fixtures: Record<string, FixtureDefinition>` with keys `vite-app` and `next-app`; `getFixture(id: string): FixtureDefinition` (throws on an unknown id); `SNAPSHOT_IGNORE: readonly string[]` = `["node_modules", "dist", ".next", ".git", "vendor", "package-lock.json", "next-env.d.ts", "*.tsbuildinfo"]`.
  - `prepare.ts`: `interface TemplateInfo {fixture: string; dir: string; fixtureHash: string; libraryHash: string; reused: boolean}`; `fixtureHash(fixture: FixtureDefinition): string`; `templateIsCurrent(sidecar: unknown, fixtureHash: string, libraryHash: string): boolean`; `withTarballDependencies(manifest: PackageManifest, tarballs: PackResult["tarballs"]): PackageManifest`; `prepareTemplate(fixture: FixtureDefinition, pack: PackResult, options: {force: boolean}): Promise<TemplateInfo>`; `readTemplate(fixture: FixtureDefinition): TemplateInfo | undefined`.

- [ ] **Step 1: Create the `vite-app` fixture**

`package.json`:

```json
{
  "name": "acme-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@acme/status": "file:./vendor/acme-status-1.4.0.tgz",
    "@peakui/react": "file:./vendor/peakui-react-0.0.0.tgz",
    "@peakui/styles": "file:./vendor/peakui-styles-0.0.0.tgz",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.3.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.1",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3",
    "vite": "8.3.1"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`vite.config.ts`:

```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Acme Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`.gitignore`:

```
node_modules
dist
*.tsbuildinfo
```

`src/index.css`:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
```

`src/main.tsx`:

```tsx
import {StrictMode} from "react";
import {createRoot} from "react-dom/client";

import {App} from "./App";

import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
    </main>
  );
}
```

- [ ] **Step 2: Create the `next-app` fixture**

`package.json`:

```json
{
  "name": "acme-site",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@peakui/react": "file:./vendor/peakui-react-0.0.0.tgz",
    "@peakui/styles": "file:./vendor/peakui-styles-0.0.0.tgz",
    "next": "16.3.6",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.3.3",
    "@types/node": "24.19.0",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "tailwindcss": "4.3.3",
    "typescript": "5.9.3"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type {NextConfig} from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

`postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

`.gitignore`:

```
node_modules
.next
next-env.d.ts
*.tsbuildinfo
```

`app/globals.css`:

```css
@import "tailwindcss";
```

`app/layout.tsx`:

```tsx
import type {Metadata} from "next";
import type {ReactNode} from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Acme",
  description: "Acme team workspace",
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/page.tsx`:

```tsx
import {getPlan} from "@/lib/plan";

export default async function Home() {
  const plan = await getPlan();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Acme</h1>
      <p>
        Plan: {plan.name} ({plan.seats} seats)
      </p>
    </main>
  );
}
```

`lib/plan.ts`:

```ts
import {readFile} from "node:fs/promises";
import {join} from "node:path";

export interface Plan {
  name: string;
  seats: number;
}

export async function getPlan(): Promise<Plan> {
  const raw = await readFile(join(process.cwd(), "data", "plan.json"), "utf8");

  return JSON.parse(raw) as Plan;
}
```

`data/plan.json`: `{"name": "Team", "seats": 12}`

- [ ] **Step 3: Write `evals/fixtures/index.ts`**

```ts
import type {FixtureDefinition} from "../src/types.ts";

import {join} from "node:path";

export const SNAPSHOT_IGNORE: readonly string[] = [
  "node_modules",
  "dist",
  ".next",
  ".git",
  "vendor",
  "package-lock.json",
  "next-env.d.ts",
  "*.tsbuildinfo",
];

const TSC = ["node_modules/.bin/tsc", "--noEmit", "--pretty", "false"];

export const fixtures: Record<string, FixtureDefinition> = {
  "next-app": {
    build: [["node_modules/.bin/next", "build"]],
    builtCssDir: ".next/static",
    clean: [".next"],
    dir: join(import.meta.dirname, "next-app"),
    id: "next-app",
    prepare: [["node_modules/.bin/next", "typegen"]],
    typecheck: [["node_modules/.bin/next", "typegen"], TSC],
  },
  "vite-app": {
    build: [["node_modules/.bin/vite", "build"]],
    builtCssDir: "dist/assets",
    clean: ["dist"],
    dir: join(import.meta.dirname, "vite-app"),
    id: "vite-app",
    prepare: [],
    typecheck: [TSC],
  },
};

export function getFixture(id: string): FixtureDefinition {
  const fixture = fixtures[id];

  if (!fixture) {
    throw new Error(`unknown fixture "${id}"; known: ${Object.keys(fixtures).join(", ")}`);
  }

  return fixture;
}
```

- [ ] **Step 4: Write the failing unit tests**

`evals/tests/fixtures.test.ts`:

```ts
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {fixtures, getFixture} from "../fixtures/index.ts";
import {readFiles, walkFiles} from "../src/files.ts";
import {fixtureHash, templateIsCurrent, withTarballDependencies} from "../src/fixtures/prepare.ts";

const OTHER_LIBRARIES =
  /hero\s?ui|next\s?ui|shadcn|radix|material[- ]ui|\bmui\b|chakra|mantine|ant design|\bantd\b|daisy\s?ui|headless ui|bootstrap/i;

describe("fixtures", () => {
  it.each(Object.values(fixtures))("$id names no UI library other than PeakUI", (fixture) => {
    const files = readFiles(fixture.dir, walkFiles(fixture.dir));

    expect(files.length).toBeGreaterThan(5);
    expect(files.filter((file) => OTHER_LIBRARIES.test(file.text)).map((file) => file.path)).toEqual([]);
  });

  it.each(Object.values(fixtures))("$id carries no agent file and no readme", (fixture) => {
    const names = walkFiles(fixture.dir).map((path) => path.toLowerCase());

    expect(names.filter((name) => /(^|\/)(agents\.md|claude\.md|readme\.md|\.mcp\.json)$/.test(name))).toEqual([]);
    expect(names.filter((name) => name.startsWith(".claude/") || name.startsWith(".cursor/"))).toEqual([]);
  });

  it("vite-app starts with PeakUI wired and no PeakUI component in use", () => {
    const [css, app] = readFiles(fixtures["vite-app"]!.dir, ["src/index.css", "src/App.tsx"]);

    expect(css!.text.indexOf("tailwindcss")).toBeLessThan(css!.text.indexOf("@peakui/styles/css"));
    expect(app!.text).not.toContain("@peakui/react");
  });

  it("next-app starts with PeakUI not wired", () => {
    const files = readFiles(fixtures["next-app"]!.dir, walkFiles(fixtures["next-app"]!.dir));

    expect(files.filter((file) => file.path !== "package.json" && file.text.includes("@peakui")).map((f) => f.path)).toEqual([]);
  });

  it("the shared-package stand-in names no UI library", () => {
    const dir = join(import.meta.dirname, "../fixtures/packages/acme-status");
    const files = readFiles(dir, walkFiles(dir));

    expect(files).toHaveLength(3);
    expect(files.filter((file) => OTHER_LIBRARIES.test(file.text) || /peakui/i.test(file.text)).map((file) => file.path)).toEqual([]);
  });

  it("rejects an unknown fixture", () => {
    expect(() => getFixture("nope")).toThrow(/unknown fixture "nope"/);
  });
});

describe("templates", () => {
  it("fixtureHash is stable and 64 hex characters", () => {
    const fixture = fixtures["vite-app"]!;

    expect(fixtureHash(fixture)).toBe(fixtureHash(fixture));
    expect(fixtureHash(fixture)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("templateIsCurrent needs both hashes to match", () => {
    const sidecar = {fixtureHash: "f", libraryHash: "l"};

    expect(templateIsCurrent(sidecar, "f", "l")).toBe(true);
    expect(templateIsCurrent(sidecar, "f", "other")).toBe(false);
    expect(templateIsCurrent(sidecar, "other", "l")).toBe(false);
    expect(templateIsCurrent(undefined, "f", "l")).toBe(false);
    expect(templateIsCurrent("not an object", "f", "l")).toBe(false);
  });

  it("withTarballDependencies points each packed dependency at its tarball in vendor/", () => {
    const out = withTarballDependencies(
      {dependencies: {"@acme/status": "x", "@peakui/react": "x", "@peakui/styles": "x", react: "19.3.0"}},
      {acmeStatus: "/t/acme-status-1.4.0.tgz", react: "/t/peakui-react-0.1.0.tgz", styles: "/t/peakui-styles-0.1.0.tgz"},
    );

    expect(out.dependencies).toEqual({
      "@acme/status": "file:./vendor/acme-status-1.4.0.tgz",
      "@peakui/react": "file:./vendor/peakui-react-0.1.0.tgz",
      "@peakui/styles": "file:./vendor/peakui-styles-0.1.0.tgz",
      react: "19.3.0",
    });
  });

  it("withTarballDependencies does not add a dependency the fixture does not declare", () => {
    const out = withTarballDependencies(
      {dependencies: {"@peakui/react": "x", "@peakui/styles": "x"}},
      {acmeStatus: "/t/acme-status-1.4.0.tgz", react: "/t/r.tgz", styles: "/t/s.tgz"},
    );

    expect(out.dependencies).not.toHaveProperty("@acme/status");
  });
});
```

Run: `pnpm --filter @peakui/evals test`
Expected: FAIL — `Cannot find module '../src/fixtures/prepare.ts'`.

- [ ] **Step 5: Implement `prepare.ts`**

`fixtureHash` is `hashFiles(readFiles(dir, walkFiles(dir)))` plus the fixture's `prepare`, `typecheck` and `build` commands serialized into the hashed input. `prepareTemplate`:

1. Template directory `join(templatesDir(), fixture.id)`, sidecar `join(templatesDir(), fixture.id + ".json")`.
2. When not `force` and `templateIsCurrent(sidecar, …)`, return `{…, reused: true}`.
3. Otherwise remove the directory, `copyDir(fixture.dir, dir)`, copy the tarballs the fixture depends on into `dir/vendor/`, write `package.json` through `withTarballDependencies`.
4. `runCommand(["npm", "install", "--no-audit", "--no-fund"], {cwd: dir, timeoutMs: 600_000})`, then each `fixture.prepare` command. A non-zero exit throws with stderr and leaves no sidecar.
5. Write the sidecar `{fixture, fixtureHash, libraryHash, node: process.version, npm: <npm --version>, createdAt}` and return `reused: false`.

`readTemplate` returns the info from the sidecar when the directory exists, else `undefined`.

- [ ] **Step 6: Write the failing template test**

`evals/tests/solutions/02-templates.test.ts`:

```ts
import {existsSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {fixtures} from "../../fixtures/index.ts";
import {type TemplateInfo, prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";

describe.each(Object.values(fixtures))("template $id", (fixture) => {
  let template: TemplateInfo;

  beforeAll(async () => {
    template = await prepareTemplate(fixture, await packLibrary(), {force: false});
  });

  it("installs the staged packages, not sources", () => {
    expect(existsSync(join(template.dir, "node_modules/@peakui/react/dist/index.mjs"))).toBe(true);
    expect(existsSync(join(template.dir, "node_modules/@peakui/react/src"))).toBe(false);
    expect(existsSync(join(template.dir, "node_modules/@peakui/styles/index.css"))).toBe(true);
  });

  it("installs the peers without the fixture declaring them", () => {
    expect(existsSync(join(template.dir, "node_modules/react-aria-components/package.json"))).toBe(true);
    expect(existsSync(join(template.dir, "node_modules/@react-aria/utils/package.json"))).toBe(true);
  });

  it("writes a lockfile and is reused on the second call", async () => {
    expect(existsSync(join(template.dir, "package-lock.json"))).toBe(true);
    expect((await prepareTemplate(fixture, await packLibrary(), {force: false})).reused).toBe(true);
  });
});
```

- [ ] **Step 7: Run all tests**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals test:solutions -- 02-templates`
Expected: unit tests pass; 6 template tests pass. The first run installs from the network and takes about four minutes; a rerun takes seconds.

- [ ] **Step 8: Commit**

```bash
git add evals
git commit -m "feat(evals): add the consumer fixtures and their installed templates"
```

---

### Task 4: Workspaces

**Files:**
- Create: `evals/src/workspace/workspace.ts`
- Test: `evals/tests/workspace.test.ts`

**Interfaces:**
- Consumes: `walkFiles`, `readFiles`, `copyDir`, `runCommand`, `SNAPSHOT_IGNORE`, `workspacesDir()`, `PACKAGE_DIR`, `TemplateInfo`, `TaskDefinition`, `FileChanges`, `ProjectFile`, `StaticContext`.
- Produces:
  - `AGENT_FILES: readonly string[]` = `["CLAUDE.md", "AGENTS.md", ".claude", ".mcp.json", ".cursor", ".agents"]`
  - `assertIsolated(dir: string): void` — throws when any ancestor of `dir` (not `dir` itself) contains one of `AGENT_FILES`; the message names the path found.
  - `interface Workspace {dir: string; scratchDir: string}`
  - `createWorkspace(options: {templateDir: string; overlayDir: string | undefined; batch: string; key: string}): Workspace` — `dir` is `join(workspacesDir(), batch, key, "app")`, `scratchDir` is `join(workspacesDir(), batch, key, "scratch")`; calls `assertIsolated(dir)` first; removes a leftover directory; copies the template, then the overlay.
  - `overlayDirOf(task: TaskDefinition): string | undefined` — `join(PACKAGE_DIR, "tasks", task.id, "overlay")` when it exists.
  - `commitInitialState(dir: string): Promise<void>` — `git init -q`, `git add -A`, `git -c user.name="Acme Dev" -c user.email=dev@acme.example commit -q -m "Initial commit"`.
  - `snapshot(dir: string): Map<string, string>` — path to SHA-256 of content, skipping `SNAPSHOT_IGNORE`.
  - `diffSnapshots(before: Map<string, string>, after: Map<string, string>): FileChanges` — each list sorted.
  - `projectFiles(dir: string): ProjectFile[]` — files outside `SNAPSHOT_IGNORE` ending in `.ts`, `.tsx` or `.css`.
  - `staticContext(dir: string, changes: FileChanges): StaticContext`
  - `removeWorkspace(workspace: Workspace): void`

- [ ] **Step 1: Write the failing tests**

`evals/tests/workspace.test.ts`:

```ts
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {runCommand} from "../src/exec.ts";
import {
  assertIsolated,
  commitInitialState,
  createWorkspace,
  diffSnapshots,
  projectFiles,
  snapshot,
  staticContext,
} from "../src/workspace/workspace.ts";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "ws-"));
  process.env.PEAKUI_EVALS_HOME = join(root, "home");
});

afterEach(() => {
  delete process.env.PEAKUI_EVALS_HOME;
  rmSync(root, {force: true, recursive: true});
});

function write(path: string, text: string): void {
  mkdirSync(join(path, ".."), {recursive: true});
  writeFileSync(path, text);
}

describe("assertIsolated", () => {
  it.each(["CLAUDE.md", "AGENTS.md", ".mcp.json"])("rejects an ancestor holding %s", (name) => {
    write(join(root, name), "x");

    expect(() => assertIsolated(join(root, "a/b/app"))).toThrow(name);
  });

  it("rejects an ancestor holding a .claude directory", () => {
    mkdirSync(join(root, "a/.claude"), {recursive: true});

    expect(() => assertIsolated(join(root, "a/b/app"))).toThrow(".claude");
  });

  it("accepts a clean chain and ignores agent files inside the workspace itself", () => {
    write(join(root, "a/b/app/AGENTS.md"), "written by a configuration");

    expect(() => assertIsolated(join(root, "a/b/app"))).not.toThrow();
  });
});

describe("createWorkspace", () => {
  it("copies the template, lays the overlay over it and makes a scratch directory", () => {
    write(join(root, "template/src/App.tsx"), "base");
    write(join(root, "template/src/index.css"), "css");
    write(join(root, "overlay/src/App.tsx"), "overlaid");
    write(join(root, "overlay/src/components/Hero.tsx"), "hero");

    const workspace = createWorkspace({batch: "b1", key: "t__none__r1", overlayDir: join(root, "overlay"), templateDir: join(root, "template")});

    expect(workspace.dir).toBe(join(root, "home/workspaces/b1/t__none__r1/app"));
    expect(readFileSync(join(workspace.dir, "src/App.tsx"), "utf8")).toBe("overlaid");
    expect(readFileSync(join(workspace.dir, "src/index.css"), "utf8")).toBe("css");
    expect(existsSync(join(workspace.dir, "src/components/Hero.tsx"))).toBe(true);
    expect(existsSync(workspace.scratchDir)).toBe(true);
  });

  it("replaces a leftover workspace of the same key", () => {
    write(join(root, "template/a.ts"), "a");
    const options = {batch: "b1", key: "k", overlayDir: undefined, templateDir: join(root, "template")};
    const first = createWorkspace(options);

    write(join(first.dir, "stale.ts"), "stale");

    expect(existsSync(join(createWorkspace(options).dir, "stale.ts"))).toBe(false);
  });
});

describe("snapshot and diff", () => {
  it("reports added, modified and deleted files and skips ignored paths", () => {
    const dir = join(root, "app");

    write(join(dir, "src/keep.ts"), "keep");
    write(join(dir, "src/change.ts"), "one");
    write(join(dir, "src/remove.ts"), "gone");
    write(join(dir, "node_modules/x/index.js"), "x");

    const before = snapshot(dir);

    write(join(dir, "src/change.ts"), "two");
    write(join(dir, "src/new.tsx"), "new");
    write(join(dir, "dist/out.css"), "built");
    write(join(dir, "node_modules/x/index.js"), "changed");
    rmSync(join(dir, "src/remove.ts"));

    expect(diffSnapshots(before, snapshot(dir))).toEqual({
      added: ["src/new.tsx"],
      deleted: ["src/remove.ts"],
      modified: ["src/change.ts"],
    });
  });
});

describe("projectFiles and staticContext", () => {
  it("returns only ts, tsx and css files outside ignored directories", () => {
    const dir = join(root, "app");

    write(join(dir, "src/a.tsx"), "a");
    write(join(dir, "src/b.css"), "b");
    write(join(dir, "package.json"), "{}");
    write(join(dir, "node_modules/x/index.ts"), "x");

    expect(projectFiles(dir).map((file) => file.path)).toEqual(["src/a.tsx", "src/b.css"]);

    const context = staticContext(dir, {added: ["src/a.tsx"], deleted: [], modified: []});

    expect(context.file("src/a.tsx")?.text).toBe("a");
    expect(context.file("missing.ts")).toBeUndefined();
  });
});

describe("commitInitialState", () => {
  it("leaves a repository with one commit and a clean tree", async () => {
    const dir = join(root, "app");

    write(join(dir, "src/a.ts"), "a");
    write(join(dir, ".gitignore"), "node_modules\n");
    await commitInitialState(dir);

    const log = await runCommand(["git", "log", "--oneline"], {cwd: dir, timeoutMs: 10_000});
    const status = await runCommand(["git", "status", "--porcelain"], {cwd: dir, timeoutMs: 10_000});

    expect(log.stdout.trim().split("\n")).toHaveLength(1);
    expect(log.stdout).toContain("Initial commit");
    expect(status.stdout).toBe("");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @peakui/evals test -- workspace`
Expected: FAIL — `Cannot find module '../src/workspace/workspace.ts'`.

- [ ] **Step 3: Implement `workspace.ts`** to the signatures in Interfaces.

`assertIsolated` walks `dirname` upward from `dirname(dir)` until the path stops changing.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @peakui/evals test -- workspace`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add evals
git commit -m "feat(evals): create isolated workspaces with snapshots of what changed"
```

---

### Task 5: Type-check and build layers

**Files:**
- Create: `evals/src/scoring/findings.ts`, `evals/src/scoring/commands.ts`
- Test: `evals/tests/findings.test.ts`, `evals/tests/commands.test.ts`

**Interfaces:**
- Consumes: `Finding`, `LayerResult`, `LayerId`, `PitfallId`, `FixtureDefinition`, `runCommand`.
- Produces:
  - `findings.ts`:
    - `interface Location {file?: string; line?: number; excerpt?: string}`
    - `check(rule: string, pitfall: PitfallId, ok: boolean, message: string, at?: Location): Finding` — `gate: true`, `pass: ok`
    - `info(rule: string, pitfall: PitfallId, ok: boolean, message: string): Finding` — `gate: false`
    - `cssUnavailable(): Finding` — `check("built-css-unavailable", "other", false, "the build produced no CSS")`
    - `layerResult(layer: LayerId, findings: Finding[], durationMs: number): LayerResult` — `fail` when any finding has `gate && !pass`, else `pass`
    - `notApplicable(layer: LayerId): LayerResult`
  - `commands.ts`:
    - `interface Diagnostic {file: string; line: number; column: number; code: string; message: string}`
    - `parseTscOutput(output: string): Diagnostic[]`
    - `classifyDiagnostic(message: string): {rule: string; pitfall: PitfallId}`
    - `classifyBuildOutput(output: string): Finding[]`
    - `cleanBuildOutput(fixture: FixtureDefinition, dir: string): void`
    - `runTypecheck(fixture: FixtureDefinition, dir: string, logPath: string): Promise<LayerResult>`
    - `runBuild(fixture: FixtureDefinition, dir: string, logPath: string): Promise<LayerResult>`

- [ ] **Step 1: Write the failing tests**

`evals/tests/findings.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {check, info, layerResult, notApplicable} from "../src/scoring/findings.ts";

describe("layerResult", () => {
  it("fails when a gating finding failed", () => {
    const result = layerResult("static", [check("a", "other", true, "ok"), check("b", "fields", false, "no")], 5);

    expect(result).toMatchObject({durationMs: 5, layer: "static", status: "fail"});
  });

  it("passes when only informational findings failed", () => {
    expect(layerResult("render", [info("uses-component-variables", "styling", false, "no")], 1).status).toBe("pass");
  });

  it("passes with no findings and reports not-applicable separately", () => {
    expect(layerResult("build", [], 0).status).toBe("pass");
    expect(notApplicable("render")).toEqual({durationMs: 0, findings: [], layer: "render", status: "not-applicable"});
  });

  it("check carries its location", () => {
    expect(check("r", "imports", false, "m", {excerpt: "x", file: "src/a.tsx", line: 3})).toEqual({
      excerpt: "x", file: "src/a.tsx", gate: true, line: 3, message: "m", pass: false, pitfall: "imports", rule: "r",
    });
  });
});
```

`evals/tests/commands.test.ts`:

```ts
import {existsSync, mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {classifyBuildOutput, classifyDiagnostic, cleanBuildOutput, parseTscOutput} from "../src/scoring/commands.ts";

const TSC_OUTPUT = [
  `src/a.tsx(2,9): error TS2305: Module '"@peakui/react"' has no exported member 'PeakUIProvider'.`,
  `src/a.tsx(3,28): error TS2307: Cannot find module '@peakui/react/button' or its corresponding type declarations.`,
  `src/a.tsx(7,25): error TS2322: Type '{ label: string; isRequired: true; errorMessage: string; }' is not assignable to type 'IntrinsicAttributes & InputRootProps'.`,
  `  Property 'label' does not exist on type 'IntrinsicAttributes & InputRootProps'.`,
  `src/b.tsx(10,41): error TS2322: Type '"bordered"' is not assignable to type '"danger" | "danger-soft" | "ghost" | "outline" | "primary" | "secondary" | "tertiary" | undefined'.`,
].join("\n");

describe("parseTscOutput", () => {
  const diagnostics = parseTscOutput(TSC_OUTPUT);

  it("reads file, position and code", () => {
    expect(diagnostics).toHaveLength(4);
    expect(diagnostics[0]).toMatchObject({code: "TS2305", column: 9, file: "src/a.tsx", line: 2});
    expect(diagnostics[3]).toMatchObject({file: "src/b.tsx", line: 10});
  });

  it("joins indented continuation lines into the message", () => {
    expect(diagnostics[2]!.message).toContain("Property 'label' does not exist");
  });

  it("returns nothing for output without diagnostics", () => {
    expect(parseTscOutput("")).toEqual([]);
    expect(parseTscOutput("Generating route types...\n✓ Types generated successfully")).toEqual([]);
  });
});

describe("classifyDiagnostic", () => {
  it.each([
    ["Module '\"@peakui/react\"' has no exported member 'PeakUIProvider'.", "provider", "no-provider"],
    ["Module '\"@peakui/react\"' has no exported member 'Card'.", "unknown-export", "imports"],
    ["Cannot find module '@peakui/react/button' or its corresponding type declarations.", "deep-import", "imports"],
    ["Type '{…}' is not assignable.\n  Property 'label' does not exist on type 'IntrinsicAttributes & InputRootProps'.", "unknown-composition-prop", "composition"],
    ["Property 'as' does not exist on type 'IntrinsicAttributes & ButtonRootProps'.", "unknown-composition-prop", "composition"],
    ["Property 'classNames' does not exist on type 'X'. Did you mean 'className'?", "unknown-composition-prop", "composition"],
    ["Property 'startContent' does not exist on type 'X'.", "unknown-composition-prop", "composition"],
    ["Property 'isLoading' does not exist on type 'IntrinsicAttributes & ButtonRootProps'.", "unknown-state-prop", "rac-props"],
    ["Property 'disabled' does not exist on type 'X'. Did you mean 'isDisabled'?", "unknown-state-prop", "rac-props"],
    ["Type '\"bordered\"' is not assignable to type '\"danger\" | \"danger-soft\" | \"ghost\" | undefined'.", "unknown-variant", "variants"],
    ["Type '\"small\"' is not assignable to type '\"lg\" | \"md\" | \"sm\" | undefined'.", "unknown-variant", "variants"],
    ["Property 'radius' does not exist on type 'X'.", "unknown-variant", "variants"],
    ["Type 'number' is not assignable to type 'string'.", "type-error", "other"],
  ])("%s -> %s", (message, rule, pitfall) => {
    expect(classifyDiagnostic(message)).toEqual({pitfall, rule});
  });
});

describe("classifyBuildOutput", () => {
  it("recognises a function crossing the server boundary", () => {
    const [event] = classifyBuildOutput("Error: Event handlers cannot be passed to Client Component props.");
    const [fn] = classifyBuildOutput("Error: Functions cannot be passed directly to Client Components unless you explicitly expose it");

    expect(event).toMatchObject({gate: true, pass: false, pitfall: "peers-rsc", rule: "function-across-server-boundary"});
    expect(fn).toMatchObject({rule: "function-across-server-boundary"});
  });

  it("recognises PeakUI styles compiled without Tailwind", () => {
    expect(classifyBuildOutput("Error: Cannot apply unknown utility class `gap-2`")[0]).toMatchObject({
      pitfall: "css-order", rule: "styles-without-tailwind",
    });
  });

  it("falls back to one build-error finding carrying the first error line", () => {
    const findings = classifyBuildOutput("vite v8\nerror during build:\nBuild failed with 1 error:\nsomething else");

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({pitfall: "other", rule: "build-error"});
    expect(findings[0]!.message).toContain("error during build");
  });

  it("reports each known rule once", () => {
    const line = "Error: Event handlers cannot be passed to Client Component props.";

    expect(classifyBuildOutput(`${line}\n${line}`)).toHaveLength(1);
  });
});

describe("cleanBuildOutput", () => {
  it("removes the fixture's output directories and nothing else", () => {
    const dir = mkdtempSync(join(tmpdir(), "clean-"));

    mkdirSync(join(dir, "dist/assets"), {recursive: true});
    mkdirSync(join(dir, "src"));
    writeFileSync(join(dir, "dist/assets/stale.css"), ".button{}");
    writeFileSync(join(dir, "src/a.ts"), "a");

    cleanBuildOutput({build: [], builtCssDir: "dist/assets", clean: ["dist"], dir: "", id: "x", prepare: [], typecheck: []}, dir);

    expect(existsSync(join(dir, "dist"))).toBe(false);
    expect(existsSync(join(dir, "src/a.ts"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- findings commands`
Expected: FAIL — `Cannot find module '../src/scoring/findings.ts'`.

- [ ] **Step 3: Implement `findings.ts`** to the signatures in Interfaces.

- [ ] **Step 4: Implement `commands.ts`**

`parseTscOutput`: a diagnostic starts at a line matching `/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/`; each following line that starts with whitespace is appended to its message with `\n`.

`classifyDiagnostic` tests in this order and returns the first match (spec 8.2):

| Pattern | Result |
| --- | --- |
| `/has no exported member '\w*Provider'/` | `provider`, `no-provider` |
| `/Cannot find module '@peakui\/(react\|styles)\//` | `deep-import`, `imports` |
| `/Module '"@peakui\/[^"]+"' has no exported member/` | `unknown-export`, `imports` |
| `/Property '(as\|classNames\|label\|errorMessage\|description\|helperText\|startContent\|endContent\|labelPlacement)' does not exist/` | `unknown-composition-prop`, `composition` |
| `/Property '(isLoading\|loading\|disabled\|readOnly\|required\|onClick\|isDisable)' does not exist/` | `unknown-state-prop`, `rac-props` |
| `/Property '(color\|radius\|colorScheme)' does not exist/` or `/^Type '"[^"]*"' is not assignable to type '"[^']*" \| /` | `unknown-variant`, `variants` |
| otherwise | `type-error`, `other` |

`classifyBuildOutput`: `/Event handlers cannot be passed to Client Component props|Functions cannot be passed directly to Client Components/` → `function-across-server-boundary`, `peers-rsc`; `/Cannot apply unknown utility class/` → `styles-without-tailwind`, `css-order`. Each known rule at most once, message = the matching line trimmed to 300 characters. When none matched, one `build-error` finding whose message is the first line containing `error` (case-insensitive), or the last non-empty line.

`runTypecheck`: run each `fixture.typecheck` command in order with `timeoutMs: 180_000` and env `{...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1"}`; write the combined stdout and stderr to `logPath`. One failed finding per diagnostic: rule and pitfall from `classifyDiagnostic`, `file`, `line`, message = first 300 characters, `excerpt` = that line of the file, trimmed, when readable. When a command exits non-zero with no diagnostic, one `type-error` finding with the last non-empty output line. A timeout is a `type-error` finding with message `type-check timed out`.

`runBuild`: same shape with `fixture.build`, `timeoutMs: 300_000`; on a non-zero exit the findings are `classifyBuildOutput(output)`.

Neither function cleans output: `scoreWorkspace` (Task 8) calls `cleanBuildOutput` once before both.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @peakui/evals test -- findings commands`
Expected: PASS — 4 + 21 tests.

- [ ] **Step 6: Commit**

```bash
git add evals
git commit -m "feat(evals): score type-check and build, classifying their errors by pitfall"
```

---

### Task 6: Static layer — AST and CSS helpers, shared detectors

**Files:**
- Create: `evals/src/scoring/ast.ts`, `evals/src/scoring/css.ts`, `evals/src/scoring/detectors.ts`, `evals/src/scoring/static.ts`
- Test: `evals/tests/ast.test.ts`, `evals/tests/css.test.ts`, `evals/tests/detectors.test.ts`, `evals/tests/static.test.ts`

**Interfaces:**
- Consumes: `check`, `layerResult`, `ProjectFile`, `StaticContext`, `TaskDefinition`, `Finding`.
- Produces:
  - `ast.ts` (TypeScript compiler API, `ts.createSourceFile` with `ScriptKind.TSX`, `setParentNodes: true`):
    - `interface JsxAttr {name: string; value: string | true; isFunction: boolean; node: ts.JsxAttribute}` — `value` is the string literal's text, the expression's source text for `{…}`, or `true` for a bare attribute; `isFunction` is true for an arrow function or function expression.
    - `interface JsxNode {tag: string; root: string; line: number; excerpt: string; attributes: Map<string, JsxAttr>; ancestors: string[]; hasFunctionChild: boolean}` — `tag` is the full tag text (`Fieldset.Group`), `root` the identifier before the first dot, `ancestors` the tags of enclosing JSX elements nearest first.
    - `interface ImportedName {module: string; imported: string; local: string; line: number; excerpt: string}`
    - `interface ParsedSource {file: ProjectFile; source: ts.SourceFile; imports: ImportedName[]; peakui: Set<string>; jsx: JsxNode[]; directives: string[]}` — `peakui` holds local names imported from `@peakui/react`; `directives` holds leading string-literal statements such as `use client`.
    - `parseSource(file: ProjectFile): ParsedSource`
    - `parsedSources(context: StaticContext): ParsedSource[]` — `.ts` and `.tsx` files only
    - `isPeakui(source: ParsedSource, node: JsxNode): boolean`
    - `peakuiElements(context: StaticContext, tag: string): JsxNode[]` — across all parsed sources, the nodes with that tag whose root identifier is imported from `@peakui/react`
    - `locate(source: ParsedSource, node: {line: number; excerpt: string}): Location`
  - `css.ts`:
    - `tryParseCss(text: string): Root | undefined`
    - `importTargets(root: Root): string[]` — `@import` targets without quotes or `url()`, in order
    - `layerOrder(root: Root): string[]` — top-level `@layer` names in order of first appearance; a statement `@layer a, b;` contributes `a` then `b`
    - `interface CssRule {selector: string; layer: string | undefined; declarations: Record<string, string>}` — values lower-cased with whitespace removed; `layer` is the nearest enclosing `@layer` name
    - `rulesWithSelector(root: Root, fragment: string): CssRule[]`
    - `classRuleExists(root: Root, className: string): boolean` — a rule whose selector contains `.` + the class with every character outside `[A-Za-z0-9_-]` backslash-escaped, not followed by `[\w-]`
    - `atRuleParams(root: Root, name: string): string[]`
    - `declarationValues(root: Root, property: string): string[]` — normalized like `CssRule`
    - `cssFiles(context: StaticContext): Array<{file: ProjectFile; root: Root}>` — parseable `.css` files
  - `detectors.ts`: `runDetectors(context: StaticContext): Finding[]` — failed gating findings only (spec 8.3)
  - `static.ts`: `runStatic(task: TaskDefinition, context: StaticContext): LayerResult`

- [ ] **Step 1: Write the failing tests**

`evals/tests/ast.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {isPeakui, parseSource, peakuiElements} from "../src/scoring/ast.ts";

const SOURCE = `"use client";

import {Button, Fieldset as Set, TextField} from "@peakui/react";
import {useState} from "react";

export function A({saving}: {saving: boolean}) {
  return (
    <Set.Group render={(props) => <section {...props} />}>
      <TextField isRequired minLength={8} type="password">
        <Button isPending={saving} onPress={() => {}}>
          {({isPressed}) => (isPressed ? "a" : "b")}
        </Button>
      </TextField>
      <button disabled>plain</button>
    </Set.Group>
  );
}
`;

describe("parseSource", () => {
  const parsed = parseSource({path: "src/A.tsx", text: SOURCE});
  const byTag = (tag: string) => parsed.jsx.find((node) => node.tag === tag)!;

  it("reads directives and imports", () => {
    expect(parsed.directives).toEqual(["use client"]);
    expect([...parsed.peakui].sort()).toEqual(["Button", "Set", "TextField"]);
    expect(parsed.imports.find((entry) => entry.local === "Set")).toMatchObject({imported: "Fieldset", module: "@peakui/react"});
  });

  it("reads tags, roots, lines and ancestors", () => {
    expect(byTag("Set.Group")).toMatchObject({line: 8, root: "Set"});
    expect(byTag("Button").ancestors).toEqual(["TextField", "Set.Group"]);
    expect(byTag("Button").excerpt).toBe("<Button isPending={saving} onPress={() => {}}>");
  });

  it("reads attribute values", () => {
    expect(byTag("TextField").attributes.get("type")?.value).toBe("password");
    expect(byTag("TextField").attributes.get("minLength")?.value).toBe("8");
    expect(byTag("TextField").attributes.get("isRequired")?.value).toBe(true);
    expect(byTag("Button").attributes.get("isPending")?.value).toBe("saving");
    expect(byTag("Button").attributes.get("onPress")?.isFunction).toBe(true);
    expect(byTag("Set.Group").attributes.get("render")?.isFunction).toBe(true);
  });

  it("detects a function child", () => {
    expect(byTag("Button").hasFunctionChild).toBe(true);
    expect(byTag("TextField").hasFunctionChild).toBe(false);
  });

  it("tells PeakUI elements from plain ones", () => {
    expect(isPeakui(parsed, byTag("Set.Group"))).toBe(true);
    expect(isPeakui(parsed, byTag("button"))).toBe(false);
  });

  it("does not throw on a file that does not parse", () => {
    expect(() => parseSource({path: "src/B.tsx", text: "export function B() { return <div><Button"})).not.toThrow();
  });

  it("peakuiElements skips same-named elements that are not from PeakUI", () => {
    const local = {path: "src/C.tsx", text: `const Button = () => null;\nexport const c = <Button onPress={() => {}} />;`};
    const files = [{path: "src/A.tsx", text: SOURCE}, local];
    const found = peakuiElements({changes: {added: [], deleted: [], modified: []}, file: () => undefined, files}, "Button");

    expect(found).toHaveLength(1);
    expect(found[0]!.attributes.has("isPending")).toBe(true);
  });
});
```

`evals/tests/css.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {
  atRuleParams,
  classRuleExists,
  declarationValues,
  importTargets,
  layerOrder,
  rulesWithSelector,
  tryParseCss,
} from "../src/scoring/css.ts";

describe("css helpers", () => {
  it("tryParseCss returns undefined for broken CSS", () => {
    expect(tryParseCss(".a { color: red")).toBeUndefined();
    expect(tryParseCss(".a { color: red }")).toBeDefined();
  });

  it("importTargets strips quotes and keeps order", () => {
    const root = tryParseCss(`@import "tailwindcss";\n@import '@peakui/styles/css';\n@import url("./x.css") layer(base);`)!;

    expect(importTargets(root)).toEqual(["tailwindcss", "@peakui/styles/css", "./x.css"]);
  });

  it("layerOrder is first appearance at the top level", () => {
    const correct = tryParseCss("@layer properties{a{b:c}}@layer theme{a{b:c}}@layer base{a{b:c}}@layer components{.button{b:c}}@layer base{d{e:f}}@layer utilities{a{b:c}}")!;
    const reversed = tryParseCss("@layer theme{a{b:c}}@layer components{.button{b:c}}@layer base{a{b:c}}@layer utilities{a{b:c}}")!;
    const statement = tryParseCss("@layer theme, base, components;\n@layer components{a{b:c}}")!;

    expect(layerOrder(correct)).toEqual(["properties", "theme", "base", "components", "utilities"]);
    expect(layerOrder(reversed)).toEqual(["theme", "components", "base", "utilities"]);
    expect(layerOrder(statement)).toEqual(["theme", "base", "components"]);
  });

  it("rulesWithSelector reports the layer and normalized declarations", () => {
    const root = tryParseCss("@layer components{.button--primary{--button-bg: #16A34A; --button-bg-hover:#15803d}}\n.other{color:red}")!;

    expect(rulesWithSelector(root, "button--primary")).toEqual([
      {declarations: {"--button-bg": "#16a34a", "--button-bg-hover": "#15803d"}, layer: "components", selector: ".button--primary"},
    ]);
  });

  it("classRuleExists matches whole class names, escaped ones included", () => {
    const root = tryParseCss(".rounded-sm{border-radius:2px}.ring-emerald-600\\/20{--x:1}.bg-emerald-1000{color:red}")!;

    expect(classRuleExists(root, "rounded-sm")).toBe(true);
    expect(classRuleExists(root, "ring-emerald-600/20")).toBe(true);
    expect(classRuleExists(root, "rounded")).toBe(false);
    expect(classRuleExists(root, "bg-emerald-100")).toBe(false);
  });

  it("atRuleParams and declarationValues", () => {
    const root = tryParseCss(`@source "../node_modules/@acme/status";\n:root{--color-accent: #16A34A}`)!;

    expect(atRuleParams(root, "source")).toEqual([`"../node_modules/@acme/status"`]);
    expect(declarationValues(root, "--color-accent")).toEqual(["#16a34a"]);
  });
});
```

`evals/tests/detectors.test.ts`:

```ts
import type {StaticContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {runDetectors} from "../src/scoring/detectors.ts";

function contextOf(files: Record<string, string>, unchanged: string[] = []): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {added: list.map((file) => file.path).filter((path) => !unchanged.includes(path)), deleted: [], modified: []},
    file: (path) => list.find((file) => file.path === path),
    files: list,
  };
}

function rules(source: string, path = "src/A.tsx"): string[] {
  return runDetectors(contextOf({[path]: source})).map((finding) => finding.rule).sort();
}

const IMPORT = `import {Button, Fieldset, Input, TextField, tv} from "@peakui/react";\n`;

describe("runDetectors", () => {
  it.each([
    ["deep-import", `import {Button} from "@peakui/react/button";`],
    ["provider", `import {PeakUIProvider} from "@peakui/react";`],
    ["foreign-tv", `import {tv} from "tailwind-variants";`],
    ["forward-ref", `import {forwardRef} from "react";`],
    ["forward-ref", `import * as React from "react";\nexport const A = React.forwardRef(() => null);`],
    ["class-names-prop", `${IMPORT}export const a = <Button classNames={{base: "x"}}>x</Button>;`],
    ["as-prop", `${IMPORT}export const a = <Fieldset.Group as="section">x</Fieldset.Group>;`],
    ["assembled-field-prop", `${IMPORT}export const a = <Input label="Email" />;`],
    ["assembled-field-prop", `${IMPORT}export const a = <TextField errorMessage="x" />;`],
    ["dom-event-on-button", `${IMPORT}export const a = <Button onClick={() => {}}>x</Button>;`],
    ["dom-state-prop", `${IMPORT}export const a = <Button isLoading>x</Button>;`],
    ["dom-state-prop", `${IMPORT}export const a = <TextField required />;`],
    ["color-prop", `${IMPORT}export const a = <Button color="danger">x</Button>;`],
    ["interpolated-class", `${IMPORT}export const a = (r: string) => <Button className={\`rounded-\${r}\`}>x</Button>;`],
    ["interpolated-class", `${IMPORT}export const v = (r: string) => tv({base: \`rounded-\${r}\`});`],
    ["type-escape", `// @ts-ignore\nexport const a = 1;`],
    ["type-escape", `export const a = {} as any;`],
  ])("fires %s", (rule, source) => {
    expect(rules(source)).toContain(rule);
  });

  it.each([
    ["a plain button with onClick and disabled", `export const a = <button disabled onClick={() => {}}>x</button>;`],
    ["disabled on a standalone Input and on Fieldset", `${IMPORT}export const a = <Fieldset disabled><Input disabled /></Fieldset>;`],
    ["tv from the package root", `${IMPORT}export const v = tv({base: "rounded-full"});`],
    ["a conditional between whole class strings", `${IMPORT}export const a = (f: boolean) => <Button className={f ? "rounded-full" : "rounded-sm"}>x</Button>;`],
    ["a template literal that joins whole classes", `${IMPORT}export const a = (c: string) => <Button className={\`rounded-full \${c}\`}>x</Button>;`],
    ["React Aria props", `${IMPORT}export const a = <Button isDisabled isPending onPress={() => {}}>x</Button>;`],
  ])("stays silent for %s", (_name, source) => {
    expect(rules(source)).toEqual([]);
  });

  it("reports file, line and excerpt", () => {
    const [finding] = runDetectors(contextOf({"src/A.tsx": `${IMPORT}export const a = <Button color="danger">x</Button>;`}));

    expect(finding).toMatchObject({excerpt: expect.stringContaining('color="danger"'), file: "src/A.tsx", gate: true, line: 2, pass: false, pitfall: "variants"});
  });

  it("looks only at changed or added files", () => {
    const context = contextOf({"src/Old.tsx": `import {tv} from "tailwind-variants";`}, ["src/Old.tsx"]);

    expect(runDetectors(context)).toEqual([]);
  });

  it("flags a changed tsconfig.json", () => {
    const context: StaticContext = {changes: {added: [], deleted: [], modified: ["tsconfig.json"]}, file: () => undefined, files: []};

    expect(runDetectors(context).map((finding) => finding.rule)).toEqual(["config-weakened"]);
  });

  it("does not throw on a file that does not parse", () => {
    expect(() => rules("export function B() { return <div><Button")).not.toThrow();
  });
});
```

`evals/tests/static.test.ts`:

```ts
import type {StaticContext, TaskDefinition} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {check} from "../src/scoring/findings.ts";
import {runStatic} from "../src/scoring/static.ts";

const base: TaskDefinition = {fixture: "vite-app", id: "t", pitfalls: [], prompt: "p", staticChecks: () => [], title: "t"};

function contextOf(files: Record<string, string>): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {changes: {added: list.map((file) => file.path), deleted: [], modified: []}, file: (path) => list.find((f) => f.path === path), files: list};
}

describe("runStatic", () => {
  it("passes with clean files and passing checks", () => {
    const task = {...base, staticChecks: () => [check("x", "other" as const, true, "ok")]};

    expect(runStatic(task, contextOf({"src/a.ts": "export const a = 1;"})).status).toBe("pass");
  });

  it("fails on a detector hit even when the task's checks pass", () => {
    const result = runStatic(base, contextOf({"src/a.ts": `import {tv} from "tailwind-variants";`}));

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.rule)).toContain("foreign-tv");
  });

  it("turns a changed CSS file that does not parse into a finding", () => {
    const result = runStatic(base, contextOf({"src/index.css": ".a { color: red"}));

    expect(result.findings).toContainEqual(expect.objectContaining({file: "src/index.css", pass: false, rule: "unparseable-css"}));
  });

  it("turns a crashing task check into a finding instead of throwing", () => {
    const task = {...base, staticChecks: () => { throw new Error("boom"); }};
    const result = runStatic(task, contextOf({}));

    expect(result.status).toBe("fail");
    expect(result.findings).toContainEqual(expect.objectContaining({message: expect.stringContaining("boom"), rule: "static-check-crashed"}));
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- ast css detectors static`
Expected: FAIL — the four modules do not exist.

- [ ] **Step 3: Implement `ast.ts` and `css.ts`** to the signatures in Interfaces.

- [ ] **Step 4: Implement `detectors.ts`**

Rules, pitfalls and conditions are the table in spec 8.3, applied to every `.ts`/`.tsx` file in `changes.added` and `changes.modified`. Messages name the offending construct, for example `onClick on a PeakUI Button; press events use onPress`. `interpolated-class`: visit every template expression that is inside a `className` attribute value, or inside an argument of a call whose callee identifier is `tv`, `cn`, `clsx` or `twMerge`; fire when, for some substitution, the text immediately before it ends with `-` or the text immediately after it starts with `-`. `type-escape`: `/@ts-(ignore|expect-error|nocheck)/` in the file text, or an `as any` expression. `config-weakened`: `tsconfig.json` in `added` or `modified`.

- [ ] **Step 5: Implement `runStatic`**

Findings, in order: `runDetectors(context)`; one failed `unparseable-css` finding (pitfall `other`) per changed `.css` file for which `tryParseCss` returns `undefined`; `task.staticChecks(context)`, and when that throws, one failed `static-check-crashed` finding with the error message. Returns `layerResult("static", findings, durationMs)`.

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @peakui/evals test -- ast css detectors static`
Expected: PASS — 7 + 6 + 27 + 4 tests.

- [ ] **Step 7: Commit**

```bash
git add evals
git commit -m "feat(evals): add the static layer with shared pitfall detectors"
```

---

### Task 7: Rendered output layer

**Files:**
- Create: `evals/src/scoring/render-runner.mjs`, `evals/src/scoring/dom.ts`, `evals/src/scoring/render.ts`
- Test: `evals/tests/dom.test.ts`, `evals/tests/render.test.ts`

**Interfaces:**
- Consumes: `check`, `layerResult`, `notApplicable`, `tryParseCss`, `runCommand`, `walkFiles`, `FixtureDefinition`, `TaskDefinition`, `RenderSpec`.
- Produces:
  - `dom.ts`:
    - `parseHtml(html: string): Document`
    - `classTokens(element: Element): string[]`
    - `textOf(element: Element): string` — `textContent` with runs of whitespace collapsed, trimmed
    - `withText(scope: Document | Element, selector: string, text: string): Element | undefined` — the first match whose `textOf` equals `text`
    - `labelLinked(field: Element): boolean` — the field has a `label[data-slot="label"]` whose `for` equals the `id` of an `input` or `textarea` inside the field
    - `countOf(tokens: string[], token: string): number`
  - `render.ts`:
    - `readBuiltCss(fixture: FixtureDefinition, dir: string): Root | undefined` — concatenates every `.css` file under `fixture.builtCssDir`; `undefined` when there is none or it does not parse
    - `type SsrResult = {ok: true; documents: Record<string, string>} | {ok: false; error: string}`
    - `renderSsr(dir: string, ssr: NonNullable<RenderSpec["ssr"]>): Promise<SsrResult>`
    - `runRender(task: TaskDefinition, fixture: FixtureDefinition, dir: string, logPath: string): Promise<LayerResult>`

- [ ] **Step 1: Write `evals/src/scoring/render-runner.mjs`**

This exact file was run against a prepared `vite-app` during design (spec section 3).

```js
/*
 * Renders one exported component of a workspace to static markup, once per case.
 * Runs as a child process so that Vite, React and react-dom all come from the WORKSPACE's
 * node_modules: one React copy, the versions the project really has.
 *
 * argv: <workspaceDir> <module, e.g. /src/components/SaveBar.tsx> <exportName> <casesJson>
 * stdout: {"ok":true,"documents":{"<case>":"<html>"}} or {"ok":false,"error":"..."}
 */
import {createRequire} from "node:module";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [, , workspaceDir, modulePath, exportName, casesJson = "[]"] = process.argv;
const require = createRequire(join(workspaceDir, "package.json"));
const reviveFunctions = (_key, value) => (value === "__fn__" ? () => {} : value);

let server;

try {
  const {createServer} = await import(pathToFileURL(require.resolve("vite")).href);

  // configFile: false — the agent's Vite config must not be able to break scoring.
  server = await createServer({
    appType: "custom",
    configFile: false,
    css: {postcss: {}},
    logLevel: "silent",
    optimizeDeps: {include: [], noDiscovery: true},
    root: workspaceDir,
    server: {hmr: false, middlewareMode: true, watch: null, ws: false},
  });

  const loaded = await server.ssrLoadModule(modulePath);
  const component = loaded[exportName];

  if (typeof component !== "function") {
    throw new Error(`${modulePath} has no exported component named ${exportName}`);
  }

  // Through require, not ssrLoadModule: Vite externalizes node_modules, so this is the same
  // CommonJS instance the component imports.
  const react = require("react");
  const {renderToStaticMarkup} = require("react-dom/server");
  const documents = {};

  for (const {name, props} of JSON.parse(casesJson, reviveFunctions)) {
    documents[name] = renderToStaticMarkup(react.createElement(component, props));
  }

  process.stdout.write(JSON.stringify({documents, ok: true}));
} catch (error) {
  process.stdout.write(JSON.stringify({error: String(error?.stack ?? error), ok: false}));
} finally {
  await server?.close();
}
```

- [ ] **Step 2: Write the failing tests**

`evals/tests/dom.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {classTokens, countOf, labelLinked, parseHtml, textOf, withText} from "../src/scoring/dom.ts";

const HTML = `
<form>
  <div data-slot="textfield" data-required="true">
    <label data-slot="label" id="l1" for="i1">Email</label>
    <input data-slot="input" id="i1" type="email" class="input input--secondary">
  </div>
  <div data-slot="textfield">
    <label data-slot="label" for="nope">Broken</label>
    <input data-slot="input" id="i2">
  </div>
  <button data-slot="button" class="button button--md  button--danger">Delete   account</button>
  <button data-slot="button" class="button button button--lg">Plan: <!-- -->Team</button>
</form>`;

describe("dom helpers", () => {
  const document = parseHtml(HTML);
  const fields = [...document.querySelectorAll('[data-slot="textfield"]')];

  it("classTokens splits on any whitespace", () => {
    expect(classTokens(document.querySelector("button")!)).toEqual(["button", "button--md", "button--danger"]);
  });

  it("textOf collapses whitespace and ignores comments", () => {
    expect(textOf(document.querySelectorAll("button")[0]!)).toBe("Delete account");
    expect(textOf(document.querySelectorAll("button")[1]!)).toBe("Plan: Team");
  });

  it("withText finds by exact collapsed text", () => {
    expect(withText(document, "button", "Delete account")?.className).toContain("button--danger");
    expect(withText(document, "button", "Delete")).toBeUndefined();
  });

  it("labelLinked checks the for/id pair inside the field", () => {
    expect(labelLinked(fields[0]!)).toBe(true);
    expect(labelLinked(fields[1]!)).toBe(false);
  });

  it("countOf counts duplicates", () => {
    expect(countOf(classTokens(document.querySelectorAll("button")[1]!), "button")).toBe(2);
  });
});
```

`evals/tests/render.test.ts`:

```ts
import type {FixtureDefinition, TaskDefinition} from "../src/types.ts";

import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {check} from "../src/scoring/findings.ts";
import {readBuiltCss, runRender} from "../src/scoring/render.ts";

const fixture: FixtureDefinition = {build: [], builtCssDir: "dist/assets", clean: ["dist"], dir: "", id: "x", prepare: [], typecheck: []};
const base: TaskDefinition = {fixture: "x", id: "t", pitfalls: [], prompt: "p", staticChecks: () => [], title: "t"};

function workspace(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "render-"));

  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), {recursive: true});
    writeFileSync(join(dir, path), text);
  }

  return dir;
}

describe("readBuiltCss", () => {
  it("concatenates the built CSS files", () => {
    const dir = workspace({"dist/assets/a.css": ".a{color:red}", "dist/assets/b.css": ".b{color:blue}", "dist/assets/c.js": "x"});

    expect(readBuiltCss(fixture, dir)?.toString()).toContain(".b{color:blue}");
  });

  it("is undefined when the build left nothing", () => {
    expect(readBuiltCss(fixture, workspace({"src/a.ts": ""}))).toBeUndefined();
  });
});

describe("runRender", () => {
  it("is not-applicable for a task without a render spec", async () => {
    expect((await runRender(base, fixture, workspace({}), join(tmpdir(), "r.log"))).status).toBe("not-applicable");
  });

  it("reports render-unavailable when the module cannot be rendered", async () => {
    const task: TaskDefinition = {
      ...base,
      render: {check: () => [check("never", "other", true, "unreachable")], ssr: {cases: [{name: "default", props: {}}], exportName: "Gone", module: "/src/Gone.tsx"}},
    };
    const result = await runRender(task, fixture, workspace({"package.json": "{}"}), join(tmpdir(), "r.log"));

    expect(result.status).toBe("fail");
    expect(result.findings.map((finding) => finding.rule)).toEqual(["render-unavailable"]);
  });

  it("reports render-unavailable when the build left no HTML", async () => {
    const task: TaskDefinition = {...base, render: {check: () => [], html: {path: ".next/server/app/index.html"}}};
    const result = await runRender(task, fixture, workspace({"package.json": "{}"}), join(tmpdir(), "r.log"));

    expect(result.findings).toContainEqual(expect.objectContaining({pass: false, rule: "render-unavailable"}));
  });

  it("hands the parsed HTML and CSS to the check", async () => {
    const dir = workspace({"dist/assets/a.css": ".button{color:red}", "out/index.html": "<button class='button'>Go</button>"});
    const task: TaskDefinition = {
      ...base,
      render: {
        check: ({css, documents}) => [
          check("has-button", "other", documents.get("html")?.querySelector("button.button") !== null, "button"),
          check("has-css", "other", css !== undefined, "css"),
        ],
        html: {path: "out/index.html"},
      },
    };
    const result = await runRender(task, fixture, dir, join(tmpdir(), "r.log"));

    expect(result.status).toBe("pass");
    expect(result.findings).toHaveLength(2);
  });

  it("turns a crashing check into a finding", async () => {
    const task: TaskDefinition = {...base, render: {check: () => { throw new Error("boom"); }}};
    const result = await runRender(task, fixture, workspace({}), join(tmpdir(), "r.log"));

    expect(result.findings).toContainEqual(expect.objectContaining({rule: "render-check-crashed"}));
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- dom render`
Expected: FAIL — `Cannot find module '../src/scoring/dom.ts'`.

- [ ] **Step 4: Implement `dom.ts` and `render.ts`**

`parseHtml` is `new JSDOM(html).window.document`. `renderSsr` runs `[process.execPath, <render-runner.mjs>, dir, ssr.module, ssr.exportName, JSON.stringify(ssr.cases)]` with `cwd: dir`, `timeoutMs: 60_000`; stdout that is not the runner's JSON, or a timeout, becomes `{ok: false, error}`.

`runRender`, in order:
1. No `task.render` → `notApplicable("render")`.
2. `ssr` present: on `ok: false`, one failed `render-unavailable` finding (pitfall `other`, message = first line of the error) and return — `check` is not called. Otherwise each document is parsed and stored under its case name.
3. `html` present: when the file is missing, one failed `render-unavailable` finding (`the build did not produce <path>`) and return. Otherwise the parsed document is stored under `"html"`.
4. `css = readBuiltCss(fixture, dir)`.
5. `task.render.check({css, documents})`; a throw becomes one failed `render-check-crashed` finding.
6. Write the documents and the findings to `logPath`; return `layerResult("render", findings, durationMs)`.

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @peakui/evals test -- dom render`
Expected: PASS — 5 + 7 tests.

- [ ] **Step 6: Commit**

```bash
git add evals
git commit -m "feat(evals): score rendered markup and built CSS"
```

---

### Task 8: Scoring pipeline, task format and the first task

**Files:**
- Create: `evals/src/scoring/score.ts`
- Create: `evals/tasks/index.ts`
- Create: `evals/tasks/sign-in-form/task.ts`, and under `evals/tasks/sign-in-form/solutions/`: `good/`, `bad-assembled/`, `bad-native-required/`, each with `expect.json` and `files/`
- Create: `evals/tests/helpers/solutions.ts`
- Test: `evals/tests/score.test.ts`, `evals/tests/tasks.gate.test.ts`, `evals/tests/tasks.static.test.ts`, `evals/tests/solutions/03-solutions.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 4–7; `prepareTemplate`, `packLibrary`, `getFixture`.
- Produces:
  - `score.ts`:
    - `interface ScoreResult {layers: Record<LayerId, LayerResult>; passed: boolean; mistakes: Mistake[]}`
    - `collectMistakes(layers: Record<LayerId, LayerResult>): Mistake[]` — failed gating findings in `LAYERS` order, de-duplicated by `rule` + `file` + `line`
    - `scoreWorkspace(options: {task: TaskDefinition; fixture: FixtureDefinition; dir: string; changes: FileChanges; logsDir: string}): Promise<ScoreResult>` — `cleanBuildOutput`, then `runTypecheck`, `runBuild`, `runStatic(task, staticContext(dir, changes))`, `runRender`, in that order, logs `typecheck.log`, `build.log`, `render.log`; `passed` is true when no layer is `fail`
  - `tasks/index.ts`: `tasks: TaskDefinition[]`; `getTask(id: string): TaskDefinition` (throws on an unknown id, listing the known ones)
  - `tests/helpers/solutions.ts`:
    - `interface Expectation {layers: Record<LayerId, LayerStatus>; rules: Partial<Record<LayerId, string[]>>}`
    - `solutionsOf(task: TaskDefinition): string[]`
    - `solutionFilesDir(task: TaskDefinition, solution: string): string`
    - `readExpectation(task: TaskDefinition, solution: string): Expectation`
    - `inMemoryContext(task: TaskDefinition, solution: string): StaticContext` — fixture files, then the overlay, form the base; the solution's `files/` laid over it form the result; `changes` is the difference; `files` keeps `.ts`, `.tsx`, `.css`
- Layout of a solution: `solutions/<name>/files/<path as in the workspace>` and `solutions/<name>/expect.json`.

- [ ] **Step 1: Write the failing unit tests**

`evals/tests/score.test.ts`:

```ts
import type {LayerId, LayerResult} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {check, info, layerResult, notApplicable} from "../src/scoring/findings.ts";
import {collectMistakes} from "../src/scoring/score.ts";

describe("collectMistakes", () => {
  const layers: Record<LayerId, LayerResult> = {
    build: layerResult("build", [], 1),
    render: layerResult("render", [check("pending-state", "rac-props", false, "no data-pending"), info("i", "styling", false, "n")], 1),
    static: layerResult("static", [
      check("dom-state-prop", "rac-props", false, "isLoading", {excerpt: "<Button isLoading>", file: "src/a.tsx", line: 4}),
      check("dom-state-prop", "rac-props", false, "isLoading", {excerpt: "<Button isLoading>", file: "src/a.tsx", line: 4}),
      check("press-handler", "rac-props", true, "ok"),
    ], 1),
    typecheck: layerResult("typecheck", [check("unknown-state-prop", "rac-props", false, "Property 'isLoading'", {file: "src/a.tsx", line: 4})], 1),
  };

  it("lists failed gating findings in layer order, de-duplicated", () => {
    expect(collectMistakes(layers).map((mistake) => [mistake.layer, mistake.rule])).toEqual([
      ["typecheck", "unknown-state-prop"],
      ["static", "dom-state-prop"],
      ["render", "pending-state"],
    ]);
  });

  it("keeps the location and ignores not-applicable layers", () => {
    const mistakes = collectMistakes({...layers, render: notApplicable("render")});

    expect(mistakes[1]).toMatchObject({excerpt: "<Button isLoading>", file: "src/a.tsx", line: 4, pitfall: "rac-props"});
    expect(mistakes).toHaveLength(2);
  });
});
```

`evals/tests/tasks.gate.test.ts`:

```ts
import {existsSync} from "node:fs";

import {describe, expect, it} from "vitest";

import {fixtures} from "../fixtures/index.ts";
import {readFiles, walkFiles} from "../src/files.ts";
import {overlayDirOf} from "../src/workspace/workspace.ts";
import {tasks} from "../tasks/index.ts";
import {readExpectation, solutionFilesDir, solutionsOf} from "./helpers/solutions.ts";

const OTHER_LIBRARIES =
  /hero\s?ui|next\s?ui|shadcn|radix|material[- ]ui|\bmui\b|chakra|mantine|ant design|\bantd\b|daisy\s?ui|headless ui|bootstrap/i;
const ANSWER_LEAKS =
  /isPending|onPress\b|isRequired|isDisabled|isInvalid|FieldError|InputGroup|data-slot|buttonVariants|\btv\(|@source|render prop|use client|classNames|@layer/;

describe("task set", () => {
  it("has unique ids and known fixtures", () => {
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);

    for (const task of tasks) expect(fixtures, task.id).toHaveProperty(task.fixture);
  });

  it.each(tasks)("$id: the prompt names no other library and no answer", (task) => {
    expect(task.prompt.length).toBeGreaterThan(60);
    expect(task.prompt).not.toMatch(OTHER_LIBRARIES);
    expect(task.prompt).not.toMatch(ANSWER_LEAKS);
  });

  it.each(tasks)("$id: the overlay names no other library", (task) => {
    const dir = overlayDirOf(task);
    const files = dir ? readFiles(dir, walkFiles(dir)) : [];

    expect(files.filter((file) => OTHER_LIBRARIES.test(file.text)).map((file) => file.path)).toEqual([]);
  });

  it.each(tasks)("$id: has a good solution and at least one bad one, each with files and an expectation", (task) => {
    const solutions = solutionsOf(task);

    expect(solutions).toContain("good");
    expect(solutions.filter((name) => name.startsWith("bad-")).length).toBeGreaterThan(0);

    for (const solution of solutions) {
      expect(existsSync(solutionFilesDir(task, solution)), solution).toBe(true);

      const expectation = readExpectation(task, solution);
      const statuses = Object.values(expectation.layers);

      if (solution === "good") expect(statuses).not.toContain("fail");
      else expect(statuses, solution).toContain("fail");
    }
  });
});
```

`evals/tests/tasks.static.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {runStatic} from "../src/scoring/static.ts";
import {tasks} from "../tasks/index.ts";
import {inMemoryContext, readExpectation, solutionsOf} from "./helpers/solutions.ts";

const cases = tasks.flatMap((task) => solutionsOf(task).map((solution) => ({solution, task})));

describe("static layer against reference solutions", () => {
  it.each(cases)("$task.id / $solution", ({solution, task}) => {
    const expectation = readExpectation(task, solution);
    const result = runStatic(task, inMemoryContext(task, solution));
    const failed = result.findings.filter((finding) => finding.gate && !finding.pass).map((finding) => finding.rule);

    expect(result.status, failed.join(", ")).toBe(expectation.layers.static);
    expect(failed).toEqual(expect.arrayContaining(expectation.rules.static ?? []));

    if (solution === "good") expect(failed).toEqual([]);
  });
});
```

- [ ] **Step 2: Write the failing solutions test**

`evals/tests/solutions/03-solutions.test.ts`:

```ts
import {mkdirSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {fixtures, getFixture} from "../../fixtures/index.ts";
import {copyDir} from "../../src/files.ts";
import {type TemplateInfo, prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";
import {scoreWorkspace} from "../../src/scoring/score.ts";
import {LAYERS} from "../../src/types.ts";
import {createWorkspace, diffSnapshots, overlayDirOf, removeWorkspace, snapshot} from "../../src/workspace/workspace.ts";
import {tasks} from "../../tasks/index.ts";
import {readExpectation, solutionFilesDir, solutionsOf} from "../helpers/solutions.ts";

// EVAL_TASKS=sign-in-form,pending-button narrows the run.
const only = process.env.EVAL_TASKS?.split(",");
const cases = tasks
  .filter((task) => !only || only.includes(task.id))
  .flatMap((task) => solutionsOf(task).map((solution) => ({solution, task})));

const templates = new Map<string, TemplateInfo>();

beforeAll(async () => {
  const pack = await packLibrary();

  for (const fixture of Object.values(fixtures)) {
    templates.set(fixture.id, await prepareTemplate(fixture, pack, {force: false}));
  }
});

describe("reference solutions through the real scorer", () => {
  it.each(cases)("$task.id / $solution", async ({solution, task}) => {
    const expectation = readExpectation(task, solution);
    const workspace = createWorkspace({
      batch: "solutions-test",
      key: `${task.id}__${solution}`,
      overlayDir: overlayDirOf(task),
      templateDir: templates.get(task.fixture)!.dir,
    });

    try {
      const before = snapshot(workspace.dir);

      copyDir(solutionFilesDir(task, solution), workspace.dir);

      const logsDir = join(workspace.scratchDir, "logs");

      mkdirSync(logsDir, {recursive: true});

      const score = await scoreWorkspace({
        changes: diffSnapshots(before, snapshot(workspace.dir)),
        dir: workspace.dir,
        fixture: getFixture(task.fixture),
        logsDir,
        task,
      });

      for (const layer of LAYERS) {
        const failed = score.layers[layer].findings.filter((finding) => finding.gate && !finding.pass);

        expect(score.layers[layer].status, `${layer}: ${failed.map((f) => `${f.rule} (${f.message})`).join("; ")}`).toBe(expectation.layers[layer]);
        expect(failed.map((finding) => finding.rule)).toEqual(expect.arrayContaining(expectation.rules[layer] ?? []));
      }

      if (solution === "good") {
        expect(score.mistakes).toEqual([]);
        expect(score.passed).toBe(true);
      } else {
        expect(score.passed).toBe(false);
      }
    } finally {
      removeWorkspace(workspace);
    }
  });
});
```

- [ ] **Step 3: Run the unit tests to verify they fail**

Run: `pnpm --filter @peakui/evals test -- score tasks`
Expected: FAIL — `Cannot find module '../src/scoring/score.ts'` and `'../tasks/index.ts'`.

- [ ] **Step 4: Implement `score.ts` and `tests/helpers/solutions.ts`** to the signatures in Interfaces.

- [ ] **Step 5: Write `evals/tasks/sign-in-form/task.ts`**

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources} from "../../src/scoring/ast.ts";
import {labelLinked} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const signInForm: TaskDefinition = {
  fixture: "vite-app",
  id: "sign-in-form",
  pitfalls: ["fields", "composition", "rac-props", "imports"],
  prompt:
    'Add a sign-in form to this app using PeakUI. Put it in src/components/SignInForm.tsx as a named export `SignInForm` and show it on the home screen in src/App.tsx. It needs an email field and a password field, both required, and the password must be at least 8 characters. Validation messages should appear under the field they belong to. Add a "Sign in" submit button.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const fields = [...document.querySelectorAll('[data-slot="textfield"]')];
      const types = [...document.querySelectorAll("input")].map((input) => input.getAttribute("type")).sort();

      return [
        check(
          "two-required-fields",
          "rac-props",
          fields.length === 2 && fields.every((field) => field.getAttribute("data-required") === "true"),
          "exactly two text fields, both marked required on the field root",
        ),
        check("label-linked", "fields", fields.length > 0 && fields.every(labelLinked), "every field's label is linked to its input"),
        check("input-types", "fields", types.join(",") === "email,password", "one email input and one password input"),
        check(
          "submit-button",
          "rac-props",
          document.querySelector('form button[data-slot="button"][type="submit"]') !== null,
          "a PeakUI submit button inside the form",
        ),
      ];
    },
    ssr: {cases: [{name: "default", props: {}}], exportName: "SignInForm", module: "/src/components/SignInForm.tsx"},
  },
  staticChecks(context) {
    const sources = parsedSources(context);
    const nodes = sources.flatMap((source) => source.jsx);
    const errorsInFields = nodes.filter((node) => node.tag === "FieldError" && node.ancestors.includes("TextField"));
    const hasLengthRule =
      nodes.some((node) => ["TextField", "Input"].includes(node.tag) && node.attributes.get("minLength")?.value === "8") ||
      nodes.some((node) => node.tag === "TextField" && (node.attributes.has("validate") || node.attributes.has("isInvalid")));
    const app = sources.find((source) => source.file.path === "src/App.tsx");

    return [
      check("field-error-in-each-field", "fields", errorsInFields.length >= 2, "a FieldError inside each of the two text fields"),
      check("password-length-rule", "fields", hasLengthRule, "the 8-character rule is expressed on the password field"),
      check("form-is-mounted", "other", app?.jsx.some((node) => node.tag === "SignInForm") ?? false, "src/App.tsx renders SignInForm"),
    ];
  },
  title: "Sign-in form with validation",
};
```

- [ ] **Step 6: Write `evals/tasks/index.ts`**

```ts
import type {TaskDefinition} from "../src/types.ts";

import {signInForm} from "./sign-in-form/task.ts";

export const tasks: TaskDefinition[] = [signInForm];

export function getTask(id: string): TaskDefinition {
  const task = tasks.find((candidate) => candidate.id === id);

  if (!task) {
    throw new Error(`unknown task "${id}"; known: ${tasks.map((candidate) => candidate.id).join(", ")}`);
  }

  return task;
}
```

- [ ] **Step 7: Write the reference solutions**

All three share `files/src/App.tsx`:

```tsx
import {SignInForm} from "./components/SignInForm";

export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
      <SignInForm />
    </main>
  );
}
```

`good/files/src/components/SignInForm.tsx`:

```tsx
import {Button, FieldError, Input, Label, TextField} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input />
        <FieldError />
      </TextField>
      <TextField isRequired minLength={8} name="password" type="password">
        <Label>Password</Label>
        <Input />
        <FieldError />
      </TextField>
      <Button type="submit">Sign in</Button>
    </form>
  );
}
```

`good/expect.json`:

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "pass"}, "rules": {}}
```

`bad-assembled/files/src/components/SignInForm.tsx` (`label` is the first attribute on purpose: TypeScript names the first excess property):

```tsx
import {Button, Input} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4">
      <Input label="Email" errorMessage="Enter your email" isRequired name="email" type="email" />
      <Input label="Password" errorMessage="At least 8 characters" isRequired minLength={8} name="password" type="password" />
      <Button type="submit">Sign in</Button>
    </form>
  );
}
```

`bad-assembled/expect.json`:

```json
{
  "layers": {"typecheck": "fail", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {
    "typecheck": ["unknown-composition-prop"],
    "static": ["assembled-field-prop", "field-error-in-each-field"],
    "render": ["two-required-fields"]
  }
}
```

`bad-native-required/files/src/components/SignInForm.tsx`:

```tsx
import {Button, Input, Label, TextField} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4">
      <TextField name="email" type="email">
        <Label>Email</Label>
        <Input required />
      </TextField>
      <TextField name="password" type="password">
        <Label>Password</Label>
        <Input required minLength={8} />
      </TextField>
      <Button type="submit">Sign in</Button>
    </form>
  );
}
```

`bad-native-required/expect.json`:

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"static": ["field-error-in-each-field"], "render": ["two-required-fields"]}
}
```

- [ ] **Step 8: Run every tier**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=sign-in-form pnpm --filter @peakui/evals test:solutions -- 03-solutions`
Expected: unit tests pass, including 3 static cases and 4 gate cases for `sign-in-form`; the solutions test passes 3 cases in about 40 seconds.

If a `bad-*` case reports a layer status different from its `expect.json`, the answer key or the scorer is wrong. Find out which by reading the layer's log in the workspace's `scratch/logs`; do not edit `expect.json` to match without understanding why.

- [ ] **Step 9: Commit**

```bash
git add evals
git commit -m "feat(evals): score a workspace in four layers and add the sign-in form task"
```

---

### Task 9: Button tasks

Five tasks on fixture `vite-app`: `pending-button`, `custom-button-variant`, `destructive-actions`, `press-state-label`, `link-as-button`. Spec section 7.2 holds each prompt, starting state and answer key with its source.

**Files:**
- Create, per task under `evals/tasks/<id>/`: `task.ts`, `overlay/` (where listed), `solutions/<name>/expect.json`, `solutions/<name>/files/…`
- Modify: `evals/tasks/index.ts` (import and append the five tasks, in the order above)
- Test: the generic `tests/tasks.gate.test.ts`, `tests/tasks.static.test.ts`, `tests/solutions/03-solutions.test.ts` from Task 8 — no new test file

**Interfaces:**
- Consumes: `check`, `info`, `cssUnavailable`; `parsedSources`, `peakuiElements`, `isPeakui`; `classTokens`, `countOf`, `textOf`, `withText`; `classRuleExists`.
- Produces: exports `pendingButton`, `customButtonVariant`, `destructiveActions`, `pressStateLabel`, `linkAsButton`, each a `TaskDefinition`.

Every overlay `src/App.tsx` below keeps the fixture's `<main>`, heading and paragraph and adds one line; only that line and the imports are shown as "adds".

- [ ] **Step 1: Write the overlays, the solutions and their expectations**

`expect.json` for every `good` solution is:

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "pass"}, "rules": {}}
```

**`pending-button`**

`overlay/src/components/SaveBar.tsx`:

```tsx
export interface SaveBarProps {
  saving: boolean;
  onSave: () => void;
}

export function SaveBar(_props: SaveBarProps) {
  return <div className="flex justify-end border-t border-neutral-200 p-4"></div>;
}
```

`overlay/src/App.tsx`:

```tsx
import {useState} from "react";

import {SaveBar} from "./components/SaveBar";

export function App() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1500);
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
      <SaveBar saving={saving} onSave={save} />
    </main>
  );
}
```

`solutions/good/files/src/components/SaveBar.tsx`:

```tsx
import {Button, Spinner} from "@peakui/react";

export interface SaveBarProps {
  saving: boolean;
  onSave: () => void;
}

export function SaveBar({onSave, saving}: SaveBarProps) {
  return (
    <div className="flex justify-end border-t border-neutral-200 p-4">
      <Button isPending={saving} onPress={onSave}>
        {saving ? <Spinner aria-hidden color="current" size="sm" /> : null}
        Save
      </Button>
    </div>
  );
}
```

`solutions/bad-no-spinner/files/src/components/SaveBar.tsx`: the good file with the `Spinner` import and the `{saving ? … : null}` line removed.

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["spinner-while-pending"]}}
```

`solutions/bad-is-loading/files/src/components/SaveBar.tsx`: the good file with `isPending={saving}` replaced by `isLoading={saving}`.

```json
{
  "layers": {"typecheck": "fail", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"typecheck": ["unknown-state-prop"], "static": ["dom-state-prop"], "render": ["pending-state"]}
}
```

**`custom-button-variant`** — no overlay.

`solutions/*/files/src/App.tsx` (all four): the fixture's `App.tsx` plus `import {AppButton} from "./components/AppButton";` and `<AppButton>Get started</AppButton>` after the paragraph.

`solutions/good/files/src/components/AppButton.tsx`:

```tsx
import type {ButtonProps, VariantProps} from "@peakui/react";

import {Button, tv} from "@peakui/react";

const appButtonVariants = tv({
  defaultVariants: {radius: "full"},
  variants: {
    radius: {
      full: "rounded-full",
      sm: "rounded-sm",
    },
  },
});

export interface AppButtonProps
  extends Omit<ButtonProps, "className">, VariantProps<typeof appButtonVariants> {
  className?: string;
}

export function AppButton({className, radius, ...props}: AppButtonProps) {
  return <Button className={appButtonVariants({className, radius})} {...props} />;
}
```

`solutions/bad-interpolated/files/src/components/AppButton.tsx`:

```tsx
import type {ButtonProps} from "@peakui/react";

import {Button} from "@peakui/react";

export interface AppButtonProps extends Omit<ButtonProps, "className"> {
  radius?: "full" | "sm";
}

export function AppButton({radius = "full", ...props}: AppButtonProps) {
  return <Button className={`rounded-${radius}`} {...props} />;
}
```

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"static": ["interpolated-class"], "render": ["radius-classes-have-rules"]}
}
```

`solutions/bad-extend-wrapper/files/src/components/AppButton.tsx`:

```tsx
import type {ButtonProps} from "@peakui/react";

import {Button, buttonVariants, tv} from "@peakui/react";

const appButtonVariants = tv({
  extend: buttonVariants,
  variants: {radius: {full: "rounded-full", sm: "rounded-sm"}},
});

export interface AppButtonProps extends Omit<ButtonProps, "className"> {
  radius?: "full" | "sm";
}

export function AppButton({radius = "full", size, variant, ...props}: AppButtonProps) {
  return <Button className={appButtonVariants({radius, size, variant})} size={size} variant={variant} {...props} />;
}
```

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["variant-classes-once"]}}
```

`solutions/bad-foreign-tv/files/src/components/AppButton.tsx`: the good file with `tv` and `VariantProps` imported from `"tailwind-variants"` instead of `"@peakui/react"` (`ButtonProps` and `Button` still come from `@peakui/react`). npm hoists `tailwind-variants`, so this type-checks and builds.

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "pass"}, "rules": {"static": ["foreign-tv"]}}
```

**`destructive-actions`**

`overlay/src/components/DangerZone.tsx`:

```tsx
export function DangerZone() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border border-neutral-200 p-6">
      <h2 className="text-lg font-semibold">Danger zone</h2>
      <p className="text-sm text-neutral-600">
        Deleting your account removes all projects and cannot be undone.
      </p>
    </section>
  );
}
```

`overlay/src/App.tsx` adds `import {DangerZone} from "./components/DangerZone";` and `<DangerZone />`.

Each solution's `files/src/components/DangerZone.tsx` is the overlay file plus `import {Button} from "@peakui/react";` and, after the paragraph, a `<div className="flex gap-2">` holding:

- `good`: `<Button size="sm" variant="danger">Delete account</Button>` and `<Button size="sm" variant="outline">Cancel</Button>`
- `bad-utility-classes`: `<Button className="bg-red-600 text-white" size="sm">Delete account</Button>` and `<Button className="border border-neutral-400 bg-transparent" size="sm">Cancel</Button>`

  ```json
  {"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["danger-variant", "outline-variant"]}}
  ```

- `bad-color-prop`: `<Button color="danger" size="small">Delete account</Button>` and `<Button size="small" variant="bordered">Cancel</Button>`

  ```json
  {
    "layers": {"typecheck": "fail", "build": "pass", "static": "fail", "render": "fail"},
    "rules": {"typecheck": ["unknown-variant"], "static": ["color-prop"], "render": ["danger-variant", "outline-variant"]}
  }
  ```

**`press-state-label`**

`overlay/src/components/ConfirmButton.tsx`:

```tsx
export interface ConfirmButtonProps {
  onConfirm: () => void;
}

export function ConfirmButton(_props: ConfirmButtonProps) {
  return null;
}
```

`overlay/src/App.tsx` adds `import {ConfirmButton} from "./components/ConfirmButton";` and `<ConfirmButton onConfirm={() => window.alert("Confirmed")} />`.

`solutions/good/files/src/components/ConfirmButton.tsx`:

```tsx
import {Button} from "@peakui/react";

export interface ConfirmButtonProps {
  onConfirm: () => void;
}

export function ConfirmButton({onConfirm}: ConfirmButtonProps) {
  return (
    <Button onPress={onConfirm}>
      {({isPressed}) => (isPressed ? "Release to confirm" : "Confirm")}
    </Button>
  );
}
```

`solutions/bad-mouse-events/files/src/components/ConfirmButton.tsx`:

```tsx
import {Button} from "@peakui/react";
import {useState} from "react";

export interface ConfirmButtonProps {
  onConfirm: () => void;
}

export function ConfirmButton({onConfirm}: ConfirmButtonProps) {
  const [held, setHeld] = useState(false);

  return (
    <Button onClick={onConfirm} onMouseDown={() => setHeld(true)} onMouseUp={() => setHeld(false)}>
      {held ? "Release to confirm" : "Confirm"}
    </Button>
  );
}
```

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "pass"},
  "rules": {"static": ["dom-event-on-button", "press-state-source", "no-pointer-handlers", "press-handler"]}
}
```

**`link-as-button`**

`overlay/src/components/Hero.tsx`:

```tsx
export function Hero() {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl bg-neutral-100 p-6">
      <h2 className="text-xl font-semibold">Upgrade your workspace</h2>
      <p className="text-sm text-neutral-600">More seats, longer history and priority support.</p>
      <a href="/pricing">View pricing</a>
    </section>
  );
}
```

`overlay/src/App.tsx` adds `import {Hero} from "./components/Hero";` and `<Hero />`.

Each solution's `files/src/components/Hero.tsx` is the overlay file with the link line replaced:

- `good`: `import {buttonVariants} from "@peakui/react";` and `<a className={buttonVariants({variant: "secondary"})} href="/pricing">View pricing</a>`
- `bad-nested`: `import {Button} from "@peakui/react";` and `<a href="/pricing"><Button variant="secondary">View pricing</Button></a>`

  ```json
  {"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["button-classes", "no-nested-interactive"]}}
  ```

- `bad-as-prop`: `import {Button} from "@peakui/react";` and `<Button as="a" href="/pricing" variant="secondary">View pricing</Button>`

  ```json
  {
    "layers": {"typecheck": "fail", "build": "pass", "static": "fail", "render": "fail"},
    "rules": {"typecheck": ["unknown-composition-prop"], "static": ["as-prop"], "render": ["still-a-link"]}
  }
  ```

- [ ] **Step 2: Register the five tasks with empty checks and watch the tests fail**

Create each `task.ts` with its `id`, `title`, `fixture: "vite-app"`, `pitfalls` and `prompt` from Step 3, `staticChecks: () => []` and no `render`; append them to `tasks` in `tasks/index.ts`.

Run: `pnpm --filter @peakui/evals test -- tasks`
Expected: FAIL — `custom-button-variant / bad-interpolated` passes only because of the shared detector; `press-state-label / bad-mouse-events` fails with `expected arrayContaining ["press-state-source", …]`.

- [ ] **Step 3: Write the checks**

`evals/tasks/pending-button/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {peakuiElements} from "../../src/scoring/ast.ts";
import {textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const BUTTON = 'button[data-slot="button"]';
const SPINNER = '[data-slot="spinner"]';

export const pendingButton: TaskDefinition = {
  fixture: "vite-app",
  id: "pending-button",
  pitfalls: ["rac-props"],
  prompt:
    'src/components/SaveBar.tsx is missing its button. Add a PeakUI "Save" button that calls `onSave`. While `saving` is true the button should show a loading spinner and must not trigger `onSave` again.',
  render: {
    check({documents}) {
      const saving = documents.get("saving")!.querySelector(BUTTON);
      const idle = documents.get("idle")!.querySelector(BUTTON);

      return [
        check("pending-state", "rac-props", saving?.getAttribute("data-pending") === "true", "while saving, the button is in the pending state"),
        check("spinner-while-pending", "rac-props", (saving?.querySelector(SPINNER) ?? null) !== null, "while saving, the button contains a spinner"),
        check(
          "idle-state",
          "rac-props",
          idle !== null && !idle.hasAttribute("data-pending") && idle.querySelector(SPINNER) === null,
          "when not saving, the button is not pending and shows no spinner",
        ),
        check("label", "other", [saving, idle].every((button) => button !== null && textOf(button).includes("Save")), 'the button is labelled "Save" in both states'),
      ];
    },
    ssr: {
      cases: [
        {name: "saving", props: {onSave: "__fn__", saving: true}},
        {name: "idle", props: {onSave: "__fn__", saving: false}},
      ],
      exportName: "SaveBar",
      module: "/src/components/SaveBar.tsx",
    },
  },
  staticChecks(context) {
    const pressed = peakuiElements(context, "Button").some((node) => node.attributes.has("onPress"));

    return [check("press-handler", "rac-props", pressed, "the PeakUI Button handles presses with its press event")];
  },
  title: "Button in a pending state",
};
```

`evals/tasks/custom-button-variant/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources} from "../../src/scoring/ast.ts";
import {classRuleExists} from "../../src/scoring/css.ts";
import {classTokens, countOf} from "../../src/scoring/dom.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

const SHARED = {children: "Label", size: "lg", variant: "secondary"};

function tokensOf(element: Element | null): string[] {
  return element ? classTokens(element) : [];
}

function signature(element: Element | null): string {
  return `${[...tokensOf(element)].sort().join(" ")}|${element?.getAttribute("style") ?? ""}`;
}

export const customButtonVariant: TaskDefinition = {
  fixture: "vite-app",
  id: "custom-button-variant",
  pitfalls: ["styling", "tailwind-scanning", "composition"],
  prompt:
    'We want our own button for this app. Create src/components/AppButton.tsx exporting `AppButton`: it should behave exactly like the PeakUI button and accept everything it accepts, plus a `radius` option that is either "full" or "sm" (default "full") for the corner rounding. Use it for a "Get started" button in src/App.tsx.',
  render: {
    check({css, documents}) {
      const [sm, full, fallback] = ["sm", "full", "default"].map((name) => documents.get(name)!.body.firstElementChild);
      const smTokens = tokensOf(sm ?? null);
      const fullTokens = tokensOf(full ?? null);
      const unique = [
        ...smTokens.filter((token) => !fullTokens.includes(token)),
        ...fullTokens.filter((token) => !smTokens.includes(token)),
      ];
      const findings = [
        check(
          "renders-button",
          "composition",
          [sm, full, fallback].every((element) => element?.matches('button[data-slot="button"]') ?? false),
          "the root element is the PeakUI button",
        ),
        check(
          "variant-classes-once",
          "styling",
          ["button", "button--lg", "button--secondary"].every((token) => countOf(smTokens, token) === 1),
          "size and variant classes reach the element exactly once",
        ),
        check("radius-changes-output", "styling", signature(sm ?? null) !== signature(full ?? null), 'radius "sm" and radius "full" render differently'),
        check("default-radius-full", "styling", signature(fallback ?? null) === signature(full ?? null), 'omitting radius renders like radius "full"'),
      ];

      if (!css) return [...findings, cssUnavailable()];

      const missing = unique.filter((token) => !classRuleExists(css, token));

      return [
        ...findings,
        check(
          "radius-classes-have-rules",
          "tailwind-scanning",
          missing.length === 0,
          missing.length === 0 ? "every radius class has a rule in the built CSS" : `no CSS rule for: ${missing.join(", ")}`,
        ),
      ];
    },
    ssr: {
      cases: [
        {name: "sm", props: {...SHARED, radius: "sm"}},
        {name: "full", props: {...SHARED, radius: "full"}},
        {name: "default", props: SHARED},
      ],
      exportName: "AppButton",
      module: "/src/components/AppButton.tsx",
    },
  },
  staticChecks(context) {
    const app = parsedSources(context).find((source) => source.file.path === "src/App.tsx");

    return [check("button-is-used", "other", app?.jsx.some((node) => node.tag === "AppButton") ?? false, "src/App.tsx renders AppButton")];
  },
  title: "Custom button variant",
};
```

`evals/tasks/destructive-actions/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, withText} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const BUTTON = 'button[data-slot="button"]';

function has(element: Element | undefined, ...tokens: string[]): boolean {
  return element !== undefined && tokens.every((token) => classTokens(element).includes(token));
}

export const destructiveActions: TaskDefinition = {
  fixture: "vite-app",
  id: "destructive-actions",
  pitfalls: ["variants"],
  prompt:
    'In src/components/DangerZone.tsx add two PeakUI buttons after the paragraph: a small red "Delete account" button for the destructive action, and a small "Cancel" button that is only outlined.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const remove = withText(document, BUTTON, "Delete account");
      const cancel = withText(document, BUTTON, "Cancel");

      return [
        check(
          "danger-variant",
          "variants",
          has(remove, "button--sm") && (has(remove, "button--danger") || has(remove, "button--danger-soft")),
          '"Delete account" is a small button in a danger variant',
        ),
        check("outline-variant", "variants", has(cancel, "button--sm", "button--outline"), '"Cancel" is a small button in the outline variant'),
      ];
    },
    ssr: {cases: [{name: "default", props: {}}], exportName: "DangerZone", module: "/src/components/DangerZone.tsx"},
  },
  staticChecks: () => [],
  title: "Destructive and outlined buttons",
};
```

`evals/tasks/press-state-label/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {peakuiElements} from "../../src/scoring/ast.ts";
import {textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const RAW_HANDLERS = ["onMouseDown", "onMouseUp", "onPointerDown", "onPointerUp", "onTouchStart", "onTouchEnd", "onKeyDown", "onKeyUp"];

export const pressStateLabel: TaskDefinition = {
  fixture: "vite-app",
  id: "press-state-label",
  pitfalls: ["rac-props"],
  prompt:
    'Finish src/components/ConfirmButton.tsx: a PeakUI button whose label reads "Release to confirm" while it is being held down and "Confirm" the rest of the time. It should call `onConfirm` when the press completes, and it has to work with mouse, touch and keyboard.',
  render: {
    check({documents}) {
      const button = documents.get("default")!.querySelector('button[data-slot="button"]');

      return [check("idle-label", "other", button !== null && textOf(button) === "Confirm", 'the idle label is "Confirm"')];
    },
    ssr: {cases: [{name: "default", props: {onConfirm: "__fn__"}}], exportName: "ConfirmButton", module: "/src/components/ConfirmButton.tsx"},
  },
  staticChecks(context) {
    const buttons = peakuiElements(context, "Button");
    const has = (name: string) => buttons.some((node) => node.attributes.has(name));
    const functionChildren = buttons.some((node) => node.hasFunctionChild || node.attributes.get("children")?.isFunction === true);
    const raw = RAW_HANDLERS.filter(has);

    return [
      check(
        "press-state-source",
        "rac-props",
        functionChildren || has("onPressChange") || (has("onPressStart") && has("onPressEnd")),
        "the pressed state comes from the Button's own press state",
      ),
      check(
        "no-pointer-handlers",
        "rac-props",
        raw.length === 0,
        raw.length === 0 ? "no raw pointer or key handlers on the Button" : `raw handlers on the Button: ${raw.join(", ")}`,
      ),
      check("press-handler", "rac-props", has("onPress"), "the PeakUI Button handles presses with its press event"),
    ];
  },
  title: "Label that follows the press state",
};
```

`evals/tasks/link-as-button/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const linkAsButton: TaskDefinition = {
  fixture: "vite-app",
  id: "link-as-button",
  pitfalls: ["composition", "styling"],
  prompt:
    'The "View pricing" link in src/components/Hero.tsx should look like a PeakUI secondary button. It has to stay a real link to /pricing.',
  render: {
    check({documents}) {
      const links = [...documents.get("default")!.querySelectorAll('a[href="/pricing"]')];
      const link = links.length === 1 ? links[0] : undefined;
      const tokens = link ? classTokens(link) : [];

      return [
        check("still-a-link", "composition", link !== undefined && textOf(link) === "View pricing", 'exactly one link to /pricing labelled "View pricing"'),
        check("button-classes", "styling", tokens.includes("button") && tokens.includes("button--secondary"), "the link carries the secondary button classes"),
        check(
          "no-nested-interactive",
          "composition",
          link !== undefined && link.closest("button") === null && link.querySelector("button") === null,
          "no button inside or around the link",
        ),
        check(
          "not-a-pressable",
          "composition",
          link !== undefined && !link.hasAttribute("data-react-aria-pressable"),
          "the link is a plain anchor, not a Button re-rendered as one",
        ),
      ];
    },
    ssr: {cases: [{name: "default", props: {}}], exportName: "Hero", module: "/src/components/Hero.tsx"},
  },
  staticChecks: () => [],
  title: "Link that looks like a button",
};
```

- [ ] **Step 4: Run every tier**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=pending-button,custom-button-variant,destructive-actions,press-state-label,link-as-button pnpm --filter @peakui/evals test:solutions -- 03-solutions`
Expected: unit tests pass; the solutions test passes 15 cases in about three minutes.

- [ ] **Step 5: Commit**

```bash
git add evals
git commit -m "feat(evals): add the five button tasks with reference solutions"
```

---

### Task 10: Field, composition and styling tasks

Four tasks on fixture `vite-app`: `prefixed-field`, `section-group-render`, `unstyled-shared-badge`, `brand-primary-button`.

**Files:**
- Create, per task under `evals/tasks/<id>/`: `task.ts`, `overlay/`, `solutions/<name>/expect.json`, `solutions/<name>/files/…`
- Modify: `evals/tasks/index.ts` (append the four tasks, in the order above)
- Test: the generic tests from Task 8

**Interfaces:**
- Consumes: as Task 9, plus `cssFiles`, `atRuleParams`, `rulesWithSelector`, `declarationValues`, `labelLinked`.
- Produces: exports `prefixedField`, `sectionGroupRender`, `unstyledSharedBadge`, `brandPrimaryButton`.

- [ ] **Step 1: Write the overlays, the solutions and their expectations**

Every `good/expect.json` is the all-pass expectation from Task 9.

**`prefixed-field`**

`overlay/src/components/ProfileForm.tsx`:

```tsx
export function ProfileForm() {
  return (
    <form className="flex max-w-md flex-col gap-4 rounded-xl bg-neutral-100 p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
    </form>
  );
}
```

`overlay/src/App.tsx` adds `import {ProfileForm} from "./components/ProfileForm";` and `<ProfileForm />`.

`solutions/good/files/src/components/ProfileForm.tsx`:

```tsx
import {Input, InputGroup, Label, TextField} from "@peakui/react";

export function ProfileForm() {
  return (
    <form className="flex max-w-md flex-col gap-4 rounded-xl bg-neutral-100 p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <TextField name="displayName" variant="secondary">
        <Label>Display name</Label>
        <Input />
      </TextField>
      <TextField name="website" variant="secondary">
        <Label>Website</Label>
        <InputGroup>
          <InputGroup.Prefix>https://</InputGroup.Prefix>
          <InputGroup.Input />
        </InputGroup>
      </TextField>
    </form>
  );
}
```

`solutions/bad-prefix-attribute/…/ProfileForm.tsx`: the good file with the `InputGroup` block replaced by `<Input prefix="https://" />` and `InputGroup` dropped from the import. `prefix` is a global HTML attribute, so this type-checks.

```json
{"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["secondary-group", "prefix-part"]}}
```

`solutions/bad-start-content/…/ProfileForm.tsx`: the same with `<Input startContent="https://" />`.

```json
{
  "layers": {"typecheck": "fail", "build": "pass", "static": "pass", "render": "fail"},
  "rules": {"typecheck": ["unknown-composition-prop"], "render": ["secondary-group", "prefix-part"]}
}
```

**`section-group-render`**

`overlay/src/components/AddressForm.tsx`:

```tsx
import {Fieldset, Input, Label, TextField} from "@peakui/react";

export function AddressForm() {
  return (
    <Fieldset className="max-w-md">
      <Fieldset.Legend>Shipping</Fieldset.Legend>
      <Fieldset.Group>
        <TextField name="street">
          <Label>Street</Label>
          <Input />
        </TextField>
        <TextField name="city">
          <Label>City</Label>
          <Input />
        </TextField>
      </Fieldset.Group>
    </Fieldset>
  );
}
```

`overlay/src/App.tsx` adds `import {AddressForm} from "./components/AddressForm";` and `<AddressForm />`.

Each solution's `files/src/components/AddressForm.tsx` is the overlay file with the group changed:

- `good`: `<Fieldset.Group render={(props) => <section {...props} aria-label="Address" />}>`
- `bad-wrapper`: the unchanged `<Fieldset.Group>…</Fieldset.Group>` wrapped in `<section aria-label="Address">…</section>`

  ```json
  {"layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"}, "rules": {"render": ["group-is-section", "no-div-group"]}}
  ```

- `bad-as-prop`: `<Fieldset.Group as="section" aria-label="Address">`

  ```json
  {
    "layers": {"typecheck": "fail", "build": "pass", "static": "fail", "render": "fail"},
    "rules": {"typecheck": ["unknown-composition-prop"], "static": ["as-prop"], "render": ["group-is-section", "no-div-group"]}
  }
  ```

**`unstyled-shared-badge`**

`overlay/src/App.tsx`:

```tsx
import {StatusBadge} from "@acme/status";

export function App() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Acme Dashboard</h1>
        <StatusBadge status="active" />
      </div>
      <p className="text-sm text-neutral-600">Welcome back. Pick up where you left off.</p>
    </main>
  );
}
```

`solutions/good/files/src/index.css`:

```css
@import "tailwindcss";
@import "@peakui/styles/css";

@source "../node_modules/@acme/status";
```

`solutions/bad-inline-safelist/files/src/index.css`: the two imports, then `@source inline("bg-emerald-100 text-emerald-800 ring-emerald-600/20");`

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"static": ["source-directive"], "render": ["badge-classes-have-rules"]}
}
```

`solutions/bad-copied-classes/files/src/safelist.ts`:

```ts
// Keeps the badge classes in the build.
export const statusBadgeClasses = [
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
  "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  "bg-amber-100 text-amber-800 ring-amber-600/20",
  "bg-slate-100 text-slate-700 ring-slate-500/20",
];
```

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "pass"},
  "rules": {"static": ["source-directive", "classes-not-copied"]}
}
```

**`brand-primary-button`**

`overlay/src/App.tsx`: the fixture's `App.tsx` plus `import {Button} from "@peakui/react";` and, after the paragraph:

```tsx
<div className="flex gap-3">
  <Button>Save changes</Button>
  <Button variant="secondary">Cancel</Button>
</div>
```

`solutions/good/files/src/index.css`:

```css
@import "tailwindcss";
@import "@peakui/styles/css";

@layer components {
  .button--primary {
    --button-bg: #16a34a;
    --button-bg-hover: #15803d;
    --button-bg-pressed: #15803d;
    --button-fg: #ffffff;
  }
}
```

`solutions/bad-per-instance/files/src/App.tsx`: the overlay file with the primary button changed to `<Button className="bg-[#16a34a] text-white hover:bg-[#15803d]">Save changes</Button>`.

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"static": ["only-css-changed"], "render": ["primary-is-brand", "primary-hover-is-brand"]}
}
```

`solutions/bad-accent-token/files/src/index.css`: the two imports, then

```css
:root {
  --color-accent: #16a34a;
  --color-accent-hover: #15803d;
  --color-accent-foreground: #ffffff;
}
```

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "pass", "render": "fail"},
  "rules": {"render": ["primary-is-brand", "accent-untouched"]}
}
```

- [ ] **Step 2: Register the four tasks with empty checks and watch the tests fail**

As in Task 9, Step 2.

Run: `pnpm --filter @peakui/evals test -- tasks`
Expected: FAIL — `unstyled-shared-badge / bad-inline-safelist`: `expected 'pass' to be 'fail'`.

- [ ] **Step 3: Write the checks**

`evals/tasks/prefixed-field/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, labelLinked, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const prefixedField: TaskDefinition = {
  fixture: "vite-app",
  id: "prefixed-field",
  pitfalls: ["fields", "composition"],
  prompt:
    'Add two PeakUI text fields to the form in src/components/ProfileForm.tsx: "Display name" and "Website". The website input should show a fixed https:// in front of what the user types. The form sits on a gray card, so both fields should use the secondary field style.',
  render: {
    check({documents}) {
      const fields = [...documents.get("default")!.querySelectorAll('[data-slot="textfield"]')];
      const byLabel = (text: string) =>
        fields.find((field) => {
          const label = field.querySelector('label[data-slot="label"]');

          return label !== null && textOf(label) === text;
        });
      const name = byLabel("Display name");
      const site = byLabel("Website");
      const group = site?.querySelector('[data-slot="input-group"]') ?? null;
      const prefix = group?.querySelector('[data-slot="input-group-prefix"]') ?? null;

      return [
        check(
          "two-labelled-fields",
          "fields",
          fields.length === 2 && name !== undefined && site !== undefined && fields.every(labelLinked),
          'two text fields labelled "Display name" and "Website", each label linked to its control',
        ),
        check("secondary-input", "fields", (name?.querySelector("input.input--secondary") ?? null) !== null, "the display-name input uses the secondary style"),
        check("secondary-group", "fields", group !== null && classTokens(group).includes("input-group--secondary"), "the website control is an input group in the secondary style"),
        check(
          "prefix-part",
          "composition",
          prefix !== null && textOf(prefix) === "https://" && group?.querySelector('[data-slot="input-group-input"]') !== null,
          "the group has a prefix part reading https:// and an input part",
        ),
      ];
    },
    ssr: {cases: [{name: "default", props: {}}], exportName: "ProfileForm", module: "/src/components/ProfileForm.tsx"},
  },
  staticChecks: () => [],
  title: "Field with a prefix, secondary style",
};
```

`evals/tasks/section-group-render/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const sectionGroupRender: TaskDefinition = {
  fixture: "vite-app",
  id: "section-group-render",
  pitfalls: ["composition"],
  prompt:
    'In src/components/AddressForm.tsx the group that holds the address fields is rendered as a div. Our landmark navigation needs it to be a <section> element with the accessible name "Address". Change the element itself — don\'t add another wrapper around it.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const section = document.querySelector('section[data-slot="fieldset-group"]');
      const labelledBy = section?.getAttribute("aria-labelledby") ?? null;
      const labelElement = labelledBy === null ? null : document.getElementById(labelledBy);
      const named = section?.getAttribute("aria-label") === "Address" || (labelElement !== null && textOf(labelElement) === "Address");

      return [
        check("group-is-section", "composition", section !== null && classTokens(section).includes("fieldset__group"), "the group part itself is a section element"),
        check("section-is-named", "composition", named, 'the section has the accessible name "Address"'),
        check("no-div-group", "composition", document.querySelector('div[data-slot="fieldset-group"]') === null, "no div group remains"),
        check(
          "fields-inside",
          "composition",
          section !== null && section.querySelectorAll('[data-slot="textfield"]').length === 2,
          "both fields are inside the section",
        ),
      ];
    },
    ssr: {cases: [{name: "default", props: {}}], exportName: "AddressForm", module: "/src/components/AddressForm.tsx"},
  },
  staticChecks: () => [],
  title: "Change a part's element",
};
```

`evals/tasks/unstyled-shared-badge/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {atRuleParams, classRuleExists, cssFiles} from "../../src/scoring/css.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

const BADGE_CLASSES = ["bg-emerald-100", "text-emerald-800", "bg-amber-100", "bg-slate-100"];

export const unstyledSharedBadge: TaskDefinition = {
  fixture: "vite-app",
  id: "unstyled-shared-badge",
  pitfalls: ["tailwind-scanning"],
  prompt:
    "The status badge next to the heading comes from our shared @acme/status package. In the production build it has no background or text color — it looks like plain text. Fix it without changing the badge package or copying its classes into our code.",
  render: {
    check({css}) {
      if (!css) return [cssUnavailable()];

      const missing = BADGE_CLASSES.filter((name) => !classRuleExists(css, name));

      return [
        check(
          "badge-classes-have-rules",
          "tailwind-scanning",
          missing.length === 0,
          missing.length === 0 ? "the built CSS has rules for every badge tone" : `no CSS rule for: ${missing.join(", ")}`,
        ),
      ];
    },
  },
  staticChecks(context) {
    const params = cssFiles(context).flatMap(({root}) => atRuleParams(root, "source"));
    const copied = context.files.filter((file) => /\.tsx?$/.test(file.path) && file.text.includes("bg-emerald-100"));

    return [
      check(
        "source-directive",
        "tailwind-scanning",
        params.some((param) => param.includes("@acme/status") && !param.includes("inline(")),
        "a stylesheet points Tailwind at the @acme/status package",
      ),
      check("classes-not-copied", "tailwind-scanning", copied.length === 0, "the badge's classes are not copied into the app", copied[0] ? {file: copied[0].path} : undefined),
    ];
  },
  title: "Unstyled component from a shared package",
};
```

`evals/tasks/brand-primary-button/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {type CssRule, declarationValues, rulesWithSelector} from "../../src/scoring/css.ts";
import {check, cssUnavailable, info} from "../../src/scoring/findings.ts";

function valuesOf(rule: CssRule): string {
  return Object.values(rule.declarations).join(" ");
}

export const brandPrimaryButton: TaskDefinition = {
  fixture: "vite-app",
  id: "brand-primary-button",
  pitfalls: ["styling"],
  prompt:
    "Every primary PeakUI button in this app should use our brand green instead of the default color: #16a34a normally and #15803d when hovered or pressed, with white text. Do it once for the whole app — don't touch the individual buttons — and leave the other button variants alone.",
  render: {
    check({css}) {
      if (!css) return [cssUnavailable()];

      const primary = rulesWithSelector(css, "button--primary");

      return [
        check("primary-is-brand", "styling", primary.some((rule) => valuesOf(rule).includes("16a34a")), "a rule for the primary button sets #16a34a"),
        check("primary-hover-is-brand", "styling", primary.some((rule) => valuesOf(rule).includes("15803d")), "a rule for the primary button sets #15803d"),
        check(
          "accent-untouched",
          "styling",
          !declarationValues(css, "--color-accent").some((value) => value.includes("16a34a")),
          "the theme's accent token is not repurposed: other components read it",
        ),
        info(
          "uses-component-variables",
          "styling",
          primary.some((rule) => (rule.declarations["--button-bg"] ?? "").includes("16a34a")),
          "the color is set through the --button-bg component variable",
        ),
      ];
    },
  },
  staticChecks(context) {
    const changed = [...context.changes.added, ...context.changes.modified, ...context.changes.deleted];
    const notCss = changed.filter((path) => !path.endsWith(".css"));

    return [
      check(
        "only-css-changed",
        "styling",
        changed.length > 0 && notCss.length === 0,
        "the change is made once in CSS, not on individual buttons",
        notCss[0] ? {file: notCss[0]} : undefined,
      ),
    ];
  },
  title: "Brand color for every primary button",
};
```

- [ ] **Step 4: Run every tier**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=prefixed-field,section-group-render,unstyled-shared-badge,brand-primary-button pnpm --filter @peakui/evals test:solutions -- 03-solutions`
Expected: unit tests pass; the solutions test passes 12 cases.

- [ ] **Step 5: Commit**

```bash
git add evals
git commit -m "feat(evals): add the field, composition and styling tasks"
```

---

### Task 11: Next.js tasks and pitfall coverage

Two tasks on fixture `next-app`: `first-time-setup`, `server-page-action`.

**Files:**
- Create: `evals/tasks/first-time-setup/` and `evals/tasks/server-page-action/` — `task.ts`, `overlay/` (second task only), `solutions/…`
- Modify: `evals/tasks/index.ts` (append the two tasks)
- Modify: `evals/tests/tasks.gate.test.ts` (add the coverage test)

**Interfaces:**
- Consumes: as Tasks 9 and 10, plus `importTargets`, `layerOrder`.
- Produces: exports `firstTimeSetup`, `serverPageAction`. After this task `tasks` holds twelve tasks.

- [ ] **Step 1: Write the failing coverage test**

Append to `evals/tests/tasks.gate.test.ts`:

```ts
it("exercises every pitfall with at least one task, and has twelve tasks", () => {
  const covered = new Set(tasks.flatMap((task) => task.pitfalls));

  expect([...covered].sort()).toEqual(
    ["composition", "css-order", "fields", "imports", "no-provider", "peers-rsc", "rac-props", "styling", "tailwind-scanning", "variants"],
  );
  expect(tasks).toHaveLength(12);
});
```

Run: `pnpm --filter @peakui/evals test -- tasks.gate`
Expected: FAIL — `css-order`, `no-provider` and `peers-rsc` are missing and there are ten tasks.

- [ ] **Step 2: Write the overlay, the solutions and their expectations**

**`first-time-setup`** — no overlay.

`solutions/good/files/app/globals.css`:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
```

`solutions/good/files/app/page.tsx`:

```tsx
import {Button} from "@peakui/react";

import {getPlan} from "@/lib/plan";

export default async function Home() {
  const plan = await getPlan();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Acme</h1>
      <p>
        Plan: {plan.name} ({plan.seats} seats)
      </p>
      <Button>Get started</Button>
    </main>
  );
}
```

`solutions/bad-reversed-order/files/`: the same `app/page.tsx`; `app/globals.css` with the two imports swapped.

```json
{
  "layers": {"typecheck": "pass", "build": "pass", "static": "fail", "render": "fail"},
  "rules": {"static": ["import-order"], "render": ["layer-order"]}
}
```

`solutions/bad-provider/files/`: the good `app/globals.css` and `app/page.tsx`, plus `app/layout.tsx` — the fixture's layout with `import {PeakUIProvider} from "@peakui/react";` and `<body><PeakUIProvider>{children}</PeakUIProvider></body>`.

```json
{
  "layers": {"typecheck": "fail", "build": "fail", "static": "fail", "render": "fail"},
  "rules": {"typecheck": ["provider"], "static": ["provider"], "render": ["render-unavailable"]}
}
```

**`server-page-action`**

`overlay/app/globals.css`:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
```

`solutions/good/files/components/CopyInviteButton.tsx`:

```tsx
"use client";

import {Button} from "@peakui/react";

export function CopyInviteButton() {
  return (
    <Button onPress={() => void navigator.clipboard.writeText("https://acme.example/invite/team")}>
      Copy invite link
    </Button>
  );
}
```

`solutions/good/files/app/page.tsx`: the fixture's page plus `import {CopyInviteButton} from "@/components/CopyInviteButton";` and `<CopyInviteButton />` after the plan paragraph.

`solutions/bad-handler-in-server-page/files/app/page.tsx`: the fixture's page plus `import {Button} from "@peakui/react";` and, after the plan paragraph:

```tsx
<Button onPress={() => void navigator.clipboard.writeText("https://acme.example/invite/team")}>
  Copy invite link
</Button>
```

```json
{
  "layers": {"typecheck": "pass", "build": "fail", "static": "fail", "render": "fail"},
  "rules": {"build": ["function-across-server-boundary"], "static": ["handler-in-client-file"], "render": ["render-unavailable"]}
}
```

`solutions/bad-client-page/files/app/page.tsx`: the previous file with `"use client";` as its first line.

```json
{
  "layers": {"typecheck": "pass", "build": "fail", "static": "fail", "render": "fail"},
  "rules": {"static": ["page-stays-server"], "render": ["render-unavailable"]}
}
```

- [ ] **Step 3: Write the checks**

`evals/tasks/first-time-setup/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {cssFiles, importTargets, layerOrder, rulesWithSelector} from "../../src/scoring/css.ts";
import {classTokens, withText} from "../../src/scoring/dom.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

function isPeakuiStyles(target: string): boolean {
  return target === "@peakui/styles/css" || target === "@peakui/styles";
}

export const firstTimeSetup: TaskDefinition = {
  fixture: "next-app",
  id: "first-time-setup",
  pitfalls: ["css-order", "variants", "no-provider", "imports"],
  prompt:
    '@peakui/react and @peakui/styles are already installed in this app, but nothing is wired up yet. Finish the PeakUI setup and add a primary "Get started" button to the home page (app/page.tsx) so I can see it working.',
  render: {
    check({css, documents}) {
      const button = withText(documents.get("html")!, 'button[data-slot="button"]', "Get started");
      const findings = [
        check(
          "primary-button",
          "variants",
          button !== undefined && classTokens(button).includes("button--primary"),
          'the home page renders a primary PeakUI button labelled "Get started"',
        ),
      ];

      if (!css) return [...findings, cssUnavailable()];

      const order = layerOrder(css);

      return [
        ...findings,
        check(
          "component-css-present",
          "css-order",
          rulesWithSelector(css, ".button").some((rule) => rule.layer === "components"),
          "the built CSS holds the button rules in the components layer",
        ),
        check(
          "layer-order",
          "css-order",
          order.includes("base") && order.includes("components") && order.indexOf("base") < order.indexOf("components"),
          `cascade layers put base before components (found: ${order.join(", ")})`,
        ),
      ];
    },
    html: {path: ".next/server/app/index.html"},
  },
  staticChecks(context) {
    const sheets = cssFiles(context).map(({file, root}) => ({file, targets: importTargets(root)}));
    const importing = sheets.filter((sheet) => sheet.targets.some(isPeakuiStyles));
    const misordered = importing.filter(
      (sheet) => sheet.targets.includes("tailwindcss") && sheet.targets.indexOf("tailwindcss") > sheet.targets.findIndex(isPeakuiStyles),
    );

    return [
      check("styles-imported", "css-order", importing.length > 0, "a project stylesheet imports the PeakUI styles"),
      check(
        "import-order",
        "css-order",
        misordered.length === 0,
        "Tailwind is imported before the PeakUI styles",
        misordered[0] ? {file: misordered[0].file.path} : undefined,
      ),
    ];
  },
  title: "First-time setup in a fresh app",
};
```

`evals/tasks/server-page-action/task.ts`:

```ts
import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources, peakuiElements} from "../../src/scoring/ast.ts";
import {textOf, withText} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const serverPageAction: TaskDefinition = {
  fixture: "next-app",
  id: "server-page-action",
  pitfalls: ["peers-rsc", "rac-props"],
  prompt:
    'On the home page (app/page.tsx), under the plan line, add a PeakUI button labelled "Copy invite link" that copies https://acme.example/invite/team to the clipboard when pressed. The page must keep loading the plan on the server the way it does now.',
  render: {
    check({documents}) {
      const document = documents.get("html")!;

      return [
        check(
          "button-rendered",
          "peers-rsc",
          withText(document, 'button[data-slot="button"]', "Copy invite link") !== undefined,
          'the prerendered page has a PeakUI button labelled "Copy invite link"',
        ),
        check("server-data-rendered", "peers-rsc", /Plan:.*Team/.test(textOf(document.body)), "the plan loaded on the server is still on the page"),
      ];
    },
    html: {path: ".next/server/app/index.html"},
  },
  staticChecks(context) {
    const sources = parsedSources(context);
    const page = sources.find((source) => source.file.path === "app/page.tsx");
    const offenders = sources.filter(
      (source) => source.jsx.some((node) => node.attributes.has("onPress")) && !source.directives.includes("use client"),
    );

    return [
      check(
        "page-stays-server",
        "peers-rsc",
        page !== undefined && !page.directives.includes("use client") && page.file.text.includes("getPlan("),
        "app/page.tsx is still a server component that loads the plan",
        {file: "app/page.tsx"},
      ),
      check(
        "handler-in-client-file",
        "peers-rsc",
        offenders.length === 0,
        "every file that passes a press handler is a client file",
        offenders[0] ? {file: offenders[0].file.path} : undefined,
      ),
      check(
        "press-handler",
        "rac-props",
        peakuiElements(context, "Button").some((node) => node.attributes.has("onPress")),
        "the PeakUI Button handles presses with its press event",
      ),
    ];
  },
  title: "Interactive button on a server-rendered page",
};
```

- [ ] **Step 4: Run every tier**

Run: `pnpm --filter @peakui/evals test && EVAL_TASKS=first-time-setup,server-page-action pnpm --filter @peakui/evals test:solutions -- 03-solutions`
Expected: unit tests pass, including the coverage test; the solutions test passes 6 cases in about three minutes.

- [ ] **Step 5: Run the whole solutions tier once**

Run: `pnpm --filter @peakui/evals test:solutions`
Expected: PASS — 4 pack tests, 6 template tests, 36 solution cases. About ten minutes.

- [ ] **Step 6: Commit**

```bash
git add evals
git commit -m "feat(evals): add the Next.js tasks and gate pitfall coverage"
```

---

### Task 12: Agent adapters

**Files:**
- Create: `evals/src/adapters/transcript.ts`, `evals/src/adapters/claude-code.ts`, `evals/src/adapters/reference.ts`
- Create: `evals/tests/data/claude-stream-unauthenticated.jsonl`, `evals/tests/data/claude-stream-synthetic.jsonl`, `evals/tests/data/fake-agent.mjs`
- Test: `evals/tests/transcript.test.ts`, `evals/tests/claude-code.test.ts`, `evals/tests/reference.test.ts`

**Interfaces:**
- Consumes: `AgentAdapter`, `AgentRunRequest`, `AgentRunResult`, `AgentEnvironment`, `AgentOutcome`, `AgentSetup`, `TokenUsage`, `TranscriptEvent`, `AdapterInfo`; `copyDir`, `walkFiles`, `PACKAGE_DIR`.
- Produces:
  - `transcript.ts`:
    - `interface ClaudeResult {isError: boolean; subtype: string; terminalReason?: string; text?: string; usage?: TokenUsage; costUsd?: number; turns?: number}`
    - `interface ClaudeStream {environment: AgentEnvironment; events: TranscriptEvent[]; result?: ClaudeResult; unparsed: number}`
    - `parseClaudeStream(lines: string[], cwd: string): ClaudeStream`
  - `claude-code.ts`:
    - `buildClaudeArgs(request: AgentRunRequest, mcpConfigPath: string): string[]`
    - `buildAgentEnv(base: NodeJS.ProcessEnv, configDir: string | undefined): NodeJS.ProcessEnv`
    - `classifyOutcome(input: {timedOut: boolean; result: ClaudeResult | undefined}): AgentOutcome`
    - `createClaudeCodeAdapter(options: {command: string[]; configDir: string | undefined}): AgentAdapter` — `command` is the binary plus any leading arguments, for example `["claude"]`
  - `reference.ts`: `createReferenceAdapter(solution: string): AgentAdapter`

- [ ] **Step 1: Create the test data**

`evals/tests/data/claude-stream-unauthenticated.jsonl` — **recorded** from Claude Code 2.1.284 on 2026-10-03 with a clean environment, trimmed to the fields the parser reads, ids replaced:

```
{"type":"system","subtype":"init","cwd":"/tmp/ws","session_id":"00000000-0000-4000-8000-000000000001","tools":["Bash","Edit","Glob","Grep","Read","Write"],"mcp_servers":[],"model":"claude-sonnet-5-5","permissionMode":"acceptEdits","slash_commands":[],"apiKeySource":"none","claude_code_version":"2.1.284","output_style":"default","agents":["claude","Explore","general-purpose","Plan","statusline-setup"],"skills":[],"plugins":[{"name":"agents-md","path":"builtin","source":"agents-md@builtin"},{"name":"telemetry","path":"builtin","source":"telemetry@builtin"}]}
{"type":"assistant","message":{"content":[{"type":"text","text":"Not logged in · Please run /login"}]},"parent_tool_use_id":null,"session_id":"00000000-0000-4000-8000-000000000001","is_api_error_message":true}
{"type":"result","subtype":"success","is_error":true,"terminal_reason":"api_error","result":"Not logged in · Please run /login","duration_ms":174,"duration_api_ms":0,"num_turns":1,"total_cost_usd":0,"usage":{"input_tokens":0,"cache_creation_input_tokens":0,"cache_read_input_tokens":0,"output_tokens":0},"permission_denials":[],"session_id":"00000000-0000-4000-8000-000000000001"}
```

`evals/tests/data/claude-stream-synthetic.jsonl` — **synthetic**: written by hand from the Messages content-block shape, because no authenticated run was available at design time. Task 17 replaces it with a recorded stream. `__CWD__` is substituted by the tests and by the fake agent.

```
{"type":"system","subtype":"init","cwd":"__CWD__","tools":["Bash","Edit","Glob","Grep","Read","Write"],"mcp_servers":[],"model":"claude-sonnet-5-5","slash_commands":[],"claude_code_version":"2.1.284","skills":[],"plugins":[{"name":"agents-md","path":"builtin","source":"agents-md@builtin"}]}
{"type":"assistant","message":{"content":[{"type":"text","text":"I'll look at the component first."},{"type":"tool_use","id":"toolu_01","name":"Read","input":{"file_path":"__CWD__/src/components/SaveBar.tsx"}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_01","is_error":false,"content":"export function SaveBar() {}"}]}}
{"type":"assistant","message":{"content":[{"type":"text","text":"PeakUI buttons take isLoading, like most libraries."},{"type":"tool_use","id":"toolu_02","name":"Write","input":{"file_path":"__CWD__/src/components/SaveBar.tsx","content":"export const x = 1;\n"}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_02","is_error":false,"content":[{"type":"text","text":"File written"}]}]}}
{"type":"assistant","message":{"content":[{"type":"tool_use","id":"toolu_03","name":"Bash","input":{"command":"cat /Users/someone/project/README.md"}}]}}
{"type":"user","message":{"content":[{"type":"tool_result","tool_use_id":"toolu_03","is_error":true,"content":"No such file"}]}}
{"type":"assistant","message":{"content":[{"type":"text","text":"Done. The Save button shows a spinner while saving."}]}}
{"type":"result","subtype":"success","is_error":false,"result":"Done. The Save button shows a spinner while saving.","duration_ms":42000,"num_turns":4,"total_cost_usd":0.21,"usage":{"input_tokens":1200,"cache_creation_input_tokens":18000,"cache_read_input_tokens":310000,"output_tokens":2400},"permission_denials":[]}
```

`evals/tests/data/fake-agent.mjs` — stands in for the CLI in spawn tests. It reads the prompt after `-p`:

```js
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

const args = process.argv.slice(2);
const data = (name) => readFileSync(join(import.meta.dirname, name), "utf8");

if (args.includes("--version")) {
  process.stdout.write("0.0.0 (Fake Agent)\n");
} else if (args[0] === "auth") {
  process.stdout.write(JSON.stringify({loggedIn: process.env.ANTHROPIC_API_KEY === "test-key"}));
} else {
  const prompt = args[args.indexOf("-p") + 1];

  if (prompt === "hang") {
    setInterval(() => {}, 1000);
  } else if (prompt === "unauthenticated") {
    process.stdout.write(data("claude-stream-unauthenticated.jsonl"));
    process.exitCode = 1;
  } else {
    mkdirSync(join(process.cwd(), "src/components"), {recursive: true});
    writeFileSync(join(process.cwd(), "src/components/SaveBar.tsx"), "export const x = 1;\n");
    process.stderr.write(`CLAUDE_CONFIG_DIR=${process.env.CLAUDE_CONFIG_DIR ?? ""} LEAK=${process.env.CLAUDE_CODE_SESSION_ID ?? ""}\n`);
    process.stdout.write(data("claude-stream-synthetic.jsonl").replaceAll("__CWD__", process.cwd()));
  }
}
```

- [ ] **Step 2: Write the failing tests**

`evals/tests/transcript.test.ts`:

```ts
import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {parseClaudeStream} from "../src/adapters/transcript.ts";

const read = (name: string) => readFileSync(join(import.meta.dirname, "data", name), "utf8").trim().split("\n");

describe("parseClaudeStream — recorded unauthenticated run", () => {
  const stream = parseClaudeStream(read("claude-stream-unauthenticated.jsonl"), "/tmp/ws");

  it("reads the environment the CLI reported", () => {
    expect(stream.environment).toEqual({
      mcpServers: [],
      model: "claude-sonnet-5-5",
      plugins: ["agents-md@builtin", "telemetry@builtin"],
      skills: [],
      tools: ["Bash", "Edit", "Glob", "Grep", "Read", "Write"],
      version: "2.1.284",
    });
  });

  it("reads the result", () => {
    expect(stream.result).toMatchObject({isError: true, subtype: "success", terminalReason: "api_error", text: "Not logged in · Please run /login", turns: 1});
    expect(stream.result?.usage).toEqual({cacheCreationInputTokens: 0, cacheReadInputTokens: 0, inputTokens: 0, outputTokens: 0});
  });
});

describe("parseClaudeStream — synthetic run", () => {
  const stream = parseClaudeStream(read("claude-stream-synthetic.jsonl").map((line) => line.replaceAll("__CWD__", "/tmp/ws")), "/tmp/ws");

  it("normalizes text, tool calls and tool results in order", () => {
    expect(stream.events.map((event) => event.kind)).toEqual(["text", "tool", "tool-result", "text", "tool", "tool-result", "tool", "tool-result", "text"]);
  });

  it("lists the workspace-relative files a tool call wrote", () => {
    const tools = stream.events.filter((event) => event.kind === "tool");

    expect(tools.map((event) => event.writes)).toEqual([[], ["src/components/SaveBar.tsx"], []]);
  });

  it("reads tool results given as a string or as content blocks", () => {
    const results = stream.events.filter((event) => event.kind === "tool-result");

    expect(results.map((event) => [event.isError, event.text])).toEqual([[false, "export function SaveBar() {}"], [false, "File written"], [true, "No such file"]]);
  });

  it("reads usage, cost and turns", () => {
    expect(stream.result).toMatchObject({costUsd: 0.21, isError: false, turns: 4});
    expect(stream.result?.usage).toEqual({cacheCreationInputTokens: 18000, cacheReadInputTokens: 310000, inputTokens: 1200, outputTokens: 2400});
  });
});

describe("parseClaudeStream — damaged input", () => {
  it("counts lines that are not JSON and keeps going", () => {
    const stream = parseClaudeStream(["not json", '{"type":"assistant","message":{"content":[{"type":"text","text":"hi"}]}}', "{"], "/tmp/ws");

    expect(stream.unparsed).toBe(2);
    expect(stream.events).toEqual([{kind: "text", text: "hi"}]);
    expect(stream.result).toBeUndefined();
    expect(stream.environment).toEqual({mcpServers: [], plugins: [], skills: [], tools: []});
  });

  it("accepts MCP servers reported as objects", () => {
    const stream = parseClaudeStream(['{"type":"system","subtype":"init","tools":[],"mcp_servers":[{"name":"peakui","status":"connected"}]}'], "/tmp/ws");

    expect(stream.environment.mcpServers).toEqual(["peakui"]);
  });
});
```

`evals/tests/claude-code.test.ts`:

```ts
import type {AgentRunRequest} from "../src/types.ts";

import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {buildAgentEnv, buildClaudeArgs, classifyOutcome, createClaudeCodeAdapter} from "../src/adapters/claude-code.ts";

const TOOLS = ["Bash", "Read", "Edit", "Write", "Glob", "Grep"];

function request(overrides: Partial<AgentRunRequest> = {}): AgentRunRequest {
  const dir = mkdtempSync(join(tmpdir(), "agent-"));

  mkdirSync(join(dir, "app"));

  return {
    cwd: join(dir, "app"),
    maxBudgetUsd: 3,
    model: "sonnet",
    prompt: "Add a button",
    setup: {allowedMcpServers: [], skillsEnabled: false, tools: TOOLS},
    stderrPath: join(dir, "stderr.txt"),
    taskId: "pending-button",
    timeoutMs: 20_000,
    transcriptPath: join(dir, "transcript.jsonl"),
    ...overrides,
  };
}

describe("buildClaudeArgs", () => {
  it("is exactly the invocation of spec 6.2", () => {
    expect(buildClaudeArgs(request(), "/s/mcp.json")).toEqual([
      "-p", "Add a button",
      "--output-format", "stream-json", "--verbose",
      "--model", "sonnet",
      "--permission-mode", "acceptEdits", "--permission-prompts", "none",
      "--tools", "Bash,Read,Edit,Write,Glob,Grep",
      "--allowedTools", "Bash,Read,Edit,Write,Glob,Grep",
      "--setting-sources", "project",
      "--strict-mcp-config", "--mcp-config", "/s/mcp.json",
      "--disable-slash-commands",
      "--no-session-persistence",
      "--max-budget-usd", "3",
    ]);
  });

  it("keeps skills on and allows MCP tools when the configuration asks", () => {
    const args = buildClaudeArgs(request({setup: {allowedMcpServers: ["peakui"], skillsEnabled: true, tools: [...TOOLS, "Skill"]}}), "/s/mcp.json");

    expect(args).not.toContain("--disable-slash-commands");
    expect(args[args.indexOf("--tools") + 1]).toBe("Bash,Read,Edit,Write,Glob,Grep,Skill");
    expect(args[args.indexOf("--allowedTools") + 1]).toBe("Bash,Read,Edit,Write,Glob,Grep,Skill,mcp__peakui");
  });

  it("omits the budget flag when the budget is 0", () => {
    expect(buildClaudeArgs(request({maxBudgetUsd: 0}), "/s/mcp.json")).not.toContain("--max-budget-usd");
  });
});

describe("buildAgentEnv", () => {
  const base = {
    ANTHROPIC_API_KEY: "k",
    AWS_REGION: "eu-west-1",
    CLAUDECODE: "1",
    CLAUDE_CODE_OAUTH_TOKEN: "t",
    CLAUDE_CODE_SESSION_ID: "parent-session",
    HOME: "/Users/jo",
    NODE_OPTIONS: "--inspect",
    PATH: "/usr/bin",
  };

  it("passes the allow-list and nothing else", () => {
    expect(buildAgentEnv(base, "/cfg")).toEqual({
      ANTHROPIC_API_KEY: "k", AWS_REGION: "eu-west-1", CLAUDE_CODE_OAUTH_TOKEN: "t", CLAUDE_CONFIG_DIR: "/cfg", HOME: "/Users/jo", PATH: "/usr/bin",
    });
  });

  it("leaves CLAUDE_CONFIG_DIR unset in inherit mode", () => {
    expect(buildAgentEnv(base, undefined)).not.toHaveProperty("CLAUDE_CONFIG_DIR");
  });
});

describe("classifyOutcome", () => {
  const ok = {isError: false, subtype: "success"};

  it.each([
    [{result: undefined, timedOut: false}, "infra-error"],
    [{result: {isError: true, subtype: "success", terminalReason: "api_error"}, timedOut: false}, "infra-error"],
    [{result: undefined, timedOut: true}, "timeout"],
    [{result: ok, timedOut: true}, "timeout"],
    [{result: {isError: true, subtype: "error_max_budget_usd"}, timedOut: false}, "budget"],
    [{result: {isError: true, subtype: "error_max_turns"}, timedOut: false}, "budget"],
    [{result: {isError: true, subtype: "error_during_execution"}, timedOut: false}, "agent-error"],
    [{result: ok, timedOut: false}, "ok"],
  ] as const)("%j -> %s", (input, outcome) => {
    expect(classifyOutcome(input)).toBe(outcome);
  });
});

describe("createClaudeCodeAdapter against the fake agent", () => {
  // The directory has a space in its name: the real binary lives under "Application Support".
  const home = mkdtempSync(join(tmpdir(), "fake agent "));
  const fake = join(home, "fake-agent.mjs");

  cpSync(join(import.meta.dirname, "data"), home, {recursive: true});

  const adapter = createClaudeCodeAdapter({command: [process.execPath, fake], configDir: join(home, "cfg")});

  it("runs, stores the raw stream and returns the normalized result", async () => {
    const input = request();
    const result = await adapter.run(input);

    expect(result.outcome).toBe("ok");
    expect(result.exitCode).toBe(0);
    expect(result.turns).toBe(4);
    expect(result.usage?.cacheReadInputTokens).toBe(310000);
    expect(result.finalMessage).toBe("Done. The Save button shows a spinner while saving.");
    expect(result.events.filter((event) => event.kind === "tool" && event.writes.length > 0)).toHaveLength(1);
    expect(readFileSync(input.transcriptPath, "utf8").trim().split("\n")).toHaveLength(9);
    expect(existsSync(join(input.cwd, "src/components/SaveBar.tsx"))).toBe(true);
  });

  it("gives the agent the isolated config directory and none of the parent session's variables", async () => {
    process.env.CLAUDE_CODE_SESSION_ID = "parent-session";

    const input = request();

    await adapter.run(input);
    delete process.env.CLAUDE_CODE_SESSION_ID;

    expect(readFileSync(input.stderrPath, "utf8")).toBe(`CLAUDE_CONFIG_DIR=${join(home, "cfg")} LEAK=\n`);
  });

  it("reports an unauthenticated CLI as an infrastructure error", async () => {
    const result = await adapter.run(request({prompt: "unauthenticated"}));

    expect(result.outcome).toBe("infra-error");
    expect(result.exitCode).toBe(1);
    expect(result.error).toContain("Not logged in");
  });

  it("kills an agent that outlives the timeout", async () => {
    const result = await adapter.run(request({prompt: "hang", timeoutMs: 500}));

    expect(result.outcome).toBe("timeout");
    expect(result.durationMs).toBeLessThan(5000);
  });

  it("reports a missing binary as an infrastructure error instead of throwing", async () => {
    const missing = createClaudeCodeAdapter({command: [join(home, "no-such-binary")], configDir: undefined});

    expect((await missing.run(request())).outcome).toBe("infra-error");
  });

  it("describe reports version and authentication from the CLI", async () => {
    expect(await adapter.describe()).toMatchObject({authenticated: false, id: "claude-code", version: "0.0.0 (Fake Agent)"});
  });
});
```

`evals/tests/reference.test.ts`:

```ts
import {mkdtempSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {createReferenceAdapter} from "../src/adapters/reference.ts";

function request(taskId: string) {
  const dir = mkdtempSync(join(tmpdir(), "ref-"));

  return {
    cwd: dir, maxBudgetUsd: 0, model: "none", prompt: "p",
    setup: {allowedMcpServers: [], skillsEnabled: false, tools: []},
    stderrPath: join(dir, "stderr.txt"), taskId, timeoutMs: 1000, transcriptPath: join(dir, "transcript.jsonl"),
  };
}

describe("createReferenceAdapter", () => {
  it("copies the solution's files and reports each as a write", async () => {
    const input = request("pending-button");
    const result = await createReferenceAdapter("bad-no-spinner").run(input);

    expect(result.outcome).toBe("ok");
    expect(readFileSync(join(input.cwd, "src/components/SaveBar.tsx"), "utf8")).toContain("isPending");
    expect(result.events).toEqual([
      {kind: "text", text: "Applying reference solution bad-no-spinner."},
      {id: "reference-1", input: {}, kind: "tool", name: "Write", writes: ["src/components/SaveBar.tsx"]},
    ]);
    expect(result.usage).toBeUndefined();
  });

  it("is an infrastructure error when the task has no such solution", async () => {
    const result = await createReferenceAdapter("nope").run(request("pending-button"));

    expect(result.outcome).toBe("infra-error");
    expect(result.error).toContain("nope");
  });

  it("describes itself as always available", async () => {
    expect(await createReferenceAdapter("good").describe()).toMatchObject({authenticated: true, id: "reference"});
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- transcript claude-code reference`
Expected: FAIL — the three adapter modules do not exist.

- [ ] **Step 4: Implement `transcript.ts`**

One JSON object per line; a line that does not parse increments `unparsed`. `system`/`init` fills `environment`: `tools`, `skills` as given; `mcp_servers` entries are strings or objects with `name`; `plugins` entries map to `source`, else `name`; `model`; `claude_code_version` → `version`. `assistant` events: each `text` block → a `text` event, each `tool_use` block → a `tool` event. `writes` is non-empty only for the tools `Write`, `Edit`, `MultiEdit` and `NotebookEdit`, from `input.file_path` or `input.notebook_path`, made relative to `cwd` when inside it (compare also with a leading `/private` removed from either side), forward slashes. `user` events: each `tool_result` block → a `tool-result` event; `content` is a string or an array of blocks whose `text` values are joined with `\n`. `result` → `ClaudeResult` (`is_error`, `subtype`, `terminal_reason`, `result`, `total_cost_usd`, `num_turns`, `usage.*`). Every field access goes through narrowing from `unknown`.

- [ ] **Step 5: Implement `claude-code.ts`**

`buildAgentEnv` keeps `PATH`, `HOME`, `TMPDIR`, `LANG`, `LC_ALL`, `USER`, `SHELL`, `TERM`, `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, and every name starting with `ANTHROPIC_`, `AWS_` or `GOOGLE_`; sets `CLAUDE_CONFIG_DIR` when `configDir` is defined.

`classifyOutcome`, first match wins: `timedOut` → `timeout`; no result → `infra-error`; `isError` and `terminalReason === "api_error"` → `infra-error`; `isError` and `subtype` matching `/max_budget|max_turns/` → `budget`; `isError` → `agent-error`; else `ok`. The two `error_max_*` subtype names are from the Agent SDK's result type and were not observed; Task 17 checks them.

`run`: create `configDir` when defined; when the setup has no `mcpConfigPath`, write `{"mcpServers":{}}` to `mcp.json` beside the transcript and use it; `spawn(command[0], [...command.slice(1), ...args], {cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe"]})`; pipe stdout to `transcriptPath` and stderr to `stderrPath`; on timeout `process.kill(-pid, "SIGKILL")`. A spawn `error` event resolves with `outcome: "infra-error"` and the error message — it never rejects. After exit, `parseClaudeStream` on the transcript. `error` is the result text for `infra-error` and `agent-error`.

`describe`: `[...command, "--version"]` → `version` (trimmed stdout); `[...command, "auth", "status"]` under `buildAgentEnv` → `authenticated` is the JSON's `loggedIn === true`, false when the output is not JSON; `binary` is `command[0]`.

- [ ] **Step 6: Implement `reference.ts`**

`run` copies `join(PACKAGE_DIR, "tasks", request.taskId, "solutions", solution, "files")` into `request.cwd`. Events: one `text` event `Applying reference solution <name>.`, then one `tool` event per copied file in path order with ids `reference-1`, `reference-2`, …, `name: "Write"`, `input: {}`. Environment: empty lists. A missing directory returns `outcome: "infra-error"` with `error` naming the task and the solution.

- [ ] **Step 7: Run the tests**

Run: `pnpm --filter @peakui/evals test -- transcript claude-code reference`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add evals
git commit -m "feat(evals): add the Claude Code and reference agent adapters"
```

---

### Task 13: Configurations

**Files:**
- Create: `evals/src/configurations/index.ts`
- Test: `evals/tests/configurations.test.ts`

**Interfaces:**
- Consumes: `Configuration`, `ConfigurationResult`, `AgentSetup`, `AgentEnvironment`, `ExpectedEnvironment`.
- Produces:
  - `DEFAULT_AGENT_SETUP: AgentSetup` = `{allowedMcpServers: [], skillsEnabled: false, tools: ["Bash", "Read", "Edit", "Write", "Glob", "Grep"]}`
  - `configurations: Configuration[]` — `none`, then the planned `agents-md`, `skill`, `mcp`
  - `getConfiguration(id: string): Configuration` — throws on an unknown id, listing the known ones
  - `checkEnvironment(environment: AgentEnvironment, expected: ExpectedEnvironment, setup: AgentSetup): string[]` — human-readable violations, empty when clean

- [ ] **Step 1: Write the failing test**

```ts
import type {ConfigurationContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {DEFAULT_AGENT_SETUP, checkEnvironment, configurations, getConfiguration} from "../src/configurations/index.ts";
import {tasks} from "../tasks/index.ts";

const context: ConfigurationContext = {scratchDir: "/tmp/s", task: tasks[0]!, workspaceDir: "/tmp/w"};

describe("configurations", () => {
  it("registers none and the three planned channels, in order", () => {
    expect(configurations.map((configuration) => configuration.id)).toEqual(["none", "agents-md", "skill", "mcp"]);
  });

  it("none is available, writes nothing and expects a bare agent", async () => {
    const none = getConfiguration("none");

    expect(await none.available()).toEqual({ok: true});
    expect(await none.apply(context)).toEqual({
      artifacts: {},
      expected: {mcpServers: [], skills: []},
      setup: DEFAULT_AGENT_SETUP,
    });
  });

  it.each(["agents-md", "skill", "mcp"])("%s is planned: unavailable with a reason, and apply refuses", async (id) => {
    const configuration = getConfiguration(id);
    const availability = await configuration.available();

    expect(availability.ok).toBe(false);
    expect(availability).toHaveProperty("reason", expect.stringContaining("spec section 9"));
    await expect(configuration.apply(context)).rejects.toThrow(/planned/);
  });

  it("rejects an unknown id", () => {
    expect(() => getConfiguration("nope")).toThrow(/unknown configuration "nope"; known: none, agents-md, skill, mcp/);
  });
});

describe("checkEnvironment", () => {
  const clean = {mcpServers: [], plugins: ["agents-md@builtin"], skills: [], tools: ["Bash", "Edit", "Glob", "Grep", "Read", "Write"]};
  const expected = {mcpServers: [], skills: []};

  it("accepts the environment the isolated CLI reports", () => {
    expect(checkEnvironment(clean, expected, DEFAULT_AGENT_SETUP)).toEqual([]);
  });

  it("accepts an adapter that reports no tools", () => {
    expect(checkEnvironment({...clean, tools: []}, expected, DEFAULT_AGENT_SETUP)).toEqual([]);
  });

  it("names an unexpected MCP server, skill and tool", () => {
    const dirty = {...clean, mcpServers: ["codegraph"], skills: ["superpowers:brainstorming"], tools: [...clean.tools, "WebFetch"]};

    expect(checkEnvironment(dirty, expected, DEFAULT_AGENT_SETUP)).toEqual([
      "unexpected MCP server: codegraph",
      "unexpected skill: superpowers:brainstorming",
      "unexpected tool: WebFetch",
    ]);
  });

  it("names a missing expected MCP server and skill", () => {
    const setup = {allowedMcpServers: ["peakui"], skillsEnabled: true, tools: [...DEFAULT_AGENT_SETUP.tools, "Skill"]};

    expect(checkEnvironment(clean, {mcpServers: ["peakui"], skills: ["peakui-react"]}, setup)).toEqual([
      "missing MCP server: peakui",
      "missing skill: peakui-react",
    ]);
  });

  it("tolerates built-in skills and MCP tools when the setup enables them", () => {
    const setup = {allowedMcpServers: ["peakui"], skillsEnabled: true, tools: [...DEFAULT_AGENT_SETUP.tools, "Skill"]};
    const reported = {...clean, mcpServers: ["peakui"], skills: ["peakui-react", "code-review"], tools: [...clean.tools, "Skill", "mcp__peakui__get_component_docs"]};

    expect(checkEnvironment(reported, {mcpServers: ["peakui"], skills: ["peakui-react"]}, setup)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @peakui/evals test -- configurations`
Expected: FAIL — `Cannot find module '../src/configurations/index.ts'`.

- [ ] **Step 3: Implement `configurations/index.ts`**

The planned reasons, verbatim:

- `agents-md`: `planned: needs a peakui-cli build (PEAKUI_EVALS_CLI_BIN) and a docs origin (PEAKUI_EVALS_DOCS_URL); contract in spec section 9`
- `skill`: `planned: needs skills/peakui-react, which does not exist yet; contract in spec section 9`
- `mcp`: `planned: needs a peakui-mcp build (PEAKUI_EVALS_MCP_CMD) and a docs origin; contract in spec section 9`

A planned configuration's `apply` rejects with `Error(reason)`.

`checkEnvironment` rules, reported in this order: every reported MCP server must be in `expected.mcpServers`; every reported skill must be in `expected.skills` unless `setup.skillsEnabled`; every reported tool must be in `setup.tools` or start with `mcp__<server>__` for a server in `setup.allowedMcpServers`; then every expected MCP server and skill must be reported.

- [ ] **Step 4: Run the test**

Run: `pnpm --filter @peakui/evals test -- configurations`
Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
git add evals
git commit -m "feat(evals): add the configuration mechanism with none and three planned channels"
```

---

### Task 14: Runner, records and resume

**Files:**
- Create: `evals/src/runner/matrix.ts`, `pool.ts`, `justify.ts`, `record.ts`, `run.ts`
- Modify: `evals/.gitignore` (add `results/**/events.json`)
- Test: `evals/tests/matrix.test.ts`, `evals/tests/pool.test.ts`, `evals/tests/justify.test.ts`, `evals/tests/record.test.ts`, `evals/tests/run.test.ts`, `evals/tests/solutions/04-pipeline.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `matrix.ts`:
    - `runKeyId(key: RunKey): string` — `<task>__<configuration>__r<repetition>`
    - `planMatrix(options: {tasks: string[]; configurations: string[]; repetitions: number}): RunKey[]` — ordered by repetition, then task, then configuration, so an interrupted batch has even coverage
    - `type RunState = "pending" | "completed" | "infra-error"`
    - `runState(batchDir: string, key: RunKey): RunState`
    - `newBatchId(now: Date, label: string): string` — `YYYYMMDD-HHmmss-<label>` in UTC; the label is lower-cased with every run of characters outside `[a-z0-9]` replaced by `-`
  - `pool.ts`: `runPool<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]>` — results in input order
  - `justify.ts`:
    - `narrationOf(events: TranscriptEvent[]): string[]`
    - `attachJustifications(mistakes: Mistake[], events: TranscriptEvent[]): Mistake[]`
    - `outsideAccess(events: TranscriptEvent[], roots: {workspace: string; watch: string[]}): string[]`
  - `record.ts`:
    - `runDir(batchDir: string, key: RunKey): string` — `<batchDir>/runs/<id>`
    - `writeRecord(batchDir: string, record: RunRecord, roots: {workspace?: string; evalsHome: string; home: string}): void` — redacts every string in the record, writes to a temporary file, renames
    - `readRecord(path: string): RunRecord | undefined` — `undefined` when missing, not JSON, or `schemaVersion !== 1`
    - `readRecords(batchDir: string): RunRecord[]` — sorted by key
    - `writeManifest(batchDir: string, manifest: BatchManifest): void`; `readManifest(batchDir: string): BatchManifest | undefined`
    - `saveChangedFiles(workspaceDir: string, changes: FileChanges, destination: string): void` — copies added and modified files to `<destination>/files/`
  - `run.ts`:
    - `interface ExecuteRunOptions {batch: string; batchDir: string; key: RunKey; adapter: AgentAdapter; configuration: Configuration; template: TemplateInfo; model: string; timeoutMs: number; maxBudgetUsd: number; keepWorkspace: boolean}`
    - `executeRun(options: ExecuteRunOptions): Promise<RunRecord>`
    - `rescoreRun(options: {batch: string; batchDir: string; record: RunRecord; template: TemplateInfo}): Promise<RunRecord>`

- [ ] **Step 1: Write the failing unit tests**

`evals/tests/matrix.test.ts`:

```ts
import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {newBatchId, planMatrix, runKeyId, runState} from "../src/runner/matrix.ts";

describe("planMatrix", () => {
  it("orders by repetition, then task, then configuration", () => {
    const keys = planMatrix({configurations: ["none", "skill"], repetitions: 2, tasks: ["a", "b"]});

    expect(keys.map(runKeyId)).toEqual([
      "a__none__r1", "a__skill__r1", "b__none__r1", "b__skill__r1",
      "a__none__r2", "a__skill__r2", "b__none__r2", "b__skill__r2",
    ]);
  });
});

describe("runState", () => {
  const batchDir = mkdtempSync(join(tmpdir(), "batch-"));
  const put = (id: string, text: string) => {
    mkdirSync(join(batchDir, "runs", id), {recursive: true});
    writeFileSync(join(batchDir, "runs", id, "record.json"), text);
  };

  put("a__none__r1", JSON.stringify({schemaVersion: 1, status: "completed"}));
  put("a__none__r2", JSON.stringify({schemaVersion: 1, status: "infra-error"}));
  put("a__none__r3", '{"schemaVersion": 1, "status": "comp');

  it.each([
    [1, "completed"],
    [2, "infra-error"],
    [3, "pending"],
    [4, "pending"],
  ] as const)("repetition %i is %s", (repetition, state) => {
    expect(runState(batchDir, {configuration: "none", repetition, task: "a"})).toBe(state);
  });
});

describe("newBatchId", () => {
  it("is a UTC timestamp and a slug", () => {
    expect(newBatchId(new Date("2026-10-03T14:05:09Z"), "Baseline: none!")).toBe("20261003-140509-baseline-none-");
  });
});
```

`evals/tests/pool.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {runPool} from "../src/runner/pool.ts";

describe("runPool", () => {
  it("never runs more than the limit at once and keeps input order", async () => {
    let active = 0;
    let peak = 0;
    const results = await runPool([30, 5, 20, 1, 10], 2, async (delay, index) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, delay));
      active -= 1;

      return index;
    });

    expect(peak).toBe(2);
    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it("treats a limit below 1 as 1 and handles an empty list", async () => {
    expect(await runPool([1, 2], 0, async (value) => value * 2)).toEqual([2, 4]);
    expect(await runPool([], 3, async () => 1)).toEqual([]);
  });
});
```

`evals/tests/justify.test.ts`:

```ts
import type {Mistake, TranscriptEvent} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {attachJustifications, narrationOf, outsideAccess} from "../src/runner/justify.ts";

const events: TranscriptEvent[] = [
  {kind: "text", text: "I'll look at the component first."},
  {id: "1", input: {file_path: "/ws/src/components/SaveBar.tsx"}, kind: "tool", name: "Read", writes: []},
  {id: "1", isError: false, kind: "tool-result", text: "…"},
  {kind: "text", text: "PeakUI buttons take isLoading, like most libraries."},
  {kind: "text", text: "Writing the button now."},
  {id: "2", input: {file_path: "/ws/src/components/SaveBar.tsx"}, kind: "tool", name: "Write", writes: ["src/components/SaveBar.tsx"]},
  {id: "3", input: {command: "cat /Users/jo/projects/peakui/AGENTS.md && ls /ws/src"}, kind: "tool", name: "Bash", writes: []},
  {kind: "text", text: "Done."},
];

describe("narrationOf", () => {
  it("is every text event in order", () => {
    expect(narrationOf(events)).toEqual([
      "I'll look at the component first.",
      "PeakUI buttons take isLoading, like most libraries.",
      "Writing the button now.",
      "Done.",
    ]);
  });
});

describe("attachJustifications", () => {
  const mistake: Mistake = {file: "src/components/SaveBar.tsx", layer: "static", line: 9, message: "m", pitfall: "rac-props", rule: "dom-state-prop"};

  it("takes the text between the previous tool call and the last write of the file", () => {
    const [justified] = attachJustifications([mistake], events);

    expect(justified!.justification).toBe("PeakUI buttons take isLoading, like most libraries.\n\nWriting the button now.");
  });

  it("leaves mistakes without a file, or whose file no tool wrote, unjustified", () => {
    const out = attachJustifications([{...mistake, file: undefined}, {...mistake, file: "src/Other.tsx"}], events);

    expect(out.map((entry) => entry.justification)).toEqual([undefined, undefined]);
  });
});

describe("outsideAccess", () => {
  it("lists watched paths outside the workspace, once each, sorted", () => {
    expect(outsideAccess(events, {watch: ["/Users/jo"], workspace: "/ws"})).toEqual(["/Users/jo/projects/peakui/AGENTS.md"]);
  });

  it("ignores paths inside the workspace even when the workspace is under a watched root", () => {
    const inside: TranscriptEvent[] = [{id: "1", input: {file_path: "/Users/jo/ws/src/a.ts"}, kind: "tool", name: "Read", writes: []}];

    expect(outsideAccess(inside, {watch: ["/Users/jo"], workspace: "/Users/jo/ws"})).toEqual([]);
  });
});
```

`evals/tests/record.test.ts`:

```ts
import type {RunRecord} from "../src/types.ts";

import {existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {readRecord, readRecords, runDir, saveChangedFiles, writeRecord} from "../src/runner/record.ts";

const key = {configuration: "none", repetition: 1, task: "pending-button"};

function record(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    agent: {
      adapter: "claude-code", artifacts: {}, durationMs: 1, environment: {mcpServers: [], plugins: [], skills: [], tools: []},
      finalMessage: "Wrote /tmp/peakui-evals/workspaces/b/k/app/src/a.tsx", narration: ["Reading /Users/jo/.npmrc"], outcome: "ok",
    },
    batch: "b", changes: {added: [], deleted: [], modified: []}, configuration: "none", finishedAt: "t", fixture: "vite-app",
    key: "pending-button__none__r1", mistakes: [], outsideAccess: ["/Users/jo/projects/x"], passed: true, repetition: 1,
    schemaVersion: 1, startedAt: "t", status: "completed", task: "pending-button", ...overrides,
  };
}

describe("records", () => {
  const batchDir = mkdtempSync(join(tmpdir(), "rec-"));
  const roots = {evalsHome: "/tmp/peakui-evals", home: "/Users/jo", workspace: "/tmp/peakui-evals/workspaces/b/k/app"};

  it("writes a redacted record that reads back", () => {
    writeRecord(batchDir, record(), roots);

    const text = readFileSync(join(runDir(batchDir, key), "record.json"), "utf8");
    const read = readRecord(join(runDir(batchDir, key), "record.json"))!;

    expect(text).not.toContain("/Users/jo");
    expect(text).not.toContain("/tmp/peakui-evals");
    expect(read.agent.finalMessage).toBe("Wrote <workspace>/src/a.tsx");
    expect(read.agent.narration).toEqual(["Reading ~/.npmrc"]);
    expect(read.outsideAccess).toEqual(["~/projects/x"]);
  });

  it("leaves no temporary file behind", () => {
    expect(existsSync(join(runDir(batchDir, key), "record.json.tmp"))).toBe(false);
  });

  it("returns undefined for a truncated or foreign record", () => {
    const path = join(batchDir, "broken.json");

    writeFileSync(path, '{"schemaVersion": 1, "status": "comp');
    expect(readRecord(path)).toBeUndefined();
    writeFileSync(path, JSON.stringify({schemaVersion: 2}));
    expect(readRecord(path)).toBeUndefined();
    expect(readRecord(join(batchDir, "missing.json"))).toBeUndefined();
  });

  it("readRecords skips broken records and sorts by key", () => {
    writeRecord(batchDir, record({key: "a__none__r1", repetition: 1, task: "a"}), roots);
    mkdirSync(join(batchDir, "runs/zzz__none__r1"), {recursive: true});
    writeFileSync(join(batchDir, "runs/zzz__none__r1/record.json"), "{");

    expect(readRecords(batchDir).map((entry) => entry.key)).toEqual(["a__none__r1", "pending-button__none__r1"]);
  });

  it("saveChangedFiles copies added and modified files, not deleted ones", () => {
    const workspace = mkdtempSync(join(tmpdir(), "ws-"));

    mkdirSync(join(workspace, "src/components"), {recursive: true});
    writeFileSync(join(workspace, "src/components/New.tsx"), "new");
    writeFileSync(join(workspace, "src/App.tsx"), "app");
    saveChangedFiles(workspace, {added: ["src/components/New.tsx"], deleted: ["src/Gone.tsx"], modified: ["src/App.tsx"]}, runDir(batchDir, key));

    expect(readFileSync(join(runDir(batchDir, key), "files/src/components/New.tsx"), "utf8")).toBe("new");
    expect(readFileSync(join(runDir(batchDir, key), "files/src/App.tsx"), "utf8")).toBe("app");
  });
});
```

`evals/tests/run.test.ts` — the infrastructure-error path needs no installed template:

```ts
import type {AgentAdapter, AgentRunResult} from "../src/types.ts";

import {existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {getConfiguration} from "../src/configurations/index.ts";
import {runState} from "../src/runner/matrix.ts";
import {runDir} from "../src/runner/record.ts";
import {executeRun} from "../src/runner/run.ts";

const root = mkdtempSync(join(tmpdir(), "run-"));
const key = {configuration: "none", repetition: 1, task: "pending-button"};
const environment = {mcpServers: [], plugins: [], skills: [], tools: []};

function adapterReturning(result: Partial<AgentRunResult>): AgentAdapter {
  return {
    describe: async () => ({authenticated: true, binary: "stub", detail: "", id: "stub", version: "0"}),
    id: "stub",
    run: async () => ({durationMs: 5, environment, events: [], exitCode: 1, outcome: "ok", ...result}),
  };
}

function options(adapter: AgentAdapter, batch: string) {
  return {
    adapter, batch, batchDir: join(root, "results", batch), configuration: getConfiguration("none"), keepWorkspace: false, key,
    maxBudgetUsd: 3, model: "sonnet",
    template: {dir: join(root, "template"), fixture: "vite-app", fixtureHash: "f", libraryHash: "l", reused: true},
    timeoutMs: 1000,
  };
}

beforeAll(() => {
  process.env.PEAKUI_EVALS_HOME = join(root, "home");
  mkdirSync(join(root, "template/src"), {recursive: true});
  writeFileSync(join(root, "template/package.json"), "{}");
});

afterAll(() => {
  delete process.env.PEAKUI_EVALS_HOME;
  rmSync(root, {force: true, recursive: true});
});

describe("executeRun — infrastructure failures", () => {
  it("records an unauthenticated agent as infra-error, unscored, and resumable", async () => {
    const record = await executeRun(options(adapterReturning({error: "Not logged in · Please run /login", outcome: "infra-error"}), "b1"));

    expect(record).toMatchObject({mistakes: [], passed: false, status: "infra-error"});
    expect(record.layers).toBeUndefined();
    expect(record.agent.error).toContain("Not logged in");
    expect(runState(join(root, "results/b1"), key)).toBe("infra-error");
  });

  it("records a contaminated environment as infra-error and says what leaked", async () => {
    const dirty = {...environment, mcpServers: ["codegraph"]};
    const record = await executeRun(options(adapterReturning({environment: dirty, outcome: "ok"}), "b2"));

    expect(record.status).toBe("infra-error");
    expect(record.agent.error).toBe("contaminated environment: unexpected MCP server: codegraph");
  });

  it("removes the workspace and keeps the record", async () => {
    await executeRun(options(adapterReturning({outcome: "infra-error"}), "b3"));

    expect(existsSync(join(root, "home/workspaces/b3/pending-button__none__r1"))).toBe(false);
    expect(existsSync(join(runDir(join(root, "results/b3"), key), "record.json"))).toBe(true);
  });
});
```

- [ ] **Step 2: Write the failing pipeline test**

`evals/tests/solutions/04-pipeline.test.ts`:

```ts
import {existsSync, readFileSync} from "node:fs";
import {join} from "node:path";

import {beforeAll, describe, expect, it} from "vitest";

import {getFixture} from "../../fixtures/index.ts";
import {createReferenceAdapter} from "../../src/adapters/reference.ts";
import {getConfiguration} from "../../src/configurations/index.ts";
import {type TemplateInfo, prepareTemplate} from "../../src/fixtures/prepare.ts";
import {packLibrary} from "../../src/pack/stage.ts";
import {evalsHome} from "../../src/paths.ts";
import {runDir} from "../../src/runner/record.ts";
import {executeRun, rescoreRun} from "../../src/runner/run.ts";

const key = {configuration: "none", repetition: 1, task: "pending-button"};
const batch = "pipeline-test";
const batchDir = join(evalsHome(), "results-test", batch);
let template: TemplateInfo;

function options(solution: string, repetition: number) {
  return {
    adapter: createReferenceAdapter(solution), batch, batchDir, configuration: getConfiguration("none"), keepWorkspace: false,
    key: {...key, repetition}, maxBudgetUsd: 0, model: "none", template, timeoutMs: 60_000,
  };
}

beforeAll(async () => {
  template = await prepareTemplate(getFixture("vite-app"), await packLibrary(), {force: false});
});

describe("one run end to end with the reference adapter", () => {
  it("passes the good solution and stores what changed", async () => {
    const record = await executeRun(options("good", 1));
    const dir = runDir(batchDir, {...key, repetition: 1});

    expect(record).toMatchObject({mistakes: [], passed: true, status: "completed"});
    expect(record.changes).toEqual({added: [], deleted: [], modified: ["src/components/SaveBar.tsx"]});
    expect(readFileSync(join(dir, "files/src/components/SaveBar.tsx"), "utf8")).toContain("isPending");
    expect(readFileSync(join(dir, "record.json"), "utf8")).not.toContain(evalsHome());
    expect(existsSync(join(evalsHome(), "workspaces", batch, "pending-button__none__r1"))).toBe(false);
  });

  it("fails the bad solution and attaches the adapter's words to the mistake", async () => {
    const record = await executeRun(options("bad-is-loading", 2));

    expect(record.passed).toBe(false);
    expect(record.layers?.typecheck.status).toBe("fail");
    expect(record.mistakes.map((mistake) => mistake.rule)).toEqual(
      expect.arrayContaining(["unknown-state-prop", "dom-state-prop", "pending-state"]),
    );

    const located = record.mistakes.find((mistake) => mistake.rule === "dom-state-prop")!;

    expect(located).toMatchObject({file: "src/components/SaveBar.tsx", justification: "Applying reference solution bad-is-loading."});
    expect(located.excerpt).toContain("isLoading");
  });

  it("re-scores a stored run to the same result without an adapter", async () => {
    const first = await executeRun(options("bad-no-spinner", 3));
    const again = await rescoreRun({batch, batchDir, record: first, template});

    expect(again.passed).toBe(false);
    expect(again.layers?.render.status).toBe("fail");
    expect(again.mistakes.map((mistake) => mistake.rule)).toEqual(first.mistakes.map((mistake) => mistake.rule));
    expect(again.agent).toEqual(first.agent);
  });
});
```

- [ ] **Step 3: Run the unit tests to verify they fail**

Run: `pnpm --filter @peakui/evals test -- matrix pool justify record run`
Expected: FAIL — the runner modules do not exist.

- [ ] **Step 4: Implement `matrix.ts`, `pool.ts`, `justify.ts`, `record.ts`**

`attachJustifications`: for a mistake with a `file`, find the last `tool` event whose `writes` includes it; collect the `text` events after the previous `tool` event (or the start) and before that one; join with a blank line; no text → no `justification`.

`outsideAccess`: scan `JSON.stringify(event.input)` of every `tool` event with `/(\/[\w.@+~-]+){2,}/g`; keep a path when it starts with a watched root and does not start with the workspace root.

- [ ] **Step 5: Implement `executeRun`**

In order (spec 5.5):

1. `task = getTask(key.task)`, `fixture = getFixture(task.fixture)`; `workspace = createWorkspace({batch, key: runKeyId(key), overlayDir: overlayDirOf(task), templateDir: template.dir})`.
2. `applied = await configuration.apply({scratchDir: workspace.scratchDir, task, workspaceDir: workspace.dir})`.
3. `commitInitialState(workspace.dir)`; `before = snapshot(workspace.dir)`.
4. `result = await adapter.run({cwd: workspace.dir, maxBudgetUsd, model, prompt: task.prompt, setup: applied.setup, stderrPath, taskId: task.id, timeoutMs, transcriptPath})` — both paths inside `runDir(batchDir, key)`, created first.
5. `violations = checkEnvironment(result.environment, applied.expected, applied.setup)`. The run is `infra-error` when `result.outcome === "infra-error"` or `violations.length > 0`; in the second case `agent.error` is `contaminated environment: ` + the violations joined with `; `.
6. `infra-error`: write a record with no `layers`, `passed: false`, `mistakes: []`, empty `changes`; go to step 9.
7. Otherwise `changes = diffSnapshots(before, snapshot(workspace.dir))`; `saveChangedFiles`; write the normalized events to `events.json` in the run directory; `score = await scoreWorkspace({changes, dir: workspace.dir, fixture, logsDir: runDir, task})`.
8. Record: `status: "completed"`, `layers`, `passed`, `mistakes: attachJustifications(score.mistakes, result.events)`, `agent.narration: narrationOf(result.events)`, `outsideAccess: outsideAccess(result.events, {watch: [homedir(), REPO_DIR], workspace: workspace.dir})`.
9. `writeRecord(batchDir, record, {evalsHome: evalsHome(), home: homedir(), workspace: workspace.dir})`; `removeWorkspace` unless `keepWorkspace`; return the record as written (redacted).

Any exception between steps 1 and 8 is caught and recorded as `infra-error` with the message in `agent.error`; the workspace is still removed.

- [ ] **Step 6: Implement `rescoreRun`**

Create a workspace from the template and the task's overlay under the key `<record.key>__rescore`; apply the configuration and commit as in `executeRun` (so a later configuration's files are present); copy `runDir/files` over the workspace; delete each path in `record.changes.deleted`; when `package.json` is among the changed files run `npm install --no-audit --no-fund` in the workspace; `scoreWorkspace` with `record.changes`; replace `layers`, `passed` and `mistakes` (justifications re-attached from `events.json` when it exists, otherwise carried over from the old record by `rule` + `file` + `line`); keep `agent`, `changes` and `outsideAccess`; write the record; remove the workspace.

- [ ] **Step 7: Run every tier**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals test:solutions -- 04-pipeline`
Expected: unit tests pass; 3 pipeline tests pass in about a minute.

- [ ] **Step 8: Commit**

```bash
git add evals
git commit -m "feat(evals): run one evaluation end to end, with resumable records"
```

---

### Task 15: Statistics and the batch summary

**Files:**
- Create: `evals/src/report/stats.ts`, `evals/src/report/summary.ts`
- Test: `evals/tests/helpers/records.ts` (helper), `evals/tests/stats.test.ts`, `evals/tests/summary.test.ts`

**Interfaces:**
- Consumes: `RunRecord`, `BatchManifest`, `LayerId`, `LAYERS`, `PitfallId`.
- Produces:
  - `stats.ts`:
    - `wilson(passes: number, total: number): [number, number]` — 95% interval (`z = 1.96`), `[0, 1]` when `total` is 0
    - `formatCount(passes: number, total: number): string` — `3/5`
    - `formatInterval(passes: number, total: number): string` — `23%–88%` (en dash), rounded to whole percent
    - `median(values: number[]): number` — 0 for an empty list
    - `interface Counts {passes: number; total: number}`
    - `interface TaskRow {task: string; configuration: string; layers: Record<LayerId, Counts>; overall: Counts; infraErrors: number}`
    - `interface MistakeRow {rule: string; pitfall: PitfallId; runs: number; tasks: number}`
    - `interface Range {median: number; min: number; max: number}`
    - `interface Aggregates {rows: TaskRow[]; byConfiguration: Array<{configuration: string; layers: Record<LayerId, Counts>; overall: Counts}>; spread: TaskRow[]; mistakes: MistakeRow[]; infraErrors: number; cost: {inputSideTokens: Range; outputTokens: Range; durationMs: Range; turns: Range; totalCostUsd: number; measuredRuns: number}}`
    - `aggregate(records: RunRecord[]): Aggregates`
  - `summary.ts`: `renderSummary(manifest: BatchManifest, records: RunRecord[]): string`

- [ ] **Step 1: Write the failing tests**

`evals/tests/helpers/records.ts` — builds a record with the given layer statuses and mistake rules:

```ts
import type {LayerId, LayerStatus, RunRecord} from "../../src/types.ts";

export function record(task: string, repetition: number, statuses: Partial<Record<LayerId, LayerStatus>> | "infra-error", rules: string[] = []): RunRecord {
  const base = {
    agent: {
      adapter: "claude-code", artifacts: {}, costUsd: 0.2, durationMs: 60_000 * repetition, environment: {mcpServers: [], plugins: [], skills: [], tools: []},
      narration: [], outcome: "ok" as const, turns: 10 + repetition,
      usage: {cacheCreationInputTokens: 1000, cacheReadInputTokens: 100_000 * repetition, inputTokens: 500, outputTokens: 1000 * repetition},
    },
    batch: "b", changes: {added: [], deleted: [], modified: []}, configuration: "none", finishedAt: "t", fixture: "vite-app",
    key: `${task}__none__r${repetition}`, outsideAccess: [], repetition, schemaVersion: 1 as const, startedAt: "t", task,
  };

  if (statuses === "infra-error") {
    return {...base, agent: {...base.agent, outcome: "infra-error", usage: undefined}, mistakes: [], passed: false, status: "infra-error"};
  }

  const full = {build: "pass", render: "pass", static: "pass", typecheck: "pass", ...statuses} as Record<LayerId, LayerStatus>;
  const layers = Object.fromEntries(
    Object.entries(full).map(([layer, status]) => [layer, {durationMs: 1, findings: [], layer, status}]),
  ) as unknown as RunRecord["layers"];

  return {
    ...base,
    layers,
    mistakes: rules.map((rule) => ({excerpt: `<Button ${rule}>`, file: "src/a.tsx", justification: "Buttons take isLoading.", layer: "static" as const, line: 3, message: "m", pitfall: "rac-props" as const, rule})),
    passed: !Object.values(full).includes("fail"),
    status: "completed",
  };
}
```

`evals/tests/stats.test.ts`:

```ts
import {describe, expect, it} from "vitest";

import {aggregate, formatCount, formatInterval, median, wilson} from "../src/report/stats.ts";
import {record} from "./helpers/records.ts";

describe("wilson", () => {
  it.each([
    [3, 5, 0.2307, 0.8824],
    [0, 5, 0, 0.4345],
    [5, 5, 0.5655, 1],
    [0, 0, 0, 1],
  ])("%i/%i -> [%f, %f]", (passes, total, low, high) => {
    const [a, b] = wilson(passes, total);

    expect(a).toBeCloseTo(low, 3);
    expect(b).toBeCloseTo(high, 3);
  });
});

describe("formatting", () => {
  it("always shows counts, and whole percents with an en dash", () => {
    expect(formatCount(3, 5)).toBe("3/5");
    expect(formatInterval(3, 5)).toBe("23%–88%");
    expect(formatInterval(0, 5)).toBe("0%–43%");
  });

  it("median", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBe(0);
  });
});

describe("aggregate", () => {
  const records = [
    record("a", 1, {}),
    record("a", 2, {static: "fail"}, ["dom-state-prop"]),
    record("a", 3, "infra-error"),
    record("b", 1, {render: "not-applicable", typecheck: "fail"}, ["dom-state-prop", "color-prop"]),
    record("b", 2, {render: "not-applicable", typecheck: "fail"}, ["dom-state-prop"]),
  ];
  const result = aggregate(records);

  it("leaves infrastructure errors out of every denominator and counts them apart", () => {
    const a = result.rows.find((row) => row.task === "a")!;

    expect(a.overall).toEqual({passes: 1, total: 2});
    expect(a.layers.static).toEqual({passes: 1, total: 2});
    expect(a.infraErrors).toBe(1);
    expect(result.infraErrors).toBe(1);
  });

  it("leaves a not-applicable layer out of that layer's denominator", () => {
    const b = result.rows.find((row) => row.task === "b")!;

    expect(b.layers.render).toEqual({passes: 0, total: 0});
    expect(b.layers.typecheck).toEqual({passes: 0, total: 2});
    expect(b.overall).toEqual({passes: 0, total: 2});
  });

  it("sums per configuration", () => {
    expect(result.byConfiguration).toEqual([
      {
        configuration: "none",
        layers: {build: {passes: 4, total: 4}, render: {passes: 2, total: 2}, static: {passes: 3, total: 4}, typecheck: {passes: 2, total: 4}},
        overall: {passes: 1, total: 4},
      },
    ]);
  });

  it("lists as spread only the rows that are neither all pass nor all fail", () => {
    expect(result.spread.map((row) => row.task)).toEqual(["a"]);
  });

  it("ranks mistakes by the number of runs, then by rule", () => {
    expect(result.mistakes).toEqual([
      {pitfall: "rac-props", rule: "dom-state-prop", runs: 3, tasks: 2},
      {pitfall: "rac-props", rule: "color-prop", runs: 1, tasks: 1},
    ]);
  });

  it("measures cost over the runs that reported usage", () => {
    expect(result.cost.measuredRuns).toBe(4);
    expect(result.cost.outputTokens).toEqual({max: 2000, median: 1500, min: 1000});
    expect(result.cost.inputSideTokens.min).toBe(101_500);
    expect(result.cost.totalCostUsd).toBeCloseTo(0.8);
  });
});
```

`evals/tests/summary.test.ts`:

```ts
import type {BatchManifest} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {renderSummary} from "../src/report/summary.ts";
import {record} from "./helpers/records.ts";

const manifest: BatchManifest = {
  adapter: {authenticated: true, binary: "claude", detail: "", id: "claude-code", version: "2.1.284 (Claude Code)"},
  configurations: ["none"], createdAt: "2026-10-03T14:05:09Z", id: "20261003-140509-baseline", isolation: "isolated",
  libraryHash: "abc123def4567890", maxBudgetUsd: 3, model: "claude-sonnet-5-5", node: "v24.21.0", npm: "11.19.0", platform: "darwin",
  repetitions: 3, schemaVersion: 1, tasks: ["a", "b"], templateHashes: {"vite-app": "f"}, timeoutMs: 900_000,
};
const records = [
  record("a", 1, {}),
  record("a", 2, {static: "fail"}, ["dom-state-prop"]),
  record("a", 3, "infra-error"),
  record("b", 1, {render: "not-applicable", typecheck: "fail"}, ["dom-state-prop"]),
];

describe("renderSummary", () => {
  const summary = renderSummary(manifest, records);

  it("opens with what was measured", () => {
    expect(summary).toContain("# Batch 20261003-140509-baseline");
    expect(summary).toContain("claude-code 2.1.284 (Claude Code)");
    expect(summary).toContain("claude-sonnet-5-5");
    expect(summary).toContain("abc123def456");
  });

  it("warns about infrastructure errors", () => {
    expect(summary).toContain("1 run ended in an infrastructure error and is not counted below");
  });

  it("gives per-configuration counts with an interval", () => {
    expect(summary).toContain("| none | 2/3 (21%–94%) | 3/3 (44%–100%) | 2/3 (21%–94%) | 2/2 (34%–100%) | 1/3 (6%–79%) |");
  });

  it("gives one row per task with counts only", () => {
    expect(summary).toContain("| a | none | 2/2 | 2/2 | 1/2 | 2/2 | 1/2 |");
    expect(summary).toContain("| b | none | 0/1 | 1/1 | 1/1 | – | 0/1 |");
  });

  it("lists the spread, the mistakes and a verbatim excerpt with its justification", () => {
    expect(summary).toMatch(/## Spread[\s\S]*\| a \| none \| 1\/2 \|/);
    expect(summary).toContain("| dom-state-prop | rac-props | 2 | 2 |");
    expect(summary).toContain("`src/a.tsx:3`");
    expect(summary).toContain("<Button dom-state-prop>");
    expect(summary).toContain("> Buttons take isLoading.");
    expect(summary).toContain("runs/a__none__r2/record.json");
  });

  it("never prints a percentage without its counts", () => {
    for (const match of summary.matchAll(/\d+%/g)) {
      const before = summary.slice(Math.max(0, match.index - 14), match.index);

      expect(before, summary.slice(match.index - 20, match.index + 10)).toMatch(/\d+\/\d+ \(|%–$/);
    }
  });

  it("says so when the batch inherits the user's agent configuration", () => {
    expect(renderSummary({...manifest, isolation: "inherit"}, records)).toContain("user-level agent configuration was not isolated");
  });

  it("renders an empty batch without dividing by zero", () => {
    expect(renderSummary(manifest, [])).toContain("No completed runs.");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- stats summary`
Expected: FAIL — `Cannot find module '../src/report/stats.ts'`.

- [ ] **Step 3: Implement `stats.ts`**

Wilson: with `p = passes / total` and `z = 1.96`, centre `(p + z²/2n) / (1 + z²/n)`, half-width `z · sqrt(p(1−p)/n + z²/4n²) / (1 + z²/n)`, clamped to `[0, 1]`. A layer's `total` counts completed runs whose status for that layer is `pass` or `fail`. `overall` counts completed runs; a pass is `record.passed`. `inputSideTokens` of a run is `inputTokens + cacheCreationInputTokens + cacheReadInputTokens`. A mistake row's `runs` counts runs in which the rule appears at least once. Cost ranges and `totalCostUsd` cover only completed runs that reported `usage`; `measuredRuns` is their number.

- [ ] **Step 4: Implement `summary.ts`**

Sections in the order of spec 10.1, with these headings: `# Batch <id>`, `## Per configuration`, `## Per task`, `## Spread`, `## Mistakes`, `## Verbatim`, `## Cost`. Table columns for the first two: `typecheck`, `build`, `static`, `render`, `all layers`. The spread table has the columns task, configuration, `all layers`; the mistakes table rule, pitfall, runs, tasks. A count with a total of 0 prints `–`. The header shows the first 12 characters of the library hash. Verbatim: for each of the ten most frequent rules, up to three mistakes from different runs — `` `file:line` ``, the excerpt in a code span, the justification as a block quote, and a relative link `runs/<key>/record.json`. Warning lines, verbatim: `<n> run(s) ended in an infrastructure error and is/are not counted below` (singular `1 run ended in an infrastructure error and is not counted below`) and `Warning: user-level agent configuration was not isolated (--agent-config inherit).` With no completed run the body is `No completed runs.`

- [ ] **Step 5: Run the tests**

Run: `pnpm --filter @peakui/evals test -- stats summary`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add evals
git commit -m "feat(evals): report pass counts per layer with intervals, spread and mistakes"
```

---

### Task 16: Command line

**Files:**
- Create: `evals/src/cli.ts`, `evals/src/commands/doctor.ts`, `prepare.ts`, `run.ts`, `score.ts`, `report.ts`
- Modify: `evals/package.json` (add script `"evals": "node src/cli.ts"`), root `package.json` (add script `"evals": "pnpm --filter @peakui/evals evals"`)
- Modify: `AGENTS.md` and `CLAUDE.md` identically — one row in the Commands table: `| Agent evals | \`pnpm evals doctor\` / \`prepare\` / \`run --dry-run\`; scorer tests \`pnpm --filter @peakui/evals test:solutions\` |`, and under it one sentence: `A real \`pnpm evals run\` spends tokens: more than one run needs \`--yes\`. Design: \`docs/superpowers/specs/2026-10-03-agent-evals-design.md\`.`
- Test: `evals/tests/cli.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `interface CliOptions {command: "doctor" | "prepare" | "run" | "score" | "report"; tasks: string[] | undefined; configs: string[]; reps: number; concurrency: number; model: string; batch: string | undefined; label: string; dryRun: boolean; yes: boolean; force: boolean; adapter: "claude-code" | "reference"; solution: string; timeoutMin: number; maxBudgetUsd: number; agentBin: string | undefined; agentConfig: "isolated" | "inherit"; keepWorkspaces: boolean}`
  - `parseCli(argv: string[]): CliOptions` — throws `Error` with a usage message on a bad argument
  - `needsConfirmation(input: {adapter: string; launches: number; yes: boolean}): boolean`
  - `describePlan(entries: Array<{key: RunKey; state: RunState}>): string`
  - each command module exports one function `(options: CliOptions) => Promise<number>` returning the exit code: `doctor`, `prepare`, `run`, `score`, `report`

- [ ] **Step 1: Write the failing tests**

`evals/tests/cli.test.ts`:

```ts
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {describePlan, needsConfirmation, parseCli} from "../src/cli.ts";
import {runCommand} from "../src/exec.ts";
import {PACKAGE_DIR} from "../src/paths.ts";

describe("parseCli", () => {
  it("applies the defaults of spec section 11", () => {
    expect(parseCli(["run"])).toEqual({
      adapter: "claude-code", agentBin: undefined, agentConfig: "isolated", batch: undefined, command: "run", concurrency: 2,
      configs: ["none"], dryRun: false, force: false, keepWorkspaces: false, label: "run", maxBudgetUsd: 3, model: "sonnet",
      reps: 5, solution: "good", tasks: undefined, timeoutMin: 15, yes: false,
    });
  });

  it("reads every option", () => {
    const options = parseCli([
      "run", "--tasks", "a,b", "--configs", "none,skill", "--reps", "3", "--concurrency", "4", "--model", "opus", "--batch", "x",
      "--label", "smoke", "--dry-run", "--yes", "--adapter", "reference", "--solution", "bad-x", "--timeout-min", "5",
      "--max-budget-usd", "1.5", "--agent-bin", "/a b/claude", "--agent-config", "inherit", "--keep-workspaces",
    ]);

    expect(options).toMatchObject({
      adapter: "reference", agentBin: "/a b/claude", agentConfig: "inherit", batch: "x", concurrency: 4, configs: ["none", "skill"],
      dryRun: true, keepWorkspaces: true, label: "smoke", maxBudgetUsd: 1.5, model: "opus", reps: 3, solution: "bad-x",
      tasks: ["a", "b"], timeoutMin: 5, yes: true,
    });
  });

  it.each([
    [[], /usage/i],
    [["launch"], /unknown command "launch"/],
    [["run", "--reps", "0"], /--reps must be an integer of at least 1/],
    [["run", "--reps", "many"], /--reps must be an integer of at least 1/],
    [["run", "--concurrency", "0"], /--concurrency must be an integer of at least 1/],
    [["run", "--adapter", "cursor"], /--adapter must be claude-code or reference/],
    [["run", "--agent-config", "mine"], /--agent-config must be isolated or inherit/],
    [["run", "--nope"], /nope/],
    [["score"], /--batch is required/],
    [["report"], /--batch is required/],
  ])("rejects %j", (argv, message) => {
    expect(() => parseCli(argv)).toThrow(message);
  });
});

describe("needsConfirmation", () => {
  it.each([
    [{adapter: "claude-code", launches: 1, yes: false}, false],
    [{adapter: "claude-code", launches: 2, yes: false}, true],
    [{adapter: "claude-code", launches: 60, yes: true}, false],
    [{adapter: "reference", launches: 60, yes: false}, false],
    [{adapter: "claude-code", launches: 0, yes: false}, false],
  ])("%j -> %s", (input, expected) => {
    expect(needsConfirmation(input)).toBe(expected);
  });
});

describe("describePlan", () => {
  it("lists every run with its state and totals what would launch", () => {
    const text = describePlan([
      {key: {configuration: "none", repetition: 1, task: "a"}, state: "completed"},
      {key: {configuration: "none", repetition: 2, task: "a"}, state: "infra-error"},
      {key: {configuration: "none", repetition: 3, task: "a"}, state: "pending"},
    ]);

    expect(text).toContain("a__none__r1  completed");
    expect(text).toContain("a__none__r2  infra-error");
    expect(text).toContain("a__none__r3  pending");
    expect(text).toContain("agent runs to launch: 2 of 3");
  });
});

describe("the command line, as a process", () => {
  const env = {...process.env, PEAKUI_EVALS_HOME: mkdtempSync(join(tmpdir(), "cli-"))};
  const cli = (...args: string[]) => runCommand([process.execPath, "src/cli.ts", ...args], {cwd: PACKAGE_DIR, env, timeoutMs: 30_000});

  it("--dry-run prints the matrix and launches nothing", async () => {
    const result = await cli("run", "--dry-run", "--tasks", "pending-button,sign-in-form", "--reps", "2");

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("pending-button__none__r2  pending");
    expect(result.stdout).toContain("agent runs to launch: 4 of 4");
  });

  it("refuses more than one real agent run without --yes, with exit code 2", async () => {
    const result = await cli("run", "--tasks", "pending-button", "--reps", "2");

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("would launch 2 agent runs");
    expect(result.stderr).toContain("--yes");
  });

  it("refuses a planned configuration and names what is missing", async () => {
    const result = await cli("run", "--dry-run", "--configs", "skill");

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("skills/peakui-react");
  });

  it("refuses an unknown task", async () => {
    const result = await cli("run", "--dry-run", "--tasks", "nope");

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('unknown task "nope"');
  });

  it("prints usage for a bad argument, with exit code 1", async () => {
    const result = await cli("run", "--reps", "0");

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("--reps must be an integer of at least 1");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/evals test -- cli`
Expected: FAIL — `Cannot find module '../src/cli.ts'`.

- [ ] **Step 3: Implement `cli.ts`**

`parseCli` uses `parseArgs` from `node:util` with `strict: true`; the first positional is the command. `describePlan` prints one line per run — the key id, two spaces, the state — and a last line `agent runs to launch: <pending + infra-error> of <total>`. The file ends with the entry point, guarded so that importing it in tests runs nothing:

```ts
if (import.meta.main) {
  try {
    const options = parseCli(process.argv.slice(2));
    const commands = {doctor, prepare, report, run, score};

    process.exitCode = await commands[options.command](options);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
```

(`import.meta.main` exists from Node 22.18 and 24.2; the repository's engine floor is 22.18.)

- [ ] **Step 4: Implement the commands**

`run`, in this order — everything before point 5 is free:

1. Resolve tasks (`getTask` for each id, all twelve when `--tasks` is absent) and configurations (`getConfiguration`, then `available()`; an unavailable one throws its reason).
2. `batch = options.batch ?? newBatchId(new Date(), options.label)`; `batchDir = join(RESULTS_DIR, batch)`; `keys = planMatrix(…)`; states from `runState`.
3. `--dry-run`: print `describePlan`, return 0.
4. `launches` = keys not `completed`. `needsConfirmation` → print the plan and `this would launch <n> agent runs and spend real tokens; pass --yes to confirm` to stderr, return 2.
5. Adapter: `reference` → `createReferenceAdapter(options.solution)`; `claude-code` → `createClaudeCodeAdapter({command: [options.agentBin ?? process.env.PEAKUI_EVALS_CLAUDE_BIN ?? "claude"], configDir: options.agentConfig === "isolated" ? agentConfigDir(batch) : undefined})`. `info = await adapter.describe()`; when not authenticated, print `doctor`'s authentication advice and return 1.
6. `pack = await packLibrary()`; a template per fixture in use via `prepareTemplate(…, {force: false})`.
7. Write the manifest when the batch is new. When resuming, refuse (return 1) if the stored `libraryHash` differs from `pack.libraryHash`: `this batch measured a different library build; start a new batch`.
8. `runPool(pending keys, options.concurrency, executeRun)`, printing one line per finished run: key, status, `passed`, the four layer statuses.
9. Write `summary.md` with `renderSummary`; print its path; return 0.

`score`: read the manifest and records of `--batch`; for each `completed` record (filtered by `--tasks`), `rescoreRun`; rewrite `summary.md`. Never constructs an adapter.

`report`: read the manifest and records; write `summary.md`; print it.

`prepare`: `packLibrary`, then `prepareTemplate` for both fixtures with `force: options.force`; print each template's directory and whether it was reused.

`doctor`: print Node and npm versions, `evalsHome()`, the adapter's binary, version and authentication, and whether each template is current. Return 1 when the binary cannot be run or is not authenticated, with this advice: `The agent runs with an isolated config directory, so a keychain login is not visible to it. Export CLAUDE_CODE_OAUTH_TOKEN (from "claude setup-token") or ANTHROPIC_API_KEY, or pass --agent-config inherit. If "claude" is not on PATH, pass --agent-bin or set PEAKUI_EVALS_CLAUDE_BIN.`

- [ ] **Step 5: Run every tier and the gates**

Run: `pnpm --filter @peakui/evals test && pnpm --filter @peakui/evals typecheck && pnpm lint && cmp AGENTS.md CLAUDE.md`
Expected: all unit tests pass; no type or lint error; `cmp` prints nothing.

- [ ] **Step 6: Run the whole pipeline on reference solutions — no tokens**

Run:

```bash
pnpm evals prepare
pnpm evals run --adapter reference --solution good --reps 1 --label reference-good
```

Expected: twelve lines, each `completed  passed  pass pass pass pass` (the two CSS-only tasks and the others alike), and a `summary.md` path. Open the summary: `## Per configuration` reads `12/12` for all layers.

Then delete that batch directory — it is a self-test, not a result: `rm -r evals/results/*-reference-good`.

- [ ] **Step 7: Commit**

```bash
git add evals package.json AGENTS.md CLAUDE.md
git commit -m "feat(evals): add the command line with dry-run, resume and a cost guard"
```

---

### Task 17: One smoke run against the real agent

This is the only task that spends tokens: **one** run of **one** task. If `doctor` fails, stop and report; do not work around authentication and do not use `--agent-config inherit` without the owner's decision.

**Files:**
- Modify: `evals/tests/data/claude-stream-synthetic.jsonl` (replaced by a recorded excerpt), possibly `evals/src/adapters/transcript.ts` and `claude-code.ts`
- Modify: `docs/superpowers/specs/2026-10-03-agent-evals-design.md` (section 3 "Not verified", section 14)
- Create: `evals/results/<batch>/` for the smoke batch

- [ ] **Step 1: Check the environment**

Run: `pnpm evals doctor`
Expected: exit 0, `authenticated: yes`, both templates current. On this machine the binary is not on `PATH`; pass `--agent-bin "$HOME/Library/Application Support/Claude/claude-code/2.1.284/claude.app/Contents/MacOS/claude"` or set `PEAKUI_EVALS_CLAUDE_BIN`.

- [ ] **Step 2: Dry run**

Run: `pnpm evals run --tasks pending-button --reps 1 --label smoke --dry-run`
Expected: one line `pending-button__none__r1  pending` and `agent runs to launch: 1 of 1`.

- [ ] **Step 3: The smoke run**

Run: `pnpm evals run --tasks pending-button --reps 1 --label smoke`
Expected: one result line with status `completed` (whatever the layers say — a failing agent is a valid result), and a summary path. An `infra-error` here is a harness or authentication problem: read `runs/pending-button__none__r1/stderr.txt` and `record.json`, fix, and rerun with `--batch <the same id>`. Rerunning is allowed only while the previous attempt was `infra-error`.

- [ ] **Step 4: Reconcile the parser with the real stream**

Read `runs/pending-button__none__r1/transcript.jsonl`. Check, against `evals/src/adapters/transcript.ts`:

- `assistant` events carry `message.content` blocks of type `text` and `tool_use` (`id`, `name`, `input`);
- tool results arrive as `user` events with `tool_result` blocks (`tool_use_id`, `is_error`, `content`);
- file-writing tools are named `Write` and `Edit` and carry `input.file_path` as an absolute path;
- the `result` event's `subtype` and `terminal_reason` for a normal finish.

Replace `claude-stream-synthetic.jsonl` with a redacted excerpt of the real stream that still contains one read, one write and the result (keep the name; change the header comment in `transcript.test.ts` from "synthetic" to "recorded"), adjusting the expected values in `transcript.test.ts` and `claude-code.test.ts`. If the shapes differ from what the parser assumes: first make the tests fail with the recorded data, then fix the parser.

Run: `pnpm --filter @peakui/evals test -- transcript claude-code`
Expected: PASS.

- [ ] **Step 5: Check the record a skill author would read**

Open `record.json` of the smoke run and confirm: `agent.environment.tools` is the six tools, `mcpServers` and `skills` are empty, `agent.usage` has four non-zero-or-zero integers, `agent.narration` holds the agent's own sentences, every mistake with a `file` has a `justification`, `outsideAccess` lists no path under the repository, and no string contains the home directory. Anything missing is a bug in Task 12 or 14: write the failing test, then fix.

- [ ] **Step 6: Record what was measured**

In the spec: replace the "Not verified" paragraph of section 3 with what Step 4 observed, and replace the estimate table of section 14 with the measured input-side tokens, output tokens, turns, cost and wall-clock time of this run, multiplied to 60 runs and marked as an extrapolation from one sample.

- [ ] **Step 7: Commit**

```bash
git add evals docs/superpowers/specs/2026-10-03-agent-evals-design.md
git commit -m "test(evals): reconcile the transcript parser with a recorded smoke run"
```

---

## After this plan

The baseline is not part of the plan. When the owner asks for it:

```bash
pnpm evals run --configs none --reps 5 --label baseline --dry-run   # 60 runs, launches nothing
pnpm evals run --configs none --reps 5 --label baseline --yes       # spends tokens
```

An interrupted baseline resumes with `--batch <id> --yes`. After reading the transcripts and correcting any answer key, `pnpm evals score --batch <id>` re-scores without an agent.
