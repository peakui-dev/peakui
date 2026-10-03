# The field family — `Input`, `InputGroup`, `Fieldset`, and the floor they stand on

`@peakui/react` ships two components, `Button` and `Spinner`. Neither is a form field, so the
library has no field contract at all: nothing provides a label, nothing wires `aria-describedby`,
nothing renders a validation message. This spec adds that contract and the seven components that
constitute it.

## Task

Ship seven components, as one contract:

| Component | RAC primitive | What it is |
| --- | --- | --- |
| `TextField` | `TextField` | The field root: owns value, validation state, and the id wiring |
| `Label` | `Label` | The field's name |
| `Description` | `Text slot="description"` | Help text below the control |
| `FieldError` | `FieldError` | The validation message, driven by the field's state |
| `Input` | `Input` | The styled `<input>` |
| `InputGroup` | `Group` | A shell holding prefix / control / suffix as one field |
| `Fieldset` | `<fieldset>` via `dom.fieldset` | A group of fields with a legend |

The request named `Input`, `InputGroup` and `Fieldset`. The other four are not scope creep: in the
reference, `Input` is only a styled `<input>` — the label, the description and the error are
`TextField` plus three separate components, and without them `Input` cannot be labelled, cannot
report an error, and cannot be verified in Storybook as anything but a placeholder. Confirmed
against `heroui/packages/react/src/components/textfield/textfield.stories.tsx`, where every
labelled field is a `TextField` wrapping `Label` + `Input` + `FieldError`.

**CodeGraph, before any file was read** — `pnpm codegraph explore input`:

> Found 11 symbols across 2 files. Blast radius — `RadiusId`
> (`packages/styles/src/generator/preset.ts:3`), 3 callers in
> `packages/styles/src/generator/index.ts`, `packages/styles/src/generator/preset.ts`; tested via
> callers: `packages/styles/src/generator/derive.test.ts`,
> `packages/styles/src/generator/emit.test.ts` +1.

The word "input" does not occur in the library's component code at all. The eleven symbols are the
theme generator's `RadiusId` / `formRadius` neighbourhood, which this work consumes but does not
change. There is no blast radius to manage: every file this spec touches is new, apart from four
registration points named in section 11.

## 1. The floor, and why it comes first

Three pieces of shared infrastructure do not exist yet. `SKILL.md` is explicit that a missing
foundation module is created as its own task rather than improvised inside a component, so each is
specified here as a deliverable in its own right.

### 1.1 `FieldVariantContext` — one context, not one per field root

`packages/react/src/contexts/field-variant.ts` (new directory) exports `FieldVariantContext` and
`useFieldVariant()`. A field root provides it; `Input` and `InputGroup` consume it. `variant`
resolution is: the part's own prop → the nearest provider → `primary` from `defaultVariants`.

**Rule: every field root provides the context unconditionally, including when `variant` is
`undefined`.** That is what makes a nested field reset inheritance instead of letting an outer
field's variant leak into it.

This diverges from the reference, which gives each field root its own context and has the leaf read
them all — `input.tsx:20-21` reads `TextFieldContext` *and* `ComboBoxContext` today, and each
future field root (`SearchField`, `NumberField`, `DatePicker`) adds another `use()` to that file.
Three reasons for the divergence, in order of weight:

1. **RAC already does it this way, for this exact problem, in the dependency we ship.** In
   `react-aria-components@1.21.1`, `dist/private/TextField.js:119-121` provides a single
   `TextContext` keyed by *role* — `slots: {description, errorMessage}` — and
   `dist/private/Text.js` reads that one context via `useContextProps` without knowing which root
   provided it. `ComboBox`, `Select`, `NumberField` and `DatePicker` provide the same context with
   the same slot names. A leaf enumerating its possible ancestors is not RAC's pattern. Our own
   `Description` and `FieldError` ride on that single context already, so the reference is
   internally inconsistent: text slots by role through one context, `variant` by root type through
   N.
2. **A `??` chain is not tree order.** `variantProp ?? textFieldContext.variant ??
   comboBoxContext.variant` encodes a fixed precedence that has nothing to do with the DOM.
   `<TextField variant="secondary"><ComboBox variant="primary"><Input/></ComboBox></TextField>`
   resolves to `secondary` — the *farther* ancestor wins, because it is earlier in the chain.
   React context answers "nearest provider wins" by construction; the reference reimplements that
   by hand and gets a different answer.
