# `@peakui/react` — the React layer, proved by Button and Spinner

## Task

Create the React layer of the library and ship its first two components: `Button` and `Spinner`.

`Button` already exists as a style layer. `2026-10-02-composition-contract-design.md` section 2 built
`button.styles.ts` and `button.css` and declared that a legitimate terminal state, putting
`packages/react` and `button.tsx` out of scope. This spec picks up exactly there.

The work is therefore not "write a component". It is "stand up the React layer", with Button as the
thing that proves it — the same figure the style-layer spec used, for the same reason: a package with
no component cannot be verified, and a component has nowhere to live without a package.

**CodeGraph, before any file was read** — `pnpm codegraph explore button`:

> Found 10 symbols across 2 files. Blast radius: `buttonVariants`
> (`packages/styles/src/components/button/button.styles.ts:10`) — 4 callers in
> `apps/storybook/src/stories/button.stories.tsx`; tests:
> `packages/styles/src/components/button/button.styles.test.ts`,
> `packages/styles/src/index.test.ts`

`codegraph status`: 47 files, 379 nodes, 1,003 edges. The index is current; nothing was skipped.

## Decisions taken before this spec was written

Each was put to the repository owner during brainstorming and answered.

| Question | Decision |
| --- | --- |
| Scope boundary | Foundation + Button, **no ButtonGroup**. The reference's context-merging half of `button.tsx` is dropped. |
| Build | Source exports in-repo, plus a real build. `pnpm build` / `build:packages` arrive with the package, as `AGENTS.md` promised. |
| Bundler | **`tsdown`** in unbundle mode, plus a gate on `"use client"`. |
| Test helpers | A private **`packages/testing`**, mirroring the reference. |
| `isPending` | A full pending state. This is what pulled **Spinner** into scope as a second component; the subsequent fidelity decision then settled *how* the two combine — see section 8. |
| `packages/standard` | **Mandatory**, and deployed before the components. |
| `hooks/` | **Not required** — verified, see below. Not created. |
| Fidelity to the reference | **Match HeroUI v3 exactly.** Where the component-standards skill contradicts the reference, the skill is corrected. |
| The two prior divergences | `forced-colors` and CSS-native utilities **stay**. Matching the reference there would delete working code and revoke a shipped guarantee. |
| `conventions.md` conflict | Corrected in the curator repository, in Russian, in place. |
| `any` | Relaxed **narrowly**, at the polymorphic spread boundary only. |

### `hooks/` is not required, by inspection

Neither component imports anything from a hooks directory. `button.tsx` takes `use` from React,
`buttonVariants`, the RAC primitive and `composeTwRenderProps`. `spinner.tsx` takes `useId` and
`dom`. The reference carries eleven files in `src/hooks/` and Button and Spinner need none of them.

## 1. Order of work

The order is a constraint, not a preference. Code must pass under the corrected skill rather than in
spite of the current one, so the skill is corrected first.

1. Skill corrections (three rules), plus `conventions.md` in the curator repository
2. `packages/standard`
3. `packages/testing`
4. `packages/react` foundation
5. `packages/styles` additions
6. `Spinner`
7. `Button`
8. Storybook stories and the e2e audit

## 2. Skill corrections

Three rules in `.agents/skills/peakui-component-standards/` contradict what the reference actually
does. They are corrected through the `writing-skills` skill.

### 2.1 Hardcoded assistive strings

`references/accessibility-and-i18n.md:117-119` states that every string a component generates goes
through `useLocalizedStringFormatter` with a `ru-RU` entry, and that a hardcoded English string is a
defect. The matching line in the `SKILL.md` checklist says the same.

The reference hardcodes `aria-label="Loading"` in `spinner.tsx`. Measured across its library code,
excluding stories, the reference has **five** such strings in total — `"Loading"`, `"Close"`,
`"Clear selection"`, `"Remove tag"`, `"pagination"`. This is not negligence at scale; it is a
deliberately small surface. Spinner is one of the five.

**Corrected to:** a hardcoded English default is acceptable for a string the component generates
itself. A consumer-supplied label always wins over the default. The formatter arrives when a
component owns many strings of its own — a calendar's month labels, a table's empty state — and
`@react-aria/i18n` remains the mechanism when it does.

The "consumer-supplied label always wins" half is kept unchanged, because the reference honours it:
in `spinner.tsx` the `{...props}` spread comes **after** `aria-label`, so a passed prop overrides.

### 2.2 `any`

