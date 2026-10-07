# SegmentedControl Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `SegmentedControl` component to `@peakui/react` — a single-select capsule whose
selected segment is wrapped in an indicator that slides to the clicked segment — then migrate the
hand-rolled theme switcher in `apps/docs` onto it.

**Architecture:** A thin compound composition over the `react-aria-components` `ToggleButtonGroup`
primitive plus its `SelectionIndicator`, which already provides a FLIP transition between parents.
The Root fixes `selectionMode="single"` and `disallowEmptySelection`, adapts RAC's `Set` API to a
single key, and publishes the size through context. The Item composes RAC `ToggleButton` and renders
the indicator internally. All Tailwind lives in `@peakui/styles`; `tv()` emits BEM names only.

**Tech Stack:** React 19, `react-aria-components@1.21.1`, `tailwind-variants`, Tailwind v4 CSS in
`@peakui/styles`, vitest + `@testing-library/react` via `@peakui/testing`, Playwright in
`apps/storybook`, Next.js + Fumadocs in `apps/docs`.

**Spec:** `docs/superpowers/specs/2026-10-07-segmented-control-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Pipeline:** stages 1-4 only. Stage 5 is switched off — **no changeset, no codemod**, and their
  absence is not a blocker.
- **Mandatory skills:** component and styles work goes through `peakui-component-standards`; the
  docs page and demos through `peakui-docs`; the Playwright spec through `playwright-e2e`. Each
  task summary cites the skills it used.
- **CodeGraph:** run `pnpm codegraph:sync` at the start of each task, query before reading code, and
  quote the first query's result in the task summary. Sync again after `pnpm add:component`.
- **Generated registries are never hand-edited** — `packages/react/src/components/index.ts`,
  `packages/styles/src/components/index.ts`, `packages/styles/components/index.css`,
  `apps/docs/src/demos/index.ts`, `apps/docs/content/docs/en/react/components/meta.json`. Add files,
  then run `pnpm registries`. The edit hook rejects direct edits.
- **No hardcoded Tailwind in JSX and none inside `tv()`** — utilities live in `@peakui/styles` CSS.
- **`data-slot` on every rendered element**; style state through `data-*`, never `is-*`.
- **Value-less `data-*` selectors** — `[data-selected]`, not `[data-selected="true"]`. The house
  form, recorded in `toggle-button.css`'s deviation list item 5. `tabs.css` uses the older valued
  form; do not change `tabs.css`.
- **No `forwardRef`** (React 19 passes `ref` as a prop), `"use client"` on every component, named
  exports only, interfaces over types, no `any`.
- **Accessibility floor WCAG 2.2 AA plus `forced-colors`.**
- **Animation:** `transition-duration: 250ms`, `transition-timing-function: var(--ease-out-fluid)`,
  and `motion-reduce:transition-none` written **after** `transition` so it wins on specificity.
- **Document language is English** — this plan, the spec, the docs page, MDX copy. **Test and story
  descriptions stay Russian**, matching every neighbouring test and e2e spec
  (`toggle-button-group.test.tsx`, `Tabs.spec.ts`); AGENTS.md's English rule enumerates documents
  and user-facing text, and these are neither. Flagged here so it is visible rather than assumed.
- **Nothing a visitor or an agent reads may name the reference library** — pages, demos, UI text,
  generated markdown.
- **Conventional commits**, header ≤ 150 chars, Russian subjects allowed.
- **Gates before any commit that touches `packages/`:** `pnpm typecheck`, `pnpm lint`,
  `pnpm --filter @peakui/react test segmented-control`, `pnpm registries --check`.

## Review Focus

Five conditions the spec implies that no task's own happy-path tests would reach. Each one's test is
assigned to the task that owns the code, in that task's step list.

- **RTL** — the capsule must slide along the inline axis in `dir="rtl"`, not jump to the mirrored
  position. FLIP computes deltas from rects, so this should hold, but it has to be proven: the
  indicator must land on the selected segment. → Task 5.
- **`prefers-reduced-motion: reduce`** — the capsule must appear at the new segment with no
  animation, and `motion-reduce` must actually suppress it rather than be overridden. → Task 5.
- **`selectedKey` matching no item** — a controlled consumer can pass a stale key. Nothing is
  selected, no indicator is rendered, and the control must not throw. → Task 2.
- **A single segment** — n=1 means the indicator never moves and the width rule has no siblings to
  distribute against. Must render with the capsule filling the only segment. → Task 2.
- **The selected segment unmounts** — a consumer removes the currently selected option.
  `disallowEmptySelection` cannot restore a key that is gone; the control must end with nothing
  selected and no stale indicator, and must not throw. → Task 2.

---

## File Structure

**Created by `pnpm add:component SegmentedControl --rac ToggleButtonGroup --category buttons`** (it
refuses to overwrite, and runs `pnpm registries` itself):

| File | Responsibility |
| --- | --- |
| `packages/react/src/components/segmented-control/segmented-control.tsx` | Context, Root, Item — one file, the house compound pattern |
| `packages/react/src/components/segmented-control/index.ts` | `Object.assign` compound + named exports + variant re-export |
| `packages/react/src/components/segmented-control/segmented-control.stories.tsx` | Stories, beside the component |
| `packages/styles/src/components/segmented-control/segmented-control.styles.ts` | `tv()` emitting BEM names only |
| `packages/styles/src/components/segmented-control/index.ts` | Re-export |
| `packages/styles/components/segmented-control.css` | All Tailwind, tokens, states, forced colors |
| `packages/react/tests/components/segmented-control/segmented-control.test.tsx` | jsdom contracts |
| `packages/react/tests/components/segmented-control/segmented-control.ssr.test.tsx` | SSR smoke |
| `apps/docs/content/docs/en/react/components/(buttons)/segmented-control.mdx` | Docs page |
| `apps/docs/src/demos/segmented-control/basic.tsx` | First demo |

**Created by hand:**

| File | Responsibility |
| --- | --- |
| `apps/storybook/e2e/SegmentedControl.spec.ts` | Indicator geometry, RTL, reduced motion, per-theme axe |
| `apps/docs/src/demos/segmented-control/{icon-only,sizes,disabled,controlled}.tsx` | Remaining demos |

**Modified (phase 2):**

| File | Change |
| --- | --- |
| `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx` | Rewritten on `SegmentedControl`, both modes |
| `apps/docs/src/app/[lang]/(home)/layout.tsx` | `slots.themeSwitch` so home stops using upstream fumadocs |
| `apps/docs/src/app/global.css` | Delete the `[data-theme-toggle]` block and its home-layout override |
| `apps/docs/src/components/github-link.tsx` | Drop `size-[34px]`, use `size="md"` |
| `apps/docs/src/components/fumadocs/ui/search-toggle.tsx` | Drop `size-[34px]`, use `size="md"` |

---

# Phase 1 — the core component

## Task 1: Scaffold and the Root

**Files:**
- Create (via scaffolder): all ten files listed above
- Modify: `packages/react/src/components/segmented-control/segmented-control.tsx`
- Modify: `packages/react/src/components/segmented-control/index.ts`
- Modify: `packages/styles/src/components/segmented-control/segmented-control.styles.ts`
- Test: `packages/react/tests/components/segmented-control/segmented-control.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `SegmentedControlRootProps` — `size?: "sm" | "md" | "lg"` (default `"md"`), `isDisabled?: boolean`,
    `selectedKey?: Key`, `defaultSelectedKey?: Key`, `onSelectionChange?: (key: Key) => void`,
    `className?: string`, `children: ReactNode`, plus `aria-label` / `aria-labelledby`.
    `selectionMode` and `disallowEmptySelection` are **not** in this interface.
  - `SegmentedControlContext` — `createContext<{slots?: ReturnType<typeof segmentedControlVariants>}>`,
    the shape `TabsContext` uses: the Root computes the slots once and a part reads its own from
    here. It carries **no** `size`. Size is a modifier on the Root only
    (`.segmented-control--sm`), and the stylesheet reaches the segment by descent, so the Item needs
    no size class and no size in context. `ToggleButtonGroup` passes `size` through context because
    its `ToggleButton` also works standalone; `SegmentedControl.Item` never does.
  - `segmentedControlVariants` from `@peakui/styles` — slots `base` and `item`, variant `size`,
    emitting `segmented-control`, `segmented-control--sm|md|lg`, `segmented-control__item`.

