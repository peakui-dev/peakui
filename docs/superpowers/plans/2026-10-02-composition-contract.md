# Composition Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@peakui/styles` the public JS surface that makes framework-agnostic styling real, prove it with Button's style layer, and write the resulting contract into `peakui-component-standards`.

**Architecture:** `tv()` emits BEM class names from `@peakui/styles` (no React anywhere in that package); the Tailwind lives in `components/<name>.css`. A consumer on any framework calls `<name>Variants()` or writes the BEM classes by hand. Button ships its style layer only — `packages/react` is Planned and stays untouched.

**Tech Stack:** TypeScript 5.9, `tailwind-variants` 3.3, Tailwind v4, vitest 3, Storybook 9 (`@storybook/react-vite`), publint + `@arethetypeswrong/cli`.

**Spec:** `docs/superpowers/specs/2026-10-02-composition-contract-design.md`

## Global Constraints

- Every new document in **English**. Existing Russian content is legacy — leave it alone.
- Named exports only. The one exception is Storybook CSF, which reads a default export.
- No `any`. Literal unions, never bare `string`.
- Files kebab-case, matching the BEM block and the CSS file name.
- `tv()` contains **BEM class names only** — no Tailwind utility ever enters it on the library side.
- No literal colour in `components/*.css`. Reference a token; `pnpm check:tokens` enforces it.
- `sideEffects: false` stays true for `@peakui/styles`.
- Accessibility floor **WCAG 2.2 AA**. Base control height is `@apply h-10 md:h-9` — 40 px coarse pointer, 36 px fine.
- Every interactive state is written in **both** forms: pseudo-class **and** `data-*`.
- `motion-reduce:transition-none` comes **after** the `transition` declaration.
- Do not create `packages/react` or any `.tsx` component. Do not edit `heroui/` — a `protected-files` hook rejects it.
- Conventional commits, header ≤ 150 chars, Russian subjects allowed.
- **CodeGraph is not indexed in this clone** — `codegraph status` reports `Not initialized`, and the agent file forbids indexing on your own initiative. Do not route around it and do not pretend a query ran: say so in the task summary. The honest reason it does not block this plan is that `@peakui/styles` has no dependents — `packages/react` does not exist and `apps/storybook` consumes only CSS. `pnpm bootstrap` indexes it, and that is the clone owner's step.

## Deferred — not in this plan

- `packages/react`, `button.tsx`, and the React-side re-export of `buttonVariants`.
- The docs site, the handbook page, `llms.txt`, and the `peakui-mcp` entry.
- Every component other than Button.
- The reference's `src/utils` JS utility strings — deliberately not copied (spec section 3).
- Codegen for the component barrel.

## Review Focus

The spec implies these and no task's tests reach them unless the listed task adds the test:

1. **`buttonVariants()` with no arguments** — a non-React consumer calls it bare and must get the full default string, not just `button`. Test added in Task 1.
2. **An unknown variant value from untyped JS** — Vue and Svelte consumers have no TypeScript guard, so `buttonVariants({variant: "nope"})` must not throw and must still emit the base class. Test added in Task 1.
3. **Re-export identity of `tv`** — `tv` from `@peakui/styles` must be the same function object `tailwind-variants` exports, or `tv({extend: buttonVariants})` breaks across duplicate installs. Test added in Task 2.
4. **The barrel gate passing vacuously** — a gate that iterates an empty glob passes while proving nothing. Test added in Task 4.
5. **`./components/*.css` still resolving to CSS** — after `./components/*` is added, `@peakui/styles/components/button.css` must not resolve to the TypeScript entry. Test added in Task 5.

---

### Task 1: Button variant function

**Files:**
- Create: `packages/styles/src/components/button/button.styles.ts`
- Test: `packages/styles/src/components/button/button.styles.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `buttonVariants` — a `tv()` return value callable as `buttonVariants(props?: ButtonVariants): string`; and `type ButtonVariants = VariantProps<typeof buttonVariants>`.

- [ ] **Step 1: Write the failing test**

```ts
import {describe, expect, it} from "vitest";

import {buttonVariants} from "./button.styles.ts";