3. **The name collides with RAC's own export.** `react-aria-components` exports
   `TextFieldContext` (`dist/types/src/TextField.d.ts`). A second context of the same name,
   declared in a neighbouring file and imported by the same components, is a trap for the next
   reader.

What the divergence costs: when a field root is later ported from the reference, its own
`*Context` carrying `variant` must be translated into providing `FieldVariantContext` — one
`use()` / one provider per ported field, in one direction. That is cheaper than editing `input.tsx`
for every new field root, and it is recorded in section 9 so it is not "fixed" back.

`useFieldVariant()` returns the context value, not a resolved variant: resolution belongs to the
part, which is the only place that knows its own prop.

### 1.2 Two focus utilities

`packages/styles/utilities/index.css` has one focus utility, `status-focused`, and it is
`outline` with `outline-offset: var(--ring-offset-width)` — 2px of separation. A field cannot use
it: inside an `InputGroup` the control sits flush against the prefix and suffix borders, so an
offset ring draws on top of its neighbours. Two utilities are added, matching the reference's
`focus-field-ring` / `invalid-field-ring` semantics:

```css
@utility status-focused-field {
  outline: 2px solid var(--color-focus);
  outline-offset: 0;
}

@utility status-invalid-field {
  outline: 1px solid var(--color-danger-soft-foreground);
  outline-offset: 0;

  &:focus,
  &:focus-visible,
  &:focus-within,
  &[data-focused],
  &[data-focus-visible],
  &[data-focus-within] {
    outline: 2px solid var(--color-danger-soft-foreground);
  }
}
```

`--color-danger-soft-foreground` rather than `--color-danger` is not a detail: section 4.1 measures
`--color-danger` at 2.95:1 against the field fill in the dark theme, below the 3:1 a boundary owes.

Two deliberate differences from the reference's version. It uses Tailwind's `ring-*`, which is a
`box-shadow`; we use `outline`, because that is what `status-focused` already uses and because a
`box-shadow` ring is clipped by an ancestor's `overflow: hidden` while an outline is not. And its
`invalid-field-ring` sets `--tw-ring-offset-width: 3px` in the unfocused branch where nothing reads
it — a leftover, not a decision, so it is dropped.

The doctrine comment above `status-focused` says there is one source of truth for visible focus,
and this adds a second utility under it. That is why both utilities are written here and not inside
a component: the field ring is one more source of truth, shared by every field, not a ring a
component drew for itself. The comment is amended to say the system has two rings and which one a
component picks.

### 1.3 `useHasTextSlot` and `packages/react/src/hooks/`

`Description` must not render when the field root published no `description` slot — otherwise a
RAC collection root, which mounts a hidden tree before its text slots exist, renders a stray
element. The reference solves it with `useHasTextSlot` plus a `FieldSlotsGateContext`
(`heroui/packages/react/src/utils/use-has-text-slot.ts`). Both are ported into
`packages/react/src/hooks/use-has-text-slot.ts` — the first inhabitant of the `hooks/` directory
that `SKILL.md`'s foundation table already names.

The gate is ported together with the hook even though no collection component exists yet. The hook
without the gate always returns `true`, which makes it a no-op whose name promises a check it does
not perform; that is worse than code waiting for its first caller. `hooks/index.ts` and the
package barrel export both.

## 2. The components

One `.tsx` per component, context and every part inside it, per `SKILL.md`. Types inline. All
`"use client"`. No `forwardRef`. `use()` over `useContext()`.

### 2.1 `TextField`

`TextFieldRoot` composes RAC `TextField`, applies `textFieldVariants({fullWidth})`, carries
`data-slot="textfield"`, and provides `FieldVariantContext` with its `variant` prop. The provider
sits *inside* the primitive's render-prop children, because RAC's render props must resolve first;
this is the reference's structure and it is correct.

`variant?: "primary" | "secondary"` is a literal union on the root. It is not forwarded to the
primitive — RAC has no such prop — so it is destructured out of the spread.

