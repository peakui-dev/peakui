# Field Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the seven components that constitute `@peakui/react`'s form-field contract — `TextField`, `Label`, `Description`, `FieldError`, `Input`, `InputGroup`, `Fieldset` — plus the shared floor they stand on.

**Architecture:** Each component is a thin styled composition over a `react-aria-components` primitive: `tv()` emits BEM names, the Tailwind lives in `@peakui/styles`, and state is read from RAC's `data-*` attributes. One `FieldVariantContext` carries `variant` from a field root to its controls, replacing the reference's one-context-per-root design. Build order is floor → `Input` → field root and label → messages → group → fieldset, so every task has a working predecessor to test against.

**Tech Stack:** React 19, `react-aria-components` 1.21.1, `tailwind-variants`, Tailwind v4 CSS, vitest + `@testing-library/react`, Playwright (Storybook e2e).

**Spec:** `docs/superpowers/specs/2026-10-03-input-field-family-design.md`

## Global Constraints

- **`"use client"`** at the top of every `.tsx` component file and every module that creates or reads a React context, including `contexts/field-variant.ts` and `hooks/use-has-text-slot.ts`.
- **No `forwardRef`.** `ref` is an ordinary prop; type props with `ComponentPropsWithRef<typeof Primitive>`. `use(Context)`, never `useContext`.
- **Named exports only**, except Storybook CSF default exports. Component files are kebab-case and match the BEM block and the CSS file name.
- **`tv()` emits BEM class names only.** No Tailwind utility inside `tv()`, no Tailwind in JSX. Every utility lives in `packages/styles/components/<name>.css`.
- **`data-slot` on every rendered element**; state styled through `data-*`, never `is-*`.
- **Every interactive state is written twice in CSS** — the pseudo-class *and* the `data-*` attribute — because the stylesheet ships standalone for non-React consumers.
- **`motion-reduce:transition-none` comes *after* the `transition` declaration**, never before.
- **No `any`** outside the `DOMRenderProps` polymorphic spread, where it carries a comment and an inline `eslint-disable-next-line @typescript-eslint/no-explicit-any`.
- **Every red mark is `--color-danger-soft-foreground`**, never `--color-danger`: measured at 2.95:1 against the field fill in the dark theme, below both the 4.5:1 text and 3:1 boundary minimums.
- **Field focus is `status-focused-field`**, never `status-focused`: the 2px offset of the general ring draws over a neighbouring slot's border.
- **Imports in tests** use the `@/` alias (`@/components/input`) and helpers come from `@peakui/testing/helpers`. Code comments in Russian, matching the surrounding files; test names in English, matching `button.test.tsx`.
- **Both call styles must work** for every component: `<Input>` / `<Input.Root>` / `<InputRoot>` are the same component, via `Object.assign` onto the Root.

## Review Focus

Five things the spec implies and no task's happy path exercises. Each has a test assigned to the task that owns the code.

1. **A control with no field root above it.** `Input` and `InputGroup` read `useFieldVariant()`; with no provider they must render `primary` and must not throw. Test in Task 3 and Task 6.
2. **A consumer's `className` must merge with the BEM names, not replace them.** `composeTwRenderProps` and `composeSlotClassName` are easy to wire backwards, and the failure is silent — the component still renders. Test in Task 3 (root) and Task 6 (slots).
3. **An interactive control inside `InputGroup.Suffix`.** Click-to-focus must not steal a click meant for a button in the suffix. Test in Task 6.
4. **A disabled `Fieldset` wrapping a field.** `Input` is not one of the seven forwarded contexts; it relies on native `<fieldset disabled>` while the label's disabled styling relies on `data-disabled` cascading from the root. Test in Task 7.
5. **`ref` reaching the real DOM node on every part.** React 19 passes it as a prop, and a part that destructures props and forgets to spread it fails silently. Test in Tasks 3–7, one assertion per part.

---

## File structure

**New, `packages/react/src/`:**

| File | Responsibility |
| --- | --- |
| `contexts/field-variant.ts` | `FieldVariantContext`, `useFieldVariant` |
| `contexts/index.ts` | barrel |
| `hooks/use-has-text-slot.ts` | `useHasTextSlot`, `FieldSlotsGateContext` |
| `hooks/index.ts` | barrel |
| `components/<name>/<name>.tsx` | context + every part, one file per component |
| `components/<name>/<name>.stories.tsx` | `Components/<Name>` |
| `components/<name>/index.ts` | the three-section export contract |

