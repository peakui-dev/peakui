# Badge Proportions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A badge holding more than one character renders as a rounded rectangle at every size, instead of a circle stretched out of shape.

**Architecture:** One stylesheet carries the whole behavioural change — lower `min-h`/`min-w` on `md` and `lg`, raise `.badge__label` padding, and spell the radius once. Nothing in `badge.tsx` or `badge.styles.ts` moves, so the public surface is untouched. A new story supplies the multi-character fixture that both the browser tier and the docs page needed and never had.

**Tech Stack:** Tailwind v4 CSS in `@peakui/styles`, `tailwind-variants` for BEM names, Storybook CSF, Playwright for the browser tier, Fumadocs MDX for the page.

**Spec:** `docs/superpowers/specs/2026-10-20-badge-proportions-design.md`

## Global Constraints

- Every document, comment and user-facing string is in **English**.
- No Tailwind in JSX or inside `tv()` — utilities live in `@peakui/styles` CSS only.
- The base class carries the `md` values; `.badge--md` stays empty with its comment.
- Nothing a visitor or an agent reads may name the reference library.
- `apps/docs/src/demos/index.ts` and `components/meta.json` are generated — run `pnpm registries`, never edit them.
- Demos import only from `@peakui/react`, `@gravity-ui/icons` and `react`.
- A docs section is its heading, at most one sentence, then the preview.
- Stage 5 is switched off: no changeset, no codemod.

## Review Focus

- **A badge with no children** must stay a circle at every size — the dot is the childless case, and the padding change must not reach it. Pinned in Task 2.
- **A single character** must stay a circle, not become a rounded rectangle; the padding must not push it past the `min-width` floor. Pinned in Task 2.
- **`forced-colors`** must still leave a visible edge after the radius and size change. The existing assertion covers it; Task 2 runs it rather than assuming.
- **Placement offsets** are `translate(±25%, ±25%)` of the badge's own box, so a smaller badge shifts its anchor point. The existing placement test covers it; Task 2 runs it.
- **`lg` dropping from 32px to 24px** makes it smaller than today's `md`. Task 2 asserts the three sizes stay strictly ordered.

---

### Task 1: The `Content` story

The proportion change is invisible without a badge holding more than one character, and no story has one. This story is the fixture Task 2 measures and the source Task 3 adapts.

**Files:**
- Modify: `packages/react/src/components/badge/badge.stories.tsx`

**Interfaces:**
- Produces: a `Content` story, id `components-badge--content`, rendering four anchored badges whose labels are `5`, `99+`, `New`, and a `Bell` icon from `@gravity-ui/icons`.

- [ ] **Step 1: Add the story**

Follow the file's existing shape: a `Story` export whose `render` wraps its badges in the local `Showcase` with a `title`, and reuses the local `Person` for each anchor. The icon badge carries an `aria-label`, since an icon alone is not an accessible name.

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm --filter @peakui/react typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/react/src/components/badge/badge.stories.tsx
git commit -m "test(badge): a story for multi-character content"
```

---

### Task 2: The size scale

**Files:**
- Modify: `packages/styles/components/badge.css`
- Test: `apps/storybook/e2e/Badge.spec.ts`

**Interfaces:**
- Consumes: the `components-badge--content` story from Task 1.
- Produces: `.badge` at 20px, `.badge--sm` at 16px, `.badge--lg` at 24px, each `rounded-full`, with `.badge__label` padding of 6px / 4px / 8px respectively.

- [ ] **Step 1: Write the failing tests**

Add `content: "components-badge--content"` to the `STORY` map, then these four tests:

```ts
test("a multi-character badge is wider than it is tall", async ({page}) => {
  await page.goto(iframe(STORY.content));

  const badge = page.locator('[data-slot="badge"]', {hasText: "New"}).first();

  await expect(badge).toBeVisible(COLD);

  const box = (await badge.boundingBox())!;

  expect(box.width / box.height).toBeGreaterThanOrEqual(1.5);
});

test("a single-character badge stays a circle", async ({page}) => {
  await page.goto(iframe(STORY.content));

  const badge = page.locator('[data-slot="badge"]', {hasText: "5"}).first();

  await expect(badge).toBeVisible(COLD);

  const box = (await badge.boundingBox())!;

  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
});

test("a childless badge stays a circle", async ({page}) => {
  await page.goto(iframe(STORY.dot));

  const badge = page.locator('[data-slot="badge"]').first();

  await expect(badge).toBeVisible(COLD);

  const box = (await badge.boundingBox())!;

  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
});