- [ ] **Step 1: Scaffold, sync, confirm the registries**

Run: `pnpm add:component SegmentedControl --rac ToggleButtonGroup --category buttons && pnpm codegraph:sync && pnpm registries --check`
Expected: ten files reported created, registries up to date.

- [ ] **Step 2: Write the failing Root tests**

In `describe("SegmentedControl")`, `describe("рендеринг")`:

```tsx
it("выставляет BEM-блок и data-slot", () => {
  // <SegmentedControl aria-label="Вид" data-testid="control"> with one Item
  expect(control).toHaveClass("segmented-control");
  expect(control).toHaveAttribute("data-slot", "segmented-control");
});

it("имеет роль radiogroup", () => {
  expect(screen.getByRole("radiogroup", {name: "Вид"})).toBeInTheDocument();
});

it("ведёт себя одинаково как SegmentedControl.Root и как SegmentedControlRoot", () => { … });

it("по умолчанию применяет размер md", () => {
  expect(control).toHaveClass("segmented-control--md");
});

it.each(["sm", "md", "lg"] as const)("применяет класс размера %s", (size) => {
  expect(control).toHaveClass(`segmented-control--${size}`);
});
```

In `describe("выбор")`:

```tsx
it("defaultSelectedKey выбирает сегмент при монтировании", () => {
  expect(screen.getByRole("radio", {name: "Список"})).toBeChecked();
});

it("onSelectionChange получает одиночный ключ, а не Set", async () => {
  const onSelectionChange = vi.fn();
  // click "Таблица"
  expect(onSelectionChange).toHaveBeenCalledWith("table");
});

it("selectedKey управляет выбором извне", () => { /* rerender with a different key */ });

it("isDisabled выключает все сегменты", () => { /* every radio is disabled */ });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm --filter @peakui/react test segmented-control`
Expected: FAIL — the scaffolded Root has no `size`, no roles, no single-key API.

