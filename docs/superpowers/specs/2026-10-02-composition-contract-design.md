# Composition Contract — the public styling surface of `@peakui/styles`

PeakUI promises what the reference calls **Framework-Agnostic Styles**: a consumer on Vue, Svelte or
plain HTML can use the design system without React. Today that promise has no surface behind it.
`packages/styles/src/index.ts` is `export const version = "0.0.0"` and nothing else, the package
exports only CSS paths, and no component's variant function exists.

This spec defines that surface, proves it with one real component's style layer, and writes the
resulting contract into `peakui-component-standards` so every later component inherits it.

## Task

Three gaps, found by auditing the skill against
`heroui/apps/docs/content/docs/en/react/getting-started/(handbook)/composition.mdx`:

1. **No JS surface.** `*Variants` functions, `tv`, `cn` and `VariantProps` are not exported from
   `@peakui/styles`, and there is no per-component subpath. Every consumer recipe on that page fails
   to compile against PeakUI as it stands.
2. **No proof.** With no component variants in the package, "framework-agnostic" is a claim with
   nothing executable behind it.
3. **The skill is silent.** It specifies the component's *internal* standard correctly — its export
   contract is byte-aligned with `heroui/packages/react/src/components/button/index.ts` — but says
   nothing about the consumer-facing composition surface, and nothing about the consumer recipes
   that surface enables.

## Decisions made before this spec

Settled in the brainstorm; recorded so they are not re-litigated:

- **Mirror the vendored reference's shape**, verified by reading `heroui/packages/styles`, not from
  memory. Divergences are allowed only where a PeakUI rule forces one, and each is written down
  (section 3).
- **Ship the plumbing together with one component's style layer.** Plumbing alone leaves a rule
  nobody can check — the failure mode the **Planned** section of the agent file exists to prevent.
- **Do not copy the reference's `src/utils`.** Reason in section 3.
- **Barrel completeness is a test, not codegen.** The reference hand-maintains an 80-line barrel with
  nothing guarding it; a vitest gate buys the guarantee without a build step.
- **Order: JS surface → Button style layer → skill.** A skill rule citing an export that does not
  exist is the aspirational rule this spec rejects.

## 1. The public JS surface of `@peakui/styles`

### Layout

Per component, mirroring the reference exactly:

```
packages/styles/src/components/<name>/<name>.styles.ts   tv() → BEM class names only
packages/styles/src/components/<name>/index.ts           export * from "./<name>.styles";
packages/styles/src/components/index.ts                  flat barrel of every component
packages/styles/components/<name>.css                    the Tailwind, imported by components/index.css
```

The split between `src/` (TypeScript) and the package root `components/` (CSS) already exists in this
package and in the reference. This spec does not change it.

### Root entry

`src/index.ts` becomes:

```ts
export {cn, tv, type VariantProps} from "tailwind-variants";
export * from "./components";

export const version = "0.0.0";
```

`version` stays: `src/index.test.ts` asserts it, and dropping it is an unrelated breaking change.
`tv` is re-exported because the consumer recipe `tv({extend: buttonVariants})` requires the same `tv`
instance the library used; importing a second copy from the consumer's own `tailwind-variants` works
by luck of version alignment, not by contract.

There is no `export * from "./utils"` — see section 3.

### Exports map

One key is added to `packages/styles/package.json`:

```jsonc
"./components/*": {
  "types":   "./src/components/*/index.ts",
  "import":  "./src/components/*/index.ts",
  "default": "./src/components/*/index.ts"
}
```

It coexists with the existing `"./components/*.css"`. Node resolves subpath patterns by **specificity
of the pattern, not declaration order**, and `*.css` is more specific than `*`, so a `.css` request
never falls through to the TypeScript entry. The reference ships this same pair.

The key is placed to keep the map alphabetically sorted, matching the file's existing order.

### What a consumer may rely on

| Surface | Import | Stability |
| --- | --- | --- |
| `<name>Variants` function | `@peakui/styles`, or `@peakui/styles/components/<name>` | Public. Removing or renaming a variant or value is breaking. |
| `<Name>Variants` type | same | Public. |
| BEM class names it emits | the stylesheet; no import | Public. Renaming one is breaking. |
| `tv`, `cn`, `VariantProps` | `@peakui/styles` | Public, re-exported from `tailwind-variants`. |
| CSS custom properties `--<name>-*` | the stylesheet | Public — the intended theming seam. |
| `version` | `@peakui/styles` | Public. |