**New, `packages/styles/`:** `src/components/<name>/<name>.styles.ts` + `index.ts`, and `components/<name>.css`, for each of the seven. `<name>` ∈ `input`, `input-group`, `textfield`, `label`, `description`, `field-error`, `fieldset`.

**New tests:** `packages/react/tests/hooks/use-has-text-slot.test.tsx`, `packages/react/tests/components/<name>/<name>.test.tsx` for all seven, `packages/react/tests/components/textfield/textfield.ssr.test.tsx`, `apps/storybook/e2e/InputGroup.spec.ts`.

**Modified:** `packages/react/src/index.ts`, `packages/react/src/components/index.ts`, `packages/styles/src/components/index.ts`, `packages/styles/components/index.css`, `packages/styles/utilities/index.css`.

---

## Task 1: The field floor — context and hook

**Files:**
- Create: `packages/react/src/contexts/field-variant.ts`, `packages/react/src/contexts/index.ts`
- Create: `packages/react/src/hooks/use-has-text-slot.ts`, `packages/react/src/hooks/index.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/tests/hooks/use-has-text-slot.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type FieldVariant = "primary" | "secondary"`
  - `interface FieldVariantContextValue {variant?: FieldVariant}`
  - `const FieldVariantContext: Context<FieldVariantContextValue>`, default `{}`
  - `function useFieldVariant(): FieldVariantContextValue` — returns the context value unresolved; the part resolves its own prop against it
  - `const FieldSlotsGateContext: Context<boolean>`, default `false`
  - `function useHasTextSlot(slot: string): boolean` — `true` outside a gate; inside a gate, `true` only when RAC's `TextContext` publishes that slot

- [ ] **Step 1: Write the failing test** — `tests/hooks/use-has-text-slot.test.tsx`, a probe component rendering `String(useHasTextSlot("description"))`:

```tsx
it("reports the slot available outside a gate", () => { /* renders "true" with no providers */ });
it("reports the slot unavailable inside a gate with no TextContext slots", () => {
  /* <FieldSlotsGateContext value={true}><Probe/> */ /* renders "false" */
});
it("reports the slot available inside a gate once TextContext publishes it", () => {
  /* <FieldSlotsGateContext value={true}><TextContext value={{slots: {description: {}}}}> */ /* "true" */
});
it("reports an unrelated slot unavailable inside a gate", () => {
  /* slots: {errorMessage: {}} and probing "description" */ /* "false" */
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd packages/react && pnpm vitest run tests/hooks/use-has-text-slot.test.tsx`
Expected: FAIL — cannot resolve `@/hooks/use-has-text-slot`.

- [ ] **Step 3: Implement both floor modules**

`contexts/field-variant.ts` holds the three exports above. `hooks/use-has-text-slot.ts` is ported from `heroui/packages/react/src/utils/use-has-text-slot.ts` — read it rather than recalling it — reading RAC's `TextContext` via `use()` and narrowing it to `{slots?: Record<string, unknown>} | null` with `unknown`, not `any`. Both files open with `"use client"`. Each barrel re-exports its directory; `src/index.ts` gains `export * from "./contexts/index.ts";` and `export * from "./hooks/index.ts";` beside the two existing lines.

- [ ] **Step 4: Run the test and the gates**

