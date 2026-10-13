# Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a complete release pipeline for `peakui`: changesets versioning, npm publishing via
OIDC trusted publishing, GitHub Releases, and a manual Releases section in the docs.

**Architecture:** Trunk-based flow — feature PRs merge to `main` freely; `changesets/action`
maintains a Version Packages PR; merging it is the release. `scripts/publish-release.mjs` packs
both publishable packages and publishes tarballs via the npm CLI (the proven trusted-publishing
path), tags `v<version>`, and creates the GitHub Release from the per-package changelogs.
`@peakui/react` publishes built `dist/` through a `publishConfig` override while workspace
consumers keep importing source.

**Tech Stack:** pnpm 12 workspaces, `@changesets/cli` + `@changesets/changelog-github`,
`changesets/action@v1`, GitHub Actions (environment `npm-publish`, OIDC), fumadocs MDX.

**Spec:** `docs/superpowers/specs/2026-10-12-release-pipeline-design.md` — the plan argues from
the spec; read both.

## Global Constraints

- All work happens inside the `peakui` repository (`cd peakui` first). Never edit the vendored
  references (`heroui/`, `heroui-cli/`, `heroui-mcp/`, `gravity-ui/`, `daisyui/`) — the
  protected-files hook rejects it anyway.
- New prose, comments, docs and commit messages are in English. Legacy Russian content is left
  exactly as it is (no opportunistic translation).
- Conventional Commits for every commit.
- pnpm 12.3.4 / node ≥ 22.18 locally, node 24 in CI. The release job needs npm ≥ 11.5 (trusted
  publishing); the workflow installs `npm@11` explicitly.
- `@peakui/standard`, `@peakui/testing`, `@peakui/docs`, `@peakui/storybook`, `@peakui/evals` are
  `private: true` and are never published.
- The working tree contains an unrelated modified file,
  `packages/styles/themes/default/variables.css`. Never stage it — every `git add` in this plan is
  explicit by path.
- License is Apache-2.0 (spec default). If the owner flips to MIT, substitute the LICENSE text
  and the two `license` fields; nothing else changes.
- The publishable pair is exactly `@peakui/react` (dir `packages/react`) and `@peakui/styles`
  (dir `packages/styles`), versioned in lockstep (`fixed`), first release `0.0.1`.

---

### Task 1: Publish-ready manifests and LICENSE

**Files:**
- Modify: `packages/react/package.json`
- Modify: `packages/styles/package.json`
- Create: `LICENSE`

**Interfaces:**
- Consumes: nothing.
- Produces: manifest fields every later task relies on — react `publishConfig.exports` pointing
  at `./dist/index.js`, `files: ["dist", "THIRD-PARTY-NOTICES.md"]`; both packages get
  `publishConfig.access: "public"`, `repository`, `license: "Apache-2.0"`. This is the
  spec's *Verification gate* task: it proves `pnpm pack` applies `publishConfig.exports`.

- [ ] **Step 1: Edit `packages/react/package.json`**

Add after the `"peerDependencies"` block (keep everything else byte-identical):

```json
  "repository": {
    "type": "git",
    "url": "https://github.com/peakui-dev/peakui.git",
    "directory": "packages/react"
  },
  "license": "Apache-2.0",
  "publishConfig": {
    "access": "public",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js",
        "default": "./dist/index.js"
      },
      "./package.json": "./package.json"
    }
  }
```

Replace `"files": ["src"]` with `"files": ["dist", "THIRD-PARTY-NOTICES.md"]`.

Note: `files` is a pack-only field — workspace consumers (docs, storybook, evals) resolve through
`exports`, which still points at `./src/*.ts`. Dev workflow is untouched.

- [ ] **Step 2: Edit `packages/styles/package.json`**

Replace `"sideEffects": false` with:

```json
  "sideEffects": ["**/*.css"],
```

Add after `"sideEffects"`:

```json
  "repository": {
    "type": "git",
    "url": "https://github.com/peakui-dev/peakui.git",
    "directory": "packages/styles"
  },
  "license": "Apache-2.0",
  "publishConfig": {
    "access": "public"
  }
```

