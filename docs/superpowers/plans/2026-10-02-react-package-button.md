# `@peakui/react` — Button and Spinner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the React layer of the library — `packages/standard`, `packages/testing`,
`packages/react` — and ship `Button` and `Spinner` on it, in the shape of HeroUI v3.

**Architecture:** Three new workspace packages. `packages/standard` carries ESLint and Prettier
presets with no dependencies of its own. `packages/testing` carries the jsdom setup RAC requires and
the `render` / `setupUser` / `ssrSmoke` helpers. `packages/react` is built with `tsdown` in unbundle
mode so each module keeps its own `"use client"`, holds two foundation utils (`compose`, `dom`) and
the two components as thin styled compositions. The existing `@peakui/styles` gains Spinner's style
layer and the pending state's one utility.

**Tech Stack:** React 19, `react-aria-components`, `tailwind-variants`, `tsdown` (Rolldown), vitest 3
+ `@testing-library/react`, Playwright, ESLint 9 + Prettier, pnpm workspaces.

**Spec:** [`docs/superpowers/specs/2026-10-02-react-package-button-design.md`](../specs/2026-10-02-react-package-button-design.md)

## Global Constraints

- Work in `/Users/vlad/Desktop/projects/peakui-company/peakui` on branch `chore/ai-harness`. Task 2 is the **only** task that commits in `peakui-company`.
- Order is mandated by the spec section 1 and is not an optimisation: skill corrections land before any component code.
- `"use client"` at the top of every component `.tsx`. No `forwardRef`. `use()` not `useContext()`.
- Named exports only; Storybook CSF and config files are the single default-export exception.
- `tv()` emits BEM class names only. Every Tailwind utility lives in `@peakui/styles` CSS.
- `data-slot` on every rendered element. State through `data-*`, never `is-*`.
- No `any` except at the polymorphic spread boundary of a `DOMRenderProps` component, with a comment — enforced by keeping `@typescript-eslint/no-explicit-any` at `"error"` and requiring an inline disable at the one permitted site. The reference sets this rule to `"off"`; peakui does not.
- Component files are kebab-case, matching the BEM block and the CSS file.
- `sideEffects: false` in both new publishable-shaped packages.
- Tests live in `packages/react/tests/components/<name>/`; stories live beside the component.
- Conventional Commits, Russian subjects allowed, header ≤ 150 chars. End every commit message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- `AGENTS.md` and `CLAUDE.md` in `peakui` are byte-identical today. Any edit to one is applied to both.
- Accessibility floor WCAG 2.2 AA plus `forced-colors`. The two inherited contrast defects in spec section 13 are **not** fixed here.
- `packages/react/src/utils/assertion.ts` and `packages/react/src/hooks/` are **not created**. Neither component uses them and RAC sets the `data-*` attributes itself. The `SKILL.md` foundation table describes what components import, not a package manifest.
- Write every new document in English. Existing Russian content is left exactly as it is; `conventions.md` in Task 2 is corrected **in Russian**, in place.
- Versions: `typescript` 5.9.3, `vitest` ^3.2.4 (matching `packages/styles`, not the reference's vitest 4), `react` / `react-dom` >=19.0.0 as peers.

## Review Focus

Five behaviours the spec implies that the reference's own tests do not exercise. Each has its test
added to the task that owns the code.

1. **A consumer `className` must merge with the BEM names, not replace them.** `composeTwRenderProps` is the only thing standing between a consumer's `className` and a button that silently loses `.button`. Pinned in Task 5.
2. **A `className` passed as a *function* (RAC's render-prop form) must work.** Consumers copy this from RAC docs; if `composeTwRenderProps` mishandles it the class list becomes `"[object Object]"`. Pinned in Task 5.
3. **`ref` must actually land on the DOM node.** With no `forwardRef`, nothing else proves React 19 prop-ref forwarding survives the composition. Pinned in Tasks 10 and 11.
4. **Two Spinners on one page must not collide on gradient ids.** `useId` is the mechanism and the reference never tests it; a collision makes one spinner render invisibly. Pinned in Task 10.
5. **A pending Button must block activation while staying focusable.** This is the user-visible half of `isPending` and the reference tests it nowhere. Pinned in Task 11.

---

### Task 1: Correct the three contradicting rules in the component-standards skill

**Files:**
- Modify: `.agents/skills/peakui-component-standards/references/accessibility-and-i18n.md:99-127`
- Modify: `.agents/skills/peakui-component-standards/references/typescript.md:7`
- Modify: `.agents/skills/peakui-component-standards/references/code-quality.md:126`
- Modify: `.agents/skills/peakui-component-standards/SKILL.md` — the Forbidden Patterns `any` entry, the File Structure tree, and two Pre-Review Checklist lines
- Modify: `AGENTS.md` and `CLAUDE.md` — the Conventions bullets for `any` and for test location
- Test: `scripts/skill-rules.test.mjs` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: the corrected rules every later task is written against. No code symbols.

- [ ] **Step 1: Write the failing test**

Create `scripts/skill-rules.test.mjs`, run by the existing `pnpm test:ai` (`node --test "scripts/**/*.test.mjs"`). It asserts the corrections exist rather than describing them twice:

```js
import {readFileSync} from "node:fs";
import {strict as assert} from "node:assert";
import {test} from "node:test";

const read = (p) => readFileSync(p, "utf8");
const A11Y = ".agents/skills/peakui-component-standards/references/accessibility-and-i18n.md";
const TS = ".agents/skills/peakui-component-standards/references/typescript.md";
const SKILL = ".agents/skills/peakui-component-standards/SKILL.md";

test("a hardcoded English default is no longer called a defect", () => {
  const text = read(A11Y);
  assert.ok(!text.includes("Hardcoded Russian or English in JSX is a defect"));
  assert.match(text, /hardcoded English default is acceptable/i);
  assert.match(text, /consumer-supplied label always wins/i);
});

test("the any relaxation is scoped to the polymorphic spread boundary", () => {
  for (const text of [read(TS), read(SKILL)]) {
    assert.match(text, /DOMRenderProps/);
    assert.match(text, /polymorphic spread/i);
  }
});

test("tests are located under tests/, stories beside the component", () => {
  const text = read(SKILL);
  assert.match(text, /tests\/components\/<component-name>\//);
  assert.ok(!text.includes("<component-name>.test.tsx # jsdom"));
});

test("AGENTS.md and CLAUDE.md stay byte-identical", () => {
  assert.equal(read("AGENTS.md"), read("CLAUDE.md"));
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test:ai`
Expected: FAIL — the first three tests fail; the fourth passes, because the two files are identical today.

- [ ] **Step 3: Rewrite the i18n rule in `accessibility-and-i18n.md`**

Replace the `## Internationalization` rules list. The new rule: a hardcoded English default is
acceptable for a string a component generates itself; a consumer-supplied label always wins over the
default; the formatter arrives when a component owns many strings of its own (a calendar's month
labels, a table's empty state), and `@react-aria/i18n` stays the mechanism when it does. Keep the
`useLocalizedStringFormatter` example as the shape to use *then*, labelled as such. State the
reference measurement as the evidence: five hardcoded strings in HeroUI's entire library code.

- [ ] **Step 4: Scope the `any` prohibition in `typescript.md`, `code-quality.md` and `SKILL.md`**

The prohibition stands everywhere except the polymorphic spread boundary of a component using
`DOMRenderProps`, where the element type is inexpressible. A comment is required at each site, and
the permitted form is an inline `eslint-disable-next-line @typescript-eslint/no-explicit-any` — the
lint rule stays at `"error"`, which is what keeps the relaxation narrow.

- [ ] **Step 5: Move the test location in `SKILL.md` and both agent files**

`SKILL.md` File Structure: tests move to `packages/react/tests/components/<component-name>/`; the
`.stories.tsx` stays in the component directory. Note the `@/*` alias and
`include: ["src", "tests"]` that this requires. Update the matching Conventions bullet in `AGENTS.md`,
then copy `AGENTS.md` over `CLAUDE.md`.

- [ ] **Step 6: Record the divergences in `SKILL.md`**

Each of the three corrections gets its reason inline, so it reads as a decision rather than a
loosening. Without this the next agent restores the old text from the vendored reference or from
habit.

Then add a pointer, beside the "Verify, don't recall" paragraph, to the full divergence table in spec
section 12 — the build tool, the absent vitest browser tier, the `--color-` token prefix, the missing
ButtonGroup hook points, and the two divergences reaffirmed for this spec. `SKILL.md` sends agents to
`heroui/` to check patterns; it has to also tell them where the known-correct differences are written
down, or every one of them reads as a bug.

- [ ] **Step 7: Run the test to verify it passes**

Run: `pnpm test:ai`
Expected: PASS, all four tests.

- [ ] **Step 8: Commit**

```bash
git add scripts/skill-rules.test.mjs .agents/skills/peakui-component-standards AGENTS.md CLAUDE.md
git commit -m "docs(skills): привести три правила стандарта к фактическому поведению эталона"
```

---

### Task 2: Correct the `forwardRef` convention in the curator repository

**Files:**
- Modify: `../docs/ecosystem/conventions.md:33-34` (in `peakui-company`)
- Test: none — a prose correction in a different repository; verified by reading and by the curator's own sync hook.

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. This removes a contradiction that would otherwise make Task 11 violate a cross-product convention.

- [ ] **Step 1: Correct the two TypeScript bullets, in Russian, in place**

In `peakui-company/docs/ecosystem/conventions.md`, the bullets `компоненты — forwardRef с обязательным
displayName` and `публичный ref-API — через useImperativeHandle` are replaced with the React 19 rule:
`ref` is an ordinary prop, `displayName` only where it is not inferred. Russian, because the file is
listed for legacy translation in `docs/ecosystem/backlog.md` and translating it here would start a
half migration.

- [ ] **Step 2: Verify nothing else in the curator repo still mandates `forwardRef`**

Run: `cd .. && grep -rn "forwardRef\|useImperativeHandle" docs/ AGENTS.md CLAUDE.md`
Expected: no matches.

- [ ] **Step 3: Run the curator's sync gate**

Run: `cd .. && node scripts/check-agents-sync.mjs`
Expected: PASS. (`conventions.md` is not `CLAUDE.md`, so this should be unaffected; run it because the hook will.)

- [ ] **Step 4: Commit in `peakui-company`, not in `peakui`**

```bash
cd .. && git add docs/ecosystem/conventions.md
git commit -m "docs(ecosystem): ref — обычный проп, конвенция отстала от React 19"
```

---

### Task 3: `packages/standard` — ESLint and Prettier presets

**Files:**
- Create: `packages/standard/package.json`, `eslint/base.mjs`, `eslint/react.mjs`, `prettier/base.mjs`, `README.md`
- Create: `eslint.config.mjs`, `prettier.config.mjs` (repository root)
- Modify: `package.json` (root) — `lint`, `format`, `format:fix` scripts and the plugin devDependencies
- Modify: `packages/styles/package.json`, `apps/storybook/package.json` — a `lint` script each
- Test: the lint run itself, over the two packages that already exist

**Interfaces:**
- Consumes: nothing.
- Produces: `@peakui/standard/eslint/base.mjs`, `@peakui/standard/eslint/react.mjs` (both default-export a flat config array), `@peakui/standard/prettier/base.mjs` (default-exports a Prettier config object). Resolved through Node's legacy subpath resolution — the package deliberately has **no** `exports` map, which is how the reference does it.

- [ ] **Step 1: Write the failing check**

There is no unit test for a lint config; the deliverable is proved by running it. Add to the root
`package.json`:

```json
"lint": "eslint . --max-warnings=0",
"format": "prettier --check .",
"format:fix": "prettier --write ."
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm lint`
Expected: FAIL — `eslint.config.mjs` does not exist.

- [ ] **Step 3: Create `packages/standard`**

`package.json`: `{"name": "@peakui/standard", "private": true, "version": "0.0.0", "type": "module"}`,
no `exports` map, no dependencies.

`eslint/base.mjs` — port the reference's `packages/standard/eslint/base.mjs` with one deliberate
change: `@typescript-eslint/no-explicit-any` stays at **`"error"`** where the reference sets it
`"off"`. This is the mechanism that keeps Task 1's relaxation narrow. Keep the rest: `import/order`
with its path groups, `consistent-type-imports`, `unused-imports`, `sort-keys-fix`,
`padding-line-between-statements`, `object-curly-spacing: never`, `prettier/prettier`, and the
ignores list.

`eslint/react.mjs` — port the reference's, including its one override with its reason:
`react-hooks/rules-of-hooks` off for `**/*.stories.tsx`, because Storybook `render:` callbacks are
lowercase and the plugin cannot recognise them as components.

`prettier/base.mjs` — port verbatim: `printWidth: 100`, `bracketSpacing: false`,
`arrowParens: "always"`, `trailingComma: "all"`, `semi: true`, `singleQuote: false`, `tabWidth: 2`,
`endOfLine: "auto"`, `jsxSingleQuote: false`, `bracketSameLine: false`.

- [ ] **Step 4: Wire the root**

Root `eslint.config.mjs` re-exports `@peakui/standard/eslint/react.mjs`; root `prettier.config.mjs`
re-exports `@peakui/standard/prettier/base.mjs`. Add the plugins as root devDependencies at the
reference's versions: `eslint` 9.39.2, `@eslint/js` 9.39.2, `typescript-eslint` 8.70.0,
`@typescript-eslint/parser` 8.70.0, `@typescript-eslint/eslint-plugin` 8.70.0,
`eslint-config-prettier` 10.1.8, `eslint-plugin-import` 2.32.0, `eslint-plugin-jsx-a11y` 6.10.2,
`eslint-plugin-only-warn` 1.2.1, `eslint-plugin-prettier` 5.5.6, `eslint-plugin-react` 7.37.5,
`eslint-plugin-react-hooks` 7.0.1, `eslint-plugin-react-refresh` 0.5.7,
`eslint-plugin-sort-destructure-keys` 2.0.0, `eslint-plugin-sort-keys-fix` 1.1.2,
`eslint-plugin-storybook` 10.6.0, `eslint-plugin-unused-imports` 4.4.1, `globals` 16.5.0,
`prettier` 3.9.7, and `@peakui/standard` as `workspace:*`.

**The TypeScript baseline does not move.** `tsconfig.base.json` stays at the repository root. Do not
create `packages/standard/tsconfig/`.

- [ ] **Step 5: Run lint and format over the existing code and fix what they find**

Run: `pnpm install && pnpm lint && pnpm format`
Expected: PASS. Existing code in `packages/styles` and `apps/storybook` has never been linted, so
expect import-order and formatting churn. Fix it with `pnpm format:fix` and by hand for lint errors.
**Do not weaken a rule to make existing code pass** — if a rule is genuinely wrong for this
repository, say so and stop for a decision.

- [ ] **Step 6: Verify the existing gates still pass after the formatting churn**

Run: `pnpm typecheck && pnpm test && pnpm check:tokens && pnpm lint:package`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/standard eslint.config.mjs prettier.config.mjs package.json packages/styles apps/storybook pnpm-lock.yaml
git commit -m "feat(standard): пресеты ESLint 9 и Prettier, pnpm lint и format"
```

---

### Task 4: `packages/testing` — jsdom setup and test helpers

**Files:**
- Create: `packages/testing/package.json`, `configs/base.mjs`, `configs/react.mjs`, `setup/react.ts`, `helpers/index.ts`, `helpers/render.ts`, `helpers/user.ts`, `helpers/ssr.ts`, `globals.d.ts`, `tsconfig.json`, `vitest.config.ts`
- Test: `packages/testing/tests/helpers.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces, all from `@peakui/testing/helpers`:
  - `render(ui: ReactElement, options?: PeakUIRenderOptions)` → `@testing-library/react`'s `RenderResult`
  - `setupUser(options?: SetupUserOptions)` → a `userEvent` instance configured `{delay: null, pointerMap}`
  - `ssrSmoke(ui: ReactElement, options?: SsrSmokeOptions)` → `Promise<{html: string}>`; asserts no hydration error
  - re-exports `act`, `cleanup`, `fireEvent`, `screen`, `waitFor`, `within`, type `RenderResult` from `@testing-library/react`, and `installPointerEvent`, `pointerMap`, `User` from `@react-aria/test-utils`
  - `@peakui/testing/configs/react` exports `uiConfig`, a vitest config with `environment: "jsdom"`, `globals: true`, and `setup/react.ts` as a setup file

- [ ] **Step 1: Write the failing test**

`packages/testing/tests/helpers.test.tsx` proves the helpers work on plain DOM, with no component of
ours involved — which is what makes this task independently testable:

```tsx
import {render, screen, setupUser, ssrSmoke} from "../helpers/index.ts";

describe("testing helpers", () => {
  it("renders and queries by role", () => {
    render(<button type="button">Save</button>);
    expect(screen.getByRole("button", {name: "Save"})).toBeInTheDocument();
  });

  it("drives a pointer press through the RAC pointer map", async () => {
    const user = setupUser();
    const onClick = vi.fn();

    render(<button onClick={onClick} type="button">Save</button>);
    await user.click(screen.getByRole("button", {name: "Save"}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("installs the jsdom gaps RAC needs", () => {
    expect(typeof globalThis.ResizeObserver).toBe("function");
    expect(typeof window.matchMedia).toBe("function");
    expect(typeof document.elementFromPoint).toBe("function");
    expect(typeof Element.prototype.getAnimations).toBe("function");
    expect(typeof globalThis.PointerEvent).toBe("function");
  });

  it("hydrates server HTML without a mismatch", async () => {
    const {html} = await ssrSmoke(<button type="button">Save</button>);
    expect(html).toContain("Save");
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/testing test`
Expected: FAIL — the package does not exist.

- [ ] **Step 3: Create the package manifest and configs**

`package.json`: `@peakui/testing`, `private: true`, `version: "0.0.0"`, `type: "module"`, no
`exports` map (legacy subpath resolution, as `@peakui/standard`). Dependencies at the reference's
versions: `@react-aria/test-utils` 1.0.0-rc.1, `@testing-library/dom` 10.4.2,
`@testing-library/jest-dom` 7.0.1, `@testing-library/react` 16.3.3,
`@testing-library/user-event` 14.6.7, `jsdom` 30.0.1. Peers: `react` >=19.0.0, `react-dom` >=19.0.0,
`vitest` ^3.2.4.

`configs/base.mjs` exports `baseConfig` with `passWithNoTests: true` and coverage off by default.
`configs/react.mjs` exports `uiConfig = mergeConfig(baseConfig, …)` with `environment: "jsdom"`,
`globals: true`, and `setupFiles: [join(import.meta.dirname, "../setup/react.ts")]`.

**No browser tier.** Do not port `configs/browser.mjs`, `setup/browser.ts` or `helpers/browser.ts`;
peakui's browser tier is Playwright in `apps/storybook/e2e/`.

- [ ] **Step 4: Implement `setup/react.ts`**

Port the reference's file. It calls `installPointerEvent()` from `@react-aria/test-utils` because
`usePress` needs `PointerEvent` in jsdom, imports `@testing-library/jest-dom/vitest`, and installs
the four jsdom gaps the test above asserts: a no-op `ResizeObserver` class, a `matchMedia` stub
returning `matches: false`, `document.elementFromPoint` returning `null`, and
`Element.prototype.getAnimations` returning `[]`. Each guarded by a `typeof … === "undefined"` check.

- [ ] **Step 5: Implement the three helpers**

`helpers/render.ts` — `render` wrapping `rtlRender`, accepting a `wrapper` as a function component.
`helpers/user.ts` — `setupUser` calling `userEvent.setup({delay: null, pointerMap, ...options})`.
`helpers/ssr.ts` — `ssrSmoke`: `renderToString`, assert non-empty, put the HTML in a detached
container, `hydrateRoot` inside `act`, capture `console.error`, and fail if any captured message
matches the hydration pattern `/Hydration|did not match|Text content does not match|Expected server
HTML|Minified React error #(418|419|422|423|425)/i`. Restore `console.error`, `setTimeout` and
`setInterval`, clear stray timers, unmount and remove the container in a `finally`. Port the
reference's implementation — the timer capture exists because jsdom tears down before RAC's
hydration timers fire.

`helpers/index.ts` — the barrel listed in the Interfaces block.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @peakui/testing test`
Expected: PASS, all four tests.

- [ ] **Step 7: Commit**

```bash
git add packages/testing pnpm-lock.yaml
git commit -m "feat(testing): jsdom-настройка для RAC и хелперы render, setupUser, ssrSmoke"
```

---

### Task 5: `packages/react` skeleton and `utils/compose.ts`

**Files:**
- Create: `packages/react/package.json`, `tsconfig.json`, `vitest.config.ts`, `eslint.config.mjs`, `src/index.ts`, `src/components/index.ts`, `src/utils/index.ts`, `src/utils/compose.ts`
- Test: `packages/react/tests/utils/compose.test.ts`

**Interfaces:**
- Consumes: `@peakui/testing/configs/react` (Task 4).
- Produces:
  - `composeTwRenderProps<T>(className: string | ((v: T) => string) | undefined, tailwind?: string | ((v: T) => string | undefined)): string | ((v: T) => string)`, re-exported from `packages/react/src/utils/index.ts`

**One deliberate narrowing of the spec.** Spec section 5 lists `compose.ts` as carrying
`composeSlotClassName` as well. Neither Button nor Spinner has slots, so nothing in this plan would
call it, and writing it now contradicts the same YAGNI the spec applies to `assertion.ts` and
`hooks/` two paragraphs later. It arrives with the first multi-slot component. Flagged here rather
than silently skipped.

- [ ] **Step 1: Write the failing test**

`packages/react/tests/utils/compose.test.ts`. The first two cases are Review Focus items 1 and 2:

```ts
import {composeTwRenderProps} from "@/utils/compose";

describe("composeTwRenderProps", () => {
  it("merges a consumer string className with the library classes", () => {
    const composed = composeTwRenderProps("mt-4", "button button--primary");

    expect(typeof composed === "function" ? composed({} as never) : composed)
      .toEqual(expect.stringContaining("button button--primary"));
    expect(typeof composed === "function" ? composed({} as never) : composed)
      .toEqual(expect.stringContaining("mt-4"));
  });

  it("accepts a function className and passes render props to it", () => {
    const composed = composeTwRenderProps(
      ({isPressed}: {isPressed: boolean}) => (isPressed ? "pressed" : "idle"),
      "button",
    );
    const result = typeof composed === "function" ? composed({isPressed: true}) : composed;

    expect(result).toEqual(expect.stringContaining("button"));
    expect(result).toEqual(expect.stringContaining("pressed"));
    expect(result).not.toEqual(expect.stringContaining("[object Object]"));
  });

  it("returns the library classes unchanged when no className is given", () => {
    const composed = composeTwRenderProps(undefined, "button button--md");

    expect(typeof composed === "function" ? composed({} as never) : composed)
      .toEqual(expect.stringContaining("button button--md"));
  });

  it("accepts a function for the library classes", () => {
    const composed = composeTwRenderProps(undefined, () => "button button--lg");

    expect(typeof composed === "function" ? composed({} as never) : composed)
      .toEqual(expect.stringContaining("button--lg"));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/react test`
Expected: FAIL — the package does not exist.

- [ ] **Step 3: Create the package manifest**

`@peakui/react`, `version: "0.0.0"`, `type: "module"`, `sideEffects: false`. Dependencies:
`@peakui/styles` `workspace:*`, `tailwind-variants` ^3.3.1. Peers: `react` >=19.0.0,
`react-dom` >=19.0.0, `react-aria-components` ^1.21.1, `@react-aria/utils` ^3.34.1 (Task 6 needs
`mergeRefs` and `useLayoutEffect` from it). Dev: `@peakui/testing` `workspace:*`,
`@peakui/standard` `workspace:*`, `@vitejs/plugin-react` ^6.1.1, `vitest` ^3.2.4, `typescript` 5.9.3,
`publint` ^0.3.0, `@arethetypeswrong/cli` ^0.18.0, `@types/react` ^19.3.0, `@types/react-dom` ^19.3.0.

Scripts: `test`, `test:coverage`, `typecheck`, `lint`, `lint:package`. `build` arrives in Task 7.

In-repo `exports`: `"."` → `./src/index.ts` for `types`, `import` and `default`; plus
`"./package.json"`. The publish-time rewrite to `dist` is release mechanics and out of scope.

- [ ] **Step 4: Create `tsconfig.json`, `vitest.config.ts` and `eslint.config.mjs`**

`tsconfig.json` extends `../../tsconfig.base.json`, adds `"jsx": "preserve"`, the `@/*` → `./src/*`
path alias, `"noEmit": true`, and `include: ["src", "tests", "../testing/globals.d.ts"]`.

`vitest.config.ts` merges `uiConfig` from `@peakui/testing/configs/react` with the `react()` plugin,
the `@` alias pointing at `src`, `include: ["tests/**/*.{test,ssr.test}.{ts,tsx}"]` and
`passWithNoTests: false`. **A single project** — no `react-browser` project, unlike the reference.

`eslint.config.mjs` re-exports `@peakui/standard/eslint/react.mjs`.

- [ ] **Step 5: Implement `composeTwRenderProps` in `src/utils/compose.ts`**

`"use client"` at the top. `composeTwRenderProps` wraps `composeRenderProps` from
`react-aria-components` and joins with `cx` from `tailwind-variants`. Port the reference's
implementation but **do not** re-export `disabledClasses` / `focusRingClasses` /
`ariaDisabledClasses`: those utilities stay CSS-native in peakui, a divergence recorded in the spec
section 12.

`src/utils/index.ts` re-exports from `./compose.ts`. `src/components/index.ts` is created empty with
a comment that Task 10 adds the first entry. `src/index.ts` re-exports
`./components/index.ts`, `./utils/index.ts`, and `{cn, tv, type VariantProps}` from
`tailwind-variants`, mirroring `@peakui/styles`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm --filter @peakui/react test && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/react pnpm-lock.yaml
git commit -m "feat(react): каркас пакета и composeTwRenderProps"
```

---

### Task 6: `utils/dom.tsx` — the `render`-prop element helper

**Files:**
- Create: `packages/react/src/utils/dom.tsx`
- Modify: `packages/react/src/utils/index.ts`
- Test: `packages/react/tests/utils/dom.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type DOMRenderFunction<E extends keyof JSX.IntrinsicElements, T> = (props: JSX.IntrinsicElements[E], renderProps: T) => ReactElement`
  - `interface DOMRenderProps<E, T> { render?: DOMRenderFunction<E, T> }`
  - `dom` — a `Proxy` yielding a component per intrinsic element, so `dom.span` renders a `<span>`
  - Task 10 consumes `dom.span` and `DOMRenderProps`.

- [ ] **Step 1: Write the failing test**

```tsx
import {createRef} from "react";

import {render, screen} from "@peakui/testing/helpers";

import {dom} from "@/utils/dom";

describe("dom", () => {
  it("renders the intrinsic element it is addressed as", () => {
    render(<dom.span data-testid="el">text</dom.span>);
    expect(screen.getByTestId("el").tagName).toBe("SPAN");
  });

  it("caches the component per element type", () => {
    expect(dom.span).toBe(dom.span);
    expect(dom.span).not.toBe(dom.div);
  });

  it("lets a render prop replace the element and receive the props", () => {
    render(
      <dom.span
        data-testid="el"
        render={(props) => <em {...props} data-rendered="true" />}
      >
        text
      </dom.span>,
    );
    const el = screen.getByTestId("el");

    expect(el.tagName).toBe("EM");
    expect(el).toHaveAttribute("data-rendered", "true");
  });

  it("forwards ref to the default element", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<dom.span ref={ref}>text</dom.span>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards ref through a render prop that passes props through", () => {
    const ref = createRef<HTMLElement>();

    render(<dom.span ref={ref} render={(props) => <em {...props} />}>text</dom.span>);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/react test tests/utils/dom.test.tsx`
Expected: FAIL with a module-not-found error for `@/utils/dom`.

- [ ] **Step 3: Implement `dom.tsx`**

`"use client"` at the top. Port the reference's `src/utils/dom.tsx`, keeping its provenance comment —
it is lifted from `react-aria-components`' internal `utils.tsx` and should be replaced with a direct
import once RAC exports it. An internal `DOMElement(ElementType, props)` merges the forwarded ref
with a local one via `mergeRefs`, warns in non-production when a `render` function did not connect
the ref, and either calls `render(domProps)` or renders `<ElementType {...domProps} />`. `dom` is a
`Proxy` over `{}` whose `get` binds and caches `DOMElement` per element-type string.

This file is the one permitted `any` site in the package: the `DOMComponents` mapped type and the
`DOMElement` props cannot express the per-element union. Each occurrence carries a comment and an
inline `eslint-disable-next-line @typescript-eslint/no-explicit-any`, per Task 1.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @peakui/react test && pnpm typecheck && pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/react
git commit -m "feat(react): dom.* — элемент с render-пропом, портировано из RAC"
```

---

### Task 7: `tsdown` build and the `"use client"` directive gate

**Files:**
- Create: `packages/react/tsdown.config.ts`, `packages/react/scripts/require-client-directives.ts`
- Modify: `packages/react/package.json` — `build` script and `tsdown` devDependency
- Modify: `package.json` (root) — `build`, `build:packages`, `test:coverage` scripts
- Test: `packages/react/tests/build/require-client-directives.test.ts`

**Interfaces:**
- Consumes: `src/utils/compose.ts` and `src/utils/dom.tsx` (Tasks 5, 6) as the modules that declare `"use client"` and must still declare it after the build.
- Produces: `requireClientDirectives()` — a `tsdown`/Rolldown plugin whose `writeBundle` hook throws when an emitted chunk's source module declared `"use client"` and the output does not begin with it. Exported for the test to call directly.

- [ ] **Step 1: Verify the `tsdown` surface before writing config against it**

Run: `pnpm --filter @peakui/react add -D tsdown && pnpm --filter @peakui/react exec tsdown --help`
Expected: the help text names the unbundle/per-module output option and the dts option. **Record the
exact option names in the commit message.** The spec took them from documentation, not from a run.
If unbundle output cannot preserve the directive at all, stop and report — that is a bundler
decision, not something to work around.

- [ ] **Step 2: Write the failing test for the gate**

```ts
import {requireClientDirectives} from "../../scripts/require-client-directives.ts";

const chunk = (code: string) => ({type: "chunk", code, fileName: "utils/compose.js"});

describe("requireClientDirectives", () => {
  it("passes a chunk that kept the directive", () => {
    const plugin = requireClientDirectives();

    expect(() =>
      plugin.check({"utils/compose.js": chunk('"use client";\nexport const a = 1;')}, new Set(["utils/compose.js"])),
    ).not.toThrow();
  });

  it("throws naming the file when the directive was dropped", () => {
    const plugin = requireClientDirectives();

    expect(() =>
      plugin.check({"utils/compose.js": chunk("export const a = 1;")}, new Set(["utils/compose.js"])),
    ).toThrow(/utils\/compose\.js/);
  });

  it("ignores a chunk whose source never declared the directive", () => {
    const plugin = requireClientDirectives();

    expect(() =>
      plugin.check({"utils/index.js": chunk("export const a = 1;")}, new Set()),
    ).not.toThrow();
  });
});
```

- [ ] **Step 3: Run it to make sure it fails**

Run: `pnpm --filter @peakui/react test tests/build/require-client-directives.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `requireClientDirectives()` in `scripts/require-client-directives.ts`**

Export a factory returning an object with a pure `check(bundle, clientModules)` method — pure so the
test above can call it without running a build — and a `writeBundle` hook that calls `check`. The set
of client modules is collected in `transform` by testing each module's source for a leading
`"use client"` directive. `check` throws an `Error` listing every offending `fileName`.

- [ ] **Step 5: Write `tsdown.config.ts` and the build script**

Unbundle mode (one output file per source module), ESM output, declarations on, `src/index.ts` plus
each `src/components/*/index.ts` as entries, `requireClientDirectives()` in the plugin list. External:
every peer and dependency. Add `"build": "tsdown"` to the package and
`"build:packages": "pnpm -r --filter './packages/*' build"`, `"build": "pnpm build:packages"`,
`"test:coverage": "pnpm -r test:coverage"` to the root — the three commands `AGENTS.md` promised
would arrive with this package.

- [ ] **Step 6: Run the build and confirm the directive survived a real run**

Run: `pnpm --filter @peakui/react build && head -1 packages/react/dist/utils/compose.js`
Expected: the build succeeds and the first line is `"use client";`. Then delete `dist` and confirm
`.gitignore` covers it.

- [ ] **Step 7: Run the packaging gate**

Run: `pnpm --filter @peakui/react lint:package`
Expected: PASS. `publint --strict` and `attw --profile esm-only` on TypeScript-source entry points is
the shape `packages/styles` already solved with `--exclude-entrypoints`; apply the same treatment and
report if a deeper packaging decision is needed.

- [ ] **Step 8: Commit**

```bash
git add packages/react package.json .gitignore pnpm-lock.yaml
git commit -m "build(react): tsdown в unbundle-режиме и гейт на потерянный use client"
```

---

### Task 8: Spinner's style layer in `@peakui/styles`

**Files:**
- Create: `packages/styles/src/components/spinner/spinner.styles.ts`, `packages/styles/src/components/spinner/index.ts`, `packages/styles/components/spinner.css`
- Modify: `packages/styles/src/components/index.ts`, `packages/styles/components/index.css`
- Test: `packages/styles/src/components/spinner/spinner.styles.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `spinnerVariants` and type `SpinnerVariants` from `@peakui/styles` and from `@peakui/styles/components/spinner`. Variants: `size` → `sm | md | lg | xl`, `color` → `current | accent | danger | success | warning`, defaults `{color: "accent", size: "md"}`. Task 10 consumes both.

- [ ] **Step 1: Write the failing test**

Mirror `button.styles.test.ts`. Assert the base name, that each variant value maps to its BEM
modifier, that the defaults are applied when nothing is passed, and that `md` maps to the name
`spinner--md` even though its CSS rule is empty.

```ts
import {spinnerVariants} from "./spinner.styles.ts";

describe("spinnerVariants", () => {
  it("applies the default color and size", () => {
    expect(spinnerVariants()).toBe("spinner spinner--accent spinner--md");
  });

  it.each(["current", "accent", "danger", "success", "warning"] as const)(
    "maps color %s to its modifier",
    (color) => {
      expect(spinnerVariants({color})).toEqual(expect.stringContaining(`spinner--${color}`));
    },
  );

  it.each(["sm", "md", "lg", "xl"] as const)("maps size %s to its modifier", (size) => {
    expect(spinnerVariants({size})).toEqual(expect.stringContaining(`spinner--${size}`));
  });
});
```

The exact class order in the first assertion comes from `tailwind-variants`; if it differs, match
what the library emits rather than reordering the variant definition.

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/styles test`
Expected: FAIL — module not found, **and** the barrel completeness gate in
`src/components/index.test.ts` now fails too, because the directory exists without a barrel entry or
a paired CSS file. Both failures are the gate working.

- [ ] **Step 3: Implement `spinner.styles.ts` and its barrel file**

`tv({base: "spinner", variants: {...}, defaultVariants: {color: "accent", size: "md"}})`, BEM names
only, no Tailwind utility anywhere in the file. `index.ts` is
`export * from "./spinner.styles.ts";`. Add `export * from "./spinner/index.ts";` to
`src/components/index.ts`.

- [ ] **Step 4: Write `components/spinner.css` and import it from the components layer**

`.spinner` carries the default size and the animation:
`@apply pointer-events-none inline-flex size-6 shrink-0 animate-spin-fast motion-reduce:animate-none;`
— `--animate-spin-fast` already exists at `themes/shared/theme.css:170`. Sizes: `sm` → `size-4`,
`md` → an **empty rule** with a comment that the default lives in `.spinner`, `lg` → `size-8`,
`xl` → `size-10`. Colours: `current` → `color: inherit`, the other four →
`color: var(--color-accent | --color-danger | --color-success | --color-warning)`. These are peakui's
token names, mapped in `@theme` at `themes/shared/theme.css:43-55`; the reference's bare
`var(--accent)` is the same token under a different name.

Add `@import "./spinner.css";` to `components/index.css`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @peakui/styles test && pnpm check:tokens && pnpm lint`
Expected: PASS, including the barrel completeness gate, which now sees Spinner re-exported and
CSS-paired.

- [ ] **Step 6: Commit**

```bash
git add packages/styles
git commit -m "feat(styles): стилевой слой Spinner — четыре размера и пять цветов"
```

---

### Task 9: The pending state's style layer

**Files:**
- Modify: `packages/styles/utilities/index.css`
- Modify: `packages/styles/components/button.css`
- Test: `packages/styles/src/components/button/button.pending.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the `status-pending` utility and `.button[data-pending="true"]` behaviour. No JS symbols — `isPending` reaches the DOM from the RAC primitive in Task 11, not from a variant.

- [ ] **Step 1: Write the failing test**

A content gate in the idiom the barrel gate already uses, because the styles package runs in `node`
and cannot compute styles. The behavioural proof is the e2e assertion in Task 12, which this step
does not replace.

```ts
import {readFileSync} from "node:fs";

const utilities = readFileSync("utilities/index.css", "utf8");
const buttonCss = readFileSync("components/button.css", "utf8");

describe("pending state", () => {
  it("declares the status-pending utility", () => {
    expect(utilities).toMatch(/@utility status-pending \{/);
  });

  it("applies it from the button's data-pending state", () => {
    expect(buttonCss).toMatch(/&\[data-pending="true"\]\s*\{[^}]*@apply status-pending;/);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm --filter @peakui/styles test`
Expected: FAIL on both assertions.

- [ ] **Step 3: Add the utility and the rule**

`utilities/index.css` gains `@utility status-pending { pointer-events: none; }`, beside
`status-disabled`, with a Russian comment matching the file's existing voice — the file is legacy
Russian and must not be translated here.

`button.css` gains `&[data-pending="true"] { @apply status-pending; }` inside `.button`, placed with
the other state rules. **Only that.** No `position: relative`, no absolute-centred indicator, no
fading of button content: the owner chose the reference's shape, and the indicator is the consumer's
to place.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter @peakui/styles test && pnpm check:tokens`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/styles
git commit -m "feat(styles): состояние pending у Button и утилита status-pending"
```

---

### Task 10: Spinner

**Files:**
- Create: `packages/react/src/components/spinner/spinner.tsx`, `packages/react/src/components/spinner/index.ts`
- Modify: `packages/react/src/components/index.ts`
- Test: `packages/react/tests/components/spinner/spinner.test.tsx`, `packages/react/tests/components/spinner/spinner.ssr.test.tsx`, `packages/react/tests/components/index.test.ts`

**Interfaces:**
- Consumes: `dom`, `DOMRenderProps` (Task 6); `spinnerVariants`, `SpinnerVariants` (Task 8); `render`, `screen`, `ssrSmoke` (Task 4).
- Produces:
  - `SpinnerRoot` — renders `dom.span` with `role="status"`, `aria-label="Loading"`, `data-slot="spinner"`, containing an `aria-hidden` `<svg data-slot="spinner-icon">`
  - `SpinnerRootProps<E>` and the alias `SpinnerProps`
  - `Spinner = Object.assign(SpinnerRoot, {Root: SpinnerRoot})`, plus the `Spinner` type with `Props` and `RootProps`
  - re-exports `spinnerVariants` / `SpinnerVariants` from `@peakui/styles`
  - Task 11's story consumes `Spinner`.

- [ ] **Step 1: Write the failing tests**

`spinner.test.tsx` ports the reference's five cases — status role with the default name, BEM block
plus `data-slot` plus the icon sub-part, `aria-label` override, colour and size modifiers, `data-*`
passthrough — and adds Review Focus items 3 and 4:

```tsx
it("forwards ref to the rendered element", () => {
  const ref = createRef<HTMLSpanElement>();

  render(<Spinner ref={ref} />);
  expect(ref.current).toBeInstanceOf(HTMLSpanElement);
});

it("gives each instance its own gradient ids", () => {
  render(
    <>
      <Spinner data-testid="first" />
      <Spinner data-testid="second" />
    </>,
  );

  const ids = (testId: string) =>
    [...screen.getByTestId(testId).querySelectorAll("linearGradient")].map((node) => node.id);

  expect(ids("first")).toHaveLength(2);
  expect(new Set([...ids("first"), ...ids("second")]).size).toBe(4);
});
```

`spinner.ssr.test.tsx` ports the reference's two cases, asserting the gradient markup survives
`renderToString` → `hydrateRoot`.

`tests/components/index.test.ts` is the barrel completeness gate, ported from
`packages/styles/src/components/index.test.ts`: read `src/components` directory names from the
filesystem, assert `src/components/index.ts` contains
`export * from "./<name>/index.ts";` for each, strip comments before matching, and keep the
"does not pass vacuously on an empty set" guard that file opens with. Drop the paired-CSS half — CSS
lives in `@peakui/styles` and that gate already covers it.

- [ ] **Step 2: Run them to make sure they fail**

Run: `pnpm --filter @peakui/react test`
Expected: FAIL — `@/components/spinner` not found, and the barrel gate fails on the un-exported
directory.

- [ ] **Step 3: Implement `spinner.tsx`**

`"use client"`. An internal `SpinnerPrimitive` renders the `<svg viewBox="0 0 24 24">` with
`data-slot="spinner-icon"` and two `linearGradient` definitions whose ids are suffixed with
`useId()`, which is what keeps two spinners on one page from colliding. Copy the reference's two
gradient stops and two `path` elements verbatim — they are the artwork, not logic.

`SpinnerRoot<E extends keyof JSX.IntrinsicElements = "span">` takes `className`, `color`, `size` and
`DOMRenderProps<E, undefined>`, and renders `dom.span` with `aria-label="Loading"`,
`data-slot="spinner"`, `role="status"`, the props spread **after** `aria-label` so a consumer
override wins, and `className={spinnerVariants({className, color, size})}`.

- [ ] **Step 4: Write `index.ts` with all three export sections**

The three sections exactly as the Interfaces block names them. A leaf still ships the full shape:
`Object.assign(SpinnerRoot, {Root: SpinnerRoot})`. Add
`export * from "./spinner/index.ts";` to `src/components/index.ts`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter @peakui/react test && pnpm typecheck && pnpm lint && pnpm --filter @peakui/react build`
Expected: PASS, and the build's directive gate stays green with a component in the bundle.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): компонент Spinner и гейт полноты бочки"
```

---

### Task 11: Button

**Files:**
- Create: `packages/react/src/components/button/button.tsx`, `packages/react/src/components/button/index.ts`
- Modify: `packages/react/src/components/index.ts`
- Test: `packages/react/tests/components/button/button.test.tsx`, `packages/react/tests/components/button/button.ssr.test.tsx`

**Interfaces:**
- Consumes: `composeTwRenderProps` (Task 5); `buttonVariants`, `ButtonVariants` from `@peakui/styles`; `render`, `screen`, `setupUser`, `fireEvent`, `ssrSmoke` (Task 4).
- Produces:
  - `ButtonRoot` — `react-aria-components/Button` with `data-slot="button"` and the BEM classes
  - `ButtonRootProps extends ComponentPropsWithRef<typeof ButtonPrimitive>, ButtonVariants`, and the alias `ButtonProps`
  - `Button = Object.assign(ButtonRoot, {Root: ButtonRoot})`, plus the `Button` type with `Props` and `RootProps`
  - re-exports `buttonVariants` / `ButtonVariants` from `@peakui/styles`

- [ ] **Step 1: Write the failing tests**

`button.test.tsx` ports the reference's twelve cases: role and accessible name; BEM block plus
`data-slot`; variant modifier; `data-*` passthrough; hover sets and clears `data-hovered`; press sets
and clears `data-pressed`; `onPress` on click; Tab gives `data-focus-visible` and tabbing away clears
it; `isDisabled` disables, sets `data-disabled` and blocks `onPress`; a disabled button exposes no
hover state; Enter and Space activate; render-prop children react to `isPressed`.

jsdom needs RAC's pointer sequence spelled out, as the reference's file does:

```tsx
const pointerOpts = {button: 0, pointerId: 1, pointerType: "mouse", clientX: 1, clientY: 1} as const;
const pressDown = (el: HTMLElement) => fireEvent.pointerDown(el, pointerOpts);
const pressUp = (el: HTMLElement) => {
  fireEvent.pointerUp(el, pointerOpts);
  fireEvent.click(el, {button: 0});
};
```

Add Review Focus items 1, 3 and 5:

```tsx
it("merges a consumer className with the BEM names", () => {
  render(<Button className="mt-4">Save</Button>);
  const button = screen.getByRole("button", {name: "Save"});

  expect(button.className).toEqual(expect.stringContaining("button--primary"));
  expect(button.className).toEqual(expect.stringContaining("mt-4"));
});

it("forwards ref to the button element", () => {
  const ref = createRef<HTMLButtonElement>();

  render(<Button ref={ref}>Save</Button>);
  expect(ref.current).toBeInstanceOf(HTMLButtonElement);
});

it("blocks activation while pending but stays focusable", async () => {
  const user = setupUser();
  const onPress = vi.fn();

  render(<Button isPending onPress={onPress}>Save</Button>);
  const button = screen.getByRole("button", {name: "Save"});

  expect(button).toHaveAttribute("data-pending", "true");

  await user.click(button);
  expect(onPress).not.toHaveBeenCalled();

  await user.tab();
  expect(button).toHaveFocus();
});

it("names an icon-only button from aria-label", () => {
  render(<Button isIconOnly aria-label="More options"><span aria-hidden>…</span></Button>);
  expect(screen.getByRole("button", {name: "More options"})).toBeInTheDocument();
});
```

`button.ssr.test.tsx` ports the reference's two cases: default renders containing
`data-slot="button"`, and disabled renders containing `data-disabled="true"`.

- [ ] **Step 2: Run them to make sure they fail**

Run: `pnpm --filter @peakui/react test tests/components/button`
Expected: FAIL — `@/components/button` not found.

- [ ] **Step 3: Implement `button.tsx`**

`"use client"`. Import the primitive as `Button as ButtonPrimitive` from
`react-aria-components/Button` — the deep import, as the reference does. `ButtonRoot` destructures
`children, className, fullWidth, isIconOnly, size, slot, style, variant` and spreads the rest,
computes `buttonVariants({fullWidth, isIconOnly, size, variant})`, and renders `ButtonPrimitive` with
`className={composeTwRenderProps(className, styles)}`, `data-slot="button"`, and children passed
through as a render prop when they are a function.

**Dropped from the reference in full:** `BUTTON_GROUP_CHILD`, `ButtonGroupContext`, and the
precedence merge of `size` / `variant` / `isDisabled` / `fullWidth` against group context. ButtonGroup
is out of scope and a hook point for a component that does not exist would be speculative. `isPending`
needs no code — it reaches the primitive through the spread, and its style comes from Task 9.

- [ ] **Step 4: Write `index.ts` with all three export sections**

As the Interfaces block names them, including the `ButtonRootProps as ButtonProps` alias. Add
`export * from "./button/index.ts";` to `src/components/index.ts`.

- [ ] **Step 5: Run the full suite and every gate**

Run: `pnpm --filter @peakui/react test && pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @peakui/react build && pnpm --filter @peakui/react lint:package`
Expected: PASS, including the barrel gate now seeing two components.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): компонент Button поверх примитива react-aria-components"
```

---

### Task 12: Stories, Storybook wiring, and the e2e audit

**Files:**
- Create: `packages/react/src/components/button/button.stories.tsx`, `packages/react/src/components/spinner/spinner.stories.tsx`
- Modify: `apps/storybook/package.json` — add `@peakui/react` as `workspace:*`
- Modify: `apps/storybook/e2e/Button.spec.ts` — add the React stories to the audit and rewrite the opening comment
- Test: the e2e suite itself

**Interfaces:**
- Consumes: `Button` (Task 11), `Spinner` (Task 10).
- Produces: story ids `components-button--*` and `components-spinner--*` for the e2e audit to address.

- [ ] **Step 1: Write the failing e2e assertions**

In `apps/storybook/e2e/Button.spec.ts`, add a `test.describe("Button — React-компонент")` block. Two
assertions that the style-layer tests cannot make, plus the axe audit over the new stories in both
themes:

```ts
test("pending-кнопка не принимает нажатие и остаётся фокусируемой", async ({page}) => {
  await page.goto("/iframe.html?id=components-button--pending&globals=theme:default-light");

  const button = page.getByRole("button", {name: "Сохраняем"});

  await expect(button).toHaveAttribute("data-pending", "true");
  await expect(button).toHaveCSS("pointer-events", "none");
  await button.focus();
  await expect(button).toBeFocused();
});
```

Extend the existing `STORIES` loop with `components-button--variants`,
`components-button--pending` and `components-spinner--sizes` so the axe audit covers them in
`default-light` and `default-dark`.

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test:e2e`
Expected: FAIL — the stories do not exist, so the iframe renders Storybook's "story not found".

- [ ] **Step 3: Add `@peakui/react` to the Storybook app**

`apps/storybook/package.json` gains `"@peakui/react": "workspace:*"`. `.storybook/main.ts` needs **no
change**: line 20 already carries the glob
`../../../packages/react/src/**/*.stories.@(ts|tsx)`, added before the package existed.

- [ ] **Step 4: Write the two story files**

`button.stories.tsx`, title `Components/Button`. The export names are the story ids step 1 addresses,
so they are fixed, not suggestions: `Variants` (all seven variants × three sizes),
`IconOnly` (with `aria-label` on every button), `FullWidth`, `Disabled`, and `Pending`. `Pending`
composes the indicator the way the reference and the RAC docs do —
`<Button isPending><Spinner color="current" size="sm" />Сохраняем</Button>` — and the accessible name
must be exactly `Сохраняем`, because step 1 queries by it. This story is the only place in the
repository that shows the intended `isPending` recipe, so comment it as such.

`spinner.stories.tsx`, title `Components/Spinner`, exports `Sizes` and `Colors`.

Stories are the one permitted default export. Keep the existing style-layer stories in
`apps/storybook/src/stories/button.stories.tsx` untouched — they are the standalone-CSS proof and are
not superseded by a React story.

- [ ] **Step 5: Rewrite the lie at the top of the e2e file**

`apps/storybook/e2e/Button.spec.ts` currently opens with «Button существует пока только как стилевой
слой: packages/react не создан, React-компонента нет». Replace it with a comment saying the file now
covers both tiers and why both still exist: the style-layer stories prove the framework-agnostic
promise, the React stories prove the component. Russian, matching the file.

- [ ] **Step 6: Run the e2e suite and every remaining gate**

Run: `pnpm build:storybook && pnpm test:e2e && pnpm typecheck && pnpm test && pnpm lint && pnpm format`
Expected: PASS. If axe reports a contrast violation on `accent-hover` or on `.button--outline`'s
border, that is one of the two inherited defects in spec section 13 — **do not fix it here**; confirm
it matches what `docs/ecosystem/backlog.md` already records and exclude it the way
`foundations.a11y.spec.ts` already excludes `.bg-accent-hover`, with a comment pointing at the
backlog.

- [ ] **Step 7: Commit**

```bash
git add packages/react apps/storybook pnpm-lock.yaml
git commit -m "feat(storybook): истории Button и Spinner, e2e покрывает React-ярус"
```

---

### Task 13: Make the agent files tell the truth

**Files:**
- Modify: `AGENTS.md` and `CLAUDE.md` — the Commands table and the `## Planned` section
- Test: `scripts/skill-rules.test.mjs` (extend)

**Interfaces:**
- Consumes: every package and command created by Tasks 3-12.
- Produces: nothing. This is the documentation gate the backlog describes, applied by hand to the items this plan delivered.

- [ ] **Step 1: Extend the failing test**

Add to `scripts/skill-rules.test.mjs`: every path named above `## Planned` exists on disk, and every
`pnpm` command named in the Commands table exists in the relevant `package.json`. This is the shape
`docs/ecosystem/backlog.md` describes under "Documentation gates" — applied here to the delivered
items rather than built as a general gate, which stays deferred.

```js
test("no delivered package is still listed as Planned", () => {
  const planned = read("AGENTS.md").split("## Planned")[1];
  for (const delivered of ["packages/react/", "packages/standard/"]) {
    assert.ok(!planned.includes(delivered), `${delivered} is delivered but still Planned`);
  }
});

test("every command in the Commands table exists", () => {
  const scripts = JSON.parse(read("package.json")).scripts;
  for (const name of ["build", "build:packages", "test:coverage", "lint", "format", "format:fix"]) {
    assert.ok(name in scripts, `root package.json is missing ${name}`);
  }
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `pnpm test:ai`
Expected: FAIL — `packages/react/` and `packages/standard/` are still in the Planned block.

- [ ] **Step 3: Update the Commands table and the Planned section**

Remove `packages/react/` and `packages/standard/` from Planned, and remove the sentences promising
`pnpm build`, `build:packages`, `test:coverage`, `lint`, `format` and `format:fix` — they exist now.
Add them to the Commands table. `packages/testing/` was never in Planned; add it to the Architecture
section's description of the test stack so a later agent does not re-invent it. `packages/codemodes/`,
`apps/docs/`, `.claude/agents/` and `.claude/guides/` stay Planned.

Copy `AGENTS.md` over `CLAUDE.md`.

- [ ] **Step 4: Resync CodeGraph so the next task's queries see the new packages**

Run: `pnpm codegraph:sync && pnpm codegraph explore button`
Expected: the index now reports the React component alongside the variant function. Quote the result
in the task summary — `AGENTS.md` requires it, and this plan's own first query predates the code.

- [ ] **Step 5: Run everything one last time**

Run: `pnpm test:ai && pnpm typecheck && pnpm test && pnpm lint && pnpm format && pnpm check:tokens && pnpm lint:package && pnpm build && pnpm build:storybook && pnpm test:e2e`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add AGENTS.md CLAUDE.md scripts/skill-rules.test.mjs
git commit -m "docs: packages/react и packages/standard больше не Planned"
```