The BEM block is `textfield`, one word, and the directory and CSS file match it. `text-field`
would be a real collision: `@theme inline` declares `--color-field`, which makes `text-field` a
*generated Tailwind utility* setting `color: var(--color-field)`. The reference names it
`textfield` for this reason and states it in `textfield.css`; our token layer has the same
property, so the reason holds here unchanged.

### 2.2 `Label`

`LabelRoot` composes RAC `Label` with `labelVariants({isRequired, isDisabled, isInvalid})`,
`data-slot="label"`. The three booleans are props *and* ancestor selectors in CSS: RAC sets
`data-required` / `data-disabled` / `data-invalid` on the field root, and `label.css` cascades from
there, so a consumer never has to pass them by hand. The props exist for the standalone case — a
label outside any RAC field, which the style layer must also serve.

### 2.3 `Description`

`Text slot="description"` with `data-slot="description"`, returning `null` when
`useHasTextSlot("description")` is false. No variants beyond the base class.

### 2.4 `FieldError`

RAC `FieldError` with `data-slot="field-error"`. The reference sets a bare `data-visible` attribute
unconditionally, which is what its collapsing-height CSS keys on; since RAC only renders
`FieldError` when the field is invalid, "rendered" and "visible" coincide and the attribute is
honest. We keep it, and we keep the collapse, because the alternative — the element appearing
abruptly — moves the content below it with no transition.

### 2.5 `Input`

`InputRoot` composes RAC `Input` with `inputVariants({fullWidth, variant})`, where `variant` falls
back to `useFieldVariant()`. `data-slot="input"`. Nothing else: value, focus, ARIA and the
`data-*` state attributes come from the primitive.

### 2.6 `InputGroup`

Parts: `InputGroupRoot` (RAC `Group`), `InputGroupInput`, `InputGroupTextArea`,
`InputGroupPrefix`, `InputGroupSuffix`. The root holds an `InputGroupContext` carrying the
`tv({slots})` result, so each part asks the context for its own class instead of recomputing the
recipe.

The root resolves `variant` from its prop or `useFieldVariant()`, and exposes click-to-focus: a
click anywhere in the shell that is not already inside the control focuses the control. The
reference implements this as `groupRef.current?.querySelector("input")`, which **cannot find a
`<textarea>`** — so in the reference, `InputGroup` + `InputGroup.TextArea` does not focus on a
prefix click. Ours queries `input, textarea` and keeps the rest of the reference's guard (do
nothing when the event target is the control or inside it, then call the consumer's `onClick`).

`InputGroupTextArea` renders RAC `TextArea` with `data-slot="input-group-textarea"` and the same
`slots.input()` class as `InputGroupInput`; the textarea-only rules hang off the `data-slot` in CSS.
This is the only multiline control in this delivery — a standalone `TextArea` component is out of
scope (section 12).

Prefix and suffix are plain `<div>`s, not RAC primitives: they hold decoration, not behaviour.
A consumer putting a `Button` in a suffix gets the Button's own semantics, which is the intent.

### 2.7 `Fieldset`

Parts: `FieldsetRoot`, `FieldsetLegend`, `FieldsetGroup`, `FieldsetActions`, with namespace keys
`Root`, `Legend`, `Group`, `Actions`. All four are polymorphic through `DOMRenderProps` and
`dom.*`, as in the reference, because they render plain DOM elements rather than RAC primitives —
`packages/react/src/utils/dom.tsx` already exists for exactly this and carries the package's one
sanctioned `any`.

The flat export of the group part is `FieldsetGroup`, where the reference exports `FieldGroup`.
Every other part in the library is prefixed with its component name, and `FieldGroup` in the
package's flat namespace would collide with a future `FieldGroup` component. The namespace key
stays `Group`, so `<Fieldset.Group>` is identical to the reference.

**The disabled cascade.** A native `<fieldset disabled>` disables descendant form controls in the
browser, but that is not enough twice over: RAC primitives that render as `<div>` are not form
controls and the browser does not touch them, and RAC's internal `isDisabled` state — which drives
`data-disabled` and the `{isDisabled}` render prop — only updates from props or context. So
`FieldsetRoot`, when `disabled` is true, mirrors it as `data-disabled="true"` for the CSS cascade
and wraps children in RAC's `Provider` with all seven contexts the reference uses:
`ButtonContext`, `CheckboxGroupContext`, `LinkContext`, `RadioGroupContext`, `SliderContext`,
`ToggleButtonContext`, `ToggleButtonGroupContext`.