`files` and `exports` stay as they are (source-shipping, `@heroui/styles` precedent).

- [ ] **Step 3: Create LICENSE**

```bash
curl -sfo LICENSE https://www.apache.org/licenses/LICENSE-2.0.txt
head -2 LICENSE
```

Expected: the first lines contain `Apache License`.

- [ ] **Step 4: Verify the gates still pass with the publish form**

```bash
pnpm build:packages
pnpm lint:package
```

Expected: exit 0 for both. `lint:package` runs publint + attw against the packed tarball; from
now on it requires the build, which is why CI gains the build step in Task 6.

- [ ] **Step 5: Verify `pnpm pack` applies `publishConfig.exports` (spec verification gate)**

```bash
TMP=$(mktemp -d)
pnpm --filter @peakui/react pack --pack-destination "$TMP"
tar -xzf "$TMP"/peakui-react-0.0.0.tgz -O package/package.json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const p=JSON.parse(s);if(p.exports['.'].import!=='./dist/index.js'){console.error('FAIL: pack did not apply publishConfig.exports:',p.exports);process.exit(1)}console.log('ok: publishConfig.exports applied')})"
tar -tzf "$TMP"/peakui-react-0.0.0.tgz | grep -c '^package/src/' || echo 'ok: no src/ in tarball'
```

Expected: `ok: publishConfig.exports applied` and `ok: no src/ in tarball`. If the first check
fails, pnpm 12 does not apply `publishConfig.exports` on pack — stop and report; the spec's
fallback is a `prepack` script that rewrites the manifest, and the spec owner must be told.

- [ ] **Step 6: Commit**

```bash
git add packages/react/package.json packages/styles/package.json LICENSE
git commit -m "chore(packages): publish-ready manifests and Apache-2.0 license"
```

### Task 2: Changesets infrastructure

**Files:**
- Modify: `package.json` (root, via pnpm add)
- Create: `.changeset/config.json`
- Create: `.changeset/README.md`

**Interfaces:**
- Consumes: Task 1 manifests (`access: public` must exist in package manifests — changesets
  reads it too).
- Produces: `.changeset/` with the config every workflow step assumes: `fixed` lockstep of the
  publishable pair, changelog-github, `baseBranch: main`, ignore list of the five private
  packages.

- [ ] **Step 1: Install**

```bash
pnpm add -D -w @changesets/cli @changesets/changelog-github
```

- [ ] **Step 2: Create `.changeset/config.json`**

```json
{
  "fixed": ["@peakui/react", "@peakui/styles"],
  "linked": [],
  "ignore": [
    "@peakui/standard",
    "@peakui/testing",
    "@peakui/docs",
    "@peakui/storybook",
    "@peakui/evals"
  ],
  "updateInternalDependencies": "patch",
  "changelog": ["@changesets/changelog-github", { "repo": "peakui-dev/peakui" }],
  "access": "public",
  "commit": false,
  "baseBranch": "main"
}
```

- [ ] **Step 3: Create `.changeset/README.md`**

```md
# Changesets

Each `*.md` file here (except this README) is a pending release entry consumed by
`@changesets/cli`. The routine that creates them is owned by the `changeset-release` skill:
`.agents/skills/changeset-release/SKILL.md`.
```

- [ ] **Step 4: Verify**

```bash
pnpm changeset status
pnpm format
```

Expected: `changeset status` exits 0; prettier passes (run `pnpm format:fix` first if it flags
the new JSON).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .changeset/config.json .changeset/README.md
git commit -m "chore: changesets infrastructure"
```

### Task 3: `scripts/sync-versions.mjs` — keep the styles version const truthful

**Files:**
- Create: `scripts/sync-versions.mjs`
- Test: `scripts/sync-versions.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `renderVersionConst(source: string, version: string): string` — exported, throws if
  the const line is missing. The CLI entry rewrites
  `packages/styles/src/index.ts`'s `export const version = "…"` from the package manifest. The
  release workflow's version step calls `node scripts/sync-versions.mjs` (Task 6).

