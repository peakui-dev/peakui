# `on-surface` Tokens and Color System Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nine `on-surface` tokens — a neutral control fill, its foreground and its hover for each of three surface levels — and a `Foundations/Color System` Storybook page that lists every colour token with its computed value.

**Architecture:** The tokens are derived in `packages/styles/src/generator/derive.ts` by mixing each surface level toward that level's own foreground, exposed through `themes/shared/theme.css`, and mapped in `FORCED_COLORS`. The page reads the computed values at runtime and re-reads them when the theme global changes.

**Tech Stack:** TypeScript 5.9, vitest 3, Tailwind v4, Storybook 10 (`@storybook/react-vite`), Playwright + axe-playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-on-surface-tokens-design.md`

## Global Constraints

- Every new document in **English**. Existing Russian content is legacy. Test descriptions follow the surrounding file, which in `packages/styles` is Russian.
- Named exports only; Storybook CSF's default export is the one sanctioned exception.
- No `any`. Literal unions, never bare `string`.
- Tokens are **semantic, never numbered**. Every background token has a matching `-foreground`, and the pair is used together.
- **`check:tokens` gate 2 fails on ANY contrast fix.** `ensureContrast` detects a wrong palette; it does not repair one. If a derivation applies a fix, the numbers are wrong — change the numbers, never the gate.
- `mix(a, pctA, b, pctB)` and `ensureContrast({token, fg, bg, min})` come from `src/generator`; `TEXT_MIN = 4.5`, `BOUNDARY_MIN = 3`.
- **The drift gate** compares the committed `variables.css` against `emitVariablesCss(preset, deriveTheme(preset))`, so `pnpm tokens:build` runs and its output is committed in the **same commit** as the `derive.ts` change.
- The family must **not** be given a 3:1 boundary against its surface. `--default` sits at 1.09:1 against the page by design; see the spec's section 2.
- Do not add the three `-focus` tokens. Do not touch the global `focus` derivation. Both are deferred with measurements in `docs/ecosystem/backlog.md`.
- Accessibility floor **WCAG 2.2 AA**. Do not edit `heroui/` — a `protected-files` hook rejects it.
- Conventional commits, header ≤ 150 chars, Russian subjects allowed.
- **CodeGraph is not indexed in this clone** (`codegraph status` → `Not initialized`), and the agent file forbids indexing on your own initiative. Say so in the task summary rather than routing around it or claiming a query that did not run.

## Deferred — not in this plan

- `on-surface-*-focus` and the global focus-ring fix (backlog).
- The `FORCED_COLORS` gaps for `surface-secondary-foreground`, `surface-tertiary-foreground`, `success`, `warning`, `danger` (backlog).
- `--snow` / `--eclipse`.
- Replacing, merging or editing the existing `Foundations/Colors` page.
- Any component consuming the new family.

## Review Focus

Each line names an input the spec implies and the task that adds its test:

1. **A token derived but never exposed.** The dangling gate reads `var()` out of `theme.css`; it cannot see a token that exists in the theme and has no `--color-` mapping, which renders as an empty swatch in silence. Test added in Task 2.
2. **A preset other than `default`.** Gate 2 runs every preset, so a brand accent could make a `-foreground` need a fix even though the default theme is clean. Test added in Task 1.
3. **A theme switch leaving stale computed values.** This is the reference's own defect and the reason the read moves into an effect. Test added in Task 4.
4. **The page drifting behind the token set.** A token added to the theme and not to the page under-reports silently. Test added in Task 4.
5. **A token listed in two sections.** It renders twice, and a plain row count still matches. Test added in Task 4.

---

### Task 1: Derive the nine tokens

**Files:**
- Modify: `packages/styles/src/generator/derive.ts`
- Test: `packages/styles/src/generator/derive.test.ts`

**Interfaces:**
- Consumes: `mix`, `ensureContrast`, `TEXT_MIN`, `FOREGROUND_PAIRS`, the `ANCHOR` table — all already in the file.
- Produces: nine new keys in the `light` and `dark` token sets: `on-surface`, `on-surface-secondary`, `on-surface-tertiary`, each with `-foreground` and `-hover`.

- [ ] **Step 1: Write the failing test**

Add to `packages/styles/src/generator/derive.test.ts`:

```ts
const LEVELS = ["surface", "surface-secondary", "surface-tertiary"] as const;

