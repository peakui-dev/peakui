# Sheet — a snap-point overlay built on React Aria's Sheet

`Sheet` is an edge-anchored overlay that rests at partial heights (snap points), follows the finger,
and stacks. It sits **alongside** `Drawer`; it does not replace it.

## Task

Add `Sheet` to `@peakui/react` on top of `react-aria-components/Sheet` (RAC 1.22.1, branch
`chore/bump-rac-1.22`). Status `alpha`. The component is a port of the reference implementation in
the vendored read-only reference tree, restyled in PeakUI tokens and held to
`peakui-component-standards`.

## Goals and non-goals

Goals:

- The full reference part set, with identical behaviour on snap points, nesting and detaching.
- Reuse `Surface` and `CloseButton`, and any wiring `Drawer` already owns, through shared modules.
- A keyboard path between snap points that needs no gesture (WCAG 2.2 AA, SC 2.5.7).
- Browser-tier coverage of scroll-snap behaviour, which jsdom cannot exercise.

Non-goals: replacing or deprecating `Drawer`; a `Drawer`-to-`Sheet` codemod; changes to core
primitives; docs-site licence text (deferred by the owner).

## API

`Sheet` is a compound: `Sheet` (root), `.Trigger`, `.Backdrop`, `.Content`, `.Dialog`, `.Header`,
`.Heading`, `.Body`, `.Footer`, `.Handle`, `.Close`, `.CloseTrigger`, `.NestedRoot`.

Root props:

| Prop | Type | Default |
| --- | --- | --- |
| `isOpen` / `defaultOpen` / `onOpenChange` | controlled and uncontrolled open state | `false` |
| `onClose` | fired when closing is requested | — |
| `onAnimationEnd` | `(open: boolean) => void`, after enter or exit animation | — |
| `isDismissable` | outside press, swipe and Escape can close | `true` |
| `placement` | `"bottom" \| "top" \| "left" \| "right"` | `"bottom"` |
| `snapPoints` | `Array<number \| string>`: pixels or any CSS length; opens at the first; trailing `1` ignored | full height |
| `isDetached` | float away from the viewport edge | `false` |

`isExiting` is exposed as a render prop and as `data-exiting` on `Backdrop`, `Content` and `Dialog`,
so consumers can style the exit. `Close` is a `CloseButton`; `CloseTrigger` wraps any element as a
close control. `NestedRoot` is a `Sheet` with `isNested` set internally; it scales the parent back.
Every part accepts `className` (string or render function) and `ref`. Types live inline.

## Behaviour

- **Snap points.** Normalised to a sorted list; full height is always implicit. Release settles on
  the nearest point, biased by velocity. A drag past the lowest point dismisses when `isDismissable`.
- **Gestures.** Touch on the panel swipes natively through scroll-snap. A pointer drag on `Handle`
  drives the scroller programmatically and releases on the shared easing curve. Body content that
  scrolls takes precedence over sheet movement until it reaches its edge.
- **Nested.** A nested sheet scales and dims its parent. Closing the child restores the parent's snap
  point. Escape closes the topmost sheet only.
- **Reduced motion.** Enter, exit, release and stack-scale transitions become instant; snap points
  still apply. Programmatic scrolls use `behavior: "auto"`.
- **RTL.** `left` and `right` are physical edges; `start` and `end` are not offered, so `placement`
  does not flip. Handle arrow keys on a horizontal sheet follow the logical direction of the
  inline axis.
- **Forced colors.** Panel, handle and backdrop get `CanvasText` borders and a `Highlight` focus
  ring; the backdrop falls back to a stippled `Canvas` since alpha is dropped.

## Accessibility

- `Dialog` is `role="dialog"` with `aria-labelledby` pointing at `Heading`; focus is trapped, returns
  to `Trigger` on close, and the page behind is inert.
- `Handle` is a keyboard-operable `role="slider"`, `aria-orientation` per placement, `aria-valuemin`
  (lowest snap), `aria-valuemax` (full), `aria-valuenow`, and `aria-valuetext` such as "Half height".
  Arrow keys step to the adjacent snap point, Home and End jump to the extremes. Escape closes. The
  Handle is rendered only when `snapPoints` has more than one entry; otherwise it is decorative
  (`aria-hidden`).
- `Close` and `Handle` targets are at least 24x24 CSS px; focus is never obscured by the sheet edge.

## File list

All under `peakui/`:

- `packages/react/src/components/sheet/sheet.tsx`, `sheet.stories.tsx`, `index.ts`
- `packages/react/src/components/sheet/` helpers: context, lifecycle, snap utilities, handle hook
  (split only where it earns it, per the standards)
- `packages/react/src/components/surface` and `close-button`: reused unchanged
- A shared overlay helper extracted from `drawer.tsx` (placement, backdrop, close wiring), imported
  by both; `Drawer` behaviour does not change
- `packages/react/tests/components/sheet/sheet.test.tsx`, `sheet.ssr.test.tsx`
- `packages/styles/src/components/sheet/sheet.styles.ts`, `index.ts`; `packages/styles/components/sheet.css`
- `apps/storybook/e2e/Sheet.spec.ts`
- Docs page with a **Sheet vs Drawer** section, and `@peakui/react` barrel and styles CSS entry

**Sheet vs Drawer (docs text, no product names):** choose Sheet for touch-first panels that rest at
partial heights, stack, or need a drag handle (bottom actions, filters, map details). Choose Drawer
for navigation or settings panels that open fully, or not at all, with no gesture. Both share
`Surface` and `CloseButton`, so they look consistent.

## Testing strategy

- **jsdom (Vitest):** open and close, controlled mode, roles and labelling, focus return, Escape,
  `Handle` slider roles and aria values, arrow-key stepping through mocked snap targets, `Close` and
  `CloseTrigger`, nested close order, SSR smoke. No assertions on colours or class lists.
- **Playwright (`apps/storybook/e2e`):** scroll-snap settling, handle drag and release, swipe-to-
  dismiss, nested scale-back, four placements, `isDetached`, emulated reduced motion, RTL, forced
  colors, keyboard stepping against live `aria-valuenow`.

## Risks

- The RAC Sheet export is new; its API may move in a minor. Pin the RAC range and import through one
  module.
- Scroll-snap differs across Safari and Chromium, so the e2e matrix must include WebKit.
- Extracting the shared helper from `Drawer` risks regressions; guard it with the existing Drawer
  suite before moving code.

## Open questions

- Should `Handle` always be a slider, or should a single-snap sheet get a plain button?
- Should `placement` offer logical `start` and `end` in a later additive release?