- [ ] **Step 1: Write the failing test** — `scripts/sync-versions.test.mjs`

```js
import {strict as assert} from "node:assert";
import {test} from "node:test";

import {renderVersionConst} from "./sync-versions.mjs";

test("renderVersionConst swaps the version in place", () => {
  const source = 'export {cn} from "tailwind-variants";\nexport const version = "0.0.0";\n';

  assert.equal(
    renderVersionConst(source, "0.0.1"),
    'export {cn} from "tailwind-variants";\nexport const version = "0.0.1";\n',
  );
});

test("renderVersionConst refuses a source without the const", () => {
  assert.throws(() => renderVersionConst("export {};\n", "0.0.1"), /version/);
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `node --test scripts/sync-versions.test.mjs`
Expected: FAIL — cannot resolve `./sync-versions.mjs`.

- [ ] **Step 3: Implement** — `scripts/sync-versions.mjs`

```js
import {readFileSync, writeFileSync} from "node:fs";
import {join} from "node:path";

/*
 * The exported `version` const of @peakui/styles is public API; this copies the manifest
 * version into it. Runs as part of the changesets `version` step, so the Version Packages PR
 * always carries a truthful constant.
 */

const CONST = /^export const version = ".*";$/m;

export function renderVersionConst(source, version) {
  if (!CONST.test(source)) {
    throw new Error('packages/styles/src/index.ts: `export const version = "…"` line not found');
  }

  return source.replace(CONST, `export const version = "${version}";`);
}

function main() {
  const manifest = JSON.parse(readFileSync(join("packages", "styles", "package.json"), "utf8"));
  const file = join("packages", "styles", "src", "index.ts");
  const updated = renderVersionConst(readFileSync(file, "utf8"), manifest.version);

  writeFileSync(file, updated);
  console.log(`sync-versions: @peakui/styles version const -> ${manifest.version}`);
}

if (process.argv[1]?.endsWith("sync-versions.mjs")) {
  main();
}
```

- [ ] **Step 4: Run the test to make sure it passes**

Run: `node --test scripts/sync-versions.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Verify the CLI entry is a no-op on the current tree**

Run: `node scripts/sync-versions.mjs && git diff --stat packages/styles/src/index.ts`
Expected: `sync-versions: @peakui/styles version const -> 0.0.0`, then an empty diff (the const
already says `0.0.0`).

- [ ] **Step 6: Commit**

```bash
git add scripts/sync-versions.mjs scripts/sync-versions.test.mjs
git commit -m "feat(scripts): sync the styles version const with its manifest"
```

### Task 4: `scripts/publish-release.mjs` — pure helpers

**Files:**
- Create: `scripts/publish-release.mjs` (helpers + stub main)
- Test: `scripts/publish-release.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces (exported, used by Task 5's main and the tests):
  - `PACKAGES: Array<{name: string, dir: string}>`
  - `pendingChangesets(filenames: string[]): boolean`
  - `tarballName(pkgName: string, version: string): string`
  - `extractChangelogSection(markdown: string, version: string): string | null`
  - `releaseNotes(sections: Record<string, string | null>): string`
  - `lockstepError(versions: Record<string, string>): Error | null`

- [ ] **Step 1: Write the failing tests** — `scripts/publish-release.test.mjs`

```js
import {strict as assert} from "node:assert";
import {test} from "node:test";

import {
  extractChangelogSection,
  lockstepError,
  pendingChangesets,
  releaseNotes,
  tarballName,
} from "./publish-release.mjs";

test("pendingChangesets ignores the README and non-markdown files", () => {
  assert.equal(pendingChangesets(["README.md", "config.json"]), false);
  assert.equal(pendingChangesets(["README.md", "config.json", "brave-pandas-run.md"]), true);
});

test("tarballName flattens the scope the way npm does", () => {
  assert.equal(tarballName("@peakui/react", "0.0.1"), "peakui-react-0.0.1.tgz");
});