`references/typescript.md:7`, the Forbidden Patterns block in `SKILL.md`, and
`references/code-quality.md:126` forbid `any` outright. The reference writes `{...(props as any)}`
in `spinner.tsx`, and has 115 `as any` sites in library code.

**Corrected narrowly:** `any` is permitted at the polymorphic spread boundary of a component using
`DOMRenderProps`, where the element type is genuinely inexpressible, and a comment is required at
each site. Everywhere else the prohibition stands.

The broad reading — delete the rule — was considered and rejected by the owner. Matching the
reference is about its component patterns, not about importing its type debt.

### 2.3 Test file location

`SKILL.md` File Structure and the Conventions section of `AGENTS.md` both place tests beside the
component. The reference places them in `packages/react/tests/components/<name>/` while keeping
stories beside the component.

**Corrected to the reference's layout.** This pulls in two mechanical consequences: a `@/*` path
alias in the package `tsconfig.json`, because the reference's tests import `@/components/button`, and
`include: ["src", "tests"]`.

A consequence worth stating rather than discovering later: `packages/styles` keeps its tests beside
its source, so the two packages diverge on this axis. That is accepted.

### 2.4 Curator repository

`peakui-company/docs/ecosystem/conventions.md:33` mandates `forwardRef` with a required
`displayName`, and `useImperativeHandle` for a public ref API. Both contradict `AGENTS.md` and
`SKILL.md`, which forbid `forwardRef` because React 19 passes `ref` as an ordinary prop. The file
states its conventions are inherited from established `peakui` practice; practice moved to React 19
afterwards and the document did not.

Corrected in the curator repository, in a separate commit, **in Russian and in place** — the file is
listed for legacy translation in `docs/ecosystem/backlog.md`, and starting a half migration inside an
unrelated task is the failure that backlog item exists to prevent.

## 3. `packages/standard`

Private, not published. The reference's shape: presets with no dependencies of their own, with the
plugins hoisted to the workspace root.

```
packages/standard/eslint/base.mjs      flat config, TypeScript rules
packages/standard/eslint/react.mjs     + react, react-hooks, jsx-a11y, react-refresh, storybook
packages/standard/prettier/base.mjs    printWidth 100, bracketSpacing false, no semicolon changes
```

There is no `exports` map: without one, Node's legacy resolution serves arbitrary subpaths, which is
how `@heroui/standard/eslint/react.mjs` resolves. The reference relies on this and so do we.

`pnpm lint`, `pnpm format` and `pnpm format:fix` appear in the root `package.json`, and each package
gains a `lint` script. Today peakui has **no** lint infrastructure at all: neither
`eslint.config.mjs` nor `prettier.config.mjs` exists anywhere in the repository.

**The TypeScript baseline does not move.** `tsconfig.base.json` stays at the repository root, where
`packages/styles` and `apps/storybook` already extend it by relative path. Migrating it into
`packages/standard/tsconfig/` would touch both existing packages for no gain, and the baseline
carries peakui's own deliberate `allowImportingTsExtensions: true`, which the barrels require because
they write `export * from "./button.styles.ts"` with the extension.

The one `react.mjs` override the reference carries is kept with its reason: `react-hooks/rules-of-hooks`
is off for `**/*.stories.tsx`, because Storybook `render:` functions are lowercase callbacks the
plugin cannot recognise as components.

## 4. `packages/testing`

Private, not published.

```
packages/testing/helpers/index.ts   render, setupUser, ssrSmoke, + @testing-library re-exports
packages/testing/helpers/render.ts
packages/testing/helpers/user.ts    userEvent.setup({delay: null, pointerMap})
packages/testing/helpers/ssr.ts     renderToString → hydrateRoot, fails on hydration errors
packages/testing/setup/react.ts     the jsdom gaps RAC needs
packages/testing/configs/react.mjs  jsdom, globals: true, the setup file
packages/testing/globals.d.ts
```

`setup/react.ts` is not ceremony. Without it RAC tests do not run: `installPointerEvent()` is
required by `usePress`, and `ResizeObserver`, `matchMedia`, `elementFromPoint` and
`Element.prototype.getAnimations` are absent from jsdom.

**No vitest browser tier.** The reference ships `configs/browser.mjs`, `setup/browser.ts` and
`helpers/browser.ts`; peakui's browser tier is Playwright in `apps/storybook/e2e/`. Recorded as a
divergence so it is not "fixed" later.

## 5. `packages/react` foundation