it("выводит заливку on-surface на каждый уровень поверхности", () => {
  const {dark, light} = deriveTheme(defaultPreset);

  for (const level of LEVELS) {
    const suffix = level === "surface" ? "" : level.replace("surface", "");
    for (const scheme of [light, dark]) {
      for (const member of ["", "-foreground", "-hover"]) {
        expect(scheme, `on-surface${suffix}${member}`).toHaveProperty(`on-surface${suffix}${member}`);
      }
    }
  }
});

it("воспроизводит отношение default к background", () => {
  // light 1.09:1 and dark 1.32-1.37:1, matching default's own 1.09 and 1.36
  // assert contrastRatio(fill, level) within [1.05, 1.45] for all three levels, both schemes
});

it("держит текст на заливке выше TEXT_MIN с большим запасом", () => {
  // assert contrastRatio(fg, fill) >= 10 for all three levels, both schemes
});

it("не требует ни одной правки контраста ни для одного пресета", () => {
  for (const preset of presets) {
    expect(deriveTheme(preset).fixes, preset.id).toEqual([]);
  }
});
```

The last one is Review Focus item 2, and it is the test that would catch a wrong percentage: gate 2 reads the same `fixes` array.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/styles && pnpm vitest run src/generator/derive.test.ts`
Expected: FAIL — the token keys do not exist. (The no-fixes test should already pass; if it fails before any change, stop and report: the palette was already broken.)

- [ ] **Step 3: Add the derivation to `deriveScheme`**

After the existing `raw["surface-hover"]` line, loop the three levels. Percentage from a scheme-keyed constant declared beside `soft`/`softHover`: `4` for light, `12` for dark. Per level: the fill is `mix(level, 100 − p, fgL, p)` where `fgL` is `fg(level)`; the foreground is `ensureContrast({token, fg: fgL, bg: fill, min: TEXT_MIN})`; the hover is `mix(fill, 96, fgL, 4)`.

Add the three names to `FOREGROUND_PAIRS` so the pair contract covers them.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/styles && pnpm vitest run src/generator/derive.test.ts`
Expected: PASS, all four.

- [ ] **Step 5: Confirm the gate agrees**

Run: `pnpm check:tokens`
Expected: all gates pass. A "Контраст: пресет … требует правки" error means a percentage is wrong — fix the percentage, not the gate.

- [ ] **Step 6: Commit**

```bash
git add packages/styles/src/generator/
git commit -m "feat(styles): вывести девять токенов on-surface по уровням поверхности"
```

---

### Task 2: Expose them, map forced colors, regenerate

**Files:**
- Modify: `packages/styles/themes/shared/theme.css`
- Modify: `packages/styles/src/generator/emit.ts`
- Modify: `packages/styles/themes/default/variables.css` (generated — do not hand-edit)
- Test: `packages/styles/src/generator/exports.test.ts`

**Interfaces:**
- Consumes: the nine tokens from Task 1.
- Produces: `--color-on-surface*` as part of the `@theme inline` surface, so Tailwind utilities and the page can reach them.

- [ ] **Step 1: Write the failing test**

In `packages/styles/src/generator/exports.test.ts` — the direction no existing gate covers (Review Focus item 1):

```ts
it("выставляет каждый выведенный токен on-surface через @theme inline", () => {
  const {light} = deriveTheme(defaultPreset);
  const themeCss = readFileSync("themes/shared/theme.css", "utf8");

  for (const name of Object.keys(light).filter((n) => n.startsWith("on-surface"))) {
    expect(themeCss, name).toContain(`--color-${name}: var(--${name});`);
  }
});