Once `@peakui/react` exists it re-exports each component's variant function and variant type from
`@peakui/styles` — the third section of the export contract already in `SKILL.md`. Both import paths
then resolve to the same function object; that identity is the "both imports work identically"
guarantee, and it holds because the re-export is a re-export and not a copy.

## 2. First proof: the Button style layer

### Scope

The **style layer only**: `button.styles.ts`, `button.css`, the barrel entry, the CSS import, and one
Storybook story. No `button.tsx`, no `packages/react` — that package is **Planned** and creating it is
not in this spec.

This is a legitimate terminal state, not a half-finished component, because `button.styles.ts` and
`button.css` have no React dependency at all. Section 4 makes the skill say so, because an agent
reading the current `SKILL.md` finds a mandatory file list including `.tsx` and will otherwise try to
"finish" the component into a package that does not exist.

### Variant shape

Taken from `heroui/packages/styles/src/components/button/button.styles.ts`:

- `base: "button"`
- `variant`: `primary`, `secondary`, `tertiary`, `danger`, `danger-soft`, `ghost`, `outline`
- `size`: `sm`, `md`, `lg`
- `isIconOnly`: `true` → `button--icon-only`
- `fullWidth`: `true` → `button--full-width`
- `defaultVariants`: `{size: "md", variant: "primary"}`

`size.md` maps to the name `button--md`, which the skill requires; what stays empty is the **CSS
rule** `.button--md {}`, whose dimensions live in `.button`. That is `css-authoring.md`'s default-size
pattern, and the reference happens to agree.

### CSS

`components/button.css` is authored to PeakUI's rules, not copied from the reference:

- Tokens only. No literal colour anywhere — the existing `check:tokens` gate gives this teeth.
- A `--button-bg` / `--button-fg` / `--button-border` theming seam declared on `.button`.
- Every interactive state in **both** forms — pseudo-class and `data-*` — per `css-authoring.md`.
  Without the pseudo-class half, a non-React consumer gets no hover and no disabled state, which
  would defeat the point of this spec.
- `motion-reduce:transition-none` after the `transition` declaration, not before.
- Base height written in the `@apply h-10 md:h-9` form from `css-authoring.md` — 40 px where the
  pointer is coarse, 36 px where it is fine — which meets WCAG 2.2 target size with no special case.
- `forced-colors` is **half** free. The token layer emits one central block per theme
  (`2026-10-01-design-tokens-design.md`, section 5) and that covers the colour roles, but the
  structural half stays the component's own job, as `css-authoring.md` shows with its `.chip`
  example: hold a transparent border in the normal state and set `border-color: ButtonBorder`
  inside `@media (forced-colors: active)`. Without it every variant but `--outline` carries its
  identity in `background-color` alone and disappears — worst of all for the bare
  `<a class="button">`, which a browser gives no button styling of its own.

### The executable proof

A story `Components/Button` in `apps/storybook/src/stories/` renders **bare markup** with BEM classes
and no React component:

```tsx
<button className="button button--primary">Primary</button>
<a className="button button--secondary" href="#">Secondary</a>
```

If those render styled, the framework-agnostic claim is demonstrated rather than asserted — this is
exactly the "Direct Class Application" recipe from the reference's page.

A story alone is not a gate, and `a11y.test: "error"` in `preview.tsx` does **not** make it one:
`apps/storybook/AGENTS.md` records that nothing in this app consumes that flag — it needs
`@storybook/addon-vitest`, which is not installed, and `storybook build` checks no accessibility. The
real gate is a Playwright spec, so Button gets `apps/storybook/e2e/Button.spec.ts`, which audits both
stories in the light and the dark theme and asserts that the bare `<a>` resolves a real background,
radius and height. It audits `/iframe.html?id=<story-id>` directly: auditing through the manager with
`checkA11y(page, "#storybook-preview-iframe")` inspects the iframe element rather than the story
inside it and reports success having seen nothing — a mistake that shipped here once and hid a real
contrast defect.

The CSS reaches the story through the chain that already exists:
`globals.css` → `@peakui/styles/css` → `components/index.css` in `layer(components)`.

The two public surfaces — the variant function and the hand-written class string — could drift, so
that seam is tested twice, each in the tier that suits it:

- `src/components/button/button.styles.test.ts`, a vitest unit test on a pure function, asserts the
  exact output of `buttonVariants()` for the default call and for each variant and size value.