```
packages/react/src/utils/compose.ts        composeTwRenderProps, composeSlotClassName
packages/react/src/utils/dom.tsx           dom.* — the render-prop element helper
packages/react/src/utils/index.ts
packages/react/src/components/index.ts     flat barrel
packages/react/src/index.ts
packages/react/tests/components/index.test.ts  barrel completeness gate
packages/react/tsdown.config.ts
packages/react/vitest.config.ts            merges @peakui/testing/configs/react
packages/react/tsconfig.json               @/* alias, include src + tests
packages/react/eslint.config.mjs
```

The barrel gate lives under `tests/` rather than beside the barrel, because section 2.3 moves every
test in this package there. `packages/styles` keeps its equivalent gate at
`src/components/index.test.ts`; the two packages differ on test location by decision, not by
accident.

`sideEffects: false` is required — without it `Object.assign` defeats tree-shaking and the flat
exports stop paying for themselves.

`utils/dom.tsx` is foundation, not optional: Spinner is a plain DOM element rather than a RAC
primitive, and the reference builds it on `dom.span` with a `render` prop.

**Not created:** `utils/assertion.ts` (`dataAttr`) and `src/hooks/`. Neither component uses them; RAC
sets the `data-*` attributes itself. The `SKILL.md` foundation table lists both, and that table
describes what components import, not a package manifest — a later component that needs one creates
it then.

### Build

`tsdown` in unbundle mode: one output file per source module, which keeps `"use client"` on its own
module and gives per-component tree-shaking without the manual `preserveModules` +
`preserveModulesRoot` wiring the reference does in rollup. Declarations come from the same tool, so
there is no separate `tsc` emit pass.

In-repo `exports` point at `src`, so Storybook and vitest need no build. The reference does the same
and rewrites `exports` to `dist` at `prepack`; the publish-time rewrite is release mechanics, owned
by the `changeset-release` skill, and is out of scope here.

