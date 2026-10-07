# `SegmentedControl` — a single-select capsule with a sliding indicator

A compact control for picking one option out of a small known set, where the choice changes what
the interface shows rather than being submitted with a form: theme, view mode, chart period, table
density, toolbar alignment. The selected segment is wrapped in a capsule that slides to the segment
the user clicks.

This is the first component in `@peakui/react` with **no prototype in the vendored reference**.
Section "Posture" below justifies that, because the standing directive says the opposite.

## Task

Add `SegmentedControl` to `@peakui/react` through pipeline stages 0-4 (stage 5 is switched off, so
no changeset and no codemod), then migrate the hand-rolled theme switcher in `apps/docs` onto it.

## The problem, measured

`apps/docs` renders **two different** theme switchers, and neither is a core component.

- `/docs/*` uses the vendored notebook layout, which renders
  `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx` — peakui `ToggleButtonGroup` plus a
  hand-written capsule: `inline-flex items-center rounded-full border p-1`.
- `/` uses `HomeLayout` from the `fumadocs-ui` npm package, which renders its own upstream
  `ThemeSwitch` (`node_modules/fumadocs-ui/dist/layouts/shared/slots/theme-switch.js`) — plain
  `div` and `button` elements with lucide icons at `size-6.5 p-1.5`. The layout receives only
  `themeSwitch={{mode}}` and no `slots.themeSwitch`, so upstream wins.

The capsule is specified twice and the two specifications conflict: `theme-toggle.tsx` sets
`border`, and `apps/docs/src/app/global.css:66` removes it again via
`[data-theme-toggle] { @apply border-none bg-default/80 }`.

Measured heights, desktop:

| Element | Computation | Height |
| --- | --- | --- |
| docs theme toggle | `ToggleButton isIconOnly size="sm"` → `h-9 md:h-8` + `w-9 md:w-8` = 32, plus shell `p-1` | **40px** |
| home theme toggle | icon `size-6.5 p-1.5` = 26, plus shell `p-1` | **34px** |
| `GitHubLinkSmall`, `SearchToggle` | `size-[34px]` hardcoded | **34px** |
| `Tabs` | `.tabs__tab` `h-8` + `.tabs__list` `p-1` | **40px** |

So the docs toggle is exactly as tall as `Tabs` — someone matched it by eye — while standing in a
row of 34px buttons. And 34px is itself ad hoc: it matches no peakui size (`sm` = 32, `md` = 36 on
desktop) and is hardcoded in two files, `apps/docs/src/components/github-link.tsx:17` and
`apps/docs/src/components/fumadocs/ui/search-toggle.tsx:42`.

Neither existing core component can absorb this:

- **`Switch`** is a form element: boolean, `name`/`value`, lives in a `Fieldset`, validates.
- **`Tabs`** is `role="tablist"` plus `TabPanel`. A theme switcher has no panels; declaring it a
  tablist lies to assistive technology.
- **`ToggleButtonGroup`** is the right base but not the component.
  `packages/styles/components/toggle-button-group.css` states its contract in its own header: "The
  group owns only layout: orientation, edge radii of the attached buttons, the separator and the
  detached mode." It has no capsule, no indicator, and no size below `sm`.

## Posture: no reference prototype

The standing directive recorded in `docs/superpowers/specs/2026-10-04-surface-design.md` is that
components are maximally similar to the vendored reference. `SegmentedControl` cannot be, because
the reference does not have it.

Measured in `../heroui` (read-only): the component list contains `tabs` and `toggle-button-group`
but nothing segmented, and `grep -rln SelectionIndicator packages/react/src/components/` returns
exactly one file, `tabs/tabs.tsx`. The reference's `toggle-button-group` has no indicator.

The directive is therefore not violated but exhausted: there is nothing to copy. What the component
does copy is peakui's own prior art — the indicator mechanism, easing, duration and stacking are
taken from `packages/styles/components/tabs.css`, not invented.

## The mechanism, verified

`react-aria-components@1.21.1` exports `SelectionIndicator` from `ToggleButtonGroup`, not only from
`Tabs`:

```
node_modules/react-aria-components/dist/types/exports/ToggleButtonGroup.d.ts:7
  export { SelectionIndicator } from '../src/SelectionIndicator';
```