it("даёт каждому токену on-surface системный цвет в forced-colors", () => {
  // every on-surface* key appears in the emitted @media (forced-colors: active) block
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/styles && pnpm vitest run src/generator/exports.test.ts`
Expected: FAIL on both — no mappings, no forced-colors entries.

- [ ] **Step 3: Add the nine mappings to `theme.css`**

`--color-on-surface*: var(--on-surface*)`, placed in the surfaces block beside the existing `--color-surface*` lines so related tokens stay together.

- [ ] **Step 4: Add the nine entries to `FORCED_COLORS` in `emit.ts`**

Fills and hovers to `ButtonFace`, foregrounds to `ButtonText` — the pair the map already uses for `default`. The spec's section 4 carries the table.

- [ ] **Step 5: Regenerate and verify no drift**

Run: `pnpm tokens:build && pnpm check:tokens`
Expected: `variables.css` gains the nine tokens per scheme and the forced-colors block grows; every gate passes, drift included. The generated file is committed, never hand-edited.

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd packages/styles && pnpm vitest run && pnpm typecheck`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add packages/styles/
git commit -m "feat(styles): выставить on-surface через @theme inline и forced-colors"
```

---

### Task 3: The Color System page

**Files:**
- Create: `apps/storybook/src/stories/color-system.stories.tsx`

**Interfaces:**
- Consumes: `--color-*` names exposed by `theme.css`.
- Produces: story ids `foundations-color-system--all-colors` and its autodocs page.

- [ ] **Step 1: Write the story**

`title: "Foundations/Color System"`, `parameters: {layout: "fullscreen"}`, default export is the CSF meta. One story `AllColors`, container `mx-auto max-w-4xl p-6`.

The token list is a module-level `const` of `{section, rows: {name, variable}[]}` — nine sections and seventy-seven rows exactly as the spec's section 5 tables them. A row renders a 48×48 swatch, the human name, the variable in a `<code>`, and the computed value in a `<code>`.

Three things the reference gets wrong and this page must not:

- **Re-read on theme change.** Read the computed values inside an effect keyed on the theme global from `preview.tsx`'s `themeGlobalType`, not in the render body. A story reads globals through the `context.globals` argument the renderer passes.
- **Show alpha.** Render each swatch over a two-tone backdrop — two halves, one light one dark, behind the swatch — so a translucent token reads as translucent. Four `*-soft` families and `backdrop` carry alpha.
- **List nothing that does not exist.** The three `on-surface-*-focus` tokens are absent; a footnote names them as deferred and cites the spec's section 6.

- [ ] **Step 2: Typecheck and build**

Run: `pnpm typecheck && pnpm build:storybook`
Expected: both succeed.

- [ ] **Step 3: Confirm the story renders and the values are not blank**

Serve the static build on a free port and open the story iframe per `apps/storybook/AGENTS.md`: `agent-browser open <iframe-url>` → `errors` → `console`. Text only, never screenshots.
Expected: no page errors, no console output, and a spot check of three variables across different sections returns non-empty computed values.

- [ ] **Step 4: Commit**

```bash
git add apps/storybook/src/stories/color-system.stories.tsx
git commit -m "feat(storybook): страница Foundations/Color System — 77 токенов в девяти секциях"
```

---

### Task 4: The page's gate

**Files:**
- Create: `apps/storybook/e2e/ColorSystem.spec.ts`

**Interfaces:**
- Consumes: the story from Task 3, the token surface from Task 2.
- Produces: the gate that makes the reference's silent-empty-swatch defect impossible here.

- [ ] **Step 1: Write the failing test**

`apps/storybook/e2e/ColorSystem.spec.ts`, auditing `/iframe.html?id=foundations-color-system--all-colors` **directly**. Not through the manager: `checkA11y(page, "#storybook-preview-iframe")` inspects the iframe element rather than the story inside it and passes having seen nothing — a mistake that shipped here once, per `apps/storybook/AGENTS.md`.

Four tests:

- **No blank computed value, in both themes.** Every row's value cell is non-empty. This is the gate; it catches a token missing from the theme, a mapping missing from `theme.css`, and a misspelled name on the page.
- **No duplicate variable** across the whole page (Review Focus item 5): collect every variable name, assert the set size equals the row count.
- **The page covers the token surface** (Review Focus item 4): read every `--color-*` name off `document.documentElement`'s computed style, subtract the documented exclusions, and assert the page lists the rest. The exclusion list lives in the spec and is named in a comment here.
- **Switching the theme changes the values** (Review Focus item 3): capture one row's value under `default-light`, reload under `default-dark`, assert it differs.

Plus a `checkA11y` audit of the story in both themes.

- [ ] **Step 2: Run it to verify it fails against a deliberate gap**

Temporarily remove one mapping line from `theme.css`.
Run: `STORYBOOK_PORT=<free> pnpm test:e2e -- e2e/ColorSystem.spec.ts`
Expected: FAIL on the blank-value test, naming the variable. Restore the line.

- [ ] **Step 3: Run the whole suite intact**

Run: `STORYBOOK_PORT=<free> pnpm test:e2e`
Expected: every test passes, the new five among them. Playwright never reuses a server it did not start, so a held 6007 is a port to step around, not a process to kill.

- [ ] **Step 4: Run every gate**

Run: `pnpm typecheck && pnpm test && pnpm check:tokens && pnpm lint:package && pnpm build:storybook`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add apps/storybook/e2e/ColorSystem.spec.ts
git commit -m "test(storybook): гейт страницы Color System — ни одной пустой плашки"
```