Run: `cd packages/react && pnpm vitest run tests/hooks && pnpm typecheck && pnpm lint`
Expected: 4 passing, no type errors, no lint errors.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/contexts packages/react/src/hooks packages/react/src/index.ts packages/react/tests/hooks
git commit -m "feat(react): фундамент полей — FieldVariantContext и useHasTextSlot"
```

---

## Task 2: The two field focus utilities

**Files:**
- Modify: `packages/styles/utilities/index.css`

**Interfaces:**
- Produces: `@utility status-focused-field`, `@utility status-invalid-field`, consumed by every CSS file in Tasks 3–7.

- [ ] **Step 1: Add both utilities**

Exactly as spec section 1.2 writes them: `status-focused-field` is `outline: 2px solid var(--color-focus)` with `outline-offset: 0`; `status-invalid-field` is a 1px `--color-danger-soft-foreground` outline that becomes 2px under the six focus forms (`:focus`, `:focus-visible`, `:focus-within`, `[data-focused]`, `[data-focus-visible]`, `[data-focus-within]`). Outline, not Tailwind `ring-*`: a `box-shadow` ring is clipped by an ancestor's `overflow: hidden`.

- [ ] **Step 2: Amend the doctrine comment above `status-focused`**

It currently claims a single source of truth for visible focus. Say instead that the system has two rings — the general one with its offset, and the field one drawn flush — and that a component picks the field ring when its control sits inside a shared shell. One sentence each; no component may draw its own.

- [ ] **Step 3: Run the token gates**

Run: `cd packages/styles && pnpm check:tokens && pnpm test`
Expected: PASS. The dangling-token gate is what proves `--color-danger-soft-foreground` and `--color-focus` are declared; a typo here fails it.

- [ ] **Step 4: Commit**

```bash
git add packages/styles/utilities/index.css
git commit -m "feat(styles): кольцо фокуса и невалидности для полей"
```

---

## Task 3: `Input`

**Files:**
- Create: `packages/styles/src/components/input/input.styles.ts`, `.../input/index.ts`, `packages/styles/components/input.css`
- Create: `packages/react/src/components/input/input.tsx`, `.../input/index.ts`, `.../input/input.stories.tsx`
- Modify: `packages/styles/src/components/index.ts`, `packages/styles/components/index.css`, `packages/react/src/components/index.ts`
- Test: `packages/react/tests/components/input/input.test.tsx`

**Interfaces:**
- Consumes: `useFieldVariant` (Task 1), `status-focused-field` / `status-invalid-field` (Task 2), `composeTwRenderProps` from `@/utils/compose.ts`.
- Produces:
  - `inputVariants` — base `input`, variants `fullWidth` (`input--full-width`), `variant` (`input--primary` / `input--secondary`), default `variant: "primary"`
  - `type InputVariants = VariantProps<typeof inputVariants>`
  - `InputRoot`, `interface InputRootProps extends ComponentPropsWithRef<typeof InputPrimitive>, InputVariants {}`
  - `Input = Object.assign(InputRoot, {Root: InputRoot})`, `type Input`, `InputProps` alias

- [ ] **Step 1: Write the failing test** — `tests/components/input/input.test.tsx`:

```tsx
it("renders a textbox and accepts typing");                      // role textbox, user.type → value
it("exposes BEM block and data-slot");                           // className contains "input", data-slot="input"
it("applies the full-width modifier");                           // "input--full-width"
it("defaults to the primary variant with no field root above it"); // "input--primary", no provider, no throw
it("reads the variant from the field context");                  // FieldVariantContext value {variant:"secondary"} → "input--secondary"
it("lets an explicit variant prop win over the context");        // context secondary + variant="primary" → "input--primary"
it("merges a consumer className with the BEM names");            // className="mine" → both "input" and "mine"
it("does not fire onChange while disabled");                     // disabled + user.type → onChange not called
it("forwards ref to the input element");                         // createRef → ref.current is HTMLInputElement
it("behaves identically as Input.Root and InputRoot");           // both render role textbox with data-slot="input"
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd packages/react && pnpm vitest run tests/components/input`
Expected: FAIL — cannot resolve `@/components/input`.

- [ ] **Step 3: Write `input.styles.ts` and register it**

`tv()` with the shape in Interfaces, BEM names only, a comment saying why no Tailwind may enter — copy the form of `button.styles.ts`. Add `export * from "./input/input.styles.ts";` to `packages/styles/src/components/index.ts`.

- [ ] **Step 4: Write `components/input.css` and register it**

Port `heroui/packages/styles/components/input.css`, applying spec section 3.1 and 5. Read the reference file; do not write it from memory. Required: fill, `--radius-field`, `border: var(--border-width-field) solid var(--field-border)` held in the normal state, `--shadow-field`, placeholder colour, `text-base sm:text-sm`, `min-h-10 md:min-h-9`; hover only under `@media (hover: hover)` and only when not focused, in both pseudo-class and `data-hovered` forms; focus `@apply status-focused-field` plus `--field-border-focus`; `[data-invalid]` `@apply status-invalid-field`; disabled `@apply status-disabled` in all three forms (`:disabled`, `[data-disabled]`, `[aria-disabled="true"]`); the multi-part `transition` with `motion-reduce:transition-none` after it; `.input--primary` empty with its comment; `.input--secondary` with `--input-bg*` custom properties over `--default`; `.input--full-width`; and a `@media (forced-colors: active)` block raising `border-width` to `1px`. Add `@import "./input.css";` to `packages/styles/components/index.css`.

- [ ] **Step 5: Write `input.tsx` and `index.ts`, and register the component**

`InputRoot` composes `react-aria-components/Input`, resolves `variant ?? useFieldVariant().variant`, passes `composeTwRenderProps(className, inputVariants({fullWidth, variant}))`, sets `data-slot="input"`, spreads the rest. `index.ts` is the three-section contract (`button/index.ts` is the model). Add `export * from "./input/index.ts";` to `packages/react/src/components/index.ts`.

- [ ] **Step 6: Run the test and confirm it passes**

Run: `cd packages/react && pnpm vitest run tests/components/input && pnpm typecheck`
Expected: 10 passing.

- [ ] **Step 7: Write the story**

`input.stories.tsx`, `title: "Components/Input"`, every story with a second-level heading — the e2e audit treats it as the readiness signal and without it axe audits an empty iframe and passes silently. Stories: `Default`, `Variants`, `FullWidth`, `Invalid`, `Disabled`, `Placeholder`.

- [ ] **Step 8: Run the whole suite and the style gates**

Run: `pnpm test && pnpm check:tokens && pnpm lint`
Expected: PASS, including both barrel-completeness gates, which now see the new directories.

- [ ] **Step 9: Commit**

```bash
git add packages/styles/src/components packages/styles/components packages/react/src/components packages/react/tests/components/input
git commit -m "feat(react): компонент Input"
```

---

## Task 4: `TextField` and `Label`

**Files:**
- Create: `packages/styles/src/components/textfield/*`, `.../label/*`, `packages/styles/components/textfield.css`, `packages/styles/components/label.css`
- Create: `packages/react/src/components/textfield/{textfield.tsx,index.ts,textfield.stories.tsx}`, `.../label/{label.tsx,index.ts,label.stories.tsx}`
- Modify: the four registration points
- Test: `packages/react/tests/components/textfield/textfield.test.tsx`, `.../textfield/textfield.ssr.test.tsx`, `.../label/label.test.tsx`

**Interfaces:**
- Consumes: `FieldVariantContext` (Task 1), `Input` (Task 3).
- Produces:
  - `textFieldVariants` — base `textfield`, variant `fullWidth`
  - `labelVariants` — base `label`, variants `isRequired`, `isDisabled`, `isInvalid` (`label--required` / `--disabled` / `--invalid`)
  - `TextFieldRoot`, `interface TextFieldRootProps extends ComponentPropsWithRef<typeof TextFieldPrimitive>, TextFieldVariants {variant?: FieldVariant}`
  - `LabelRoot`, `interface LabelRootProps extends ComponentPropsWithRef<typeof LabelPrimitive>, LabelVariants {}`
  - `TextField`, `Label` compounds with `{Root}` and their type aliases

- [ ] **Step 1: Write the failing tests**

`textfield.test.tsx`:

```tsx
it("binds the label to the control");                       // getByLabelText("City") is the input
it("exposes BEM block and data-slot");                      // "textfield", data-slot="textfield"
it("applies the full-width modifier");
it("passes its variant to a child Input through context");  // variant="secondary" → input has "input--secondary"
it("provides the context even without a variant, resetting an outer one");
  // outer FieldVariantContext {variant:"secondary"} + <TextField> → child input is "input--primary"
it("marks the field invalid");                              // isInvalid → data-invalid on the root
it("marks the field required");                             // isRequired → data-required on the root
it("forwards ref to the root element");
it("behaves identically as TextField.Root and TextFieldRoot");
```

`label.test.tsx`:

```tsx
it("renders a label element with its text");
it("exposes BEM block and data-slot");
it("applies the required, disabled and invalid modifiers");  // the three props, one assertion each
it("forwards ref to the label element");
```

`textfield.ssr.test.tsx`:

```tsx
it("renders a labelled field without hydration mismatch");  // ssrSmoke of TextField+Label+Input; html contains data-slot="textfield"
it("renders an invalid field without hydration mismatch");  // html contains data-invalid="true"
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd packages/react && pnpm vitest run tests/components/textfield tests/components/label`
Expected: FAIL — unresolved imports.

- [ ] **Step 3: Write both style recipes and both CSS files, and register all four**

`textfield.css`: `flex flex-col gap-1`, the `fullWidth` modifier making a descendant `[data-slot="input"]` / `[data-slot="input-group"]` full width, and hiding `[data-slot="description"]` while the root is `[data-invalid]` / `[aria-invalid="true"]` so the error replaces the description instead of stacking under it. Keep the reference's comment explaining why the block is `textfield` and not `text-field`: `--color-field` exists, so `text-field` is a generated Tailwind utility and the BEM name would collide with it.

`label.css`: `text-sm font-medium text-foreground`; the required asterisk via `after:content-['*']` in `--color-danger-soft-foreground`, written both as `.label--required` and as the `[data-required]` ancestor selector with the reference's `:not()` guards against group roles; the disabled and invalid states likewise in both forms, invalid in `--color-danger-soft-foreground`.

- [ ] **Step 4: Write both components and both `index.ts`**

`TextFieldRoot` composes RAC `TextField`, destructures `variant` out of the spread (RAC has no such prop), and provides `FieldVariantContext` **inside** the primitive's render-prop children so RAC's render props resolve first. The provider is unconditional — that is what makes a nested field reset inheritance. `LabelRoot` composes RAC `Label` with `labelVariants(...)`; the three booleans are props for the standalone case, while inside a field the CSS cascades from the root's `data-*`.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd packages/react && pnpm vitest run tests/components/textfield tests/components/label && pnpm typecheck`
Expected: 15 passing.

- [ ] **Step 6: Write both stories**

`Components/TextField`: `Default`, `Variants`, `FullWidth`, `Required`, `Invalid`, `Disabled`. `Components/Label`: `Default`, `States`. Second-level heading on every story.

- [ ] **Step 7: Run everything**

Run: `pnpm test && pnpm check:tokens && pnpm lint && pnpm typecheck`

- [ ] **Step 8: Commit**

```bash
git add packages/styles packages/react
git commit -m "feat(react): TextField и Label — корень поля и его подпись"
```

---

## Task 5: `Description` and `FieldError`

**Files:**
- Create: `packages/styles/src/components/description/*`, `.../field-error/*`, `packages/styles/components/description.css`, `packages/styles/components/field-error.css`
- Create: `packages/react/src/components/description/{description.tsx,index.ts}`, `.../field-error/{field-error.tsx,index.ts}`, one shared story file per component
- Modify: the four registration points
- Test: `packages/react/tests/components/description/description.test.tsx`, `.../field-error/field-error.test.tsx`

**Interfaces:**
- Consumes: `useHasTextSlot` (Task 1), `TextField` (Task 4), `Input` (Task 3).
- Produces:
  - `descriptionVariants` — base `description`; `fieldErrorVariants` — base `field-error`
  - `DescriptionRoot`, `interface DescriptionRootProps extends ComponentPropsWithRef<typeof Text>, TextProps, DescriptionVariants {}`
  - `FieldErrorRoot`, `interface FieldErrorRootProps extends ComponentPropsWithRef<typeof FieldErrorPrimitive>, FieldErrorVariants {}`

- [ ] **Step 1: Write the failing tests**

`description.test.tsx`:

```tsx
it("describes the control it sits beside");        // getByRole("textbox") has accessible description "Where you live"
it("exposes BEM block and data-slot");
it("renders nothing inside a gate with no description slot");  // FieldSlotsGateContext value={true} → container empty
it("forwards ref to the rendered element");
```

`field-error.test.tsx`:

```tsx
it("shows the message when the field is invalid");   // TextField isInvalid → message in the document
it("renders nothing when the field is valid");       // no isInvalid → queryByText null
it("describes the control while invalid");           // the message is the input's accessible description
it("exposes BEM block, data-slot and data-visible");
it("forwards ref to the rendered element");
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `cd packages/react && pnpm vitest run tests/components/description tests/components/field-error`

- [ ] **Step 3: Write both recipes and both CSS files, and register all four**

`description.css` is one rule: `text-xs text-muted`, wrapping long words. `field-error.css` collapses by default (`h-0 opacity-0`) and expands on `[data-visible]`, text in `--color-danger-soft-foreground`, with `transition` on opacity and height and `motion-reduce:transition-none` after it.

- [ ] **Step 4: Write both components and both `index.ts`**

`DescriptionRoot` renders RAC `Text` with `slot="description"` and returns `null` when `useHasTextSlot("description")` is false. `FieldErrorRoot` renders RAC `FieldError` with a bare `data-visible` and supports a function child, as the reference does.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd packages/react && pnpm vitest run tests/components/description tests/components/field-error && pnpm typecheck`
Expected: 9 passing.

- [ ] **Step 6: Write the stories**

`Components/Description` and `Components/FieldError`, each showing the part inside a real `TextField` — neither renders anything meaningful alone, and a story that hides that is a lie about the contract.

- [ ] **Step 7: Run everything, then commit**

```bash
pnpm test && pnpm check:tokens && pnpm lint && pnpm typecheck
git add packages/styles packages/react
git commit -m "feat(react): Description и FieldError — описание поля и сообщение валидации"
```

---

## Task 6: `InputGroup`

**Files:**
- Create: `packages/styles/src/components/input-group/*`, `packages/styles/components/input-group.css`
- Create: `packages/react/src/components/input-group/{input-group.tsx,index.ts,input-group.stories.tsx}`
- Modify: the four registration points
- Test: `packages/react/tests/components/input-group/input-group.test.tsx`

**Interfaces:**
- Consumes: `useFieldVariant` (Task 1), both focus utilities (Task 2), `composeSlotClassName` and `composeTwRenderProps` from `@/utils/compose.ts`, `TextField` (Task 4).
- Produces:
  - `inputGroupVariants` — slots `base` (`input-group`), `input` (`input-group__input`), `prefix` (`input-group__prefix`), `suffix` (`input-group__suffix`); variants `fullWidth`, `variant`
  - `InputGroupRoot`, `InputGroupInput`, `InputGroupTextArea`, `InputGroupPrefix`, `InputGroupSuffix` and their `*Props`
  - `InputGroup = Object.assign(InputGroupRoot, {Root, Input, TextArea, Prefix, Suffix})`

- [ ] **Step 1: Write the failing test** — `tests/components/input-group/input-group.test.tsx`:

```tsx
it("renders prefix, control and suffix");
it("exposes the BEM block and a data-slot on every part");   // input-group, -input, -prefix, -suffix
it("focuses the input when the prefix is clicked");
it("focuses the textarea when the prefix is clicked");       // regression: reference queries only "input"
it("does not steal a click aimed at a button in the suffix"); // button's onPress fires, button keeps focus
it("does nothing extra when the click lands on the control itself"); // onClick still called once
it("calls a consumer onClick alongside focusing");
it("defaults to the primary variant with no field root above it");
it("reads the variant from the field context");
it("lets an explicit variant prop win over the context");
it("merges a consumer className on the root and on a slot");
it("marks the group invalid");                                // TextField isInvalid → data-invalid reaches the shell
it("forwards ref to the group element");
it("behaves identically as InputGroup.Prefix and InputGroupPrefix");
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd packages/react && pnpm vitest run tests/components/input-group`

- [ ] **Step 3: Write the recipe and register it**

`tv({slots, variants})` per Interfaces, BEM names only.

- [ ] **Step 4: Write `components/input-group.css` and register it**

Port `heroui/packages/styles/components/input-group.css` — read it — applying spec sections 3.1, 3.2 and 5. Required beyond the reference: the invalid border uses `--color-danger-soft-foreground`, **not** the reference's undeclared `--color-field-border-invalid`, which would fail `check:tokens`; `min-h-10 md:min-h-9` replaces the fixed `min-h-9`; the grouped textarea's `min-height: 38px` and the prefix/suffix `padding-top: 0.5rem` become multiples of `--spacing`; a `@media (forced-colors: active)` block raises `border-width` on the shell, the prefix and the suffix. Keep verbatim, with their comments: the autofill handling (neutralise the inner control's `:autofill` paint with an inset box-shadow, lift the highlight onto the group) and the `:has([data-slot="input-group-textarea"])` rules that switch the shell to `items-start` and auto height. Keep the logical-property radii (`rounded-s-*` / `rounded-e-*`) so RTL flips correctly. The suffix's inline padding must leave room for a 24×24 control without the shell growing — that is WCAG 2.2 SC 2.5.8 for a button living in a suffix. Add a comment stating why `concentric-inner` is *not* used: the prefix sits flush against the shell, padding is zero, so `R_inner = R_outer` already.

- [ ] **Step 5: Write `input-group.tsx` and `index.ts`**

An `InputGroupContext` carries the computed slots so each part reads its own class instead of recomputing the recipe. `InputGroupRoot` composes RAC `Group`, resolves `variant` from prop or context, and handles click-to-focus: ignore the event when its target is the control or inside it, otherwise focus `groupRef.current?.querySelector("input, textarea")` — the reference's `querySelector("input")` is why a grouped textarea does not focus — then call the consumer's `onClick`. A click on a button inside the suffix must reach the button, which the "target is inside an interactive element" guard is responsible for.

- [ ] **Step 6: Run the test and confirm it passes**

Run: `cd packages/react && pnpm vitest run tests/components/input-group && pnpm typecheck`
Expected: 14 passing.

- [ ] **Step 7: Write the story**

`Components/InputGroup`: `Default`, `WithPrefix`, `WithSuffix`, `WithBoth`, `WithTextArea`, `WithButtonInSuffix`, `Variants`, `Invalid`, `Disabled`, `FullWidth`.

- [ ] **Step 8: Run everything, then commit**

```bash
pnpm test && pnpm check:tokens && pnpm lint && pnpm typecheck
git add packages/styles packages/react
git commit -m "feat(react): InputGroup — префикс, контрол и суффикс одним полем"
```

---

## Task 7: `Fieldset`

**Files:**
- Create: `packages/styles/src/components/fieldset/*`, `packages/styles/components/fieldset.css`
- Create: `packages/react/src/components/fieldset/{fieldset.tsx,index.ts,fieldset.stories.tsx}`
- Modify: the four registration points
- Test: `packages/react/tests/components/fieldset/fieldset.test.tsx`

**Interfaces:**
- Consumes: `dom` and `DOMRenderProps` from `@/utils/dom.tsx`, `composeSlotClassName`, `TextField` + `Label` + `Input` (Tasks 3–4), `Button` from `@/components/button`.
- Produces:
  - `fieldsetVariants` — slots `base` (`fieldset`), `legend` (`fieldset__legend`), `group` (`fieldset__group`), `actions` (`fieldset__actions`). **No `description` slot** — the reference declares one with no rule and no part behind it.
  - `FieldsetRoot`, `FieldsetLegend`, `FieldsetGroup`, `FieldsetActions`, each generic over its element type through `DOMRenderProps`
  - `Fieldset = Object.assign(FieldsetRoot, {Root, Legend, Group, Actions})` — note the namespace key is `Group` while the flat export is `FieldsetGroup`

- [ ] **Step 1: Write the failing test** — `tests/components/fieldset/fieldset.test.tsx`:

```tsx
it("names the group with its legend");                   // getByRole("group", {name: "Address"})
it("exposes a data-slot on all four parts");
it("renders a field group and actions");
it("mirrors native disabled as data-disabled on the root");
it("reports isDisabled through a child Button's render prop when disabled");
  // <Fieldset disabled><Button>{({isDisabled}) => String(isDisabled)}</Button> → "true"
it("natively disables a field's input when disabled");   // the input inside a TextField is disabled
it("leaves a child Button enabled when the fieldset is not disabled");
it("replaces the element through the render prop");      // render={(props) => <section {...props} />}
it("forwards ref to each part's element");
it("behaves identically as Fieldset.Group and FieldsetGroup");
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd packages/react && pnpm vitest run tests/components/fieldset`

- [ ] **Step 3: Write the recipe and the CSS, and register both**

`fieldset.css`: `flex flex-col gap-6` plus `shrink grow basis-0`, keeping the reference's comment about the Safari flexbox bug with a `<legend>` — it is not verifiable here, so it is not removed. `fieldset__legend` is `text-base font-medium`; `fieldset__group` is `w-full` with a `4`-step gap between fields; `fieldset__actions` is a flex row with a `2` gap. No padding on the base: the surface the consumer puts it on owns that.

- [ ] **Step 4: Write `fieldset.tsx` and `index.ts`**

All four parts render plain DOM through `dom.*` and accept `render`, which is where the package's one sanctioned `any` lives — comment it and disable the lint rule on that line only. `FieldsetRoot` mirrors a native `disabled` prop as `data-disabled="true"` and, when disabled, wraps children in RAC's `Provider` with all seven contexts — `ButtonContext`, `CheckboxGroupContext`, `LinkContext`, `RadioGroupContext`, `SliderContext`, `ToggleButtonContext`, `ToggleButtonGroupContext` — each `{isDisabled: true}`. Carry a comment giving both reasons: the browser does not disable `<div>`-based primitives, and RAC's internal `isDisabled` only updates from props or context, so without this a button is unclickable while its render prop still reports `false`.

- [ ] **Step 5: Run the test and confirm it passes**

Run: `cd packages/react && pnpm vitest run tests/components/fieldset && pnpm typecheck`
Expected: 10 passing.

- [ ] **Step 6: Write the story**

`Components/Fieldset`: `Default` (legend + three fields + actions), `Disabled`, `WithRenderProp`.

- [ ] **Step 7: Run everything, then commit**

```bash
pnpm test && pnpm check:tokens && pnpm lint && pnpm typecheck
git add packages/styles packages/react
git commit -m "feat(react): Fieldset — группа полей с легендой и каскадом disabled"
```

---

## Task 8: Style-layer stories — the framework-agnostic promise

**Files:**
- Create: `apps/storybook/src/stories/input.stories.tsx`, `input-group.stories.tsx`, `fieldset.stories.tsx`, `label.stories.tsx`, `field-error.stories.tsx`

**Interfaces:**
- Consumes: the five `tv()` recipes from `@peakui/styles`; renders **no** React component from `@peakui/react`.

- [ ] **Step 1: Write the five story files**

Bare markup only — `<input className={inputVariants({variant: "secondary"})} />` and the like — following `apps/storybook/src/stories/button.stories.tsx`, including its comment explaining why building BEM names as strings is safe where Tailwind utilities would not be. These five are the components whose CSS carries modifiers or state rules a non-React consumer must get for free; `textfield` and `description` are one rule each and are exercised inside them. State that split in a comment, so the next author does not add two empty files for symmetry.

Each file must cover, in markup, what no React story can: `data-invalid`, `data-disabled`, `data-hovered` and `data-focus-within` set by hand, plus `dir="rtl"` on one `input-group` story so the logical-property radii and the prefix divider are visible flipped.

- [ ] **Step 2: Build Storybook**

Run: `pnpm build:storybook`
Expected: build succeeds, no duplicate-story-id error against the React stories of the same title.

- [ ] **Step 3: Commit**

```bash
git add apps/storybook/src/stories
git commit -m "docs(storybook): стилевой ярус полей на голой разметке"
```

---

## Task 9: Browser tier

**Files:**
- Create: `apps/storybook/e2e/InputGroup.spec.ts`

**Interfaces:**
- Consumes: the stories from Tasks 6 and 8.

- [ ] **Step 1: Write the spec**

Follow `apps/storybook/e2e/Button.spec.ts` for the iframe-opening and readiness protocol. Four checks, each one jsdom cannot make:

```ts
test("a click on the prefix moves real focus to the control");
test("a click on the prefix moves real focus to a grouped textarea");
test("the focus ring is painted on the shell and is not clipped by the prefix"); // bounding boxes
test("the shell grows with the textarea instead of clipping it");
test("axe finds no violations on the field stories in light and dark");
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e`
Expected: PASS. It builds Storybook first; if port 6007 is taken, `STORYBOOK_PORT=<free> pnpm test:e2e`.

- [ ] **Step 3: Commit**

```bash
git add apps/storybook/e2e
git commit -m "test(storybook): e2e InputGroup — фокус, кольцо и рост по textarea"
```

---

## Task 10: Record what this work found

**Files:**
- Modify: `../docs/ecosystem/backlog.md` — **in the `peakui-company` repository, not this one.** Check its branch and leave its other working-tree changes alone.

- [ ] **Step 1: Add the four findings from spec section 10**

In English, as new content: the missing "danger mark on a neutral surface" role with the measured 2.95:1; `field` absent from `FOREGROUND_PAIRS`; `--field-border-width` not overridden in the theme's `forced-colors` block; and the field family as a second consumer of the known `--focus`-on-secondary-surface defect. Each with its measurement and a pointer to this spec.

- [ ] **Step 2: Note one doc drift found while implementing**

`references/testing.md` says test names are written in Russian; `button.test.tsx` and every suite in this plan write them in English. One of the two is wrong and it is not this plan's call — record it as a backlog item so the next component author does not have to guess.

- [ ] **Step 3: Commit in that repository**

```bash
git -C .. add docs/ecosystem/backlog.md
git -C .. commit -m "docs(ecosystem): находки семейства полей — красная метка, пара field, граница в forced-colors"
```

---

## Definition of done

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check:tokens`, `pnpm lint:package`, `pnpm test:e2e` all pass.
- All seven components ship `.tsx`, stories, a jsdom suite, a three-section `index.ts`, a `.styles.ts` and a `.css`, with both barrel lines; the two completeness gates prove it.
- A labelled, described, invalid field renders from `TextField` + `Label` + `Input` + `Description` + `FieldError` with no `aria-*` attribute and no id written by hand.
- `InputGroup` focuses its control — `input` **or** `textarea` — on a prefix click, and does not swallow a click meant for a button in its suffix.
- A disabled `Fieldset` reports `isDisabled: true` through a child `Button`'s render prop.
- No shipped field CSS reads `--color-danger` for text or for an outline.
- Every field has a visible, unclipped focus ring, and a visible boundary under `forced-colors: active`.