- [ ] **Step 4: Write `segmentedControlVariants` in `packages/styles/src/components/segmented-control/segmented-control.styles.ts`**

`tv()` with `slots: {base, item}` and `variants: {size: {sm, md, lg}}`, `defaultVariants: {size: "md"}`.
BEM names only, no Tailwind — the file's header comment follows the form used by
`toggle-button.styles.ts`.

- [ ] **Step 5: Implement `SegmentedControlRoot` in `segmented-control.tsx`**

Composes `ToggleButtonGroup` from `react-aria-components/ToggleButtonGroup` with
`selectionMode="single"` and `disallowEmptySelection` hardcoded, `className` through
`composeTwRenderProps`, `data-slot="segmented-control"`, and the context from the Interfaces block —
the slots memoised with `React.useMemo` on `size`, as `TabsRoot` does.

The one choice the signature does not determine: the controlled/uncontrolled boundary. Pass
`selectedKeys` to the primitive **only when `selectedKey` is not `undefined`**, and
`defaultSelectedKeys` only when `defaultSelectedKey` is not `undefined` — passing an empty `Set`
unconditionally would make an uncontrolled consumer permanently controlled-empty. Unwrap in
`onSelectionChange` with `keys.values().next().value` and call the consumer's handler only when that
is not `undefined`.

