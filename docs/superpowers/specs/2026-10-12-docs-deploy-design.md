# Docs Deployment — `apps/docs` on Cloudflare Workers

`peakui.dev` is not live: the docs run locally through `pnpm dev:docs`, and the client-facing
contract (`docs/ecosystem/docs-site-contract.md` in `peakui-company`) was validated against
`next build` + `next start` only. The release pipeline spec recorded "deploy docs from release
tags (`v*`), never from `main`" as an out-of-scope intention.

This spec defines the production deployment of the docs site to Cloudflare Workers and revises
that trigger decision: docs changes must ship without waiting for an npm release.

## Decisions (locked with the owner)

| Question | Decision |
| --- | --- |
| Platform | Cloudflare Workers, following the framework guide for Next.js |
| Adapter | **vinext** (Cloudflare's default path). `@opennextjs/cloudflare` is the documented fallback; switch criteria below. |
| Domain | `https://peakui.dev` as a custom domain on the Worker from the first deploy. `NEXT_PUBLIC_SITE_URL=https://peakui.dev` at build. |
| Trigger | Push to `main` + `workflow_dispatch`. **Supersedes** the tags-only decision in the release pipeline spec: docs-only changes (guides, fixes, demos) ship independently of npm releases; the Releases pages stay release-bound by content, not by deploy. No tag trigger: a tag's tree is already on `main` at release time. |
| Auth in CI | `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` GitHub secrets; deploy step runs the adapter's deploy command with these env vars. The token is custom-built, not the "Deploy Workers" template: Worker deploy **plus** zone cache purge, so the workflow can purge the edge after every deploy. |
| Previews | None. Solo development; verification is local dev, the blocking post-deploy smoke, and the live site. |

## Adapter

`vinext` is Cloudflare's recommended default: a Vite plugin reimplementing the Next.js API,
supporting `proxy.ts` (this app's Next 16 middleware), App Router, RSC and rewrites. Migration
is non-destructive — `npx vinext check` then `npx vinext init` inside `apps/docs` installs the
dependencies, generates the Vite + Workers configuration and adds `dev:vinext` / `build:vinext`
scripts while leaving `next dev` / `next build` untouched.

Known risk: vinext is in beta, and this app stresses two specific paths — `fumadocs-mdx`'s
`createMDX` plugin chain and `transpilePackages` over workspace source (`@peakui/react`,
`@peakui/styles` are consumed as TypeScript from `src/`). The first implementation task is a
spike gate that must pass before anything else is built on top (see *Fallback criteria*).

Local workflow does not change: content work stays on `pnpm dev:docs`. The generated
`dev:vinext` script stays for on-demand debugging against the target platform — no recurring
process is attached to it.

The install also wants `allowBuilds` entries in `pnpm-workspace.yaml` for toolchain packages
with postinstall scripts (wrangler, workerd and friends): pnpm silently skips their builds
under `--frozen-lockfile`, and the breakage surfaces only inside CI. Adding the entries is a
task in the plan, not an afterthought.

## Worker configuration

Whatever `vinext init` generates, the committed configuration must satisfy:

- Worker name `peakui-docs` (stable, referenced by the custom domain and the deploy workflow).
- `nodejs_compat` compatibility flag and a current compatibility date.
- Static assets bound per the adapter's layout; no KV/R2/D1 bindings — the site is build-output
  only.
- **The proxy must run before asset serving for negotiated paths.** Workers serves a matching
  static asset *without invoking the Worker* unless the assets binding says otherwise (for
  example `run_worker_first`): prerendered HTML must never bypass `proxy.ts` content
  negotiation. The smoke catches a violation; the configuration must prevent it.
- The compressed Worker script stays within the plan's script-size limit — asserted during the
  spike gate; the contingency is bundle trimming or the Workers paid plan.
- The generated files follow repo conventions (English comments, prettier-clean) and are
  committed.

## Deploy workflow — `.github/workflows/docs-deploy.yml`

- Triggers: `push` to `main`, `workflow_dispatch` (with an optional `base-url` input for the
  smoke, default `https://peakui.dev` — used for the pre-domain first deploy).
- `concurrency: docs-deploy` with `cancel-in-progress: false` — deploys serialize.
- Steps: checkout → pnpm setup (node 24, cache) → `pnpm install --frozen-lockfile` → build the
  docs app with `NEXT_PUBLIC_SITE_URL=https://peakui.dev` (the adapter's build script) → deploy
  with `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from secrets → **purge the zone's edge
  cache** (the contract's `s-maxage=3600` would otherwise keep serving the previous deploy's
  `llms-*` and `.md` bytes — cached by extension — for up to an hour, and the smoke would
  validate stale content) → run the contract smoke, **blocking**.
- If the smoke fails, the workflow attempts `wrangler rollback` (best effort,
  `continue-on-error`) and goes red. The accepted runbook beyond that is fix-forward: revert on
  `main`, the next push redeploys.
- Deploys trust that `main` is gated by `CI` through PRs; a direct push to `main` deploys
  unverified. Branch protection on `main` is the stated assumption, not something this
  workflow enforces.

## Contract preservation — `apps/docs/scripts/verify-site-contract.mjs`

The site's contract was validated on `next start`; Workers is a different host. The smoke
script (plain Node, no new dependencies, base URL as an argument) re-checks the
load-bearing promises from `docs-site-contract.md` against any environment (localhost or
production):

- Content negotiation: a docs page URL returns HTML to `Accept: text/html` and markdown to
  `Accept: text/markdown` — both representations correct, never cross-served; the site root `/`
  negotiates too. Markdown responses carry `Vary: Accept`. `HEAD` answers like `GET` without a
  body for `.md` URLs and negotiated requests.
- `<page>.md` and the `.mdx` alias return `text/markdown` with the page's markdown — with and
  without the `/en` prefix (`200`, no redirect on the unprefixed form).
- All three of `/llms.txt`, `/llms-components.txt`, `/llms-patterns.txt` return
  `text/plain; charset=utf-8`.
- `/api/components` returns JSON with the documented shape.
- Machine routes carry `X-Robots-Tag: noindex, nofollow` and
  `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- All three documented 404 shapes: an unknown `<page>.md`/`.mdx` (any prefix) answers `404`
  with an empty body and no `Content-Type`; any unknown path with `Accept: text/markdown`
  answers the `# Not Found` markdown body; an unknown path without the header redirects to the
  `/en`-prefixed form (307 outside `/docs`, 308 inside) which serves the HTML 404.

Run locally after a vinext build (`wrangler dev`/adapter preview) and in the deploy workflow
after every production deploy. If the Workers host violates a promise the script catches it
before clients do; fixing it (cache rules, headers in the Worker) is then in-scope work, not a
contract breach discovered late.

## Fallback criteria — switching to `@opennextjs/cloudflare`

Switch without redesigning workflow, auth or domain if any of these holds after a bounded
fixing attempt:

1. `vinext check` reports incompatibilities it cannot resolve,
2. the vinext build fails on `fumadocs-mdx` or `transpilePackages` with no workaround,
3. the smoke fails on a host-level behavior (negotiation, headers, caching) that vinext cannot
   express and a Worker-level fix cannot cover.

Workflow, secrets, domain and the smoke script are adapter-agnostic; only the build/deploy
steps change.

## Owner setup (outside the repository)

1. Cloudflare API token with permissions for Worker deploy **and** zone cache purge; add as
   `CLOUDFLARE_API_TOKEN` secret on `peakui-dev/peakui`; add `CLOUDFLARE_ACCOUNT_ID`.
2. `peakui.dev` zone in Cloudflare (DNS moved to Cloudflare if not yet).
3. First deploy via the workflow's manual dispatch with `base-url` pointed at the Worker's
   `workers.dev` URL — this dispatch also creates the Worker.
4. Attach the custom domain `peakui.dev` to the now-existing `peakui-docs` Worker (custom
   domains require an existing Worker; certificate provisioning takes a moment), dispatch
   again, watch the smoke against `peakui.dev`.

## Documentation updates

- `peakui/AGENTS.md` (+ byte-identical `CLAUDE.md`), Docs app section: production hosting is
  Cloudflare Workers (`peakui-docs`) via vinext; rewrite the "until `https://peakui.dev` is
  live" line; mention the smoke script.
- `peakui-company/docs/ecosystem/docs-site-contract.md`: note that the contract is re-validated
  on the Workers deployment by the smoke script after every deploy.
- Release pipeline spec decision table: the docs-deployment row now points here (trigger:
  `main` + manual dispatch, not release tags).

## Testing

- Spike gate: `vinext check` + local `build:vinext` + `wrangler dev` + smoke on localhost —
  pass before the workflow is wired.
- `ci.yml`'s verify job runs the vinext docs build in addition to the classic one: a PR that
  breaks only `build:vinext` must not merge green and strand `main` undeployable.
- `verify-site-contract.mjs` keeps its logic in pure, unit-tested helpers (the URL/check
  matrix); the HTTP layer stays a thin shell.
- Existing suites (`agent-markdown.test.ts`, docs app vitest) keep passing; `pnpm build:docs`
  (classic Next build) stays. The two build paths are maintained deliberately, without a
  sunset: the classic build feeds dev workflows and the OpenNext fallback, the vinext build
  feeds production.

## Out of scope

- PR preview environments.
- Analytics, rate limiting, WAF rules.
- Cache tuning beyond what the contract requires.
- Redirect policy between `www.peakui.dev` / apex — `peakui.dev` is the single documented host.