`ToggleButtonGroup` already wraps its children in `<SharedElementTransition>`
(`dist/private/ToggleButtonGroup.mjs:54`), so no additional scope is needed.

`SelectionIndicator` is a FLIP transition, not the View Transitions API — no browser-support
question. From `dist/private/SharedElementTransition.mjs`:

1. The indicator is a single DOM node rendered **inside the selected item**. On selection change
   React unmounts it from the old item and mounts it inside the new one.
2. On unmount it snapshots `getBoundingClientRect()` plus the computed values of the properties
   listed in the element's CSS `transition-property` (lines 88-99).
3. On mount in the new parent it sets `element.style.translate = deltaX deltaY` so the node renders
   at its old on-screen position while already living in the new item (lines 48-54).
4. One `requestAnimationFrame` later the override is removed and the CSS transition carries it
   (lines 63-66).

Four consequences that are contractual, not cosmetic:

- **CSS owns the animation.** Only properties named in `transition-property` are snapshotted.
  Removing `translate` from that list makes the indicator teleport.
- **`width` and `height` belong in the list** so segments whose content changes at runtime resize
  smoothly instead of jumping.
- **`z-index: -1`** puts the capsule behind the label, which is what makes it read as the active
  segment being wrapped rather than covered.
- **`data-entering` / `data-exiting`** exist, so the capsule does not fly in from the viewport
  corner on first paint.

The mechanism expresses exactly one indicator per group, keyed by name. Two simultaneously active
segments are not expressible — this is why multiple selection is out of scope rather than deferred.

## Scope

**Single selection, interface state, not forms.** `selectionMode="single"` and
`disallowEmptySelection` are fixed internally and not exposed; the broken combination (segmented
look plus multiple selection plus one indicator) is therefore not expressible.

Form participation is out of scope. A capsule-styled choice that submits with a form is
`RadioGroup`'s job — it already exists, and duplicating single choice would break the
one-implementation rule in the ecosystem router. Note that the ARIA roles are **not** the
distinction here: see Accessibility.

Multiple selection is out of scope permanently: that is `ToggleButtonGroup` with
`selectionMode="multiple"`.

**Composition: over the RAC primitives, with its own item.** `SegmentedControl.Item` composes RAC
`ToggleButton` directly, not peakui's `ToggleButton`. Reusing peakui's `ToggleButton` would inherit
`--toggle-button-*` and the `h-10 md:h-9 | h-9 md:h-8` scale and require overriding them from
outside — which is precisely the path that produced the 6px mismatch and the two conflicting class
sets in `apps/docs` today. A `variant="segmented"` on `ToggleButtonGroup` was rejected for two
reasons: a variant cannot forbid `selectionMode="multiple"`, and the capsule needs background and
padding on the group, contradicting the group's documented layout-only contract.

**Name.** `SegmentedControl`, matching Apple HIG, Radix Themes and Mantine. Two repository facts
decided it over `SegmentGroup`:

1. `segment` is already theme vocabulary, not an ad-hoc variable: it sits in the palette generator
   at `packages/styles/src/generator/derive.ts:105` beside `surface`, `muted`, `default`, `border`
   and `accent`, and derives `--color-segment` / `--color-segment-foreground`
   (`packages/styles/themes/shared/theme.css:48-49`). Today only `tabs.css` consumes them, at lines
   146 and 232.
2. The `-group` suffix in peakui means "a group of these standalone components", and all eight
   cases hold it: `button-group`/`button`, `checkbox-group`/`checkbox`, `radio-group`/`radio`,
   `switch-group`/`switch`, `tag-group`/`tag`, `toggle-button-group`/`toggle-button`,
   `disclosure-group`/`disclosure`, `input-group`/`input`. `SegmentGroup` would be the first
   exception and would promise a standalone `Segment`, which is meaningless outside the capsule.

`codegraph query "Segment"` finds no component or type with that name, so there is no collision.

## Files

```
packages/react/src/components/segmented-control/segmented-control.tsx
packages/react/src/components/segmented-control/index.ts
packages/react/src/components/segmented-control/segmented-control.stories.tsx
packages/styles/src/components/segmented-control/segmented-control.styles.ts
packages/styles/components/segmented-control.css
packages/react/tests/components/segmented-control/segmented-control.test.tsx
packages/react/tests/components/segmented-control/segmented-control.ssr.test.tsx
apps/storybook/e2e/SegmentedControl.spec.ts
apps/docs/content/docs/en/react/components/(buttons)/segmented-control.mdx
apps/docs/src/demos/segmented-control/*.tsx
```

