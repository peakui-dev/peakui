# Styling: tv → BEM → CSS

Styling is two layers in two packages. Getting the split right is the single most common review
failure, because the v2 habit is to put Tailwind inside `tv()`.

## The split

```
packages/styles/src/components/chip/chip.styles.ts   tv()  → BEM class NAMES only
packages/styles/components/chip.css                  the actual Tailwind / CSS
```

**Layer 1 — `tv()` maps props to class names. It contains no utilities.**

```typescript
import type {VariantProps} from "tailwind-variants";
import {tv} from "tailwind-variants";

export const chipVariants = tv({
  base: "chip",
  defaultVariants: {size: "md", variant: "solid"},
  variants: {
    size: {sm: "chip--sm", md: "chip--md", lg: "chip--lg"},
    variant: {
      solid: "chip--solid",
      outline: "chip--outline",
      soft: "chip--soft",
    },
    isDismissable: {true: "chip--dismissable"},
  },
});

export type ChipVariants = VariantProps<typeof chipVariants>;
```

**Layer 2 — the CSS owns every utility, behind those names.**

```css
/* Chip component styles */
.chip {
  @apply relative inline-flex w-fit items-center gap-1 rounded-full text-sm font-medium;

  /* Per-component theming seam — the public customization API */
  --chip-bg: transparent;
  --chip-fg: currentColor;
  --chip-border: transparent;

  background-color: var(--chip-bg);
  color: var(--chip-fg);

  /*
   * Transitions
   * CRITICAL: motion-reduce must come AFTER transition, or specificity lets the
   * transition win and the reduced-motion preference is silently ignored.
   */
  transition: background-color 100ms var(--ease-out);
  @apply motion-reduce:transition-none;

  &[data-disabled] {
    @apply status-disabled;
  }
  &:focus-visible {
    @apply status-focused;
  }
}

.chip--solid {
  --chip-bg: var(--color-accent-9);
  --chip-fg: var(--color-accent-contrast);
}
```

### Why this split exists

- The CSS ships as a standalone artifact — consumers who are not on React can use the design system.
- Variant resolution stays type-safe in TypeScript while the cascade stays in CSS.
- CSS custom properties give consumers a theming seam that does not require overriding classes.

## Slots

For a multi-part component, `tv({slots: {...}})` names one slot per part — again, BEM names only.

```typescript
export const selectVariants = tv({
  slots: {base: "select", trigger: "select__trigger", popover: "select__popover"},
  variants: {variant: {default: {trigger: "select__trigger--default"}}},
});
```

The Root computes the slots once and passes them through context; each part reads its own:

```tsx
const slots = React.useMemo(() => selectVariants({variant}), [variant]);
// in a part:
const {slots} = use(SelectContext);
<PopoverPrimitive className={composeTwRenderProps(className, slots?.popover())} />
```

## BEM naming

| Part      | Form                | Example                |
| --------- | ------------------- | ---------------------- |
| Block     | component name      | `.chip`                |
| Element   | `block__element`    | `.select__trigger`     |
| Modifier  | `block--modifier`   | `.chip--solid`         |

Kebab-case throughout, matching the file name and the `data-slot` value.

## `data-slot` — the public contract

Every rendered element carries `data-slot="<component>"` or `<component>-<part>`.

```tsx
<div data-slot="chip" />
<ButtonPrimitive data-slot="chip-dismiss" />
```

It is what consumers target to style inside a component, and what tests query when role/label/text
cannot identify an element. Because it is public, renaming one is a breaking change.

## State: `data-*`, never `is-*`

RAC emits `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`,
`data-selected`, `data-placement`. Style those.

```css
.chip[data-disabled] { @apply opacity-50; }
```

```tsx
// Only when a value is ours and RAC does not provide it:
import {dataAttr} from "../../utils/assertion";
<div data-loading={dataAttr(isLoading)} />
```

Never invent `is-focused` / `is-active` classes, and never toggle classes in JS to express state.

## Class composition

Use `cn` / `cx` from `tailwind-variants`, through the compose helpers. **Never** build a merger from
`clsx` + `tailwind-merge` — `tailwind-variants` already has `tailwind-merge` as a peer and resolves
conflicts for you.

| Helper                                            | Use for                                       |
| ------------------------------------------------- | --------------------------------------------- |
| `composeTwRenderProps(className, tw)`             | a RAC primitive whose `className` may be a function |
| `composeSlotClassName(slotFn, className, vars?)`  | a plain DOM element taking a slot function     |

There is no `classNames` prop. A consumer styles a part by putting `className` on that part, or by
targeting its `data-slot` in CSS.

## Tokens: Tailwind v4

Tokens are declared once with `@theme inline` and consumed as `var(--…)`.

```css
@theme inline {
  --color-accent-9: oklch(0.62 0.19 259);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.45, 0, 0.15, 1);
}
```

- **OKLCH for every color** — perceptually uniform lightness, so a scale stays legible when themed.
- **No raw hex or `rgb()` in a component's CSS.** Reference a token.
- Motion uses the `--ease-*` tokens, never inline cubic-beziers.
- Theme variants live in `packages/styles/themes/`; a component never hardcodes a theme value.
