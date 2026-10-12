# Release Pipeline — GitHub Releases, public npm, and a Releases page in the docs

`peakui` has CI but no release machinery: versions sit at `0.0.0`, there is no `.changeset/`
directory, no release workflow, no LICENSE, and the docs have no Releases section. The ecosystem
contract (`docs/ecosystem/conventions.md` in `peakui-company`) already mandates changesets, and the
skill `.agents/skills/changeset-release/` already describes the daily changeset routine — both are
designed but not implemented.

This spec defines the whole pipeline: version management, npm publishing, GitHub Releases, the
manual Releases page in `apps/docs`, and the CI that ties them together.

## Decisions (locked with the owner)

| Question | Decision |
| --- | --- |
| Branching model | Trunk-based. Feature PRs merge to `main` freely and publish nothing. The bot-maintained **Version Packages PR** is the single manual release action: merging it publishes to npm, tags, and creates the GitHub Release. |
| Version management | Changesets, `@peakui/react` and `@peakui/styles` in lockstep (`fixed`). First release **0.0.1**. |
| npm target | Public organization `peakui` on npmjs.com, `--access public` for every package. |
| CI → npm authentication | OIDC trusted publishing (npm ≥ 11.5, GitHub environment `npm-publish`, no long-lived tokens). Same pattern as `heroui/.github/workflows/release.yml`. |
| Docs Releases page | Hand-written MDX per release plus an index page, following `heroui/apps/docs/content/docs/en/react/releases/`. Not generated. |
| License | **Apache-2.0** (matches heroui; explicit patent grant suits a company building a commercial ecosystem on top). *The owner is still deciding between Apache-2.0 and MIT — flip at spec review if MIT wins; the swap is one LICENSE file plus one `license` field.* |
| Docs deployment | Out of scope: `peakui.dev` is not live. Recorded intent: deploy from release tags (`v*`), never from `main`, so docs always match the published version. |

## Published packages

| Package | Publishes | Form |
| --- | --- | --- |
| `@peakui/react` | yes | Built `dist/` (tsdown, unbundled ESM + dts) via `publishConfig` |
| `@peakui/styles` | yes | As-is: committed generated CSS + TS source (precedent: `@heroui/styles` ships `src`) |
| `@peakui/standard`, `@peakui/testing`, `@peakui/docs`, `@peakui/storybook` | never | `private: true`, listed in changesets `ignore` |

## Manifest changes

### `packages/react/package.json`

Dev behavior does not change: in-repo `exports` keep pointing at `./src/*.ts` so docs, storybook
and evals consume source without a build step. `files` is a pack-only field, so it can point at
`dist` without affecting workspace resolution:

```jsonc
{
  "files": ["dist", "THIRD-PARTY-NOTICES.md"],
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
  },
  "repository": { "type": "git", "url": "https://github.com/peakui-dev/peakui.git", "directory": "packages/react" },
  "license": "Apache-2.0"
}
```

`pnpm pack`/`pnpm publish` applies `publishConfig` over the manifest and rewrites the
`@peakui/styles: workspace:*` dependency into a real range. The `lint:package` gate (publint
`--strict`, `attw --pack`) packs with `publishConfig` applied, so it validates the published shape —
provided `dist` exists, which is why CI gains a build step before it (see *CI changes*).

**Verification gate (implementation, not trust):** after wiring, run `pnpm pack` in
`packages/react` locally and inspect `package.json` inside the tarball — confirm `exports` is the
dist form. If pnpm 12 turns out not to apply `publishConfig.exports` on pack, fall back to a
`prepack` script that rewrites the manifest; the dry-run rehearsal (below) catches this before any
live publish.

### `packages/styles/package.json`

- `sideEffects: false` → `["**/*.css"]` — otherwise bundlers may tree-shake CSS imports away
  (the `@heroui/styles` manifest does the same).
- `publishConfig: {"access": "public"}`, `repository`, `license` — same as react.
- `files` and `exports` stay as they are.

### `packages/styles/src/index.ts`

The exported `const version = "0.0.0"` must not lie. New script `scripts/sync-versions.mjs` copies
the package version into that constant; it runs in the changesets `version` step and is unit-tested
in the `test:ai` pattern (`scripts/sync-versions.test.mjs`).

### Repository root

`LICENSE` (Apache-2.0 full text). No `license` field in the private packages — npm never sees them.

## Changesets

- `@changesets/cli` and `@changesets/changelog-github` as root devDependencies.
- `.changeset/config.json`:

```jsonc
{
  "fixed": ["@peakui/react", "@peakui/styles"],
  "linked": [],
  "ignore": ["@peakui/standard", "@peakui/testing", "@peakui/docs", "@peakui/storybook"],
  "updateInternalDependencies": "patch",
  "changelog": ["@changesets/changelog-github", { "repo": "peakui-dev/peakui" }],
  "access": "public",
  "commit": false,
  "baseBranch": "main"
}
```

- Daily routine: unchanged from `.agents/skills/changeset-release/SKILL.md` — a `.changeset/*.md`
  file lands with every PR that touches a publishable package.
- The skill gets a factual fix (`master` → `main`) and a new English section describing the
  automated half (Version Packages PR, what release.yml does) plus the docs-page step below.
  Existing Russian content is legacy and stays untouched.

## Release workflow — `.github/workflows/release.yml`

Triggers: `push` to `main`, and `workflow_dispatch` with a `dry_run` boolean input (rehearsal and
manual override). One job:

```yaml
release:
  runs-on: ubuntu-latest
  environment: npm-publish
  permissions:
    contents: write
    id-token: write
```

Steps: checkout (`fetch-depth: 0`) → pnpm + node 24 → `pnpm install --frozen-lockfile` →
`pnpm build:packages` → `npm install -g npm@11` (trusted publishing needs ≥ 11.5) →
`changesets/action` with:

- `version`: `pnpm changeset version && node scripts/sync-versions.mjs && pnpm install --lockfile-only`
  (the lockfile records workspace package versions, so it must follow the bump).
- `publish`: `node scripts/publish-release.mjs ${{ inputs.dry_run && '--dry-run' || '' }}`

The action opens/updates the **Version Packages PR** while changesets are pending, and runs the
publish command only when none are. That PR is ordinary: `ci.yml` gates it like any other.

### `scripts/publish-release.mjs`

New script, unit-tested via `test:ai` (parsing and decision logic factored into pure functions that
the tests drive; shell steps kept thin). Behavior:

1. If pending changesets exist → exit 0 (the bot is only tending the Version Packages PR).
2. Compare each publishable package's `version` against local git tags. Nothing new → exit 0
   (a docs-only merge to `main` publishes nothing).
3. For each package with a new version: `pnpm pack --pack-destination "$RUNNER_TEMP/release"` →
   `npm publish <tarball> --access public --provenance` (tarball publish via npm CLI is the proven
   OIDC path — pnpm's own publish does not support trusted publishing).
4. Create one combined tag `v<version>` (lockstep makes both versions identical) and push it.
5. Build release notes from `packages/*/CHANGELOG.md`: the sections for this version, each under a
   `## @peakui/<pkg>` header, then `gh release create v<version> --title v<version> --notes-file …`.
   One GitHub Release per version, like heroui's Releases page.
6. `--dry-run`: everything above except `npm publish` runs with `--dry-run`, and tag/release
   creation is skipped; the tarball's `package.json` is printed for inspection.

Tests and lint are **not** re-run in this job: `ci.yml` already gated the Version Packages PR; the
job's own protection is install + build.

## CI changes

`ci.yml` `verify` job: insert `pnpm build:packages` before `pnpm lint:package` — the package gates
now validate the dist-based publish form and need the build output.

## Docs — Releases pages (manual)

New section `apps/docs/content/docs/en/react/releases/`:

- `meta.json` — section title "Releases".
- `index.mdx` — "All Releases": latest version first, a one-paragraph human summary per release,
  date, link to the full notes page (the heroui pattern).
- `v0-0-1.mdx` … one page per release — route shape `/docs/react/releases/v0-0-1`, filename with
  dashes instead of dots (fumadocs route convention, as in heroui's `v3-0-0.mdx`).

Navigation: `apps/docs/content/docs/en/react/meta.json` pages list becomes
`["getting-started", "components", "releases"]`.

Writing the page is a release step owned by `.agents/skills/changeset-release/SKILL.md` (new
English section): after merging the Version Packages PR, write `v<x-y-z>.mdx` and prepend the
index entry.

## Contract and documentation updates

- `peakui-company/docs/ecosystem/conventions.md` — targeted meaning fix of the line
  «Публикация — в закрытый Nexus-неймспейс» → publication goes to the public npm organization
  `peakui` on npmjs.com with `access public`. The edit changes the fact, not the language; the
  file's pending translation pass is untouched.
- `peakui/AGENTS.md` (+ byte-identical copy to `CLAUDE.md`) — a short "Releases" section: how to
  add a changeset, what the Version Packages PR is, what `release.yml` does, where the docs page
  lives.

## Owner setup (outside the repository)

1. npmjs org `peakui` exists (registered).
2. Trusted publishers on npmjs for `@peakui/react` and `@peakui/styles`: repository
   `peakui-dev/peakui`, workflow filename `release.yml`, environment `npm-publish`. npm allows
   configuring a trusted publisher for a package name that does not exist yet; if the UI refuses,
   the contingency is one manual first publish with a granular token, then switch to trusted
   publishing for subsequent releases.
3. GitHub environment `npm-publish` on `peakui-dev/peakui` (protection optional while solo).
4. Push the 13 commits `main` is ahead of `origin/main`.

## First release runbook

1. Land this work; write the first changesets (patch on both packages → `0.0.1`).
2. Merge feature PRs; let the Version Packages PR accumulate.
3. `workflow_dispatch` `release.yml` with `dry_run: true` — inspect tarball manifests and the
   publish plan. This is the gate that validates `publishConfig` behavior end to end.
4. Merge the Version Packages PR → live publish → verify: npm pages show both packages with
   provenance, tag `v0.0.1` and its GitHub Release exist.
5. Write `releases/v0-0-1.mdx` and the index entry.

## Testing

- `scripts/publish-release.mjs` and `scripts/sync-versions.mjs`: unit tests in the `test:ai`
  pattern next to the existing `scripts/*.test.mjs`.
- Manifest shape: existing `lint:package` gates (publint, attw) against the packed publish form.
- Workflow: rehearsed via `dry_run` before the first live release; every subsequent release is the
  same code path.

## Out of scope

- Docs deployment (decision recorded above: from release tags when introduced).
- `@peakui/codemodes` (contract-mentioned, does not exist yet; first breaking API change is far).
- Provenance beyond npm's automatic attestation, npm star/2FA policy, publishing `evals`.