- [ ] **Step 6: Export the compound in `index.ts`**

`Object.assign(SegmentedControlRoot, {Root: SegmentedControlRoot, Item: SegmentedControlItem})`, the
`SegmentedControl` type map, named exports of both parts, and `export {segmentedControlVariants}`
plus `export type {SegmentedControlVariants}` from `@peakui/styles` — the shape
`components/tabs/index.ts` uses. `Item` lands in Task 2; until then export the scaffolded stub.

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm --filter @peakui/react test segmented-control`
Expected: PASS.

- [ ] **Step 8: Gates and commit**

Run: `pnpm typecheck && pnpm lint && pnpm registries --check`

```bash
git add packages/react/src/components/segmented-control packages/styles/src/components/segmented-control packages/styles/components/segmented-control.css packages/react/tests/components/segmented-control packages/react/src/components/index.ts packages/styles/src/components/index.ts packages/styles/components/index.css apps/docs
git commit -m "feat(segmented-control): Root с одиночным выбором и шкалой размеров"
```

---

## Task 2: The Item and the internal indicator

**Files:**
- Modify: `packages/react/src/components/segmented-control/segmented-control.tsx`
- Modify: `packages/react/src/components/segmented-control/index.ts`
- Modify: `packages/styles/src/components/segmented-control/segmented-control.styles.ts` (add the `indicator` slot)
- Test: `packages/react/tests/components/segmented-control/segmented-control.test.tsx`

**Interfaces:**
- Consumes: `SegmentedControlContext` from Task 1 — the Item reads `slots` from it rather than
  calling `segmentedControlVariants()` itself.
- Produces: `SegmentedControlItemProps` — `id: Key`, `isDisabled?: boolean`, `children: ReactNode`,
  `className?: string`. Renders `data-slot="segmented-control-item"` and, inside it,
  `data-slot="segmented-control-indicator"` with class `segmented-control__indicator`. The indicator
  is **not** an exported part.

- [ ] **Step 1: Write the failing Item tests**

```tsx
it("сегмент имеет роль radio и aria-checked", () => { … });

it("индикатор рендерится только внутри выбранного сегмента", () => {
  // exactly one [data-slot="segmented-control-indicator"] in the document,
  // and it is contained by the selected radio
});

it("повторный клик по выбранному сегменту не снимает выбор", async () => { … });

it("отключённый сегмент не выбирается", async () => { … });

it("стрелка переносит фокус, но не меняет выбор", async () => {
  // ArrowRight: focus moves to the next radio, aria-checked unchanged
});

it("Space выбирает сегмент, на котором фокус", async () => { … });

it("класс размера стоит на корне, а не на сегменте", () => {
  expect(control).toHaveClass("segmented-control--sm");
  expect(item).toHaveClass("segmented-control__item");
  expect(item.className).not.toMatch(/--sm|--md|--lg/);
});
```

Review Focus tests, in `describe("граничные случаи")`:

```tsx
it("selectedKey, не совпадающий ни с одним сегментом, не выбирает ничего и не падает", () => {
  // no radio is checked, no indicator in the document
});

it("рендерится с единственным сегментом", () => {
  // the only radio is checked when defaultSelectedKey points at it; one indicator inside it
});