describe("buttonVariants", () => {
  it("отдаёт дефолты при вызове без аргументов", () => {
    const result = buttonVariants();

    expect(result).toContain("button");
    expect(result).toContain("button--md");
    expect(result).toContain("button--primary");
  });

  it.each([
    ["primary", "button--primary"],
    ["secondary", "button--secondary"],
    ["tertiary", "button--tertiary"],
    ["danger", "button--danger"],
    ["danger-soft", "button--danger-soft"],
    ["ghost", "button--ghost"],
    ["outline", "button--outline"],
  ])("отображает variant %s в %s", (variant, expected) => {
    expect(buttonVariants({variant})).toContain(expected);
  });

  it.each([
    ["sm", "button--sm"],
    ["md", "button--md"],
    ["lg", "button--lg"],
  ])("отображает size %s в %s", (size, expected) => {
    expect(buttonVariants({size})).toContain(expected);
  });

  it("отображает булевы варианты", () => {
    expect(buttonVariants({isIconOnly: true})).toContain("button--icon-only");
    expect(buttonVariants({fullWidth: true})).toContain("button--full-width");
  });

  it("не emit-ит ни одной утилиты Tailwind", () => {
    const result = buttonVariants({size: "lg", variant: "ghost"});

    for (const token of result.split(" ")) {
      expect(token).toMatch(/^button(--[a-z-]+)?$/);
    }
  });

  it("переживает неизвестное значение варианта из нетипизированного JS", () => {
    const result = buttonVariants({variant: "nope"} as never);

    expect(result).toContain("button");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/styles && pnpm vitest run src/components/button/button.styles.test.ts`
Expected: FAIL — cannot resolve `./button.styles.ts`.

- [ ] **Step 3: Implement `buttonVariants` in `packages/styles/src/components/button/button.styles.ts`**

`tv()` from `tailwind-variants`. `base: "button"`. Variants and values exactly as the spec's "Variant shape" section fixes them, each value mapping to its BEM modifier name and nothing else. `defaultVariants: {size: "md", variant: "primary"}`. Export `type ButtonVariants = VariantProps<typeof buttonVariants>` alongside. Mirror the formatting of `heroui/packages/styles/src/components/button/button.styles.ts` (alphabetically sorted keys).

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/styles && pnpm vitest run src/components/button/button.styles.test.ts`
Expected: PASS, 7 test cases green (the `it.each` blocks count their rows).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/styles/src/components/button/
git commit -m "feat(styles): buttonVariants — BEM-имена вариантов Button"
```

---

### Task 2: Root entry and the component barrel

**Files:**
- Create: `packages/styles/src/components/button/index.ts`
- Create: `packages/styles/src/components/index.ts`
- Modify: `packages/styles/src/index.ts`
- Modify: `packages/styles/src/index.test.ts`

**Interfaces:**
- Consumes: `buttonVariants`, `ButtonVariants` from Task 1.
- Produces: `@peakui/styles` root exports — `tv`, `cn`, `type VariantProps` re-exported from `tailwind-variants`; every component's variant function and variant type; `version`.

- [ ] **Step 1: Write the failing test**

Add to `packages/styles/src/index.test.ts`, keeping the existing `version` test untouched:

```ts
import {buttonVariants, cn, tv, version} from "./index.ts";
import {tv as upstreamTv} from "tailwind-variants";

it("ре-экспортирует tv и cn как вызываемые функции", () => {
  expect(typeof tv).toBe("function");
  expect(typeof cn).toBe("function");
});

it("ре-экспортирует тот же самый tv, что и tailwind-variants", () => {
  expect(tv).toBe(upstreamTv);
});

it("отдаёт вариант-функции компонентов из корня пакета", () => {
  expect(buttonVariants({variant: "primary"})).toContain("button--primary");
});
```

The identity assertion is Review Focus item 3: a copied `tv` would pass `typeof` and still break `tv({extend})`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/styles && pnpm vitest run src/index.test.ts`
Expected: FAIL — `tv`, `cn` and `buttonVariants` are not exported from `./index.ts`.

- [ ] **Step 3: Create the two barrels**

`src/components/button/index.ts` is one line: `export * from "./button.styles.ts";`
`src/components/index.ts` is the flat list, one `export * from "./<name>/index.ts";` per component directory, alphabetically sorted — Button alone for now.

- [ ] **Step 4: Rewrite `packages/styles/src/index.ts`**

```ts
export {cn, tv, type VariantProps} from "tailwind-variants";
export * from "./components/index.ts";

export const version = "0.0.0";
```

No `export * from "./utils"` — the spec's section 3 forbids copying the reference's JS utility strings.

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd packages/styles && pnpm vitest run src/index.test.ts`
Expected: PASS, including the pre-existing `version` test.

- [ ] **Step 6: Run the package's whole suite and typecheck**

Run: `pnpm typecheck && pnpm test`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add packages/styles/src/
git commit -m "feat(styles): публичная JS-поверхность — tv, cn, вариант-функции из корня"
```

---

### Task 3: Button stylesheet and the framework-agnostic proof

**Files:**
- Create: `packages/styles/components/button.css`
- Modify: `packages/styles/components/index.css`
- Create: `apps/storybook/src/stories/button.stories.tsx`
- Create: `apps/storybook/e2e/Button.spec.ts`

**Interfaces:**
- Consumes: the BEM names Task 1 fixed; `buttonVariants` from Task 2.
- Produces: the `.button` block and its modifiers as real CSS rules; two stories under `Components/Button`.

- [ ] **Step 1: Write `packages/styles/components/button.css`**

One `.button` block plus one rule per modifier. Required by the spec and the global constraints:

- `.button` carries the `md` dimensions, including `@apply h-10 md:h-9`.
- `.button--md {}` stays empty with the comment that says why (`css-authoring.md`'s default-size pattern).
- A `--button-bg` / `--button-fg` / `--button-border` seam declared on `.button`, with every colour read through `var(--button-*)` and every `--button-*` default read from a token.
- Each interactive state in both forms: `&:hover, &[data-hovered]`, `&:active, &[data-pressed]`, `&:focus-visible, &[data-focus-visible]`, `&:disabled, &[aria-disabled="true"], &[data-disabled]`.
- `transition` first, `@apply motion-reduce:transition-none` after it.
- Nothing for `forced-colors`: the token layer emits one central block per theme.

- [ ] **Step 2: Import it from the components layer**

Add `@import "./button.css";` to `packages/styles/components/index.css`, replacing the placeholder comment's claim that the layer is empty.

- [ ] **Step 3: Verify the token gate**

Run: `pnpm check:tokens`
Expected: PASS — no literal colour in `button.css`.

- [ ] **Step 4: Write the two stories**

`apps/storybook/src/stories/button.stories.tsx`, `title: "Components/Button"`, default export is the CSF meta (the sanctioned exception to named-exports-only).

- A story rendering **bare markup only** — `<button className="button button--primary">` and `<a className="button button--secondary" href="#">` — with no React component and no import from `@peakui/react`. This is the Direct Class Application recipe and the executable form of the framework-agnostic claim.
- A story rendering, for each variant and size, the `buttonVariants({...})` output beside the hand-written class string, so a modifier that exists in `tv()` with no rule behind it in `button.css` is visible.

- [ ] **Step 5: Build Storybook, then put Button under the real a11y gate**

Run: `pnpm build:storybook`
Expected: build succeeds.

A green build is **not** an accessibility result. `apps/storybook/AGENTS.md` records that `a11y.test: "error"` in `preview.tsx` is inert here — it needs `@storybook/addon-vitest`, which this app does not install, and `storybook build` audits nothing. So write `apps/storybook/e2e/Button.spec.ts`:

- One test asserting the framework-agnostic contract as a contract: the bare `a.button--secondary` resolves a non-transparent background, a radius above zero, no underline, and a height at or above the 24 px WCAG 2.2 target floor.
- A `checkA11y` audit of both stories in `default-light` and `default-dark`, run against `/iframe.html?id=<story-id>` directly. **Not** through the manager: `checkA11y(page, "#storybook-preview-iframe")` inspects the iframe element instead of the story inside it and passes having seen nothing. The `playwright-e2e` skill still shows that broken form at line 54; `apps/storybook/AGENTS.md` is the authority here, and the contradiction is a finding to report rather than a licence to copy.

Run: `STORYBOOK_PORT=<free> pnpm test:e2e`
Expected: every test passes, Button's five among them. Playwright never reuses a server it did not start, so a held 6007 is a port to step around, not a process to kill.

- [ ] **Step 6: Behavioural smoke on the story iframe**

Per `apps/storybook/AGENTS.md`: `agent-browser open <iframe-url>` → `snapshot -i` → `errors` / `console` / `a11y`. Text only, never screenshots.
Expected: no console errors, no a11y findings, and the bare `<a>` carries the computed background of `--button-bg` rather than the browser default.

- [ ] **Step 7: Commit**

```bash
git add packages/styles/components/ apps/storybook/src/stories/button.stories.tsx
git commit -m "feat(styles): слой CSS Button и доказательство framework-agnostic в Storybook"
```

---

### Task 4: Barrel completeness gate

**Files:**
- Create: `packages/styles/src/components/index.test.ts`

**Interfaces:**
- Consumes: the directory layout from Tasks 1–3.
- Produces: a gate every later component inherits — no new exported symbol.

- [ ] **Step 1: Write the failing test**

`packages/styles/src/components/index.test.ts`. It reads the filesystem, not the module graph, so a forgotten barrel line is caught rather than silently absent:

Strip comments from both sources before matching. Without that the gate passes on a **disabled** export: `// export * from "./button/index.ts";` contains the searched substring in full, and the first version of this test duly went green against a deliberately broken barrel. `check-tokens.ts` strips the same way.

```ts
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[^\n\S]*\/\/.*$/gm, "");

const componentDirs = readdirSync("src/components", {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const barrel = stripComments(readFileSync("src/components/index.ts", "utf8"));
const cssLayer = stripComments(readFileSync("components/index.css", "utf8"));

it("не проходит вхолостую на пустом наборе", () => {
  expect(componentDirs.length).toBeGreaterThan(0);
});

it.each(componentDirs)("реэкспортирует %s из бочки", (name) => {
  expect(barrel).toContain(`export * from "./${name}/index.ts";`);
});

it.each(componentDirs)("даёт %s парный CSS, импортированный слоем компонентов", (name) => {
  expect(existsSync(`components/${name}.css`), `components/${name}.css`).toBe(true);
  expect(cssLayer).toContain(`@import "./${name}.css";`);
});
```

The vacuous-pass guard is declared **first**, because `it.each([])` registers no test at all and a silent zero-row table is exactly the failure it exists to catch.

The third assertion is Review Focus item 4: without it both gates pass vacuously on an empty glob and prove nothing.

- [ ] **Step 2: Run it against two deliberate gaps to verify it fails on each**

Both halves of the gate need proving, because each can pass vacuously in its own way.

1. Comment out the Button line in `src/components/index.ts`. Expected: FAIL on the re-export assertion, naming `button`. Restore it.
2. Comment out `@import "./button.css";` in `components/index.css`. Expected: FAIL on the paired-CSS assertion. Restore it.

Run after each: `cd packages/styles && pnpm vitest run src/components/index.test.ts`

- [ ] **Step 3: Run it intact to verify it passes**

Run: `cd packages/styles && pnpm vitest run src/components/index.test.ts`
Expected: PASS, all three.

- [ ] **Step 4: Commit**

```bash
git add packages/styles/src/components/index.test.ts
git commit -m "test(styles): гейт полноты бочки компонентов — реэкспорт и парный CSS"
```

---

### Task 5: The `./components/*` subpath and the packaging gates

**Files:**
- Modify: `packages/styles/package.json`
- Modify: `packages/styles/src/generator/exports.test.ts`

**Interfaces:**
- Consumes: `src/components/button/index.ts` from Task 2 — the subpath must resolve to a file that exists, which is why this task follows rather than leads.
- Produces: `@peakui/styles/components/<name>` as a public import path.

- [ ] **Step 1: Write the failing test**

In `packages/styles/src/generator/exports.test.ts`, add `"./components/*"` to the list of required paths, and add:

```ts
it("разводит JS- и CSS-подпути одного префикса", () => {
  expect(pkg.exports?.["./components/*.css"]).toBe("./components/*.css");
  expect(pkg.exports?.["./components/*"]).toMatchObject({
    types: "./src/components/*/index.ts",
  });
});
```

That second assertion is Review Focus item 5. Node resolves subpath patterns by specificity, not declaration order, so `*.css` keeps winning for CSS requests — the test pins both halves so a later edit cannot collapse them into one.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/styles && pnpm vitest run src/generator/exports.test.ts`
Expected: FAIL — `exports` has no `./components/*`.

- [ ] **Step 3: Add the subpath to `packages/styles/package.json`**

The three-condition form from the spec's "Exports map" section, placed to keep the map alphabetically sorted.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/styles && pnpm vitest run src/generator/exports.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the packaging gate and resolve what it says**

Run: `pnpm lint:package`
Expected: PASS. If `attw --profile esm-only` rejects the TypeScript-source entry point, add `components/*` to the existing `--exclude-entrypoints` list and record the reason in the commit body — the spec's risk table anticipates exactly this. If the failure is anything other than "types point at source", stop and report: that is a packaging decision, not a flag.

- [ ] **Step 6: Confirm the import path end to end**

Run: `cd packages/styles && pnpm vitest run --reporter dot` plus a one-off check that `@peakui/styles/components/button` resolves — a temporary test file importing it, deleted after it passes.
Expected: the deep import yields the same `buttonVariants` object as the root import.

- [ ] **Step 7: Commit**

```bash
git add packages/styles/package.json packages/styles/src/generator/exports.test.ts
git commit -m "feat(styles): подпуть @peakui/styles/components/* для вариант-функций"
```

---

### Task 6: Skill RED — baseline, before any skill text

**Files:**
- Create: `docs/superpowers/plans/2026-10-02-composition-contract-baseline.md`

**Interfaces:**
- Consumes: the finished code from Tasks 1–5, so the scenarios run against a real `buttonVariants`.
- Produces: the verbatim failure record Task 7 writes against. No skill file is touched in this task.

The Iron Law from `writing-skills` covers edits, not only new skills: no skill text before a failing test. The current skill is the control. **A scenario that does not fail means its rule does not get written.**

- [ ] **Step 1: Dispatch four fresh-context subagents, one per scenario**

Each prompt says only the task and that the repository's standards in `.agents/` are binding. None mentions this plan, this spec, or the words "composition contract" — a contaminated baseline measures nothing.

1. Write the documentation example for styling a Next.js `Link` as a PeakUI primary button.
2. Write the example for giving Button a custom `radius` variant a consumer defines.
3. Review `packages/styles/src/components/button/button.styles.ts` and `packages/styles/components/button.css`; there is no `button.tsx`.
4. List every public styling entry point a consumer of PeakUI has.

- [ ] **Step 2: Record each outcome verbatim**

Write `2026-10-02-composition-contract-baseline.md`: per scenario, what the agent produced, which rule it broke or invented, and the exact wording of any rationalization — `writing-skills` builds the rationalization table from these quotes, so paraphrase loses the material.

- [ ] **Step 3: Decide which rules survive**

For each of the four, state plainly: did it fail? A scenario that passed gets no text in Task 7, and the baseline document says so. Expected from the audit, to be confirmed rather than assumed: scenario 2 refuses to put Tailwind inside `tv()` by citing the forbidden-patterns list, and scenario 3 reports the style layer as an unfinished component.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-10-02-composition-contract-baseline.md
git commit -m "test(skills): базовый замер скилла на четырёх сценариях композиции"
```

---

### Task 7: Skill GREEN — write only what the baseline failed

**Files:**
- Create: `.agents/skills/peakui-component-standards/references/composition-contract.md`
- Modify: `.agents/skills/peakui-component-standards/SKILL.md`
- Modify: `.agents/skills/peakui-component-standards/references/agent-readiness.md`
- Modify: `.agents/skills/peakui-component-standards/references/typescript.md`

**Interfaces:**
- Consumes: the baseline record from Task 6.
- Produces: the written contract every later component inherits.

- [ ] **Step 1: Write `references/composition-contract.md`**

English. Sections: the public surface table from the spec; the four consumer recipes, one complete example each with its imports — direct BEM classes, variant function, `slots.*()` under a foreign root, `tv({extend})`; the `render` rules; the reason BEM carries this promise where a utility string cannot — Tailwind finds classes by scanning source text, so a name reaching a consumer outside `@source` compiles only if it is a real rule in `button.css` (the trap `packages/styles/index.css` already documents); and the divergence table from the spec's section 3, each row carrying its reason. The divergence table is load-bearing: `SKILL.md` tells agents to read `heroui/`, and without the table they will restore what was deliberately not copied.

- [ ] **Step 2: Edit `SKILL.md`, matching form to failure**

Per `writing-skills`, a prohibition aimed at a shaping or omission failure backfires; use the form each failure calls for.

- The two-half `tv()` rule: author side unchanged and still forbidden; consumer side explicitly correct, with the caveat that a consumer's utilities compete by cascade specificity rather than `tailwind-merge`, so `--button-*` is the first-choice override and `tv({extend})` the escape hatch.
- A row in the rationalization table and a line in the red-flags list, quoting the baseline's own wording.
- The conditional, keyed to an observable predicate: while `packages/react` does not exist, a component's style layer is complete on its own. No nuance clause — `writing-skills` shows those reopen the negotiation.
- New checklist lines for the variant function, the published BEM modifier list, and the deep import path.
- A Reference Map row for `composition-contract.md`.

- [ ] **Step 3: Add the required artifact row to `agent-readiness.md`**

One more row in "What every component publishes": the BEM modifier list, beside the existing `data-slot` list, plus the statement of whether the component accepts `render`. Structural, because the failure is an omission from a table the agent already fills in.

- [ ] **Step 4: Complete the `render` rules in `typescript.md`**

Where `DOMRenderProps` already lives: merge supplied props with `mergeProps` from `@react-aria/utils` rather than spreading over them, and warn in development when the rendered element type does not match the expected one.

- [ ] **Step 5: Re-run the same four scenarios**

Fresh subagents, prompts identical to Task 6, now with the skill in place.
Expected: each scenario that failed in the baseline now complies. Append the results to the baseline document under a GREEN heading.

- [ ] **Step 6: Commit**

```bash
git add .agents/skills/peakui-component-standards/ docs/superpowers/plans/2026-10-02-composition-contract-baseline.md
git commit -m "docs(skills): контракт композиции — публичная поверхность и потребительские рецепты"
```

---

### Task 8: Skill REFACTOR — close loopholes, micro-test the wording

**Files:**
- Modify: `.agents/skills/peakui-component-standards/SKILL.md`
- Modify: `.agents/skills/peakui-component-standards/references/composition-contract.md`
- Modify: `docs/superpowers/plans/2026-10-02-composition-contract-baseline.md`

**Interfaces:**
- Consumes: the GREEN results from Task 7.
- Produces: the finished skill. Nothing later depends on it inside this plan.

- [ ] **Step 1: Micro-test the `tv({extend})` wording**

The only behaviour-shaping rule here, so it gets the treatment `writing-skills` prescribes: 5+ fresh-context reps of the consumer-variant scenario with the new wording, 5 of the same scenario with no guidance as the control. Read every flagged match by hand — a quoted counter-example looks like a hit. Variance is a metric: five different readings across five reps means the wording is not binding yet, so tighten the form before adding words.

Everything else in this work is reference material, for which `writing-skills` marks this checklist item not applicable.

- [ ] **Step 2: Turn each new rationalization into an explicit counter**

Add rows to the rationalization table using the agents' own words. No nuance clauses, and no exemption clauses — an exemption does not scope, so restructure instead of carving out.

- [ ] **Step 3: Re-run until the readings converge**

Repeat Step 1 after each wording change. Done when the reps agree on one shape, not when one rep looks good.

- [ ] **Step 4: Append the REFACTOR record to the baseline document**

Which loopholes appeared, what closed them, what the final reps looked like.

- [ ] **Step 5: Run the whole repository's gates**

Run: `pnpm typecheck && pnpm test && pnpm test:ai && pnpm check:tokens && pnpm lint:package && pnpm build:storybook && pnpm test:e2e`
Expected: all green. `pnpm test:ai` matters here because the skill files are what its hook and script tests read.

- [ ] **Step 6: Commit**

```bash
git add .agents/skills/peakui-component-standards/ docs/superpowers/plans/2026-10-02-composition-contract-baseline.md
git commit -m "docs(skills): закрыть лазейки в правиле tv({extend}) по микротесту"
```
