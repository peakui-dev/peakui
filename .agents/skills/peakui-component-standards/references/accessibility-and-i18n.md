# Accessibility & Internationalization

## The floor is WCAG 2.2 AA

WCAG 2.2 is the current W3C Recommendation; 2.1 is superseded. The criteria 2.2 added are almost all
*component-level*, which makes them this library's responsibility rather than the consumer's.

| Criterion                              | Level | What it means for a component                                     |
| -------------------------------------- | ----- | ----------------------------------------------------------------- |
| 2.5.8 Target Size (Minimum)            | AA    | Interactive targets ≥ 24×24 CSS px, or spaced so a 24px circle does not overlap a neighbour. Covers icon buttons, chip dismiss, calendar cells, table row actions. |
| 2.4.11 Focus Not Obscured (Minimum)    | AA    | A focused element is never fully hidden by our own sticky headers, toolbars or overlays. Test tab order with an overlay open. |
| 2.5.7 Dragging Movements               | AA    | Anything draggable (slider, reorderable list, color area) also works by click or keyboard. RAC primitives provide this — do not remove it. |
| 3.3.8 Accessible Authentication        | AA    | No cognitive-function test. Relevant to OTP input: allow paste and autofill. |
| 3.2.6 Consistent Help                  | A     | A help affordance keeps a consistent position across a component family. |
| 3.3.7 Redundant Entry                  | A     | Multi-step components (wizards, forms) do not ask for the same value twice. |

Carried over and still mandatory: contrast ≥ 4.5:1 for text and ≥ 3:1 for UI boundaries, visible
focus on every interactive element, full keyboard operability, a programmatic name for every control.

> **APCA** (the WCAG 3 draft contrast model) is advisory here. Use it to sanity-check pairs that
> pass 4.5:1 but look wrong; it is not a gate.

## Let RAC do the ARIA

RAC primitives already emit the correct roles, states and relationships, and manage focus. Writing
`aria-*` by hand usually means fighting them.

```tsx
// ✅ the primitive owns it
<SelectPrimitive {...props}>…</SelectPrimitive>

// ❌ re-deriving what the primitive already sets
<div role="combobox" aria-expanded={isOpen} aria-controls={listId} …>
```

Add an attribute by hand only for something the primitive cannot know — a decorative icon
(`aria-hidden="true"`), or an `aria-label` on an icon-only control the consumer did not label.

An icon-only control with no accessible name is a defect. Either require a label in the types or
supply a localized default.

## Forced colors

Windows High Contrast / forced-colors flattens backgrounds and shadows. A component whose state is
communicated only by `background-color` becomes unreadable. Every component is checked in this mode.

```css
@media (forced-colors: active) {
  .chip {
    /* Backgrounds are overridden — make the boundary carry the meaning */
    border: 1px solid ButtonBorder;
    forced-color-adjust: none;
  }
  .chip[data-selected] {
    background-color: Highlight;
    color: HighlightText;
  }
  .chip:focus-visible {
    outline: 2px solid CanvasText;
  }
}
```

Rules: express state with a border or an outline in addition to colour; use CSS system colours
(`Canvas`, `CanvasText`, `ButtonText`, `ButtonBorder`, `Highlight`, `HighlightText`), never our own
tokens inside the query; keep a transparent border in the normal state so the layout does not shift
when the forced-colors border appears.

## Reduced motion and transparency

```css
.chip {
  transition: background-color 100ms var(--ease-out);
  /* AFTER the transition — specificity order matters, see styling.md */
  @apply motion-reduce:transition-none;
}
```

- `prefers-reduced-motion` — no transform or opacity animation; state changes still read instantly.
- `prefers-reduced-transparency` — drop backdrop blur and translucent surfaces to an opaque token.
- Never gate *information* on motion: if something animates in, it is also present without the
  animation.

## Keyboard expectations

| Component family       | Keys that must work                                              |
| ---------------------- | ---------------------------------------------------------------- |
| Button / toggle        | `Enter`, `Space`                                                 |
| Overlay (popover, dialog) | `Esc` dismisses, focus moves in on open and returns to the trigger on close |
| Listbox / menu / select | `↑` `↓` `Home` `End`, type-ahead, `Enter` selects, `Esc` closes   |
| Tabs                   | `←` `→`, `Home`, `End`                                           |
| Table / grid           | arrow navigation per cell, `Enter` activates a row action        |
| Slider                 | arrows, `Home`, `End`, `PageUp`, `PageDown`                       |

These come free from RAC. The review question is never "did you implement it" but "did you break it".

## Internationalization

A component owns very few strings, and the bar scales with how many. **A hardcoded English default is
acceptable** for a string the component generates itself. When a component owns many strings — a
calendar's month labels, a table's empty state — they go through **React Aria i18n**, never
`react-i18next`, which is not a dependency of `@peakui/react`.

This is measured, not conceded. Across the entire library code of the vendored reference, excluding
stories, there are **five** hardcoded strings: `Loading`, `Close`, `Clear selection`, `Remove tag`,
`pagination`. A formatter, a dictionary and a locale provider built for five strings is machinery
without a load.

The shape to use once a component does carry that load:

```tsx
import {useLocalizedStringFormatter} from "@react-aria/i18n";

const strings = {
  "ru-RU": {dismiss: "Удалить"},
  "en-US": {dismiss: "Remove"},
};

const ChipDismiss = ({"aria-label": ariaLabel, ...props}: ChipDismissProps) => {
  const formatter = useLocalizedStringFormatter(strings, "@peakui/react");
  return <ButtonPrimitive aria-label={ariaLabel ?? formatter.format("dismiss")} {...props} />;
};
```

Rules:

- **A hardcoded English default is acceptable** for a string the component generates itself. Russian
  hardcoded in JSX is still a defect — the default is the neutral one, and the locale-specific text
  arrives with the formatter.
- **A consumer-supplied label always wins over the default.** This is the half that makes the
  hardcoded default safe, and it is not optional: spread the consumer's props *after* your
  `aria-label`, never before. `heroui/packages/react/src/components/spinner/spinner.tsx` is the
  worked example.
- Reach for the formatter when a component owns **many** strings of its own, and give it a `ru-RU`
  entry when you do. One assistive label is not that threshold.
- Locale comes from `I18nProvider` at the app root; a component never reads a global locale itself.
- Dates and numbers are formatted with `@react-aria/i18n` / `@internationalized/date`, which are
  locale-aware — never with hand-written format strings.
- Supported locales are a fixed union: `type Locale = 'ru' | 'en'`.

Application copy is **not** this library's concern. Only strings the component itself produces (a
dismiss button's name, a calendar's month label, a table's "no rows" text) live here.
