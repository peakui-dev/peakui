# React Aria Components (RAC)

The behavior and accessibility foundation. RAC is the default; raw hooks are the exception.

## Import style: deep subpaths

Always import a primitive from its own subpath, never from the package root.

```tsx
// ✅ deep subpath — only this primitive enters the bundle
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";
import {Select as SelectPrimitive, SelectStateContext} from "react-aria-components/Select";

// ❌ barrel import — pulls the whole library in
import {Button, Popover, Select} from "react-aria-components";
```

Alias the primitive (`as ButtonPrimitive`) so the name stays free for our own part.

**This is about how PeakUI consumes RAC.** What PeakUI *publishes* is a single barrel
(`@peakui/react`), kept tree-shakeable by `sideEffects: false`. Don't confuse the two.

## Primitive map

| Need                        | RAC primitive                                              |
| --------------------------- | ---------------------------------------------------------- |
| Button, toggle              | `Button`, `ToggleButton`                                   |
| Text entry                  | `TextField`, `Input`, `TextArea`, `SearchField`, `NumberField` |
| Choice                      | `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch` |
| Collections                 | `ListBox`, `GridList`, `Menu`, `Table`, `Tree`, `TagGroup`  |
| Pickers                     | `Select`, `ComboBox`, `Autocomplete`                        |
| Overlays                    | `Popover`, `Dialog`, `Modal`, `Tooltip`, `Toast`            |
| Dates                       | `Calendar`, `RangeCalendar`, `DateField`, `DatePicker`, `DateRangePicker`, `TimeField` |
| Color                       | `ColorArea`, `ColorSlider`, `ColorField`, `ColorPicker`, `ColorSwatch` |
| Navigation / structure      | `Tabs`, `Disclosure`, `Breadcrumbs`, `Link`, `Toolbar`      |
| Value display               | `Meter`, `ProgressBar`, `Slider`                            |
| Forms                       | `Form`, `FieldError`, `Label`, `Group`                      |

**Overlays are positioned by RAC `Popover`.** Anything anchored — popover, dropdown, menu, combobox,
tooltip, select — composes `Popover` and sets `placement`. Floating UI is forbidden; so is
`getBoundingClientRect` coordinate math.

## Reaching the primitive's state

RAC exposes state contexts. Read them instead of duplicating state.

```tsx
import {SelectStateContext} from "react-aria-components/Select";

const SelectClearButton = () => {
  const state = use(SelectStateContext);
  const isEmpty = (state?.selectionManager.selectedKeys.size ?? 0) === 0;
  // …
};
```

Available widely: `SelectStateContext`, `ComboBoxStateContext`, `ListStateContext`,
`OverlayTriggerStateContext`, `TextFieldContext`, and so on. If you are about to add state that a
primitive already tracks, look for its context first.

## When raw hooks are correct

Drop to `react-aria` / `react-stately` only when RAC has **no primitive** for the behavior, and leave
a comment saying so.

| Situation                                              | What to use                                   |
| ------------------------------------------------------ | --------------------------------------------- |
| Utility helpers                                        | `@react-aria/utils` — `mergeProps`, `useId`, `mergeRefs` |
| SSR-safe ids / hydration                               | `@react-aria/ssr`                             |
| A behavior with no RAC primitive at all                 | the matching `@react-aria/*` hook              |
| Locale-aware formatting inside a part                   | `@react-aria/i18n`                            |

Shared, non-RAC concerns live in `packages/react/src/hooks/` (`use-media-query`,
`use-measured-height`, `use-is-hydrated`).

## Dates

`@internationalized/date` only — `CalendarDate`, `parseDate`, `today`, `getLocalTimeZone`. It is what
RAC's date primitives speak. `date-fns` is not a dependency of `@peakui/react`; application-level
formatting is the consumer's business.

## Polymorphism: the `render` prop

RAC's escape hatch for substituting the rendered element. There is no `as` prop.

```tsx
<Chip.Dismiss render={(props) => <MyLink {...props} />} />
```

Three requirements, enforced in review: render the **expected element type**, a **single root**
element (no fragments), and **pass props and ref through**. See `typescript.md` for the typing.