- A second story renders both halves side by side, the function's output and the literal string, so
  the visual tier catches a divergence the unit test cannot see — a class that exists in `tv()` with
  no rule behind it in `button.css`.

### Why BEM is the right carrier for this promise

`packages/styles/index.css` already documents the trap: Tailwind finds classes by scanning source
text, so a class name built by interpolation never reaches the CSS, and anything outside the app's
`@source` directories is invisible to it. BEM names are immune — they are real rules in `button.css`,
not utilities that must be discovered in consumer source. So `buttonVariants()` called from a Vue file
outside `@source` works, while a utility-string equivalent would silently render unstyled. The
architecture is load-bearing for the promise, not incidental to it.

## 3. Deliberate divergences from the vendored reference

`SKILL.md` instructs agents to verify against `heroui/` rather than recall. That instruction will lead
a future agent to the differences below and invite it to "fix" them back. Each is therefore recorded
with its reason, in the skill, as a divergence that is correct.

| Reference | PeakUI | Why |
| --- | --- | --- |
| `src/utils/index.ts` exports Tailwind utility strings (`focusRingClasses`, `disabledClasses`, `ariaDisabledClasses`) as public JS API | Not exported. Utilities stay CSS-native in `utilities/index.css`, consumed via `@apply status-focused` / `status-disabled` | Two mechanisms for one concern is two sources of truth, which the ecosystem's one-implementation rule forbids. The CSS form also survives the Tailwind-scanning trap above. |
| `@heroui/styles` imports Tailwind itself | Does not; the consumer owns `@import "tailwindcss"` | Already decided and documented in `packages/styles/index.css`. |
| Barrel is hand-maintained with nothing guarding it | Hand-maintained plus a completeness gate | "Component exists, barrel forgot it" is silent and cheap to prevent. |
| No `lint:package` script | `publint --strict && attw` | PeakUI gates packaging; the reference's silence is not evidence either way. |
| No `forced-colors` support | Central per-theme block from the token layer | Pre-existing decision, `2026-10-01-design-tokens-design.md`. |

## 4. Skill changes

### Where the text goes

`SKILL.md` is the always-loaded core and is already ~17 KB; the full contract does not belong there.

**New `references/composition-contract.md`** — the consumer-facing surface in full: what each
component publishes, the four consumer recipes (direct BEM classes, variant function, `slots.*()`
under a foreign root, `tv({extend})`), the `render` rules, and the divergence table from section 3.

**In `SKILL.md`** — only what an author holds in their head: a short rules block, new checklist lines,
one rationalization-table entry, and a Reference Map row.

### Form chosen per failure

`writing-skills` warns that a prohibition aimed at a shaping or omission failure measurably backfires.
Each piece therefore takes the form its failure calls for:

| Failure to prevent | Form | Lands in |
| --- | --- | --- |
| Agent "corrects" a consumer's `tv({extend})` that contains Tailwind, citing `❌ Tailwind utilities inside tv()` | Discipline: explicit two-half rule + rationalization-table row + red flag | `SKILL.md` |
| Agent treats a `*.styles.ts` with no `.tsx` as unfinished and works toward a non-existent package | Conditional on an observable predicate: while `packages/react` does not exist, a style layer is complete on its own | `SKILL.md` |
| The BEM modifier list is never published, though the component's docs entry is written anyway | Structural: one more **required** row in the artifact table | `references/agent-readiness.md` |
| `mergeProps` and the element-type mismatch warning are missing from the `render` rules | Additive detail where the pattern already lives | `references/typescript.md` |
| Consumer recipes are unknown or invented | Reference: tables plus one complete example each | `references/composition-contract.md` |

### The `tv()` rule, in two halves

- **Library author:** zero Tailwind utilities inside `tv()`. Unchanged, and still a forbidden pattern.
- **Consumer:** Tailwind inside `tv({extend: buttonVariants})` is **correct**. That is the documented
  extension path, and the author-side prohibition does not reach it.

With one caveat the reference does not state: a consumer's utilities compete with `button.css` by
**cascade specificity**, not by `tailwind-merge`, which cannot reconcile `.button--primary` against
`bg-white/10`. So the first-choice override is the CSS custom properties (`--button-bg`), and
`tv({extend})` is the escape hatch. Both are documented; the order is stated.

### `render`, completed

