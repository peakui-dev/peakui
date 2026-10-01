# Onboarding

## When to read this

- You are working in a fresh clone.
- `pnpm bootstrap --check` reports something missing.

The second trigger matters more than the first. A half-working harness is the state in which
an agent starts improvising: guessing at commands, reading files instead of querying the
graph, indexing things it must not index.

## Prerequisites

| Tool | Required | Where it is pinned |
| --- | --- | --- |
| Node | `>= 22.18` | `engines` in `package.json`; Vite 8 needs `>= 22.12` |
| pnpm | `12.3.4` exactly | `packageManager` in `package.json` |

`bootstrap` gates on both and stops on either, naming the version it found.

## Set up

```bash
pnpm bootstrap
```

| Step | Why | Skipped when |
| --- | --- | --- |
| Version gates | A version below the floor fails later, in Vite or pnpm, where the cause is unreadable | never |
| `pnpm install` | — | never |
| `pnpm --filter @peakui/storybook exec playwright install chromium` | e2e has no browser otherwise, and fails before its first assertion | never skipped — Playwright itself exits early when the pinned revision is present |
| `pnpm exec codegraph init` | Builds `.codegraph/`, the index every CodeGraph tool reads | `.codegraph/` already exists, so a second run is cheap |

## What bootstrap does not do

- **`.zcode/config.json` is committed, not generated.** ZCode is not a target of
  `codegraph install`, so no tool maintains it. Edit it by hand and keep it in step with
  `.mcp.json`. It also wires the agent hooks for ZCode.
- **`.mcp.json` is committed, not generated.** It registers the CodeGraph MCP server in the
  portable `pnpm exec` form. A later `codegraph install` rewrites it with a bare `codegraph`
  command, which resolves from `PATH` — and MCP servers do not see `node_modules/.bin`, so on
  a machine carrying only the devDependency that server never starts. `--check` reports it.
- **Nothing frees port 6007.** Another project may hold it.

## Verify

```bash
pnpm bootstrap --check
```

A healthy report is every line `ok` and exit 0. It changes nothing, so run it whenever
something feels wrong.

## Who runs what

Two steps belong to the human:

```bash
pnpm bootstrap                              # here: builds the CodeGraph index
git config core.hooksPath .githooks         # in peakui-company: arms the sync gate
```

The CodeGraph CLI refuses to index on an agent's initiative, and it is right to: an index is
a decision about this machine, not a step in a task.

**Agents: run `pnpm bootstrap --check`, report what is missing, and stop.** Do not run setup
on your own initiative.

## Known traps

| Symptom | Cause | What to do |
| --- | --- | --- |
| `pnpm test:e2e` fails with "http://127.0.0.1:6007/index.json is already used" | 6007 is held by another project | `STORYBOOK_PORT=<free> pnpm test:e2e`. The error is deliberate: Playwright refuses to reuse a server it did not start, so a foreign Storybook is never mistaken for ours |
| `pnpm dev` offers a different port | 6007 is held by another project | `pnpm exec storybook dev --host 127.0.0.1 --port <free> --no-open`; `STORYBOOK_PORT` does not reach the `dev` script, because pnpm does not expand variables in script bodies |
| e2e fails before its first assertion | no Playwright browser | `pnpm --filter @peakui/storybook exec playwright install chromium` — the package owns `@playwright/test`, so the bare `pnpm exec` form does not resolve from the root |
| CodeGraph MCP tools are absent | the server did not start | `.mcp.json` must call `pnpm`, never a bare `codegraph` |
| CodeGraph answers "not initialized" | no index | the human runs `pnpm bootstrap`; do not index yourself |
| An edit to `pnpm-lock.yaml` or `heroui/` is rejected | the `protected-files` hook | intended — a human edits those deliberately |
| `post-edit` prints nothing on a `.ts` edit | eslint and prettier are not installed yet | expected until they arrive with `packages/react` |
