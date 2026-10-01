# Compound Components & Composition

Every PeakUI component is compound: a Root plus parts sharing state through context, shipped under
both call styles. There is **no assembled layer** — see "No assembled wrapper" below.

## Why compound

Flexibility (compose and restyle parts independently), maintainability (each part is small),
developer experience (the API reads like HTML), scalability (extend by adding a part, not a prop).

The cost of not doing it: one mega-component that grows a boolean prop per customization request,
until the prop matrix is untestable and the defaults fight each other.

## No assembled wrapper

The historical PeakUI rule — "ship a compound form *and* a pre-assembled convenience component" — is
withdrawn. `Object.assign(SelectRoot, {...})` makes `Select` **be** `SelectRoot`; the callable
namespace is the Root itself.

```tsx
<Select>…</Select>        // identical to <Select.Root>…</Select.Root> and <SelectRoot>…</SelectRoot>
```

Convenience is expressed as **defaults inside the parts**, not as a component that renders the other
parts for the consumer:

```tsx
// ✅ the part carries the sensible default
const SelectPopover = ({placement = "bottom", ...props}: SelectPopoverProps) => …;

// ✅ a part reads its parent's context for shared config
const finalSize = size ?? (isButtonGroupChild ? buttonGroupContext?.size : undefined);

// ❌ an assembled wrapper — forbidden
const SelectBase = ({label, options}) => (
  <SelectRoot><SelectTrigger>{label}</SelectTrigger><SelectPopover>…</SelectPopover></SelectRoot>
);
```

Why it is forbidden: it duplicates the parts' wiring, creates a second API surface that drifts, hides
parts the consumer then cannot reach, and tempts convenience props onto the Root.

## The pattern — Context + Root + Parts

Three things, all in one file:

1. **A context** holding what parts share — at minimum the computed `slots`.
2. **A Root** that computes slots, provides the context, and renders the RAC primitive.
3. **Parts** that read the context with `use()` and render their own primitive or element.

```tsx
type SelectContextValue = {
  slots?: ReturnType<typeof selectVariants>;
  isDisabled?: boolean;
  /** Read at event time so registration never triggers a re-render. */
  hasClearButton?: () => boolean;
  /** Called by the clear button on mount; returns its own cleanup. */
  registerClearButton?: () => () => void;
};

const SelectContext = createContext<SelectContextValue>({});

const SelectRoot = <T extends object = object>({children, variant, ...props}: SelectRootProps<T>) => {
  const slots = React.useMemo(() => selectVariants({variant}), [variant]);
  const clearButtonCount = React.useRef(0);

  // Counted, not a boolean: unmounting one clear button must not switch the
  // shortcut off while another is still mounted.
  const registerClearButton = React.useCallback(() => {
    clearButtonCount.current += 1;
    return () => { clearButtonCount.current -= 1; };
  }, []);

  return (
    <SelectContext value={{slots, registerClearButton, hasClearButton: () => clearButtonCount.current > 0}}>
      <SelectPrimitive {...props}>{children}</SelectPrimitive>
    </SelectContext>
  );
};
```

**Default the context to `{}`, not `null`.** Parts then read `slots?.trigger()` and degrade
gracefully instead of throwing. Throw only where a part is genuinely meaningless outside its Root,
and say which Root in the message.

## Feature routing — contract down, convenience up

The Root's props are the parts' **contract**, nothing more.

| Kind of feature                                                            | Home                                        |
| -------------------------------------------------------------------------- | ------------------------------------------- |
| Contract — `value`, `onChange`, `isDisabled`, `isOpen`, selection, keyboard | the Root (usually straight to the primitive) |
| Styling variants — `size`, `variant`, `fullWidth`                           | the Root, via `tv()` into context slots      |
| Convenience — placement, an icon, a label's position                        | the part's own defaults, or its own part      |
| Shared config a child needs                                                 | context read by that child (`ButtonGroupContext`) |

```tsx
// ❌ feature gravity — the Root carries config for something a part renders
<CheckboxRoot tooltip={{content: "…"}} />

// ✅ the consumer composes it
<Tooltip content="…"><CheckboxRoot …>…</CheckboxRoot></Tooltip>
```

A description, an error message or a helper icon is a **sibling part**, never a Root prop.

## Performance — split the context by concern

One context bundling slots, open-state and selection re-renders every part on any change. Split so a
part subscribes only to what it uses.

```tsx
const SelectContext = createContext<{slots?: …}>({});           // stable after mount
const SelectTriggerContext = createContext<{isDisabled?: boolean}>({});  // resolved per trigger
```

Two further tactics from the reference implementation:

- **Refs over state for registration.** A part announcing its presence (a clear button, a text slot)
  increments a ref and the Root reads it at event time — no re-render on mount.
- **Memoize the slots object**, since it is a new object every render otherwise and every part reading
  it re-renders.

## Leaf components

A component with no sub-structure still ships the full export contract:

```tsx
export const Chip = Object.assign(ChipRoot, {Root: ChipRoot});
```

Uniformity means a consumer never has to remember which components support `.Root`, and adding a part
later is not a breaking change. Add parts when the component genuinely has coordinated pieces —
`Chip` with an icon and a dismiss button does; `Kbd` does not.

## Anti-patterns

### An assembled wrapper
Covered above. One set of parts, no second surface.

### A mega-component with a prop per customization
`<Select label items triggerClassName itemClassName showCheckmark align … />`.
**Fix:** move customization to the part — style `<Select.Trigger>` directly.

### Feature gravity
Convenience config entering the Root and threading through context to wherever it renders. Every new
feature widens the context and re-renders the world.
**Fix:** route it — contract to the Root, convenience to the part.

### Two implementations, or drifting member lists
Re-wrapping a part so the namespace and the flat export are different components, or
`Object.assign(…, {Trigger})` while `Trigger` is missing from the flat exports.
**Fix:** one set of parts; both export lists live in the same file and are reviewed together.

### Prop-drilling instead of context
Works for two parts, breaks at three, makes reordering impossible.
**Fix:** context, read with `use()`.

### Shadowing a controlled prop
The Root keeps local state and ignores `props.isOpen`, so the consumer cannot control it.
**Fix:** pass controlled props through to the primitive and let RAC reconcile.

### Re-deriving primitive state
Adding `useState` for something `SelectStateContext` already tracks.
**Fix:** read the primitive's state context — see `react-aria-components.md`.