Six of those seven have no PeakUI component yet, and `button.tsx` set a precedent of refusing
extension points for components that do not exist. The precedent does not apply: those contexts
belong to `react-aria-components`, which is already a dependency, and a consumer can put a bare
RAC `Checkbox` or `Slider` inside our `Fieldset` today. Forwarding them is honouring an existing
contract, not guessing at a future one — which is the opposite of `ButtonGroupContext`, a hook
point for a PeakUI component that does not exist.

## 3. The style layer

`tv()` emits BEM names only; every utility lives in `packages/styles/components/<name>.css`.

| `tv()` recipe | Shape |
| --- | --- |
| `textFieldVariants` | base `textfield`, variant `fullWidth` |
| `labelVariants` | base `label`, variants `isRequired`, `isDisabled`, `isInvalid` |
| `descriptionVariants` | base `description` |
| `fieldErrorVariants` | base `field-error` |
| `inputVariants` | base `input`, variants `fullWidth`, `variant` |
| `inputGroupVariants` | slots `base`, `input`, `prefix`, `suffix`; variants `fullWidth`, `variant` |
| `fieldsetVariants` | slots `base`, `legend`, `group`, `actions` |

`fieldsetVariants` has **no `description` slot.** The reference declares one,
`fieldset__description`, with no CSS rule behind it and no part rendering it — a dead class name.
Our style gate would not catch that by itself, but the standard forbids it and a dead BEM name is
exactly the defect `components/index.test.ts` exists to prevent at the file level.

The reference's slot is named `fieldGroup` emitting `fieldset__field-group`; ours is `group`
emitting `fieldset__group`, matching the part name and the namespace key. The reference's own CSS
and part name already disagree with each other (`FieldGroup` versus `fieldset__field-group`), so
there is nothing consistent to preserve.

### 3.1 What the CSS must do

Ported from the reference, with the fixes below. Both state forms everywhere — the pseudo-class and
the `data-*` attribute — because the stylesheet ships standalone for consumers who are not on
React, and for them only the pseudo-classes exist.

- `.input` — field fill, radius `--radius-field`, border from `--border-width-field` and
  `--field-border`, `--shadow-field`, placeholder colour, `text-base sm:text-sm`. Hover only under
  `@media (hover: hover)` and only when not focused. Focus: `status-focused-field` plus
  `--field-border-focus`. Invalid: `status-invalid-field`. Disabled: `status-disabled`.
  `transition` for background, border and shadow, with `motion-reduce:transition-none` **after**
  it.
- `.input--secondary` — `--default` as the fill, no shadow, its own hover and focus fills exposed
  as `--input-bg*` custom properties.
- `.input-group` — the same shell, plus `items-start` and auto height when it contains a textarea,
  `:focus-within` / `[data-focus-within]` for the focus ring, and the reference's autofill
  handling: the inner control's `:autofill` paint is neutralised with an inset box-shadow and the
  highlight is lifted onto the group, so the rounded shell, prefix and suffix share it instead of
  the control drawing a sharp-cornered rectangle inside a rounded box.
- `.input-group__input` — transparent, borderless, flex-1; drops its radius and inline padding on
  whichever side touches a prefix or suffix.
- `.input-group__prefix` / `__suffix` — a divider border on the inner edge only, and the shell's
  radius on the outer corners.
- `.label` — `text-sm font-medium`; the required asterisk, the disabled state and the invalid
  colour, each written both as the modifier class and as the ancestor-state selector.
- `.field-error` — collapsed by default, expanded on `[data-visible]`, transitioned with
  `motion-reduce` after the transition. Its text colour is `--color-danger-soft-foreground`, not
  `--color-danger`; section 4.1 measures why.
- `.textfield` — `flex flex-col gap-1`; hides the description while the field is invalid, so the
  error replaces it rather than stacking under it.