test("extractChangelogSection returns the section body for the version", () => {
  const md = "# @peakui/react\n\n## 0.0.2\n\nsecond\n\n## 0.0.1\n\nfirst\n- item\n";

  assert.equal(extractChangelogSection(md, "0.0.1"), "first\n- item");
  assert.equal(extractChangelogSection(md, "0.0.2"), "second");
  assert.equal(extractChangelogSection(md, "9.9.9"), null);
});

test("releaseNotes keeps only packages that have a section", () => {
  const notes = releaseNotes({"@peakui/react": "react changes", "@peakui/styles": null});

  assert.equal(notes, "## @peakui/react\n\nreact changes");
});

test("lockstepError passes on matching versions and reports drift", () => {
  assert.equal(lockstepError({"@peakui/react": "0.0.1", "@peakui/styles": "0.0.1"}), null);
  assert.match(
    String(lockstepError({"@peakui/react": "0.0.2", "@peakui/styles": "0.0.1"})),
    /lockstep/,
  );
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `node --test scripts/publish-release.test.mjs`
Expected: FAIL — cannot resolve `./publish-release.mjs`.

- [ ] **Step 3: Implement the module with a stub main** — `scripts/publish-release.mjs`

```js
import {spawnSync} from "node:child_process";

/*
 * Release publisher. Runs in CI (release.yml) on every push to main:
 *  - pending changesets -> the changesets action only tends the Version Packages PR;
 *  - versions bumped and no v<version> tag yet -> pack, npm publish, tag, GitHub Release.
 * `--dry-run` rehearses everything except the upload and the tag/release creation.
 */

export const PACKAGES = [
  {name: "@peakui/react", dir: "packages/react"},
  {name: "@peakui/styles", dir: "packages/styles"},
];

export function pendingChangesets(filenames) {
  return filenames.some((file) => file.endsWith(".md") && file !== "README.md");
}

export function tarballName(pkgName, version) {
  return `${pkgName.replace(/^@/, "").replace("/", "-")}-${version}.tgz`;
}

export function extractChangelogSection(markdown, version) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((line) => line === `## ${version}`);

  if (start === -1) {
    return null;
  }

  const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));

  return lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();
}

export function releaseNotes(sections) {
  return Object.entries(sections)
    .filter(([, body]) => body !== null)
    .map(([pkg, body]) => `## ${pkg}\n\n${body}`)
    .join("\n\n");
}

export function lockstepError(versions) {
  if (new Set(Object.values(versions)).size > 1) {
    return new Error(`lockstep violated: ${JSON.stringify(versions)} — fix before publishing`);
  }

  return null;
}

