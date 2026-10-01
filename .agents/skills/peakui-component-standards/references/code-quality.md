# Naming, Code Quality & Package Hygiene

## Naming

| Thing              | Convention                  | Example                        |
| ------------------ | --------------------------- | ------------------------------ |
| Component / part   | `PascalCase`                | `SelectTrigger`                |
| File               | `kebab-case`                | `select.tsx`, `select.css`     |
| Styles recipe      | `<name>Variants`            | `selectVariants`               |
| Hook               | `use` + `camelCase`         | `useMediaQuery`                |
| Hook file          | `kebab-case`                | `use-media-query.ts`           |
| BEM block          | `kebab-case`                | `.select`, `.select__trigger`  |
| `data-slot`        | `kebab-case`                | `select-trigger`               |
| CSS custom property| `--kebab-case`              | `--select-trigger-bg`          |
| Type               | `PascalCase`                | `SelectTriggerProps`           |

**File names are kebab-case and match the BEM block**, so `select.tsx` ↔ `select.styles.ts` ↔
`select.css` ↔ `.select__trigger` ↔ `data-slot="select-trigger"` all line up.

## File layout inside a component

Banner comments divide the file, in this order:

```tsx
"use client";
// imports: types first, then values

/* ---------- <Name> Context ---------- */
/* ---------- <Name> Root ---------- */
/* ---------- <Name> <Part> ---------- */   // one per part, in DOM order
/* ---------- Exports ---------- */
```

## Import order

```tsx
// 1. type-only imports — ours, then external
import type {ChipVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

// 2. values: our packages
import {chipVariants} from "@peakui/styles";

// 3. react, then external
import {createContext, use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

// 4. internal relative
import {composeTwRenderProps} from "../../utils/compose";
```

## `displayName`

Only when the name does not infer. A part declared as `const SelectTrigger = (…) => …` already shows
correctly in DevTools — adding `displayName` there is noise. Set it for a component produced by a
factory or wrapper where inference fails.

## Conditional rendering

```tsx
{isDismissable && <Chip.Dismiss />}            // ✅
{isLoading ? <Skeleton /> : <Content />}        // ✅ two explicit branches
{a ? (b ? c : d) : e}                           // ❌ nested ternary — extract
```

## Memoization

Memoize the slots object and genuinely expensive derivations. Nothing else.

```tsx
const slots = React.useMemo(() => selectVariants({variant}), [variant]);   // ✅ new object each render otherwise
const label = React.useMemo(() => props.label?.toUpperCase(), [props.label]); // ❌ pointless
```

## Derived values: `useMemo`, not `useEffect` + `setState`

```tsx
// ❌ two renders: initial, then the effect's update
const [text, setText] = useState("");
useEffect(() => { setText(radius ?? fallback(size)); }, [size, radius]);

// ✅ one render, correct immediately
const text = useMemo(() => radius ?? fallback(size), [size, radius]);
```

At 100 instances that is 100 avoidable renders.

## Element size: `ResizeObserver`, not a window listener

```tsx
// ❌ a global resize listener per instance — 100 instances, 100 listeners, 100 re-renders per resize
const [width] = useWindowSize();

// ✅ observe the one element
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const check = () => setOverflowing(el.scrollWidth > el.offsetWidth);
  const ro = new ResizeObserver(check);
  ro.observe(el);
  check();
  return () => ro.disconnect();
}, []);
```

`ResizeObserver` batches at the engine level and fires once per frame. Use `use-media-query` only for
genuinely viewport-level questions.

## Package hygiene — CI gates

| Gate                        | Why it fails the build                                                      |
| --------------------------- | --------------------------------------------------------------------------- |
| `sideEffects: false`        | Without it `Object.assign` in every `index.ts` defeats tree-shaking, and a consumer importing one component pays for all of them. |
| `publint`                   | A broken `exports` map or a missing file ships a package that cannot be imported in some bundlers. |
| `are-the-types-wrong` (`attw`) | Types that resolve under `node10` but not `node16`/`bundler` break consumers' editors silently. |
| Per-component size budget   | A primitive that quietly gains a heavy transitive dependency is caught here, not by a consumer. |

Also: no barrel-to-barrel re-export chains inside `src`, and no top-level side effects in any module
(no mutation at import time, no registry writes).

## Forbidden

```tsx
props.value = newValue;                        // mutating props
eval("…"); new Function("…");                  // never
const handler = (e: any) => …;                 // any
const s = cond ? useA() : useB();              // conditional hook
import {twMerge} from "tailwind-merge";        // build your merger from tailwind-variants
useEffect(() => { fetch("/api"); }, []);       // no I/O in this library
```
