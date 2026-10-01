# Architecture: Composing React Aria Components

How a PeakUI component is built: one file, a context, a Root, parts, React 19 idioms.

## The shape

A component is a **thin styled composition over a RAC primitive**. The whole component — context,
Root, every part, every type — lives in one `.tsx`, divided by banner comments.

```tsx
"use client";

import type {ChipVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {chipVariants} from "@peakui/styles";
import {createContext, use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose";

/* -------------------------------------------------------------------------------------------------
 * Chip Context
 * -----------------------------------------------------------------------------------------------*/
type ChipContextValue = {
  slots?: ReturnType<typeof chipVariants>;
  isDisabled?: boolean;
};

const ChipContext = createContext<ChipContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * Chip Root
 * -----------------------------------------------------------------------------------------------*/
interface ChipRootProps extends ComponentPropsWithRef<"div">, ChipVariants {}

const ChipRoot = ({children, className, size, variant, ...rest}: ChipRootProps) => {
  const slots = chipVariants({size, variant});

  return (
    <ChipContext value={{slots}}>
      <div className={composeSlotClassName(slots.base, className)} data-slot="chip" {...rest}>
        {children}
      </div>
    </ChipContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Chip Dismiss
 * -----------------------------------------------------------------------------------------------*/
const ChipDismiss = ({className, ...props}: ChipDismissProps) => {
  const {slots} = use(ChipContext);

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.dismiss())}
      data-slot="chip-dismiss"
      {...props}
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ChipRoot, ChipDismiss};
export type {ChipRootProps, ChipDismissProps};
```

Note what is **absent**: no `forwardRef`, no `useState`, no props getters, no `aria-*` written by
hand, no `useCallback`, no separate types/hook/styles files, no `classNames`.

## React 19 idioms

| Do                                            | Not                                     |
| --------------------------------------------- | --------------------------------------- |
| `ComponentPropsWithRef<typeof Primitive>`     | `forwardRef<Ref, Props>`                |
| `use(Context)`                                | `useContext(Context)`                   |
| `<ChipContext value={…}>`                     | `<ChipContext.Provider value={…}>`      |
| `ref` destructured as an ordinary prop        | `useImperativeHandle` for element access |

`"use client"` goes at the top of every component file. PeakUI components are client components:
they carry interaction and context. A consumer may import them from a server component; the
directive is what makes that safe.

## Where state lives

RAC primitives own their own state. The Root adds only what RAC has no concept of — a variant
selection, a registration count, a derived flag.

```tsx
// ✅ RAC owns open/close; the Root owns only its styling slots
const SelectRoot = ({children, variant, ...props}: SelectRootProps) => {
  const slots = React.useMemo(() => selectVariants({variant}), [variant]);
  return (
    <SelectContext value={{slots}}>
      <SelectPrimitive {...props}>{children}</SelectPrimitive>
    </SelectContext>
  );
};

// ❌ Re-implementing what the primitive already does
const [isOpen, setIsOpen] = useState(false);
const getTriggerProps = useCallback(() => ({"aria-expanded": isOpen, onClick: …}), [isOpen]);
```

When the component is **controlled**, pass the controlled prop through to the primitive and let RAC
reconcile it. Never shadow a controlled prop with local state.

## When a hook is justified

Default: **no hook.** Create one only when at least one holds:

1. The logic is non-trivial and would bury the JSX (`use-calendar-state`).
2. It is reused by more than one component — then it belongs in `src/hooks/`.
3. It wraps a browser API with cleanup (`use-measured-height`, `use-media-query`).

A hook that only forwards props, or exists because "every component has one", is forbidden. The
vendored reference has three component-local hooks across ~86 components — that is the ratio.

## Reading render props

RAC primitives pass state to children and `className` as functions. Compose, don't fight it.

```tsx
<ButtonPrimitive className={composeTwRenderProps(className, slots.base())}>
  {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
</ButtonPrimitive>
```

- `composeTwRenderProps(className, tw)` — merges a consumer `className` (string or function) with
  our classes, preserving the render-props signature.
- `composeSlotClassName(slotFn, className, variants?)` — for plain DOM elements that take a slot
  function rather than RAC render props.

## Ban on conditional hooks

Hooks run in a fixed order every render. Never select a hook by condition — split into two
components and select the component.

```tsx
// ❌ forbidden
const state = isRange ? useRangeCalendarState(o) : useCalendarState(o);

// ✅ split
{isRange ? <CalendarRangeView /> : <CalendarSingleView />}
```

A part that renders nothing when closed still calls all its hooks first:
`if (!isOpen) return null;` goes **after** the hook calls.

## No data layer

`@peakui/react` performs no I/O. No `fetch`, no `axios`, no TanStack Query. Collections arrive as
props (`items`), as do `isLoading` / `isInvalid` states. Query wiring belongs to the consuming
application, or to `peakui-pro` blocks — never to a core primitive.