`references/typescript.md` already carries `DOMRenderProps` with the three requirements — expected
element type, exactly one root, props and ref passed through. Added: merge the supplied props with
`mergeProps` from `@react-aria/utils` rather than spreading over them, a development-time warning when
the rendered element type does not match the expected one, and the rule that a component accepting
`render` says so in its docs entry — which is the structural row added to `agent-readiness.md`.

## 5. Testing

### Code

TDD, red before green, in this order:

1. `src/generator/exports.test.ts` — add `./components/*` to the required-paths list. Red, then
   `package.json`.
2. `src/index.test.ts` — `tv` and `cn` are exported and callable; `buttonVariants` is reachable from
   the package root; `buttonVariants({variant: "primary"})` contains `button` and `button--primary`.
   Red, then `src/index.ts` and the barrel.
3. **Barrel completeness gate**, a new test: every directory under `src/components/` is re-exported
   from `src/components/index.ts` **and** has a matching `components/<name>.css` imported by
   `components/index.css`. Red against a deliberately missing entry, then green.
4. `pnpm check:tokens` must stay green — it is what forbids a literal colour in `button.css`.
5. `pnpm lint:package` (`publint --strict && attw --pack . --profile esm-only`) must stay green. The
   new TypeScript entry point may need an `--exclude-entrypoints` addition; the reference has no
   equivalent script, so this is settled by running it, not by assumption.
6. Storybook: the two Button stories render, and `apps/storybook/e2e/Button.spec.ts` passes — the
   bare-markup contract plus a WCAG 2.2 AA audit of both stories in both themes. The addon's
   `a11y.test: "error"` is inert in this app and proves nothing; the Playwright spec is the gate.

### Skill

`writing-skills` sets the Iron Law, and it covers edits: no skill text before a failing test. The
current skill is the control. If a scenario does not fail against it, that rule is not written.

**RED** — four scenarios, fresh-context subagents, failures recorded verbatim:

1. Write the docs example for styling a Next.js `Link` as a PeakUI primary button.
2. Write the example for adding a custom `radius` variant to Button.
3. Review `button.styles.ts` + `button.css` with no `button.tsx` present.
4. List every public styling entry point a PeakUI consumer has.

**GREEN** — write only the text that addresses the recorded failures; re-run the same four.

**REFACTOR** — new rationalizations become explicit counters; re-run until stable.

The `tv({extend})` rule is behaviour-shaping, so its wording is micro-tested against a no-guidance
control at 5+ reps with every flagged match read by hand. The rest is reference material, for which
`writing-skills` marks that checklist item not applicable.

## 6. CI gates

No new gate scripts. The work must leave green: `pnpm typecheck`, `pnpm test`, `pnpm check:tokens`,
`pnpm lint:package`, `pnpm build:storybook`, `pnpm test:e2e`. The barrel completeness gate joins
`pnpm test` as an ordinary vitest file.

## 7. Out of scope

- `packages/react` and `button.tsx`. Planned; untouched here.
- The docs site and the handbook page itself. `apps/docs/` is Planned, and a page-authoring standard
  is separate work — it was recommendation 3 of the audit and is not part of this spec.
- Every component other than Button.
- Copying the reference's `src/utils`.
- Codegen for the barrel.
- A `peakui-mcp` or `llms.txt` entry for this surface, which waits on the docs site.

## 8. Risks and open questions

| Risk | Handling |
| --- | --- |
| `attw --profile esm-only` rejects a TypeScript-source entry point for `./components/*` | Resolved by running it in the plan's first task. Likely fix is one `--exclude-entrypoints` entry; if a deeper one is needed it is a packaging decision and stops for a call. |
| `publint --strict` objects to two patterns sharing the `./components/` prefix | Same task, same treatment. Resolution is by specificity, so this would be a linter opinion rather than a correctness problem. |
| The RED phase costs ~10 subagent runs | Stated to the human before spending it. Reducible to scenarios 2 and 3 — the only discipline failure and the only structural one — at the human's choice. |
| CodeGraph is not indexed in this clone (`codegraph status` → `Not initialized`), so `impact` cannot confirm the blast radius of changing `src/index.ts` | Reported, not worked around. The honest mitigation is that `@peakui/styles` has no dependents yet: `packages/react` does not exist and `apps/storybook` consumes only CSS. `pnpm bootstrap` indexes it; the human owns that step. |
| A later component's variant function drifts from its CSS class names | The second Button story — variant function versus hand-written classes — is the pattern every later component repeats. |