Scaffolded with `pnpm add:component SegmentedControl --rac ToggleButtonGroup --category buttons`,
which also runs `pnpm registries`. The five generated registry files are never edited by hand.

BEM block `.segmented-control`, parts `.segmented-control__item` and
`.segmented-control__indicator`. `data-slot` values: `segmented-control`,
`segmented-control-item`, `segmented-control-indicator`.

Category `(buttons)`, beside `toggle-button` and `toggle-button-group` — its base primitive lives
there. Not `(forms)`, because the component is out of forms by decision. Not `(navigation)`, where
`Tabs` lives, because placing them together in the index would reproduce the confusion this
component exists to resolve.

## Public API

```tsx
<SegmentedControl aria-label="Theme" selectedKey={theme} onSelectionChange={setTheme}>
  <SegmentedControl.Item id="light"><Sun /></SegmentedControl.Item>
  <SegmentedControl.Item id="dark"><Moon /></SegmentedControl.Item>
  <SegmentedControl.Item id="system"><Airplay /></SegmentedControl.Item>
</SegmentedControl>
```

Root props: `size?: "sm" | "md" | "lg"` (default `"md"`), `isDisabled?: boolean`,
`selectedKey?: Key`, `defaultSelectedKey?: Key`, `onSelectionChange?: (key: Key) => void`,
`className?: string`, and an **accessible name** — required, because the control has no visible
label: `aria-label`, or `aria-labelledby` pointing at a visible one.

Item props: `id: Key`, `isDisabled?: boolean`, `children: ReactNode`, `className?: string`.

Compound export per the house style: `Object.assign` onto the Root yields `<SegmentedControl>`,
`<SegmentedControl.Item>` and `<SegmentedControlItem>` from one set of parts. No assembled wrapper,
no `classNames` prop.

Three API decisions and their costs:

**Single key instead of a `Set`.** RAC exposes `selectedKeys: Set<Key>` and
`onSelectionChange(Set<Key>)` because its group supports multiple selection. With the mode fixed,
that set always holds one element, so the public surface is `selectedKey` / `defaultSelectedKey` /
`onSelectionChange(key)`, as `Tabs` has. Only the shape of one prop is adapted; behaviour, keyboard
and ARIA remain the primitive's.

**The indicator is not a part.** It renders inside `Item` automatically. This diverges from `Tabs`,
where the consumer places `<Tabs.Indicator />` inside every `Tabs.Tab` by hand. The reason for the
divergence: in `Tabs` the indicator has placement variants — a capsule in `primary`, a bottom line
in `secondary` — while a segment's indicator is always the capsule filling that segment. Exposing a
part that has exactly one valid position and is easy to forget invites a bug. Styling stays
reachable through `.segmented-control__indicator` and the tokens below.

**No `fullWidth` prop.** `ToggleButtonGroup` earns that prop because `.toggle-button` is `w-fit`
(`toggle-button.css:31`), so the variant must do two things —
`.toggle-button-group--full-width { w-full }` at line 37 and
`.toggle-button-group--full-width .toggle-button { flex-1 }` at line 108. `Tabs` needs no such prop
because `.tabs__tab` is `w-full` at line 128 and its segments always distribute. Segments of a
segmented control distribute by nature, so the requirement is built into the item and a consumer
who wants a stretched control writes `className="w-full"`.

## Geometry and sizes

`size` names the **outer capsule height**, equal to a `Button` of the same size, so the control
aligns in a row with buttons. Shell padding is `p-1` (4px) at every size, as `.tabs__list:109`.

| `size` | Capsule (mobile / desktop) | Segment | Matches |
| --- | --- | --- | --- |
| `sm` | 36 / 32 | 28 / 24 | `.button--sm` (`h-9 md:h-8`) |
| `md` (default) | 40 / 36 | 32 / 28 | `.button` (`h-10 md:h-9`) |
| `lg` | 44 / 40 | 36 / 32 | `.button--lg` (`h-11 md:h-10`) |