- `.fieldset` — `flex flex-col gap-6`, plus `shrink grow basis-0`, which the reference carries with
  a comment about a Safari flexbox bug involving a `<legend>`; kept with the comment, since
  removing it is a change we cannot verify here.

Three magic numbers in the reference are replaced. `min-height: 38px` on the grouped textarea and
`padding-top: 0.5rem` on a prefix or suffix beside a textarea become multiples of `--spacing`. The
group's fixed `min-h-9` becomes the pointer-aware pattern `css-authoring.md` prescribes,
`min-h-10 md:min-h-9` — 40px where the pointer is coarse, 36px where it is fine. That string appears
in both `input.css` and `input-group.css`; it is a pair of Tailwind utilities rather than a literal
value, so the rule about a twice-used number becoming a token does not apply to it, and introducing a
custom property to share it would hide the breakpoint it depends on.

### 3.2 Spacing and radius

`gap` inside a field is `1` (`--spacing` × 1) between label, control and message; between fields in
a `Fieldset.Group` it is `4`; between the legend and the group, `6`. That satisfies
`gap(within) < gap(between)`. The third term, container padding, belongs to whatever surface the
consumer puts the fieldset on — `Fieldset` has no padding of its own and must not acquire one, or it
would double the padding of every card it sits in.

`InputGroup`'s prefix and suffix sit flush against the shell with no padding between them and the
edge, so `R_inner = R_outer` and the concentric rule is satisfied at equality rather than by the
utility. The utility pair is not used; the reason is stated in the CSS so the next reader does not
"fix" it. A control nested inside a *padded* field surface would need `concentric-inner`, and no
part of this delivery is one.

## 4. Tokens

The token layer needs **no generator change**. Every token the fields need already exists:
`--field-background`, `--field-hover`, `--field-focus`, `--field-foreground`,
`--field-placeholder`, `--field-border`, `--field-border-hover`, `--field-border-focus`,
`--field-shadow`, `--field-radius`, `--field-border-width`, lifted into `--color-field*`,
`--radius-field`, `--border-width-field` and `--shadow-field` by `themes/shared/theme.css`.

Two findings about them that the CSS must respect:

**`--field-border-width` is `0px` in the default theme.** PeakUI's fields are borderless fills by
default, unlike the reference's. Consequently `--field-border`, `--field-border-hover` and
`--field-border-focus` are *dormant* — they carry colour for a border of zero width, and hover is
conveyed by the fill alone. This is not a defect: `field-border-width` is an authored field of the
theme (`derive.ts:452`), so a brand preset raising it activates all three. The CSS therefore keeps
every border declaration, including the ones that paint nothing in the default theme, instead of
dropping them as dead code.

**The reference's invalid border colour does not exist anywhere.** `--color-field-border-invalid`
is read in ten rules across `input-group.css`, `number-field.css`, `search-field.css`,
`date-input-group.css` and `color-input-group.css` — and declared in no theme, no `@theme` block and
no base layer of `heroui/packages/styles`. In the reference the invalid border simply does not paint.
Our `check:tokens` gate — "every `var()` in shipped CSS is declared" — would fail the port, so the
token has to be chosen rather than copied. Which one is settled by measurement, next.

### 4.1 `--danger` is the wrong token for a red mark, measured

`--danger` has only ever been a *fill* in this library: `button.css:219-223` pairs it with
`--danger-foreground` as the text on top. The invalid label and the error message are the first
places where a danger colour becomes **text on the page**, and the reference uses `text-danger` for
both. Measured on the real derived default theme with the generator's own `contrastRatio`,
`parseOklch` and `compositeOver`:

| Pair | Light | Dark |
| --- | --- | --- |
| `danger` on `background` | 5.51 | **3.38** |
| `danger` on `surface` | 5.99 | **2.95** |
| `danger` on `field-background` | 5.99 | **2.95** |
| `danger-soft-foreground` on `background` | 8.63 | 5.90 |
| `danger-soft-foreground` on `surface` | 9.39 | 5.15 |
| `danger-soft-foreground` on `field-background` | 9.39 | 5.15 |

