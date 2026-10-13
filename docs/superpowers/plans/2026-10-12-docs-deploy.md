# Docs Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy `apps/docs` to Cloudflare Workers (Worker `peakui-docs`, custom domain
`peakui.dev`) with a `main`-triggered deploy workflow and a blocking contract smoke.

**Architecture:** vinext (Cloudflare's Next.js adapter) builds the app into a Worker + static
assets; a GitHub workflow deploys on push to `main` (plus manual dispatch), purges the zone
cache, then runs `verify-site-contract.mjs` — a plain-Node smoke that re-checks the
client-facing contract (negotiation, headers, 404 shapes) against the live site; a red smoke
attempts `wrangler rollback`. `@opennextjs/cloudflare` is the documented fallback if the
vinext spike gate fails.

**Tech Stack:** Next.js 16 (fumadocs), vinext, wrangler, Cloudflare Workers static assets,
GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-12-docs-deploy-design.md` — the plan argues from the
spec; read both. The contract being preserved: `../../../../../docs/ecosystem/docs-site-contract.md`
in `peakui-company` (relative to this file: `peakui-company/docs/ecosystem/docs-site-contract.md`).

## Global Constraints

- Work happens on branch `feat/docs-deploy` (already checked out) in the `peakui` repository;
  `cd peakui` first. Never edit vendored references (`heroui/` etc.).
- New prose, comments and commit messages in English. Conventional Commits.
- **Line endings: the repo stores LF.** When a tool or editor rewrites a file, verify with
  `git diff --stat` that only intended lines changed; if a whole file flips, redo the edit with
  LF preserved (`node -e` rewrite with `\n`). Do not run prettier on `*.md` — `.prettierignore`
  excludes markdown and the formatter mangles it.
- The working tree carries an unrelated modified file,
  `packages/styles/themes/default/variables.css` — never stage it; every `git add` is explicit.
- The smoke script adds no new dependencies — plain `node:` modules only.
- `NEXT_PUBLIC_SITE_URL`: `https://peakui.dev` in CI/deploys, `http://localhost:3000` for the
  classic local baseline, `http://localhost:8787` for the vinext local smoke.
- Task 3 is a **spike gate**: if its acceptance criteria fail after a bounded fixing attempt,
  STOP and report — the fallback (`@opennextjs/cloudflare`) changes only Tasks 3–5 build/deploy
  commands, not the workflow structure, domain, secrets or smoke.

---

### Task 1: Contract smoke — pure check/evaluate helpers (TDD)

**Files:**
- Create: `apps/docs/scripts/verify-site-contract.mjs` (helpers + stub CLI)
- Test: `apps/docs/tests/verify-site-contract.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (imported by Task 2's CLI and the test):
  - `NOINDEX = "noindex, nofollow"`, `MACHINE_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400"`
  - `buildChecks(page: string): Check[]` — `page` is a canonical prefixed page URL such as
    `/en/docs/react/components/button`
  - `evaluate(check: Check, response: Response): string[]` — returns problem descriptions,
    `[]` when the response satisfies the check. `Response` here is the plain summary object
    built by the CLI: `{status: number, location: string | null, contentType: string | null,
    header(name: string): string | null, body: string}`.
  - `Check` shape: `{name, path, method?, accept?, status, contentType?, charset?, location?,
    noindex?, machineCache?, vary?, bodyIncludes?, emptyBody?, noContentType?, json?, redirect?}`

- [ ] **Step 1: Write the failing test** — `apps/docs/tests/verify-site-contract.test.ts`

```ts
import {expect, test} from "vitest";

import {MACHINE_CACHE, NOINDEX, buildChecks, evaluate} from "../scripts/verify-site-contract.mjs";

function response(overrides: Partial<Parameters<typeof evaluate>[1]> = {}) {
  return {
    body: "# Button",
    contentType: "text/markdown; charset=utf-8",
    header: (name: string) =>
      ({vary: "Accept", "x-robots-tag": NOINDEX, "cache-control": MACHINE_CACHE})[
        name.toLowerCase()
      ] ?? null,
    location: null,
    status: 200,
    ...overrides,
  };
}

test("buildChecks covers every contract surface", () => {
  const checks = buildChecks("/en/docs/react/components/button");
  const names = checks.map((check) => check.name);

  expect(checks).toHaveLength(17);
  expect(names).toContain("root serves HTML");
  expect(names).toContain("root negotiates markdown");
  expect(names).toContain("page .mdx alias");
  expect(names).toContain("unprefixed .md serves directly");
  expect(names).toContain("HEAD .md matches GET");
  expect(names).toContain("machine route /llms-patterns.txt");
  expect(names).toContain("/api/components");
  expect(names).toContain("unprefixed route redirects to /en");
  expect(names).toContain("markdown 404 body");
  expect(names).toContain("unknown .md is an empty 404");
  expect(names).toContain("unknown /docs path redirects 308");
});

test("evaluate returns no problems for a compliant response", () => {
  const check = buildChecks("/en/docs/react/components/button").find(
    (candidate) => candidate.name === "page negotiates markdown",
  )!;

  expect(evaluate(check, response())).toEqual([]);
});

test("evaluate flags wrong status, content type and missing headers", () => {
  const check = {
    accept: "text/markdown",
    contentType: "text/markdown",
    machineCache: true,
    name: "any",
    noindex: true,
    path: "/x",
    status: 200,
    vary: true,
  };

  const problems = evaluate(check, {
    body: "",
    contentType: "text/html",
    header: () => null,
    location: null,
    status: 404,
  });

  expect(problems.join("\n")).toMatch(/status/);
  expect(problems.join("\n")).toMatch(/content type/);
  expect(problems.join("\n")).toMatch(/X-Robots-Tag/);
  expect(problems.join("\n")).toMatch(/Cache-Control/);
  expect(problems.join("\n")).toMatch(/Vary/);
});

test("evaluate flags a non-empty body where the contract demands an empty one", () => {
  const check = {
    emptyBody: true,
    name: "empty",
    noContentType: true,
    path: "/nope.md",
    status: 404,
  };

  expect(evaluate(check, {...response(), body: "x", contentType: null})).toEqual([
    "body is not empty",
    "Content-Type is present",
  ]);
});

test("evaluate flags a redirect that went to the wrong place and bad JSON", () => {
  const redirect = evaluate(
    {location: "/en/nope", name: "r", path: "/nope", redirect: "manual", status: 307},
    {...response(), location: "/somewhere-else", status: 307},
  );
  const json = evaluate(
    {json: true, name: "j", path: "/api/components", status: 200},
    {...response(), body: "not json", contentType: "application/json"},
  );

  expect(redirect).toEqual(["Location is /somewhere-else, expected /en/nope"]);
  expect(json.join("\n")).toMatch(/valid JSON/);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/docs exec vitest run tests/verify-site-contract.test.ts`
Expected: FAIL — cannot resolve `../scripts/verify-site-contract.mjs`.

- [ ] **Step 3: Implement the helpers** — `apps/docs/scripts/verify-site-contract.mjs`

```js
/*
 * Contract smoke for the docs site. Re-checks the client-facing promises of
 * docs/ecosystem/docs-site-contract.md (in peakui-company) against any host — localhost or
 * https://peakui.dev. Run by hand and, blocking, by the Docs deploy workflow after every
 * deploy. The check matrix and the assertions are pure so they can be unit-tested; only
 * main() talks HTTP.
 */

export const NOINDEX = "noindex, nofollow";
export const MACHINE_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

export function buildChecks(page) {
  const unprefixed = page.replace(/^\/en/, "");

  return [
    {accept: "text/html", contentType: "text/html", name: "root serves HTML", path: "/", status: 200},
    {accept: "text/markdown", contentType: "text/markdown", name: "root negotiates markdown", path: "/", status: 200, vary: true},
    {accept: "text/html", contentType: "text/html", name: "page serves HTML", path: page, status: 200},
    {accept: "text/markdown", contentType: "text/markdown", name: "page negotiates markdown", path: page, status: 200, vary: true},
    {contentType: "text/markdown", name: "page .md", path: `${page}.md`, status: 200},
    {contentType: "text/markdown", name: "page .mdx alias", path: `${page}.mdx`, status: 200},
    {contentType: "text/markdown", name: "unprefixed .md serves directly", path: `${unprefixed}.md`, redirect: "manual", status: 200},
    {contentType: "text/markdown", emptyBody: true, method: "HEAD", name: "HEAD .md matches GET", path: `${page}.md`, status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms.txt", noindex: true, path: "/llms.txt", status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms-components.txt", noindex: true, path: "/llms-components.txt", status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms-patterns.txt", noindex: true, path: "/llms-patterns.txt", status: 200},
    {contentType: "application/json", json: true, name: "/api/components", path: "/api/components", status: 200},
    {location: "/en/nope", name: "unprefixed route redirects to /en", path: "/nope", redirect: "manual", status: 307},
    {contentType: "text/html", name: "prefixed 404 is HTML", path: "/en/nope", status: 404},
    {accept: "text/markdown", bodyIncludes: "# Not Found", contentType: "text/markdown", machineCache: true, name: "markdown 404 body", path: "/nope", status: 404, vary: true},
    {emptyBody: true, name: "unknown .md is an empty 404", noContentType: true, noindex: true, path: `${page}-nope.md`, status: 404},
    {location: `/en${unprefixed}-nope`, name: "unknown /docs path redirects 308", path: `${unprefixed}-nope`, redirect: "manual", status: 308},
  ];
}

export function evaluate(check, res) {
  const problems = [];

  if (res.status !== check.status) {
    problems.push(`status is ${res.status}, expected ${check.status}`);
  }

  if (check.contentType && !(res.contentType ?? "").startsWith(check.contentType)) {
    problems.push(`content type is ${res.contentType}, expected ${check.contentType}*`);
  }

  if (check.charset && !(res.contentType ?? "").includes(`charset=${check.charset}`)) {
    problems.push(`content type is missing charset=${check.charset}`);
  }

  if (check.location && res.location !== check.location) {
    problems.push(`Location is ${res.location}, expected ${check.location}`);
  }

  if (check.noindex && res.header("x-robots-tag") !== NOINDEX) {
    problems.push(`X-Robots-Tag is ${res.header("x-robots-tag")}, expected ${NOINDEX}`);
  }

  if (check.machineCache && res.header("cache-control") !== MACHINE_CACHE) {
    problems.push(`Cache-Control is ${res.header("cache-control")}, expected ${MACHINE_CACHE}`);
  }

  if (check.vary && !(res.header("vary") ?? "").includes("Accept")) {
    problems.push("Vary does not include Accept");
  }

  if (check.bodyIncludes && !res.body.includes(check.bodyIncludes)) {
    problems.push(`body does not include ${JSON.stringify(check.bodyIncludes)}`);
  }

  if (check.emptyBody && res.body !== "") {
    problems.push("body is not empty");
  }

  if (check.noContentType && res.contentType !== null) {
    problems.push("Content-Type is present");
  }

  if (check.json) {
    try {
      JSON.parse(res.body);
    } catch {
      problems.push("body is not valid JSON");
    }
  }

  return problems;
}

function main() {
  throw new Error("not implemented yet");
}

if (process.argv[1]?.endsWith("verify-site-contract.mjs")) {
  main();
}
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `pnpm --filter @peakui/docs exec vitest run tests/verify-site-contract.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/docs/scripts/verify-site-contract.mjs apps/docs/tests/verify-site-contract.test.ts
git commit -m "feat(docs): contract smoke check matrix and assertions"
```

### Task 2: Contract smoke — HTTP shell and baseline against `next start`

**Files:**
- Modify: `apps/docs/scripts/verify-site-contract.mjs` (replace the stub `main`)

**Interfaces:**
- Consumes: Task 1 exports.
- Produces: CLI `node apps/docs/scripts/verify-site-contract.mjs <baseUrl> [page]` — default
  page `/en/docs/react/components/button`; exit 0 when all checks pass, 1 otherwise; one line
  per check. Tasks 3–4 run it against localhost and production.

- [ ] **Step 1: Replace the stub `main`**

```js
async function runCheck(base, check) {
  const response = await fetch(`${base}${check.path}`, {
    headers: check.accept ? {Accept: check.accept} : undefined,
    method: check.method ?? "GET",
    redirect: check.redirect === "manual" ? "manual" : "follow",
  });

  return evaluate(check, {
    body: check.method === "HEAD" ? "" : await response.text(),
    contentType: response.headers.get("content-type"),
    header: (name) => response.headers.get(name),
    location: response.headers.get("location"),
    status: response.status,
  });
}

async function main() {
  const [base, page = "/en/docs/react/components/button"] = process.argv.slice(2);

  if (!base) {
    console.error("usage: verify-site-contract.mjs <baseUrl> [page]");

    process.exit(2);
  }

  let failed = 0;

  for (const check of buildChecks(page)) {
    const problems = await runCheck(base.replace(/\/$/, ""), check);

    if (problems.length === 0) {
      console.log(`ok    ${check.name}`);
    } else {
      failed += 1;
      console.error(`FAIL  ${check.name} (${check.path})`);
      console.error(`      ${problems.join("; ")}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}
```

(Remove the old stub `function main() { throw … }` and keep the entry-point guard.)

- [ ] **Step 2: Unit tests still green**

Run: `pnpm --filter @peakui/docs exec vitest run tests/verify-site-contract.test.ts`
Expected: PASS.

- [ ] **Step 3: Baseline — the smoke passes against the known-good host**

The contract was captured on `next build` + `next start`; prove the *tool* there first:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000 pnpm --filter @peakui/docs build
```

Then, in a background shell: `NEXT_PUBLIC_SITE_URL=http://localhost:3000 pnpm --filter @peakui/docs start`
(port 3000). Poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` until it
answers (≤ 60 s), then:

```bash
node apps/docs/scripts/verify-site-contract.mjs http://localhost:3000
```

Expected: every line `ok`, exit 0. Stop the server afterwards.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/scripts/verify-site-contract.mjs
git commit -m "feat(docs): contract smoke HTTP shell"
```

### Task 3: Spike gate — vinext migration of `apps/docs`

**Files:**
- Modify: `apps/docs/package.json` (scripts vinext init adds, plus `deploy`)
- Modify: `pnpm-workspace.yaml` (allowBuilds for new toolchain packages)
- Create: whatever `vinext init` generates in `apps/docs` (Vite config, Workers config)

**Interfaces:**
- Consumes: Task 2 smoke CLI.
- Produces: `pnpm --filter @peakui/docs run build:vinext` and
  `pnpm --filter @peakui/docs run deploy` — the exact commands Tasks 4–5 call. Worker config
  with name `peakui-docs`, `nodejs_compat`, `run_worker_first` asset behavior.

**Acceptance criteria (all must hold before commit; otherwise STOP and report per the
fallback rule in Global Constraints):**

1. `npx vinext check` reports no blocking incompatibilities.
2. `build:vinext` succeeds with `NEXT_PUBLIC_SITE_URL=http://localhost:8787`.
3. The smoke passes against `wrangler dev` (localhost:8787).
4. The Workers config satisfies: name `peakui-docs`, `nodejs_compat`, current
   `compatibility_date`, and assets served with the Worker running first (negotiation must not
   be bypassed by direct asset hits).
5. `wrangler deploy --dry-run` reports a compressed script size within the free-plan limit
   (~3 MB); if over — STOP and report (contingency: paid plan or bundle trimming, owner call).
6. Classic paths still green: `pnpm build:docs`, `pnpm --filter @peakui/docs test`,
   `pnpm lint`, `pnpm format`.
7. `pnpm install` shows no "Ignored build scripts" warning after allowBuilds entries land.

- [ ] **Step 1: Compatibility check and init**

```bash
cd apps/docs && npx vinext check
npx vinext init
```

Read both outputs. `init` is non-destructive: it adds dependencies, scripts
(`dev:vinext`, `build:vinext`), a Vite config and the Workers configuration while leaving
`next dev`/`next build` intact.

- [ ] **Step 2: allowBuilds for new toolchain packages**

Run `pnpm install` from the repo root; if it prints `Ignored build scripts: <packages>`
(typically `workerd`, `wrangler`, `@cloudflare/*`, esbuild-related), add each to `allowBuilds`
in `pnpm-workspace.yaml` alongside the existing `esbuild` entry and reinstall. Repeat until
the warning is gone.

- [ ] **Step 3: Configure the Worker**

Open the Workers config `init` generated in `apps/docs` (`wrangler.jsonc`/`wrangler.toml` —
whatever exists) and make it satisfy criteria 4: name `"peakui-docs"`,
`"compatibility_flags": ["nodejs_compat"]`, today's `compatibility_date`, and the assets
binding with `"run_worker_first": true` (the proxy must see every request; prerendered HTML
must not bypass `proxy.ts` negotiation). Keep everything else the generator produced.

- [ ] **Step 4: Add the deploy script alias**

In `apps/docs/package.json`, ensure a `"deploy"` script exists that runs the adapter's deploy
command (init usually adds one; if it is named differently, add):

```json
    "deploy": "vinext deploy"
```

using the exact command `init` documented (fall back to `npx @vinext/cloudflare deploy` if
that is what the guide output shows).

- [ ] **Step 5: Build and smoke on localhost**

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:8787 pnpm --filter @peakui/docs run build:vinext
```

In a background shell: `pnpm --filter @peakui/docs exec wrangler dev` (port 8787). Poll
`curl -s -o /dev/null -w "%{http_code}" http://localhost:8787` until ready, then:

```bash
node apps/docs/scripts/verify-site-contract.mjs http://localhost:8787
```

Expected: all `ok`, exit 0 — criteria 2 and 3.

- [ ] **Step 6: Size dry-run**

```bash
pnpm --filter @peakui/docs exec wrangler deploy --dry-run --outdir .worker-dry-run
```

Read the reported gzip size — criterion 5. Delete `.worker-dry-run` afterwards.

- [ ] **Step 7: Classic paths and repo gates**

```bash
NEXT_PUBLIC_SITE_URL=https://docs.ci.invalid pnpm build:docs
pnpm --filter @peakui/docs test
pnpm lint
pnpm format
```

Expected: all green. If prettier flags generated JSON/YAML configs, run
`pnpm exec prettier --write <paths>` on those (never on `*.md`).

- [ ] **Step 8: Commit**

```bash
git add apps/docs pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(docs): run on vinext for cloudflare workers"
```

(`git status` first: stage generated files explicitly, never
`packages/styles/themes/default/variables.css`; confirm no whole-file EOL flips in
`git diff --stat`.)

### Task 4: Deploy workflow — `.github/workflows/docs-deploy.yml`

**Files:**
- Create: `.github/workflows/docs-deploy.yml`

**Interfaces:**
- Consumes: Task 2 smoke CLI, Task 3 `build:vinext`/`deploy` scripts.
- Produces: deploys on `main` + manual dispatch; secrets `CLOUDFLARE_API_TOKEN` (custom token:
  Workers deploy + zone cache purge), `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`.

- [ ] **Step 1: Create the workflow**

```yaml
name: Docs deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      base-url:
        description: "Base URL for the post-deploy contract smoke"
        required: false
        type: string
        default: https://peakui.dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: read
    concurrency:
      group: docs-deploy
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter @peakui/docs run build:vinext
        env:
          NEXT_PUBLIC_SITE_URL: https://peakui.dev

      - name: Deploy
        id: deploy
        run: pnpm --filter @peakui.docs run deploy
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      # The contract's s-maxage=3600 would otherwise keep serving the previous deploy's
      # llms-* and .md bytes; the smoke must validate this deploy, not the cache.
      - name: Purge edge cache
        run: >
          curl -sf -X POST
          "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/cache/purge_everything"
          -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}"
          -H "Content-Type: application/json"
          --data '{"purge_everything":true}'

      - name: Contract smoke
        run: node apps/docs/scripts/verify-site-contract.mjs "${{ inputs.base-url || 'https://peakui.dev' }}"

      # Best effort: only when something was actually deployed.
      - name: Rollback
        if: failure() && steps.deploy.outcome == 'success'
        continue-on-error: true
        run: pnpm --filter @peakui/docs exec wrangler rollback
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

**Fix before saving:** the Deploy step has a typo on purpose — `@peakui.docs` must read
`@peakui/docs`. (This line exists so the executor reads carefully; correct it.)

- [ ] **Step 2: Verify formatting**

Run: `pnpm exec prettier --check .github/workflows/docs-deploy.yml` — fix with `--write` if
needed.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/docs-deploy.yml
git commit -m "ci: docs deploy workflow with contract smoke"
```

### Task 5: CI gates the vinext build

**Files:**
- Modify: `.github/workflows/ci.yml` (verify job)

**Interfaces:**
- Consumes: Task 3 `build:vinext`.
- Produces: PRs that break only the vinext build cannot merge green.

- [ ] **Step 1: Add the build step**

In the `verify` job, directly after the existing `pnpm build:docs` step (which carries the
`NEXT_PUBLIC_SITE_URL: https://docs.ci.invalid` env), add:

```yaml
      # Production builds through vinext; a PR that breaks only this path must not
      # merge green and strand main undeployable.
      - run: pnpm --filter @peakui/docs run build:vinext
        env:
          NEXT_PUBLIC_SITE_URL: https://docs.ci.invalid
```

- [ ] **Step 2: Local sanity + commit**

```bash
pnpm exec prettier --check .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: build docs through vinext in the verify job"
```

### Task 6: Documentation — agent file and the site contract

**Files:**
- Modify: `peakui/AGENTS.md` (Docs app section) + copy to `CLAUDE.md`
- Modify: `peakui-company/docs/ecosystem/docs-site-contract.md` (append a section)

**Interfaces:**
- Consumes: Tasks 2–4 (what is being documented).
- Produces: agents landing in the repo learn the production path; the contract notes its
  deployed validation.

- [ ] **Step 1: Insert into `peakui/AGENTS.md`** — in the Docs app section, immediately after
  the bullet that starts `- **Deployment requirement: \`Vary: Accept\`**` and ends
  `…or the reverse.`:

```md
- **Production** — Cloudflare Workers, Worker `peakui-docs`, custom domain `peakui.dev`. The
  `Docs deploy` workflow ships `main` (plus manual dispatch with a `base-url` smoke input);
  every deploy purges the zone cache and must pass the contract smoke
  `apps/docs/scripts/verify-site-contract.mjs`, and a red smoke attempts `wrangler rollback`.
  Design: `docs/superpowers/specs/2026-10-12-docs-deploy-design.md`.
```

- [ ] **Step 2: Sync the copy**

```bash
cp AGENTS.md CLAUDE.md && cmp AGENTS.md CLAUDE.md && echo identical
```

- [ ] **Step 3: Append to `peakui-company/docs/ecosystem/docs-site-contract.md`** at the end of
  the file:

```md
## Deployment validation

The examples above were captured against `next build` + `next start`. Production runs on
Cloudflare Workers (Worker `peakui-docs`, `peakui.dev`); after every deploy the `Docs deploy`
workflow in `peakui` runs `apps/docs/scripts/verify-site-contract.mjs` against the live site,
so a host-level regression in negotiation, headers, or the 404 shapes fails the deploy.
```

- [ ] **Step 4: Verify and commit (two repos)**

```bash
pnpm test:ai
git add AGENTS.md CLAUDE.md && git commit -m "docs: production hosting section for the docs app"
cd .. && node scripts/check-agents-sync.mjs && git add docs/ecosystem/docs-site-contract.md && git commit -m "docs(ecosystem): docs site contract is smoke-validated on the workers deployment" && cd peakui
```

Expected: `test:ai` shows only the 7 pre-existing failures (same set as `main`); sync check
passes.

### Task 7: Owner runbook — secrets, first deploy, domain, go-live flip

**Files:**
- Modify: `peakui-company/AGENTS.md` + `CLAUDE.md` (one line, **only after** `peakui.dev` answers)

**Interfaces:**
- Consumes: Tasks 3–4 (Worker exists after first dispatch).
- Produces: live `https://peakui.dev` passing the smoke.

- [x] **Step 1: Secrets and the origin variable.** On `peakui-dev/peakui` → Settings → Secrets
  and variables → Actions, two repository secrets: `CLOUDFLARE_API_TOKEN` (custom token, Account
  → Workers Scripts → Edit, plus Account Settings → Read) and `CLOUDFLARE_ACCOUNT_ID`. One
  repository variable `DOCS_SITE_URL`, the origin the workflow builds and smokes against —
  `https://peakui-docs.<your-subdomain>.workers.dev` for now. `CLOUDFLARE_ZONE_ID` is **not**
  created yet: no zone exists, and the purge step skips itself while the secret is empty. Add it,
  and Zone → Cache Purge to the token, together with the custom domain in Step 3.

- [ ] **Step 2: First dispatch (creates the Worker).** Merge the PR of
  `fix/docs-deploy-cache-adapter` first — before it, the deploy cannot pass vinext's cache-adapter
  gate (see the amendment in the design). Then Actions → Docs deploy → Run workflow, no input:
  `base-url` is only an override, the default is `DOCS_SITE_URL`. Watch the job: deploy green,
  purge skipped, smoke green.

- [ ] **Step 3: Attach the domain.** Cloudflare dashboard → Workers → `peakui-docs` →
  Settings → Domains & Routes → Add → Custom domain `peakui.dev` (requires the zone in CF
  DNS; certificate provisioning takes a moment).

- [ ] **Step 4: Production dispatch.** Run the workflow again with the default `base-url`.
  Verify `https://peakui.dev` answers and the smoke is green. Locally:

```bash
node apps/docs/scripts/verify-site-contract.mjs https://peakui.dev
```

- [ ] **Step 5: Go-live flip in the company repo.** In `peakui-company/AGENTS.md`, replace:

```md
- Its scripts read the docs site. Until `https://peakui.dev` is live, start it with `pnpm dev:docs` in
  `peakui`; `.claude/settings.json` points the scripts at it.
```

(the two-line bullet under **Building with PeakUI**) with:

```md
- Its scripts read the docs site at `https://peakui.dev` by default; `PEAKUI_DOCS_URL` overrides
  the origin for local `pnpm dev:docs` servers.
```

Then `cp AGENTS.md CLAUDE.md`, run `node scripts/check-agents-sync.mjs`, commit
`docs: docs site is live, scripts read it by default` (stage `AGENTS.md` + `CLAUDE.md` only —
the company repo has unrelated dirty files).

---

## Self-Review

**Spec coverage:** Decisions table → adapter (T3), domain/URL (T3–4), trigger + purge +
rollback + branch-protection assumption (T4), auth/secrets (T4, T7), no previews (nothing to
build). Adapter section incl. allowBuilds (T3) and dev:vinext stance (T3 keeps the script,
attaches no process). Worker configuration incl. `run_worker_first` and size limit (T3
criteria 4–5). Workflow incl. `base-url` input (T4). Smoke script — full assertion list from
the contract incl. HEAD, `.mdx`, unprefixed, three llms files, three 404 shapes, root
negotiation, `Vary` (T1–2). Fallback criteria (Global Constraints + T3 stop rule). Owner
setup incl. domain-after-first-dispatch ordering (T7). Documentation updates (T6, T7 step 5).
Testing section: spike gate (T3), vinext build in CI (T5), pure helpers unit-tested (T1),
classic build stays (T3 criterion 6). Out of scope — nothing to implement.

**Placeholder scan:** no TBDs; every code step carries code. Task 4's deliberate typo is
self-describing and its fix is stated. Task 3 cannot pre-write files `vinext init` has not
generated yet — its steps are commands plus explicit acceptance criteria instead of invented
configs, and the deploy-script step names the alias contract Tasks 4–5 depend on.

**Type consistency:** `buildChecks`/`evaluate`/`NOINDEX`/`MACHINE_CACHE` names and shapes
match between T1, T2 and the test; the CLI base/page arguments match T3/T4/T7 invocations;
`pnpm --filter @peakui/docs run build:vinext|deploy` is the single command surface Tasks 3–5
share.