**`sm` sits on the accessibility floor.** At `sm` on desktop a segment is 24x24, exactly the
minimum of WCAG 2.2 AA SC 2.5.8 Target Size (Minimum) — compliant, with no margin. The alternatives
were rejected: reducing shell padding to 2px at `sm` collapses the scale, because 4px of padding
consumes the whole 4px difference between the outer heights of `sm` and `md`; breaking the
responsive step for `sm` alone is inconsistent with every other component. `sm` ships, and the docs
page states plainly that it is the limit and recommends `md` in headers and wherever pointer
precision matters.

Width requirement, to be satisfied in CSS: **segments are equal width; the shell hugs its content
by default; `w-full` from outside works with no extra prop; the longest label is not clipped.**

The exact declaration is deliberately left to implementation, because the two candidates differ in
how the shell's intrinsic width resolves under `width: fit-content` and the difference is a
measurement, not an argument: `w-full` on the item (as `.tabs__tab`) sizes the shell to the sum of
content widths and then equalises, which can squeeze the longest label; `flex-1` (as
`.toggle-button-group--full-width .toggle-button`) sizes it to n times the widest item, which is
wider but clips nothing. The `LongLabels` story exists for this measurement, taken with the
`agent-browser` behavioural smoke described in `apps/storybook/AGENTS.md`. The chosen declaration
and the measurement that justified it are recorded in the CSS file's deviation list.

## Theming tokens

The seam follows `toggle-button.css`: the block declares its `--<block>-*` properties at the top as
the public override contract, ahead of any `tv({extend})`. Every token referenced below was verified
to exist in `packages/styles/themes/shared/theme.css`.

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

This gives `--color-segment` / `--color-segment-foreground` their second consumer; until now only
`tabs.css` knew them.

Radius is `--radius-3xl` (24px at `--radius: 0.5rem`), matching `--toggle-button-radius`, rather
than the off-scale `calc(var(--radius) * 2.5)` that `tabs.css:23` invented. Browsers clamp a radius
to half the box, so all three sizes read as a pill.

`tv()` emits BEM names only; all Tailwind lives in the CSS file. No hardcoded Tailwind in JSX and
none inside `tv()`.

## Animation

```css
.segmented-control__indicator {
  transition-property: translate, width, height;
  transition-duration: 250ms;
  transition-timing-function: var(--ease-out-fluid);
  @apply motion-reduce:transition-none;
}
```

Same 250ms and `--ease-out-fluid` (`cubic-bezier(0.32, 0.72, 0, 1)`) as `.tabs__indicator:236-241`
— two visually similar controls with different inertia read as an oversight.

`motion-reduce` must come **after** `transition` for the override to win on specificity. This is
the `CRITICAL` note repeated across the existing CSS files and it applies here unchanged.

Because segments are equal width, the indicator normally only translates and does not resize.
`width` and `height` stay in the list anyway, so a label that changes at runtime (a count appears)
animates instead of jumping.

## Item states

Taken from the prior art in `tabs.css:160-174` rather than invented, with one correction.

- **Hover** — `opacity-70`, applied only to a segment that is neither selected nor disabled. Written
  in both forms: `:hover` guarded by `@media (hover: hover)` so it does not stick after a tap on a
  touch device, and `[data-hovered]`, which React Aria sets having already judged the pointer's
  nature.
- **Focus** — `status-focused`, on both `:focus-visible:not([data-focused])` and
  `[data-focus-visible]`. The `:not()` guard prevents double application when React Aria owns focus.
  This is the mechanism behind invariant 2 below: `status-focused` draws a ring offset from the
  element, so a clipping ancestor would cut it off.
- **Disabled** — `status-disabled`, on `:disabled`, `[aria-disabled="true"]` and `[data-disabled]`.
- **Selected** — colour from `--segmented-control-item-fg-selected`. The capsule is the indicator,
  not a background on the item.
- **Colour transition** — `color 150ms var(--ease-smooth)` on the item, as `.tabs__tab:134-139`, so
  the label's colour crossfades while the capsule slides underneath it. `motion-reduce` after it.

**The correction:** `tabs.css` writes these selectors with explicit values (`[data-selected="true"]`,
`[data-focus-visible="true"]`). The house form is the value-less `data-*` selector, recorded in
`toggle-button.css`'s deviation list, item 5. `SegmentedControl` uses the value-less form
throughout. This changes nothing in `tabs.css`; it only means the two files will not look identical
on these lines.

## Stacking and layout invariants

Three details that are present in `tabs.css` but unexplained there, and that break the component
silently if missed:

1. **The item must be `position: relative` with `z-index: 1`.** That creates the stacking context
   inside which the indicator's `z-index: -1` falls behind the label while staying in front of the
   shell background. Without the context the indicator drops behind the shell background and
   becomes invisible.
2. **The shell must not clip.** `.toggle-button-group` keeps `overflow: visible` with its reason
   recorded: a focus ring in peakui is a box-shadow, and a clipping ancestor cuts it off. The same
   applies to the capsule.
3. **The indicator positions against the item, not the shell** — `absolute inset-0 size-full`, as
   `.tabs__indicator:232`. Moving between parents is RAC's job; the shell takes no part.

## Forced colors

Required, because forced-colors flattens backgrounds and the selected state is carried by a
background here.

```css
@media (forced-colors: active) {
  .segmented-control { border: 1px solid ButtonBorder; }
  .segmented-control__indicator { background-color: Highlight; }
  .segmented-control__item[data-selected] { color: HighlightText; }
}
```

The `Highlight` / `HighlightText` pair is the approach `toggle-button.css` already uses for the same
problem; its reasoning is recorded in that file's deviation list, item 2.

## Accessibility

Almost everything comes from the primitive, verified in
`react-aria@3.52.1/dist/private/button/useToggleButtonGroup.mjs`:

```
:21   role: state.selectionMode === 'single' ? 'radiogroup' : toolbarProps.role,
:43   buttonProps.role = 'radio';
:45   buttonProps['aria-checked'] = toggleState.isSelected;
:46   delete buttonProps['aria-pressed'];
```

So the shell is `role="radiogroup"` and segments are `role="radio"` with `aria-checked`, for free
and correct. The ARIA roles are consequently **not** what separates this component from
`RadioGroup`; form participation is.

**A known APG divergence, inherited and documented rather than fixed:** the role is `radiogroup`
but the keyboard comes from `useToolbar` — arrow keys move focus, Space or Enter selects. APG
prescribes selection by arrow keys for a radiogroup. This is RAC's deliberate choice, and the house
rule is not to re-derive what RAC provides. The docs page states the actual keyboard behaviour.

An accessible name on the Root is required — `aria-label`, or `aria-labelledby` referencing a
visible label. Floor is WCAG 2.2 AA plus `forced-colors`; the `sm` target size note above is part
of meeting it.

## Tests

`packages/react/tests/components/segmented-control/`, mirroring the component path.

`segmented-control.test.tsx` (jsdom, via `@peakui/testing/helpers`) covers: roles and
`aria-checked`; selection by click and by Space; `disallowEmptySelection` — clicking the selected
segment does not clear it; a disabled segment cannot be selected; a disabled control as a whole;
arrow keys moving focus without selecting; the size class reaching items through context; the
indicator existing only inside the selected item.

`segmented-control.ssr.test.tsx` is the client SSR smoke via `ssrSmoke()`.

**The slide itself is not testable in jsdom.** FLIP depends on `getBoundingClientRect()` and
`requestAnimationFrame`; in jsdom every rect is zero. It therefore needs Playwright, which is a
deliberate exception to the rule that browser specs are for overlays and high-risk portals rather
than one per component. The precedent and the technique already exist:

```
apps/storybook/e2e/Tabs.spec.ts:108
  test("индикатор переехал к выбранному табу", …)
```

Its own comment states the reason — the move happens through a transient `translate`, so the test
asserts geometry after the transition rather than a property. It polls `boundingBox()` of the
indicator against the selected tab until the larger of the x and width deltas is under 1px.
`apps/storybook/e2e/SegmentedControl.spec.ts` repeats that for
`[data-slot="segmented-control-indicator"]`, and adds the per-theme axe run that the same file
performs at line 137.

No changeset and no codemod: pipeline stage 5 is switched off.

## Stories

`segmented-control.stories.tsx`, beside the component: `Basic`, `IconOnly`, `Sizes`, `Disabled`
(whole control and a single segment), `Controlled`, and `LongLabels`. `LongLabels` exists to settle
the width declaration under "Geometry and sizes" and is also the story the e2e spec drives.

## Docs

`apps/docs/content/docs/en/react/components/(buttons)/segmented-control.mdx`, following Usage →
Examples → Customization → Styling Reference → API Reference, with the `links` frontmatter that
feeds the components index. Demos go in `apps/docs/src/demos/segmented-control/`, one file per
example, adapted from the stories — never the reverse, and docs never import stories.