So a literal port ships error text at **3.38:1** on the page and **2.95:1** on a surface in the dark
theme, against a 4.5:1 obligation (SC 1.4.3) — and the invalid *outline* at 2.95:1 against the field
fill, against a 3:1 obligation (SC 1.4.11). `--danger-soft-foreground` clears both in both schemes
with margin, and it is the role the system already holds for a danger colour read against a
near-page background: the generator derives it as the foreground of `--danger-soft`, which is a 15%
danger tint over that background, and `button.css:230` already uses it that way.

**Decision: `--color-danger-soft-foreground` for the error text, the invalid label colour and the
invalid outline.** The name reads oddly on a border, and the honest reason is that the system has no
token named for "a danger mark on a neutral surface" — section 10 proposes one for the backlog
rather than minting it inside a component spec.

Two further pairs measured while deciding, both clean, both recorded so the next reader does not
re-measure: field text (`field-foreground` on `field-background`) is 19.61 light / 16.72 dark, and
the placeholder (`field-placeholder` on `field-background`) is 6.25 / 6.75.

## 5. Forced colors

The theme's `@media (forced-colors: active)` block remaps `--field-background` to `Field`,
`--field-foreground` to `FieldText` and `--field-border` to `ButtonBorder`. It does **not**
override `--field-border-width`, which stays `0px` — so a field in forced-colors mode today would
have a border colour and no border. A field with no boundary is unidentifiable, which is the
failure mode `forced-colors` support exists to prevent.

Per `css-authoring.md` the component owns the structural part of forced colors, so `.input`,
`.input-group`, `.input-group__prefix` and `.input-group__suffix` each hold a transparent border in
their normal state — so nothing shifts when the mode engages — and raise its width inside
`@media (forced-colors: active)`:

```css
.input {
  border: var(--border-width-field) solid var(--field-border);

  @media (forced-colors: active) {
    border-width: 1px;
  }
}
```

The alternative, overriding `--field-border-width` in the theme's forced-colors block, is a
token-layer change affecting every component that reads it, present and future. It is the better
fix and it is not this spec's: recorded for the ecosystem backlog in section 10.

## 6. Accessibility

WCAG 2.2 AA is the floor, and RAC supplies most of it. What this spec owns:

- **Name and description wiring** comes from RAC: `TextField` runs `useTextField`, which produces
  `labelProps`, `inputProps`, `descriptionProps` and `errorMessageProps` and publishes the last two
  as `TextContext` slots. Nothing here re-derives an `aria-*` attribute, and nothing hardcodes an
  id.
- **Target size (2.5.8, 24×24 CSS px).** The grouped control's height is driven by the shell's
  minimum height; the fine-pointer value is 36px and the coarse-pointer value 40px, following
  `css-authoring.md`'s `h-10 md:h-9` pattern rather than the reference's fixed `min-h-9`. A
  prefix or suffix holding an interactive control is the real risk, and the suffix's padding is set
  so a 24px square control fits without the shell growing.
- **Focus not obscured (2.4.11).** The field ring is an outline with zero offset, drawn outside the
  border box, and `InputGroup` draws it on the shell rather than on the inner control, so a prefix
  or suffix never covers it.
- **Contrast.** Measured, not assumed — the numbers and the token change they forced are in section
  4.1. Worth stating plainly: `field` is **not** in the generator's `FOREGROUND_PAIRS`
  (`derive.ts:151-162`), and `field-foreground` is assigned from `surface-foreground`
  (`derive.ts:216`). The field's own text pair is therefore inherited, not guarded — it measures
  19.61 / 16.72, so nothing is wrong today, but no gate holds it there. Section 10. The focus ring's
  known shortfall on
  second- and third-level surfaces is section 10's business, not this spec's: it is a property of
  `--focus` against those surfaces and applies identically to `variant="primary"`, so no part of
  this delivery introduces or worsens it.
- **Reduced motion.** Both transitions — the field's colour transition and `FieldError`'s collapse
  — carry `motion-reduce:transition-none` after the `transition` declaration.
- **No hardcoded assistive strings.** None of the seven generates a string of its own: every label,
  description and message is consumer content. The i18n question therefore does not arise, and no
  string formatter is introduced.

## 7. Tests

jsdom suites are mandatory, the other two tiers risk-based (`testing.md`). Test names in Russian,
matching the existing suites.

