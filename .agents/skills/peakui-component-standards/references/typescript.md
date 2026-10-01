# TypeScript Rules

## Core rules

| Rule                    | Detail                                                        |
| ----------------------- | ------------------------------------------------------------- |
| No `any`                | `unknown` + narrowing, or a generic. No `as unknown as` casts to escape a bad signature — fix the signature. |
| Type-only imports       | `import type {ComponentPropsWithRef} from "react"`             |
| Named exports only      | no default exports anywhere                                    |
| Literal unions          | `'sm' \| 'md' \| 'lg'`, never bare `string`                     |
| Types live with parts   | inline in the component `.tsx`; no `*.types.ts` by default      |
| `interface` for props   | `interface ChipRootProps extends …` — extendable and better errors |

## Props typing

Extend the primitive's props and intersect the variants. This keeps every RAC prop available without
restating it, and makes `ref` an ordinary prop.

```tsx
import type {ChipVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

interface ChipDismissProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

interface ChipRootProps extends ComponentPropsWithRef<"div">, ChipVariants {
  /** Called when the chip's dismiss button is activated. */
  onDismiss?: () => void;
}
```

`ChipVariants` comes from `VariantProps<typeof chipVariants>` in `@peakui/styles` — variant props are
never hand-written twice.

## Refs — React 19

`ref` is a prop. No `forwardRef`, no `useImperativeHandle` for element access.

```tsx
// ✅
const ChipRoot = ({ref, ...rest}: ChipRootProps) => <div ref={ref} {...rest} />;

// ❌
export const ChipRoot = forwardRef<HTMLDivElement, ChipRootProps>((props, ref) => …);
```

A custom imperative API is a last resort. Prefer exposing state through context or a controlled prop.

## Polymorphism: `render`, not `as`

An `as` prop forces a polymorphic generic that ends in casts. The `render` prop keeps types intact.

```tsx
interface DOMRenderProps<E extends keyof React.JSX.IntrinsicElements, T> {
  /**
   * Overrides the default DOM element with a custom render function.
   * Requirements: render the expected element type, exactly one root element,
   * and pass props and ref through to it.
   */
  render?: (props: React.JSX.IntrinsicElements[E], renderProps: T) => React.ReactElement;
}
```

Parts that render a plain element take it through the `dom.*` helper:

```tsx
const CardFooter = <E extends "div" | "footer" = "div">({className, ...props}: CardFooterProps<E>) => (
  <dom.div className={composeSlotClassName(slots?.footer, className)} data-slot="card-footer" {...props} />
);
```

## Generic collection parts

A collection Root is generic over its item type, and the generic flows into the primitive:

```tsx
interface SelectRootProps<T extends object, M extends "single" | "multiple" = "single">
  extends ComponentPropsWithRef<typeof SelectPrimitive<T, M>>, SelectVariants {
  items?: Iterable<T>;
}

const SelectRoot = <T extends object = object, M extends "single" | "multiple" = "single">(
  {children, ...props}: SelectRootProps<T, M>,
) => …;
```

Never widen an item type to `object` or `any` to dodge the generic.

## Public types

Every part's props type is exported, flat (`SelectTriggerProps`) and through the dotted type
namespace (`Select.TriggerProps`). The Root's props also get the short alias
(`SelectRootProps as SelectProps`). See the export contract in `SKILL.md`.