The page must state: an accessible name is required; the actual keyboard behaviour including the APG
divergence; that `sm` on desktop is at the WCAG minimum target size and `md` is recommended in
headers. No page, demo or generated markdown may name the reference library.

Stage 4 is not optional: the page and demos land in the same PR as the component.

## Phase 2: migrating `apps/docs`

This is the reason the component exists; without it the defect measured at the top of this spec
remains. It is a separate phase of the implementation plan and may ship as a follow-up PR.

1. Rewrite `apps/docs/src/components/fumadocs/ui/theme-toggle.tsx` on `SegmentedControl`. Mode
   `light-dark-system` becomes three segments. Mode `light-dark` becomes **two** segments instead
   of one button holding two icons, and gains the animation it never had; the `itemBase` /
   `itemActive` conditional classes are deleted.
2. Pass `slots={{themeSwitch: <ThemeToggle mode="light-dark-system" />}}` to `HomeLayout` in
   `apps/docs/src/app/[lang]/(home)/layout.tsx`, so the home page stops rendering the upstream
   `fumadocs-ui` `ThemeSwitch`. One component on both pages.
3. Delete the `[data-theme-toggle]` block at `apps/docs/src/app/global.css:66-72` and its margin
   override inside `#nd-home-layout`.
4. Replace the hardcoded `size-[34px]` in `apps/docs/src/components/github-link.tsx:17` and
   `apps/docs/src/components/fumadocs/ui/search-toggle.tsx:42` with `size="md"` and no override.
5. The header row lands on 36px — the height of an icon-only `Button` at `md` and of
   `SegmentedControl` at `md`. The ad-hoc 34px is gone.

## Recorded deviations

Listed so that a later reader does not mistake any of them for an oversight. Items 1-4 also belong
in the CSS file's own deviation list, in the form the other style files use.

1. **No prototype in the reference.** Measured: `../heroui` has `tabs` and `toggle-button-group` and
   nothing segmented; `SelectionIndicator` appears in exactly one of its files, `tabs/tabs.tsx`.
   The pattern is needed and `Tabs` cannot express it without claiming to be a `tablist`.
2. **`selectedKey` instead of RAC's `Set`.** The shape of one prop is adapted; behaviour is not.
3. **The indicator is internal**, unlike `Tabs`, which exposes it as a part.
4. **`radiogroup` role with toolbar keyboard** — inherited from RAC, documented rather than fixed.
5. **Why `SegmentedControl` and `ToggleButton` stay separate.** The two files will look similar and
   someone will eventually propose merging them. They are separate because the segmented control
   owns its own size scale rather than overriding `--toggle-button-*` from outside, and because
   locking the selection mode is what makes the broken combination inexpressible. Merging them
   re-creates the override path that produced the 6px defect this spec opens with.

## Amendment, 2026-10-07: icon-only segments are square

Added after the migration measured the result. The spec gave segments a height and no icon-only
geometry, so an icon-only segment inherited the text padding (`px-4`) and came out 48x28 at `md` on
desktop — an oval, where the hand-rolled switcher this component replaces used round chips
(`size-6.5 rounded-full`), and the three-icon control measured 152px against about 104px before.

`SegmentedControl.Item` therefore takes `isIconOnly`, following the geometry the house already uses
for `.button--icon-only` (`w-10 px-0 md:w-9`) and `.toggle-button--icon-only`: the segment squares to
its own height, and the radius needs no change, because `--radius-3xl` is 24px and a browser clamps a
radius to half the box. At `md` on desktop a segment becomes 28x28 and the three-icon control 92px.

This also settles the width note recorded against the migration: the control is now narrower than
the one it replaced rather than wider.

## Deferred

- **`Separator`** — thin dividers between unselected segments are a genuine part of the pattern,
  and the "hide the divider on the selected segment and the one after it" logic already exists at
  `tabs.css:143-148`. No case in scope asks for it.
- **`orientation="vertical"`** — supported by both `Tabs` and `ToggleButtonGroup`, but a vertical
  segmented control is rare. v1 is horizontal only; `data-orientation` stays in the markup so
  adding it later is not a breaking change.
- **Multiple selection** — not deferred but out of scope: that is `ToggleButtonGroup`.