**jsdom** — `packages/react/tests/components/<name>/<name>.test.tsx` for all seven:

- `textfield` — label wiring (`getByLabelText` finds the control), `data-invalid` propagation,
  `fullWidth` modifier, and that `variant` reaches a child `Input` through the context while an
  explicit prop on the `Input` still wins.
- `label` — renders as `<label>` bound to the control; the three modifier props.
- `description` — rendered inside a field; absent outside a slot-providing root.
- `field-error` — appears when the field is invalid, carries the message, is referenced as the
  control's description.
- `input` — renders with role `textbox`, typing updates the value, disabled blocks input,
  `variant` resolution from context, both call styles (`<Input>` and `<InputRoot>`).
- `input-group` — prefix and suffix render; a click on the prefix focuses the control; **a click on
  the prefix focuses a `InputGroup.TextArea`** — the regression test for the reference's
  `querySelector("input")`; `data-invalid` reaches the shell.
- `fieldset` — legend names the group; `disabled` sets `data-disabled` on the root **and** a child
  `Button` reports `isDisabled: true` through its render prop, which is the behaviour the seven
  contexts exist for; all four parts under both call styles.

**SSR** — one suite, `textfield.ssr.test.tsx`, via `ssrSmoke()`. The field root generates ids and
publishes context slots, which is exactly the id-generation risk that makes an SSR tier worthwhile;
`Input`, `Label` and the rest hydrate inside it and need no separate suite.

**Browser** — `apps/storybook/e2e/InputGroup.spec.ts`. Three things jsdom fakes: that a click on
the prefix moves real focus, that the focus ring is painted on the shell and not clipped by the
prefix, and that the group's height grows with a textarea. Plus the axe audit on the field stories
in both themes, following `Button.spec.ts`.

Barrel completeness is already covered by the two existing gates and needs no new test: adding a
directory under `packages/react/src/components/` or `packages/styles/src/components/` without its
barrel line — or, in the styles package, without `components/<name>.css` and its `@import` — fails
`pnpm test`.

## 8. Stories

React stories live beside each component, titled `Components/<Name>` per our convention rather than
the reference's `Components/Forms/<Name>`. Every story carries a second-level heading, because
`apps/storybook/e2e/` treats it as the readiness signal — without it axe audits an empty iframe and
passes silently.

Coverage: default, both variants, `fullWidth`, invalid with a message, disabled, required, with a
description, `InputGroup` with prefix / suffix / both / textarea / a button in the suffix, and a
`Fieldset` holding several fields with a legend and actions.

Style-layer stories in `apps/storybook/src/stories/` — bare markup, no React — for `input`,
`input-group`, `fieldset`, `label` and `field-error`: the five whose CSS carries modifiers or state
rules a non-React consumer must get for free. `textfield` and `description` are one rule each and
are exercised inside those stories. This is the same risk-based split the library already has:
`Button` has a style-layer story, `Spinner` does not.

## 9. Where PeakUI differs from the reference, on purpose

Collected here because `SKILL.md` points at these sections to stop a later reader "fixing" them
back.

1. **One `FieldVariantContext` instead of a context per field root** — section 1.1.
2. **`outline`-based field focus utilities instead of Tailwind `ring-*`** — section 1.2; an outline
   is not clipped by an ancestor's `overflow: hidden`, and `status-focused` is already an outline.
   A consequence, decided after a review of the rendered result: **the ring takes no part in the
   `transition`.** The reference lists `box-shadow` there, which is its ring, and a shadow
   interpolates. An outline does not: its width appears at once, 0 → 2px, so a transition can only
   reach the colour — and that reads as the frame's colour flickering rather than the ring fading in.
   The fill and the border keep their transitions, as in the reference. Verified in the browser:
   `apps/storybook/e2e/InputGroup.spec.ts`, "кольцо фокуса появляется без перехода".
3. **`--color-danger-soft-foreground` for every red mark** — the error text, the invalid label and
   the invalid outline — instead of the reference's `text-danger` and its undeclared
   `--color-field-border-invalid`. Measured: section 4.1.
4. **`forced-colors` support at all**, which the reference has none of — section 5.
5. **`FieldsetGroup` as the flat export name**, namespace key `Group` unchanged — section 2.7.
6. **`fieldset__group` instead of `fieldset__field-group`**, and no `fieldset__description` slot —
   section 3.