test("the three sizes stay strictly ordered", async ({page}) => {
  await page.goto(iframe(STORY.sizes));

  await expect(page.locator('[data-slot="badge"]').first()).toBeVisible(COLD);

  const heights = await page
    .locator('[data-slot="badge"]')
    .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));

  expect(heights).toEqual([...heights].sort((a, b) => a - b));
  expect(new Set(heights).size).toBe(3);
});
```

- [ ] **Step 2: Run them to verify the first one fails**

Run: `STORYBOOK_PORT=6017 pnpm test:e2e -- Badge.spec.ts -g "wider than it is tall"`
Expected: FAIL — the ratio is about 1.14, below 1.5.

- [ ] **Step 3: Re-proportion the stylesheet**

In `packages/styles/components/badge.css`, with the values from spec D1:

- `.badge` — `min-h-7 min-w-7 rounded-3xl` becomes `min-h-5 min-w-5 rounded-full`; `text-xs leading-[1.34]` is unchanged.
- `.badge__label` — `px-0.5` becomes `px-1.5`.
- `.badge--sm` — keeps `min-h-4 min-w-4 text-[10px] leading-[1.34]`, takes `rounded-full`, and nests `.badge__label { @apply px-1; }`.
- `.badge--lg` — `min-h-8 min-w-8 rounded-2xl` becomes `min-h-6 min-w-6 rounded-full`; `text-sm leading-[1.43]` is unchanged; nests `.badge__label { @apply px-2; }`.
- `.badge--md` stays empty with its comment.

Nest the label rule the way `avatar.css` nests `.avatar__fallback` inside `.avatar--sm`.

- [ ] **Step 4: Record the divergence**

Add difference 4 to the comment block at the end of the file: the reference floors `min-width` at the badge's height and gives the label 2px, so short text never outgrows the circle; its own page only ever shows `sm`, where 10px text clears a 16px floor, so the defect is not visible there. Reference the spec by path.

- [ ] **Step 5: Run the whole Badge browser tier**

Run: `STORYBOOK_PORT=6017 pnpm test:e2e -- Badge.spec.ts`
Expected: PASS, including the pre-existing placement and `forced-colors` tests.

- [ ] **Step 6: Run the token gate**

Run: `pnpm check:tokens`
Expected: PASS — the gate rejects literal colours and numbered colour tokens; sizing values are not its subject.

- [ ] **Step 7: Commit**

```bash
git add packages/styles/components/badge.css apps/storybook/e2e/Badge.spec.ts
git commit -m "fix(badge): text badges read as rounded rectangles, not stretched circles"
```

---

### Task 3: The demos

**Files:**
- Modify: `apps/docs/src/demos/badge/basic.tsx`, `colors.tsx`, `dot.tsx`, `placements.tsx`, `sizes.tsx`, `variants.tsx`, `custom-styles.tsx`
- Create: `apps/docs/src/demos/badge/with-content.tsx`

**Interfaces:**
- Consumes: the `Content` story from Task 1 as the source for `with-content.tsx`.
- Produces: the demo key `badge-with-content`, export `WithContent`.

- [ ] **Step 1: Rewrite the seven demos**

Adapt each from its story, per `peakui-docs`: a `map` where the story repeats an anchor by hand, English labels, a plain `div` with layout utilities in place of the story's `Showcase`, under 15 lines of JSX. Carry the spec's content decision — `placements` labels each corner, `variants` shows all three variants across the five colours, and no demo leans on `color="default"` as its only colour.

- [ ] **Step 2: Add `with-content.tsx`**

Export `WithContent`, adapted from Task 1's story: `5`, `99+`, `New`, and a `Bell` icon with an `aria-label`.

- [ ] **Step 3: Register it**

Run: `pnpm registries`
Expected: `apps/docs/src/demos/index.ts` gains `badge-with-content`.

- [ ] **Step 4: Typecheck the demos**

Run: `pnpm --filter @peakui/docs typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/demos/badge apps/docs/src/demos/index.ts
git commit -m "docs(badge): demos that show the component at a size worth seeing"
```

---

### Task 4: The page and the gates

**Files:**
- Modify: `apps/docs/content/docs/en/react/components/(data-display)/badge.mdx`

- [ ] **Step 1: Add the `With Content` section**

`### With Content` under `## Examples`, after `### Dot`, with `<ComponentPreview name="badge-with-content" />` and at most one sentence.

- [ ] **Step 2: Check the page against source**

Confirm every class, slot, variable, prop and default on the page still matches `badge.css`, `badge.styles.ts` and `badge.tsx`. The size classes kept their names, so the Styling Reference should need no edit; verify rather than assume.

- [ ] **Step 3: Run the docs gates**

Run: `pnpm --filter @peakui/docs test` and `pnpm --filter @peakui/docs typecheck`
Expected: PASS

- [ ] **Step 4: Run the repository gates**

Run: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:ai`
Expected: PASS

- [ ] **Step 5: Confirm the result in a browser**

Load the badge page on the docs dev server and measure the `New` badge. Expected: width divided by height at or above 1.5. Correct the measured figures in the spec if they differ from its estimates.

- [ ] **Step 6: Commit**

```bash
git add "apps/docs/content/docs/en/react/components/(data-display)/badge.mdx"
git commit -m "docs(badge): the With Content example"
```