**A gate, not a hope.** Rolldown has a known directive-preservation bug
([rolldown#7809](https://github.com/rolldown/rolldown/issues/7809)). A `tsdown` plugin fails the
build when an emitted chunk holds a module that declared `"use client"` and the directive is missing
from the output. This follows the repository's existing habit: barrel completeness is held by a test,
not by the author's attention.

The exact `tsdown` option names and the plugin hook used are **verified in the task that sets up the
build**, not asserted here.

## 6. `packages/styles` additions

```
packages/styles/src/components/spinner/spinner.styles.ts
packages/styles/src/components/spinner/index.ts
packages/styles/components/spinner.css
```

`spinnerVariants`: `base: "spinner"`; `size` → `sm`, `md`, `lg`, `xl`; `color` → `current`, `accent`,
`danger`, `success`, `warning`; `defaultVariants: {color: "accent", size: "md"}`. `.spinner--md` is an
empty rule — the default size lives in `.spinner`, per the default-size pattern in
`css-authoring.md`.

`spinner.css` needs nothing invented. `--animate-spin-fast` already exists at
`themes/shared/theme.css:170`, and `motion-reduce:animate-none` honours reduced motion.
`--color-success`, `--color-warning` and `--color-accent` are all mapped in `@theme`
(`themes/shared/theme.css:43-55`), so the colour variants read peakui token names; the reference's
`var(--accent)` differs only by the `--color-` prefix.

Two edits to existing files:

- `utilities/index.css` gains `@utility status-pending { pointer-events: none; }`
- `button.css` gains `&[data-pending="true"] { @apply status-pending; }`

That is the whole pending style layer, exactly as the reference has it. No `position: relative`, no
absolute-centred indicator, no fading of button content — those were proposed during brainstorming
and dropped when the owner chose reference fidelity.

The barrel completeness gate in `src/components/index.test.ts` picks Spinner up on its own; it was
written to catch a forgotten line.

## 7. Spinner

`packages/react/src/components/spinner/spinner.tsx`, `"use client"`.

An internal `SpinnerPrimitive` renders the `<svg>` with two `linearGradient` definitions whose ids
are suffixed with `useId()`, so several spinners on one page do not collide. `data-slot="spinner-icon"`.

`SpinnerRoot` renders `dom.span` with `role="status"`, `aria-label="Loading"`, `data-slot="spinner"`,
and the primitive inside as `aria-hidden`. Props spread after `aria-label`, so a consumer-supplied
label overrides it. Generic over the rendered element through `DOMRenderProps`, which is where the
single permitted `any` sits, with its comment.

## 8. Button

`packages/react/src/components/button/button.tsx`, `"use client"`.

A thin styled composition over `react-aria-components/Button`:

```tsx
interface ButtonRootProps extends ComponentPropsWithRef<typeof ButtonPrimitive>, ButtonVariants {}
```

`buttonVariants({fullWidth, isIconOnly, size, variant})` produces the class names;
`composeTwRenderProps` merges them with a consumer `className`; `data-slot="button"`; children pass
through as a render prop when they are a function.

No `forwardRef`, no `displayName`, no `render` prop — the RAC primitive owns the `<button>` element.
A link styled as a button is the consumer's `<a className={buttonVariants(...)}>`, which is the
standalone recipe both the reference's stories and peakui's existing stories already demonstrate.

`isPending` arrives free from the RAC primitive through the prop spread, and Button adds nothing for
it: no indicator of its own, no `pendingLabel`. The consumer composes the indicator in children, as
the reference's stories do and as the RAC documentation's own example does —
`{({isPending}) => isPending ? <Spinner color="current" size="sm" /> : <Icon />}`. RAC blocks press
and hover while pending and keeps the button focusable.

Dropped from the reference in full: `BUTTON_GROUP_CHILD`, `ButtonGroupContext`, and the precedence
merge of `size`, `variant`, `isDisabled` and `fullWidth` against group context. ButtonGroup is not in
this spec, and reintroducing the hook points before the component exists would be speculative.

## 9. The export contract

Both components are leaves and both ship the full three-section shape.

```ts
/* ---------- Compound Component ---------- */
export const Button = Object.assign(ButtonRoot, {Root: ButtonRoot});

export type Button = {
  Props: ComponentProps<typeof ButtonRoot>;
  RootProps: ComponentProps<typeof ButtonRoot>;
};

/* ---------- Named Component ---------- */
export {ButtonRoot};
export type {ButtonRootProps, ButtonRootProps as ButtonProps} from "./button";

/* ---------- Variants ---------- */
export {buttonVariants} from "@peakui/styles";
export type {ButtonVariants} from "@peakui/styles";
```

The variant re-export is a re-export and not a copy, so `@peakui/react` and `@peakui/styles` resolve
to the same function object. That identity is the "both import paths work identically" guarantee the
style-layer spec promised in its section 1.

## 10. Testing

The jsdom suites are ported from the reference, which already encodes the right queries — by role,
label and text, never by class list or RAC internals:

- renders with role and accessible name
- exposes the BEM block and `data-slot`
- exposes the variant BEM modifier
- passes `data-*` attributes through
- hover sets and clears `data-hovered`
- press sets and clears `data-pressed`
- `onPress` fires on click
- Tab produces `data-focus-visible`, tabbing away clears it
- `isDisabled` disables, sets `data-disabled`, and blocks `onPress`
- a disabled button exposes no hover state
- Enter and Space activate
- render-prop children react to `isPressed`

jsdom needs RAC's pointer sequence written out — `pointerDown`, then `pointerUp` plus `click` — and
the reference's test file already does this.

SSR smoke on both components: `renderToString` → `hydrateRoot`, asserting no hydration error. For
the first component in a new package this is also the only check that `"use client"` means anything.

Concretely, the files are:

```
packages/react/tests/components/button/button.test.tsx
packages/react/tests/components/button/button.ssr.test.tsx
packages/react/tests/components/spinner/spinner.test.tsx
packages/react/tests/components/spinner/spinner.ssr.test.tsx
packages/react/src/components/button/button.stories.tsx
packages/react/src/components/spinner/spinner.stories.tsx
```

Stories are titled `Components/Button` and `Components/Spinner` and sit beside their components, which
is both the reference's layout and what `SKILL.md` already requires.

Storybook needs less wiring than expected: `.storybook/main.ts:20` already carries the glob
`../../../packages/react/src/**/*.stories.@(ts|tsx)`, so component stories are picked up with no
config change. What is missing is the dependency — `apps/storybook/package.json` lists only
`@peakui/styles`, and `@peakui/react` has to be added as `workspace:*` before a story can import the
component.

### One existing file must stop lying

`apps/storybook/e2e/Button.spec.ts` opens with "Button существует пока только как стилевой слой:
packages/react не создан, React-компонента нет". After this work that is false. The spec carries a
task to add the React stories to the axe audit and rewrite the comment. The two existing
style-layer stories and their audit stay — they are the standalone-CSS proof and are not superseded.

## 11. CI gates

Must be green: `pnpm typecheck`, `pnpm test`, `pnpm check:tokens`, `pnpm lint:package`,
`pnpm build:storybook`, `pnpm test:e2e`.

New: `pnpm lint`, `pnpm format` (check mode in CI), `pnpm build` / `pnpm build:packages`, and the
`"use client"` directive gate inside the build.

## 12. Divergences from the vendored reference

`SKILL.md` tells agents to verify against `heroui/` rather than recall. That instruction will lead a
future agent to each difference below and invite it to "fix" it back. Each is therefore recorded.

| Reference | PeakUI | Why |
| --- | --- | --- |
| rollup + babel, `preserveModules` | `tsdown` unbundle | One Rolldown core shared with the Vite 8 already in `apps/storybook`, declarations from the same tool, no manual module-preservation wiring. |
| No directive gate | A `tsdown` plugin fails the build on a lost `"use client"` | [rolldown#7809](https://github.com/rolldown/rolldown/issues/7809) is a real, open failure mode. |
| `vitest` browser tier in `packages/testing` | Playwright in `apps/storybook/e2e/` | Pre-existing decision; the browser tier already exists in another shape. |
| `src/utils/index.ts` exports Tailwind utility strings | Not exported; utilities stay CSS-native, consumed via `@apply` | Recorded in `2026-10-02-composition-contract-design.md` section 3. A utility reaching a consumer outside `@source` would not compile at all, which breaks the standalone artefact promise. Reaffirmed by the owner for this spec. |
| No `forced-colors` support | Central per-theme block plus the component's own identifying border | Recorded in `2026-10-01-design-tokens-design.md`, and `button.css` already implements it. Reaffirmed by the owner for this spec. |
| `var(--accent)` | `var(--color-accent)` | peakui's token naming, mapped in `@theme`. |
| `ButtonGroup` context merging inside `button.tsx` | Absent | ButtonGroup is not in this spec. |

## 13. Defects Button inherits and cannot fix

Both are measured and already recorded in `peakui-company/docs/ecosystem/backlog.md`. The React
component inherits them unchanged; they are token-layer work.

- **`.button--outline` fails WCAG 2.2 SC 1.4.11.** Its border takes `--color-border`, measured with
  the repository's own `contrastRatio` against `--background` at **1.24:1** in `default-light` and
  **1.39:1** in `default-dark`, where 3:1 is required. No token exists for a boundary that identifies
  a control, and the reference has the same defect, so there is no pattern to copy.
- **`--accent-hover` against `--accent-foreground` is a `color-contrast` violation at `serious`
  impact**, confirmed by axe against the rendered story. This is the hover state of
  `.button--primary`.

## 14. Out of scope

- `ButtonGroup`, and any hook point anticipating it
- A `Link` component
- `utils/assertion.ts`, `src/hooks/`
- `apps/docs`, `packages/codemodes`
- Release mechanics: `clean-package`, the `prepack` rewrite of `exports`, changesets for these
  packages. Owned by the `changeset-release` skill.
- Fixing either inherited contrast defect
- Moving `tsconfig.base.json` into `packages/standard`
- Translating any existing Russian content

## 15. Risks and open questions

| Risk | Handling |
| --- | --- |
| The exact `tsdown` option for unbundle output, and the plugin hook that can inspect emitted chunks, are taken from documentation rather than from a run here | Verified in the task that sets up the build. If unbundle output cannot carry the directive at all, that is a bundler decision and stops for a call rather than being worked around. |
| `publint --strict` and `attw --profile esm-only` on a package whose in-repo `exports` point at TypeScript source | `packages/styles` already solved this shape with `--exclude-entrypoints`; the same task resolves it for `react` and reports if a deeper packaging decision is needed. |
| ESLint plugins hoisted to the root while `packages/standard` declares no dependencies — the reference's arrangement, which pnpm's strict linking can refuse | Caught by running `pnpm lint` in the task that creates the package. The fallback is declaring the plugins as dependencies of `packages/standard`, which is a change in that package only. |
| Three skill rules change, and agents in flight may have the old text in context | The corrections land before any component code, as tasks 1-2 of the plan, and each carries its reason in the skill so it reads as a decision rather than a loosening. |
| Relaxing `any` at the polymorphic boundary erodes into general use | The permission is scoped to a `DOMRenderProps` spread and requires a comment at the site. `Spinner` is the only component in this spec that may use it. |
| The e2e comment rewrite is easy to forget, leaving a false statement in a test file | It is a task, not a note. |