export function run(command, args) {
  const result = spawnSync(command, args, {encoding: "utf8", stdio: "inherit"});

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with ${result.status}`);
  }
}

function main() {
  throw new Error("not implemented yet");
}

if (process.argv[1]?.endsWith("publish-release.mjs")) {
  main();
}
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `node --test scripts/publish-release.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/publish-release.mjs scripts/publish-release.test.mjs
git commit -m "feat(scripts): release publisher helpers"
```

### Task 5: `scripts/publish-release.mjs` — orchestration

**Files:**
- Modify: `scripts/publish-release.mjs` (replace the stub `main`)

**Interfaces:**
- Consumes: Task 4 exports; Task 1 publish manifests; Task 2 `.changeset/`.
- Produces: the CLI that `release.yml` invokes — exit 0 with no side effects when there is
  nothing to publish; on a real release: `pnpm pack` per package, `npm publish <tarball>
  --access public [--provenance|--dry-run]`, lightweight tag `v<version>` pushed to origin,
  `gh release create` with combined changelog notes.

- [ ] **Step 1: Replace the stub `main` in `scripts/publish-release.mjs`**

Add these imports at the top (merging with the existing `spawnSync` import):

```js
import {mkdirSync, readdirSync, readFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
```

Replace `function main() { throw new Error("not implemented yet"); }` with:

```js
function tagExists(tag) {
  return spawnSync("git", ["tag", "-l", tag], {encoding: "utf8"}).stdout.trim() !== "";
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  if (pendingChangesets(readdirSync(".changeset"))) {
    console.log("pending changesets — the Version Packages PR is being maintained, nothing to publish");

    return;
  }

  const manifests = PACKAGES.map((pkg) => ({
    ...pkg,
    version: JSON.parse(readFileSync(join(pkg.dir, "package.json"), "utf8")).version,
  }));
  const versions = Object.fromEntries(manifests.map((pkg) => [pkg.name, pkg.version]));
  const error = lockstepError(versions);

  if (error) {
    throw error;
  }

  const version = manifests[0].version;
  const tag = `v${version}`;

  if (tagExists(tag)) {
    console.log(`${tag} already exists — nothing to publish`);

    return;
  }

  const packDir = join(tmpdir(), "peakui-release");

  mkdirSync(packDir, {recursive: true});

  for (const {name} of manifests) {
    run("pnpm", ["--filter", name, "pack", "--pack-destination", packDir]);
    run("npm", [
      "publish",
      join(packDir, tarballName(name, version)),
      "--access",
      "public",
      ...(dryRun ? ["--dry-run"] : ["--provenance"]),
    ]);
  }

  if (dryRun) {
    console.log(`dry run — ${tag} would now be tagged and the GitHub Release created`);

    return;
  }

  run("git", ["tag", tag]);
  run("git", ["push", "origin", tag]);

  const sections = Object.fromEntries(
    manifests.map(({name, dir}) => [
      name,
      extractChangelogSection(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), version),
    ]),
  );

  run("gh", ["release", "create", tag, "--title", tag, "--notes", releaseNotes(sections)]);
}
```

Notes baked into the design: tarball publish via the npm CLI is the proven OIDC path (pnpm's own
publish does not support trusted publishing); `--provenance` only on real publishes (npm publish
`--dry-run` must not need OIDC); `gh` authenticates through `GH_TOKEN` set by the workflow step.

- [ ] **Step 2: Unit tests still green**

Run: `node --test scripts/publish-release.test.mjs`
Expected: PASS (5 tests) — helpers untouched.

- [ ] **Step 3: Local dry-run rehearsal of the full publish path**

```bash
pnpm build:packages
node scripts/publish-release.mjs --dry-run
```

Expected output, in order: two `pnpm pack` tarball listings (0.0.0), two `npm publish --dry-run`
summaries, then `dry run — v0.0.0 would now be tagged and the GitHub Release created`. No tag, no
release, nothing uploaded. (`.changeset/` holds only `README.md` and `config.json`, so the
pending-changesets branch is skipped — that path is covered by Task 10's live run.)

- [ ] **Step 4: Commit**

```bash
git add scripts/publish-release.mjs
git commit -m "feat(scripts): release publisher orchestration"
```

### Task 6: Workflows — `release.yml` and the `ci.yml` build step

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `.github/workflows/ci.yml` (verify job)

**Interfaces:**
- Consumes: Task 3 `sync-versions.mjs`, Task 5 `publish-release.mjs`, Task 2 `.changeset/`.
- Produces: the automation the skill text (Task 8) and AGENTS.md (Task 9) describe — on push to
  `main`, `changesets/action` runs the version command and, when no changesets remain, the
  publish command; `workflow_dispatch` exposes `dry_run`.

- [ ] **Step 1: Create `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      dry_run:
        description: "Rehearse the publish without uploading or tagging"
        required: false
        type: boolean
        default: false

jobs:
  release:
    runs-on: ubuntu-latest
    environment: npm-publish
    timeout-minutes: 30
    permissions:
      contents: write
      id-token: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build:packages

      # Trusted publishing needs npm >= 11.5; the version bundled with node 24 is not pinned.
      - run: npm install -g npm@11

      - name: Version or publish
        uses: changesets/action@v1
        with:
          version: pnpm changeset version && node scripts/sync-versions.mjs && pnpm install --lockfile-only
          publish: node scripts/publish-release.mjs ${{ inputs.dry_run && '--dry-run' || '' }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Add the build step to `ci.yml`**

In the `verify` job, insert between the `check:tokens` step and the `lint:package` step:

```yaml
      # The package gates validate the dist-based publish form (publishConfig), so the build
      # must exist before they pack.
      - run: pnpm build:packages
```

- [ ] **Step 3: Verify YAML and repo hygiene**

```bash
pnpm format
node --test "scripts/**/*.test.mjs"
```

Expected: prettier passes on the new workflow (run `pnpm format:fix` first if it reflows the
YAML), all script tests pass.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/release.yml .github/workflows/ci.yml
git commit -m "ci: release workflow and build before package gates"
```

### Task 7: Docs — the Releases section

**Files:**
- Create: `apps/docs/content/docs/en/react/releases/meta.json`
- Create: `apps/docs/content/docs/en/react/releases/index.mdx`
- Modify: `apps/docs/content/docs/en/react/meta.json`

**Interfaces:**
- Consumes: nothing.
- Produces: the `/docs/react/releases` route. Task 10 adds `v0-0-1.mdx` and prepends the index
  entry; Task 8's skill section documents that duty.

- [ ] **Step 1: Create `releases/meta.json`**

```json
{
  "title": "Releases",
  "description": "PeakUI Release Notes",
  "icon": "rocket",
  "root": true,
  "pages": ["index"]
}
```

- [ ] **Step 2: Create `releases/index.mdx`**

```mdx
---
title: All Releases
description: Every PeakUI release — new features, fixes, and breaking changes.
---

PeakUI publishes `@peakui/react` and `@peakui/styles` in lockstep: one release, one version
number, notes for both packages.

The first public release is on its way. Until it lands, the changelog lives in each package's
`CHANGELOG.md` and on the
[GitHub Releases page](https://github.com/peakui-dev/peakui/releases).
```

- [ ] **Step 3: Add the section to the nav** — `apps/docs/content/docs/en/react/meta.json`

```json
{
  "title": "Documentation",
  "description": "PeakUI Documentation",
  "pages": ["getting-started", "components", "releases"]
}
```

- [ ] **Step 4: Verify the docs build**

```bash
NEXT_PUBLIC_SITE_URL=https://docs.ci.invalid pnpm build:docs
```

Expected: `next build` succeeds, route `/docs/react/releases` is generated (visible in the
prerender list).

- [ ] **Step 5: Commit**

```bash
git add apps/docs/content/docs/en/react/releases apps/docs/content/docs/en/react/meta.json
git commit -m "feat(docs): releases section"
```

### Task 8: Update the `changeset-release` skill

**Files:**
- Modify: `.agents/skills/changeset-release/SKILL.md`
- Modify: `.agents/skills/changeset-release/packages.md`

**Interfaces:**
- Consumes: Tasks 5–7 (the automation and docs section being documented).
- Produces: the canonical release routine for humans and agents — including the docs-page duty
  Task 10 performs.

- [ ] **Step 1: Fix the stale branch name in `SKILL.md`**

Replace the three commands in "Step 1: Analyze changes" (`git diff master --stat`,
`git diff master --name-only`, `git log master..HEAD --oneline`) with their `main` equivalents,
and in "Step 6" the phrase `merge to master` becomes `merge to main`.

- [ ] **Step 2: Append two English sections to `SKILL.md`** (after "## Constraints", before
  "## Additional resources")

```md
## Automated half (CI)

The `Release` workflow (`.github/workflows/release.yml`) owns everything after the changeset
lands:

- Every push to `main` keeps the **Version Packages** PR up to date (bot branch
  `changeset-release/main`). It carries the version bumps, both `CHANGELOG.md` files, the
  styles version const, and the lockfile.
- Merging that PR is the release: `scripts/publish-release.mjs` packs and publishes both
  packages to npm (OIDC trusted publishing), pushes tag `v<version>`, and creates the GitHub
  Release from the changelogs.
- The `dry_run` workflow input rehearses a publish without uploading or tagging.

## Docs release page

Every release writes a page under `apps/docs/content/docs/en/react/releases/`:

1. Create `v<x-y-z>.mdx` (dots become dashes: `v0-0-1.mdx`) — an English summary of what
   shipped, the install command, and a link to the GitHub Release.
2. Prepend the release to `index.mdx` and to the `pages` list in the section's `meta.json`.
```

- [ ] **Step 3: Fix the stale package claim in `packages.md`**

Delete the two sentences `` `@peakui/react` does not exist yet; it arrives with the core. Read
the version from the package's own `package.json` — a number copied here goes stale on the next
release. `` and keep only the second half as a single line: `Read a package's version from its
own package.json — a number copied here goes stale on the next release.` (both publishable
packages already exist; the file is English content, so this is a fact fix, not a translation).

- [ ] **Step 4: Verify**

```bash
pnpm test:ai
pnpm format
```

Expected: all pass (`skill-rules.test.mjs` gates the component-standards skill, not this one).

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/changeset-release/SKILL.md .agents/skills/changeset-release/packages.md
git commit -m "docs(skill): changeset-release meets the automated pipeline"
```

### Task 9: Agent file and ecosystem contract

**Files:**
- Modify: `peakui/AGENTS.md` (insert a `## Releases` section immediately before `## Architecture`)
- Modify: `peakui/CLAUDE.md` (byte-identical copy of AGENTS.md)
- Modify: `peakui-company/docs/ecosystem/conventions.md` (one sentence)

**Interfaces:**
- Consumes: everything above.
- Produces: the documented contract — agents landing in the repo learn the release flow without
  reading the spec; the ecosystem stops claiming Nexus publishing.

- [ ] **Step 1: Insert into `peakui/AGENTS.md`** before the `## Architecture` heading:

```md
## Releases

Publishing runs through changesets. Every PR touching a publishable package lands with a
`.changeset/*.md` file — `.agents/skills/changeset-release/` owns the routine.

The `Release` workflow tends a **Version Packages** PR on every push to `main`; merging it is
the release: npm publish (OIDC trusted publishing via the `npm-publish` environment), tag
`v<version>`, GitHub Release, and a hand-written notes page under
`apps/docs/content/docs/en/react/releases/`. Rehearse safely with the workflow's `dry_run`
input.

Design and decisions: `docs/superpowers/specs/2026-10-12-release-pipeline-design.md`.
```

- [ ] **Step 2: Sync the copy and verify byte-identity**

```bash
cp AGENTS.md CLAUDE.md
cmp AGENTS.md CLAUDE.md && echo identical
```

Expected: `identical`.

- [ ] **Step 3: Fix the publishing target in the company contract**

In `peakui-company/docs/ecosystem/conventions.md`, replace the sentence
`Публикация — в закрытый Nexus-неймспейс.` with
`Публикация — в публичную npm-организацию \`peakui\` (npmjs.com), доступ public; CI
аутентифицируется trusted publishing через GitHub environment \`npm-publish\`.`

- [ ] **Step 4: Verify**

```bash
cd ../ && node scripts/check-agents-sync.mjs && cd peakui
```

Expected: sync check passes (the company AGENTS.md is untouched by this task).

- [ ] **Step 5: Commit — peakui first, then the company repo**

```bash
git add AGENTS.md CLAUDE.md
git commit -m "docs: releases section in the agent file"
cd .. && git add docs/ecosystem/conventions.md && git commit -m "docs(ecosystem): point package publishing at the public npm org" && cd peakui
```

Note: the company repo has unrelated dirty files (`AGENTS.md`, `CLAUDE.md`, `.gitignore`,
`docs/ecosystem/harness.md`, screenshots) — stage `conventions.md` only.

### Task 10: First release rehearsal and 0.0.1 (operational)

**Files:**
- Create: `.changeset/tidy-orbits-listen.md` (the first changeset)
- Create: `apps/docs/content/docs/en/react/releases/v0-0-1.mdx` (at release time)
- Modify: `apps/docs/content/docs/en/react/releases/index.mdx`, `releases/meta.json` (prepend)

**Interfaces:**
- Consumes: the whole pipeline from Tasks 1–9.
- Produces: `@peakui/react@0.0.1` and `@peakui/styles@0.0.1` on npm, tag `v0.0.1`, its GitHub
  Release, and the docs page.

**Owner gate before any live publish:** trusted publishing must be configured on npmjs for both
packages (repository `peakui-dev/peakui`, workflow `release.yml`, environment `npm-publish`) and
the GitHub environment `npm-publish` must exist. The 13 commits `main` is ahead of origin must be
pushed. If the npm UI refuses to pre-register trusted publishers for not-yet-existing packages,
the contingency is one manual first publish with a granular token, then the trusted publisher is
attached for subsequent releases.

- [ ] **Step 1: Land the branch** — push the work as `feat/release-pipeline`, open the PR with
  `gh pr create`, let `CI` go green, merge to `main`.

- [ ] **Step 2: Create the first changeset** — `.changeset/tidy-orbits-listen.md`

```md
---
"@peakui/react": patch
"@peakui/styles": patch
---

Initial public release of `@peakui/react` and `@peakui/styles`.
```

Commit it directly on a small PR (`chore: changeset for the initial public release`), merge.

- [ ] **Step 3: Dry-run dispatch**

```bash
gh workflow run release.yml -f dry_run=true
gh run watch
```

Expected: the job ends green; the publish step logs both `pnpm pack` tarballs and both
`npm publish --dry-run` summaries, then `dry run — v0.0.1 would now be tagged…` (the bot has
meanwhile opened the **Version Packages** PR bumping both packages to 0.0.1).

- [ ] **Step 4: Release** — merge the Version Packages PR. Watch the run: publish, tag `v0.0.1`,
  GitHub Release with combined notes. Verify: both packages visible on npmjs with provenance,
  `https://github.com/peakui-dev/peakui/releases/tag/v0.0.1` exists.

- [ ] **Step 5: Docs page** — create `releases/v0-0-1.mdx`:

````mdx
---
title: v0.0.1
description: Initial public release of @peakui/react and @peakui/styles.
---

**October 2026**

First public release. Both packages publish in lockstep from the npm organization
[`peakui`](https://www.npmjs.com/org/peakui).

## Installing

```bash
npm install @peakui/react @peakui/styles
```

## What shipped

The component set registered in the docs index, the design-token layer, and the default theme —
summarize from the v0.0.1 changelog before committing this page.

## Full changelog

[v0.0.1 on GitHub](https://github.com/peakui-dev/peakui/releases/tag/v0.0.1).
````

Prepend the release to `releases/index.mdx` (replace the "first public release is on its way"
paragraph) and put `"v0-0-1"` after `"index"` in `releases/meta.json`. Verify with
`NEXT_PUBLIC_SITE_URL=https://docs.ci.invalid pnpm build:docs`, commit
(`feat(docs): v0.0.1 release notes`), merge via PR.

---

## Self-Review

**Spec coverage:** Decisions table → Tasks 1–2 (manifests, changesets, license) and the trunk
model (Task 6 + Task 8 skill text); published-packages table → Tasks 1–2; manifest section
(including the verification gate and styles sideEffects/version const) → Tasks 1, 3; changesets
config → Task 2; release workflow incl. dry-run and publish script semantics → Tasks 4–6;
ci.yml build step → Task 6; docs pages and nav → Task 7 (scaffold) + Task 10 (first page);
skill update → Task 8; conventions.md + AGENTS.md → Task 9; owner setup + first release runbook
→ Task 10. Out-of-scope items (docs deployment, codemodes) intentionally have no tasks.

**Placeholder scan:** no TBDs; every code step carries its code; the only deliberately
unfinalized text is the v0.0.1 "what shipped" summary, which by definition is written from the
release-time changelog (Task 10 step 5 says so explicitly).

**Type consistency:** helper names and signatures match between Tasks 4, 5 and their tests;
`PACKAGES` entries `{name, dir}` are the shape `main()` destructures; workflow invokes
`scripts/sync-versions.mjs` and `scripts/publish-release.mjs` exactly as Tasks 3 and 5 create
them.