it("размонтирование выбранного сегмента оставляет группу без выбора и без индикатора", () => {
  // rerender without the selected Item: no checked radio, no indicator, no throw
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @peakui/react test segmented-control`
Expected: FAIL — no Item, no indicator.

- [ ] **Step 3: Add the `indicator` slot to `segmentedControlVariants`**

Emits `segmented-control__indicator`. BEM name only.

- [ ] **Step 4: Implement `SegmentedControlItem` in `segmented-control.tsx`**

Composes `ToggleButton` from `react-aria-components/ToggleButtonGroup` (the group's own export, not
`react-aria-components/ToggleButton`), reads `size` from `SegmentedControlContext`, renders
`children` followed by `SelectionIndicator` from `react-aria-components/ToggleButtonGroup` carrying
the `indicator` slot class and `data-slot="segmented-control-indicator"`.

RAC decides on its own whether the indicator is visible for a given item, exactly as `Tabs` relies
on it — do not gate the render on a selected check.

- [ ] **Step 5: Export `Item` from `index.ts`**

Replace the scaffolded stub in the compound and the named exports.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter @peakui/react test segmented-control`
Expected: PASS.

- [ ] **Step 7: Gates and commit**

Run: `pnpm typecheck && pnpm lint`

```bash
git add packages/react packages/styles
git commit -m "feat(segmented-control): сегмент с внутренним индикатором выбора"
```

---

## Task 3: The stylesheet, and the width measurement that settles it

**Files:**
- Modify: `packages/styles/components/segmented-control.css`
- Modify: `packages/react/src/components/segmented-control/segmented-control.stories.tsx` (the `LongLabels` story only)

**Interfaces:**
- Consumes: the BEM names from Tasks 1-2.
- Produces: the finished stylesheet, and the width declaration recorded with its measurement in the
  file's own deviation list.

Every value below is fixed by the spec. Shell padding is `p-1` at every size.

| `size` | Capsule (mobile / desktop) | Segment |
| --- | --- | --- |
| `sm` | 36 / 32 | 28 / 24 |
| `md` (default) | 40 / 36 | 32 / 28 |
| `lg` | 44 / 40 | 36 / 32 |

- [ ] **Step 1: Write the token seam and the shell**

```css
.segmented-control {
  --segmented-control-bg: var(--color-default);
  --segmented-control-radius: var(--radius-3xl);
  --segmented-control-item-fg: var(--color-muted);
  --segmented-control-item-fg-selected: var(--color-segment-foreground);
  --segmented-control-indicator-bg: var(--color-segment);
  --segmented-control-indicator-radius: var(--radius-3xl);
  --segmented-control-indicator-shadow: var(--shadow-surface);
}
```

Shell: `inline-flex w-fit items-center p-1`, background and radius from the tokens, and
`overflow: visible` with the reason in a comment — a focus ring in peakui is a box-shadow and a
clipping ancestor cuts it off, as `.toggle-button-group` records.

- [ ] **Step 2: Write the item, its states and the stacking context**

`position: relative` with `z-index: 1` — the comment must say why: it creates the stacking context
inside which the indicator's `z-index: -1` falls behind the label while staying in front of the
shell background, and without it the indicator disappears behind the shell.

States, from the prior art at `tabs.css:160-174`, in the value-less house form:
hover `opacity-70` on a segment that is neither selected nor disabled, written both as `:hover`
under `@media (hover: hover)` and as `[data-hovered]`; focus `status-focused` on
`:focus-visible:not([data-focused])` and `[data-focus-visible]`; disabled `status-disabled` on
`:disabled`, `[aria-disabled="true"]` and `[data-disabled]`; selected colour from
`--segmented-control-item-fg-selected`; `transition: color 150ms var(--ease-smooth)` with
`motion-reduce` after it.

- [ ] **Step 3: Write the indicator**

`absolute inset-0 size-full`, `z-index: -1`, background, radius and shadow from the tokens, and the
transition contract:

```css
transition-property: translate, width, height;
transition-duration: 250ms;
transition-timing-function: var(--ease-out-fluid);
@apply motion-reduce:transition-none;
```

A comment must state that the property list is a contract, not styling: `SharedElementTransition`
snapshots only the properties named there, so removing `translate` makes the indicator teleport.

- [ ] **Step 4: Write the three size modifiers and the forced-colors block**

Size modifiers set the item's height and width per the table above. Then:

```css
@media (forced-colors: active) {
  .segmented-control { border: 1px solid ButtonBorder; }
  .segmented-control__indicator { background-color: Highlight; }
  .segmented-control__item[data-selected] { color: HighlightText; }
}
```

- [ ] **Step 5: Write the `LongLabels` story**

One `SegmentedControl` whose segments are `Day`, `Week`, `Last 12 months`, `All` — deliberately
uneven, because this story exists to measure the width rule.

- [ ] **Step 6: Measure the width rule in the browser**

Run: `pnpm dev:storybook`, then `agent-browser open <iframe-url for the LongLabels story>` →
`snapshot -i`. Text only, never screenshots; the protocol is `apps/storybook/AGENTS.md`.

Compare the two candidates on the item — `w-full` as `.tabs__tab:128`, versus `flex-1` as
`.toggle-button-group--full-width .toggle-button:108` — against the spec's four requirements:
segments equal width, shell hugs content by default, `w-full` on the shell from outside distributes
with no extra prop, **and the longest label is not clipped**. Keep the one that satisfies all four.

- [ ] **Step 7: Record the decision in the file's deviation list**

Append the numbered "what differs from the reference, and why" list that `toggle-button.css` and
`toggle-button-group.css` carry, including: the chosen width declaration with the measurement that
justified it; the value-less `data-*` form against `tabs.css`'s valued form; `--radius-3xl` instead
of the off-scale `calc(var(--radius) * 2.5)` that `tabs.css:23` uses; and the forced-colors block.

- [ ] **Step 8: Gates and commit**

Run: `pnpm check:tokens && pnpm lint && pnpm typecheck`

```bash
git add packages/styles/components/segmented-control.css packages/react/src/components/segmented-control/segmented-control.stories.tsx
git commit -m "feat(segmented-control): стили капсулы, сегмента и индикатора"
```

---

## Task 4: The remaining stories and the SSR smoke

**Files:**
- Modify: `packages/react/src/components/segmented-control/segmented-control.stories.tsx`
- Modify: `packages/react/tests/components/segmented-control/segmented-control.ssr.test.tsx`

**Interfaces:**
- Consumes: the component from Tasks 1-2, the stylesheet from Task 3.
- Produces: story ids `Basic`, `IconOnly`, `Sizes`, `Disabled`, `Controlled`, `LongLabels` — Task 5
  and Task 6 both reference them.

- [ ] **Step 1: Write the failing SSR test**

```tsx
describe("SegmentedControl SSR", () => {
  it("рендерится на сервере без рассинхронизации гидратации", async () => {
    const {html} = await ssrSmoke(/* three Items, defaultSelectedKey */);
    expect(html).toContain('data-slot="segmented-control"');
    expect(html).toContain('data-slot="segmented-control-item"');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter @peakui/react test segmented-control.ssr`
Expected: FAIL — the scaffolded SSR test asserts the stub's markup.

- [ ] **Step 3: Make it pass**

The component already satisfies it; the step is to replace the scaffolded body with the one above
and confirm no hydration warning surfaces.

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm --filter @peakui/react test segmented-control.ssr`
Expected: PASS.

- [ ] **Step 5: Write the five remaining stories**

`Basic` (three text segments), `IconOnly` (the three theme icons, the shape `apps/docs` will use),
`Sizes` (all three, stacked, so the scale is comparable at a glance), `Disabled` (one story showing
the whole control disabled and a single disabled segment), `Controlled` (`useState`, so the story
proves the single-key handler).

- [ ] **Step 6: Verify the stories render**

Run: `pnpm --filter @peakui/storybook typecheck && pnpm build:storybook`
Expected: build succeeds, no story errors.

- [ ] **Step 7: Commit**

```bash
git add packages/react/src/components/segmented-control/segmented-control.stories.tsx packages/react/tests/components/segmented-control/segmented-control.ssr.test.tsx
git commit -m "feat(segmented-control): истории и SSR-смоук"
```

---

## Task 5: The Playwright spec — geometry, RTL, reduced motion, a11y

**Files:**
- Create: `apps/storybook/e2e/SegmentedControl.spec.ts`

**Interfaces:**
- Consumes: the story ids from Task 4.
- Produces: nothing other tasks depend on.

This spec is a **deliberate exception** to the rule that Playwright covers overlays and high-risk
portals rather than one spec per component: FLIP depends on `getBoundingClientRect()` and
`requestAnimationFrame`, and in jsdom every rect is zero, so the slide is unobservable there. The
precedent and the technique are `apps/storybook/e2e/Tabs.spec.ts:108`. Goes through the
`playwright-e2e` skill.

- [ ] **Step 1: Write the four failing tests**

Model each on `Tabs.spec.ts:108` — poll `boundingBox()` of
`[data-slot="segmented-control-indicator"]` against the selected segment until the larger of the x
and width deltas is under 1px, because the move happens through a transient `translate` and only the
settled geometry is assertable.

```ts
test("индикатор переехал к выбранному сегменту", async ({page}) => { … });

test("в RTL индикатор переезжает по инлайн-оси", async ({page}) => {
  // dir="rtl" on the story root, then the same geometry assertion
});

test("при prefers-reduced-motion индикатор появляется без анимации", async ({page}) => {
  // page.emulateMedia({reducedMotion: "reduce"}), click, then assert the geometry matches
  // immediately rather than after the 250ms transition
});

for (const theme of THEMES) {
  test(`SegmentedControl не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => { … });
}
```

The axe loop copies the shape at `Tabs.spec.ts:137`, including the `globals=theme:` query parameter.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm --filter @peakui/storybook test:e2e SegmentedControl`
Expected: FAIL — the spec file is new and the story ids must be corrected against Task 4's output.

- [ ] **Step 3: Fix the story ids and selectors until the suite passes**

No component change is expected here. If a test fails on behaviour rather than on a selector, that
is a real defect in Tasks 2-3 — fix it there and say so in the task summary.

- [ ] **Step 4: Run the full suite**

Run: `pnpm test:e2e:ci`
Expected: PASS, including the pre-existing specs.

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/e2e/SegmentedControl.spec.ts
git commit -m "test(segmented-control): e2e на переезд индикатора, RTL, reduced motion и axe"
```

---

## Task 6: Docs page and demos

**Files:**
- Modify: `apps/docs/content/docs/en/react/components/(buttons)/segmented-control.mdx`
- Modify: `apps/docs/src/demos/segmented-control/basic.tsx`
- Create: `apps/docs/src/demos/segmented-control/{icon-only,sizes,disabled,controlled}.tsx`

**Interfaces:**
- Consumes: the public API from Tasks 1-2; demos are adapted from Task 4's stories, never the
  reverse, and docs never import stories.
- Produces: nothing other tasks depend on.

Goes through the `peakui-docs` skill. Stage 4 is not optional — this lands in the same PR as the
component.

- [ ] **Step 1: Write the four new demos and rewrite `basic.tsx`**

One file per example, adapted from the matching story. A demo passing a function prop starts with
`"use client"`.

- [ ] **Step 2: Register them**

Run: `pnpm registries`
Expected: `apps/docs/src/demos/index.ts` regenerated. Never edit it by hand.

- [ ] **Step 3: Write the page**

Frontmatter in the form `toggle-button-group.mdx` uses — `title`, `description`, and `links` with
`rac: ToggleButtonGroup`, `source: segmented-control/segmented-control.tsx`,
`styles: segmented-control.css`. Sections in order: Usage → Examples → Customization → Styling
Reference → API Reference, with `<ComponentPreview name="segmented-control-…" />` per demo.

Three statements the page must carry, from the spec:

1. An accessible name is required — `aria-label`, or `aria-labelledby` referencing a visible label.
2. The actual keyboard behaviour: arrow keys move focus, Space or Enter selects. Say that this
   diverges from APG's radiogroup prescription and that the behaviour comes from the primitive.
3. `sm` on desktop puts a segment at 24×24, exactly the WCAG 2.2 AA SC 2.5.8 minimum; `md` is
   recommended in headers and wherever pointer precision matters.

Nothing on the page may name the reference library.

- [ ] **Step 4: Verify the docs build and the generated agent routes**

Run: `pnpm typecheck && pnpm build:docs`
Expected: build succeeds; `/llms-components.txt` and `/api/components` include the component. Never
hand-write those files.

- [ ] **Step 5: Commit**

```bash
git add apps/docs
git commit -m "docs(segmented-control): страница компонента и демо"
```

---

# Phase 2 — migrating `apps/docs`

This phase is why the component exists; without it the defect the spec opens with remains. It may
ship as a follow-up PR.

## Task 7: Rewrite the docs theme switcher

**Files:**
- Modify: `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx`

**Interfaces:**
- Consumes: `SegmentedControl` from `@peakui/react`.
- Produces: `ThemeToggle` keeps its current props — `mode?: "light-dark" | "light-dark-system"` and
  `className` — so the notebook layout's two call sites need no change.

- [ ] **Step 1: Rewrite both modes on `SegmentedControl`**

`light-dark-system` becomes three segments. `light-dark` becomes **two** segments, sun and moon,
instead of one button holding two icons — it gains the sliding capsule it never had. Delete the
`itemBase` and `itemActive` conditional classes and the hand-written `container` string; the capsule
is the component's now.

Keep the existing theme wiring untouched: `useTheme` from `next-themes`, `useIsMounted`, and the
pre-mount null value that avoids a hydration mismatch.

- [ ] **Step 2: Verify in the browser**

Run: `pnpm dev:docs`, open `/en/docs`, switch the theme in both the header and the mobile sidebar
banner. Confirm the capsule slides, the theme changes, and no hydration warning appears in the
console.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/fumadocs/ui/theme-toggle.tsx
git commit -m "refactor(docs): переключатель темы на SegmentedControl"
```

---

## Task 8: One switcher on both pages, and one height in the header

**Files:**
- Modify: `apps/docs/src/app/[lang]/(home)/layout.tsx`
- Modify: `apps/docs/src/app/global.css`
- Modify: `apps/docs/src/components/github-link.tsx`
- Modify: `apps/docs/src/components/fumadocs/ui/search-toggle.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` from Task 7.
- Produces: nothing.

- [ ] **Step 1: Give `HomeLayout` the local switcher**

Add `slots={{themeSwitch: <ThemeToggle mode="light-dark-system" />}}`. The home page stops rendering
the upstream `fumadocs-ui` `ThemeSwitch`; `slots.themeSwitch` exists on `BaseLayoutProps`, so the
home layout does not need vendoring. Leave the existing `themeSwitch={{mode}}` only if it still has
an effect after the slot is set — otherwise remove it rather than leaving two sources of truth.

- [ ] **Step 2: Delete the hand-written capsule CSS**

Remove the `[data-theme-toggle]` block at `apps/docs/src/app/global.css:66-72` and its margin
override inside `#nd-home-layout`. Nothing should style the switcher from outside any more.

- [ ] **Step 3: Drop the hardcoded 34px**

In `github-link.tsx:17` and `search-toggle.tsx:42` replace `size-[34px]` with `size="md"` and no
size override, keeping `border-none`. The header row lands on 36px — the height of an icon-only
`Button` at `md` and of `SegmentedControl` at `md`.

- [ ] **Step 4: Verify both pages**

Run: `pnpm dev:docs`, then check `/en` and `/en/docs`. Confirm the two pages show the **same**
switcher, that its height matches the GitHub and search buttons in the same row, and that the
capsule slides on both.

- [ ] **Step 5: Verify the build**

Run: `pnpm typecheck && pnpm lint && pnpm build:docs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/docs
git commit -m "fix(docs): один переключатель темы на главной и в docs, ряд шапки в один рост"
```