7. **Coarse-pointer field height** (40px / 36px) instead of a fixed `min-h-9` — section 6.
8. **`querySelector("input, textarea")`** in `InputGroup`'s click-to-focus — section 2.6.

## 10. For the ecosystem backlog

Four items this work uncovers and does not fix:

- **The system has no token for a danger mark on a neutral surface.** `--danger` is a fill,
  `--danger-foreground` is the text on that fill, and `--danger-soft-foreground` is doing the third
  job under a name that describes the second. Every future component with an error message, an
  invalid boundary or a destructive label will face the same choice and some of them will pick
  `--danger` and ship 2.95:1. A named role — or at minimum a comment in `theme.css` pointing at
  `--danger-soft-foreground` — fixes it once.
- **`field` is not a guarded contrast pair.** `field-foreground` is assigned from
  `surface-foreground` and `field-background` is an authored anchor, so a preset can move the field
  fill without any gate measuring the text on it. Adding `field` to `FOREGROUND_PAIRS` is the fix;
  section 3 of the `on-surface` spec explains why adding a pair is the enforcement mechanism.

- **`--field-border-width` is not overridden in the theme's `forced-colors` block**, so every
  component reading it must hold its own structural border. The token-layer fix is one line and
  affects every present and future field; it needs its own task and its own gate, so that a
  component is not required to remember.
- **`--focus` against `surface-secondary` and `surface-tertiary` in the dark theme** is already
  recorded from the `on-surface` work (2.66:1 and 2.54:1 against a 3:1 obligation). The field ring
  inherits it. Noting here that the field family is now a second consumer of that defect raises its
  priority; it does not change its owner.

## 11. Registration

Four existing files gain lines, and the two completeness gates enforce every one of them:

- `packages/react/src/components/index.ts` — seven `export * from "./<name>/index.ts";`
- `packages/react/src/index.ts` — two new lines, `./hooks/index.ts` and `./contexts/index.ts`,
  beside the existing `./components/index.ts` and `./utils/index.ts`
- `packages/styles/src/components/index.ts` — seven `export * from "./<name>/<name>.styles.ts";`
- `packages/styles/components/index.css` — seven `@import "./<name>.css";`

## 12. Out of scope

- **A standalone `TextArea` component.** `InputGroup.TextArea` ships because it is a part of
  `InputGroup`; a `TextArea` usable directly inside `TextField` is its own component with its own
  CSS and variants.
- **`Form`, `ErrorMessage`.** `FieldError` driven by `isInvalid` covers the validation story
  without a form, which is how the reference's own stories demonstrate it. Native validation and
  server errors arrive with `Form`.
- **`SearchField`, `NumberField`, `InputOTP`, `ComboBox`, `Select`** — each is a field root of its
  own, and each will provide `FieldVariantContext` instead of inventing a context.
- **A `size` variant on fields.** The reference has none, the height is driven by the pointer-coarse
  rule, and adding a scale later is additive.
- **A `Fieldset` description part.** The reference's dead slot suggests the intent; the component
  arrives when something needs it.
- **Fixing `--focus` or `--field-border-width` in the generator** — section 10.
- **A codemod.** Nothing public changes; all seven components are new.

## 13. Definition of done

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check:tokens`, `pnpm lint:package` pass.
- `pnpm test:e2e` passes, including the new `InputGroup` spec and the axe audit.
- Every component: `.tsx`, stories, jsdom suite, `index.ts` with all three export sections,
  `.styles.ts`, `.css`, both barrel lines.
- A labelled, described, invalid field renders from `TextField` + `Label` + `Input` +
  `Description` + `FieldError` with no `aria-*` attribute and no id written by hand.
- `InputGroup` focuses its control — `input` or `textarea` — on a prefix click.
- A disabled `Fieldset` reports `isDisabled: true` through a child `Button`'s render prop.
- Every field has a visible, unclipped focus ring and a visible boundary under
  `forced-colors: active`.
- No shipped field CSS reads `--color-danger` for text or for an outline: every red mark is
  `--color-danger-soft-foreground`, per the measurements in section 4.1.
