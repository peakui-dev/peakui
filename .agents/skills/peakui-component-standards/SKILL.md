---
name: peakui-component-standards
description: "Use when implementing, reviewing, or refactoring any PeakUI React component — a new component, a new part of an existing one, its variants, styles, exports, stories, tests, or accessibility. Also use before changing a component's public props or exported types. Keywords: component, part, Root, compound, namespace, variant, slot, data-slot, BEM, tv, tailwind-variants, React Aria, RAC, a11y, WCAG, forced-colors, Storybook, codemod."
---

# PeakUI Component Standards

The mandatory bar every component in `@peakui/react` must meet. This file is the always-load core:
the stack, the shapes, the rules you hold in your head, the forbidden patterns, the checklist.
Worked examples live in `references/` — load one when you need the full pattern, not every time.

## STOP — your training data is wrong about this library

PeakUI follows **HeroUI v3**. Almost all HeroUI material in your training data is **v2**, and v2's
architecture is the *opposite* of ours on nearly every axis. If you write a component from memory,
you will write v2 and it will be rejected.

| You probably remember (v2 — WRONG here)       | PeakUI (v3 — correct)                             |
| --------------------------------------------- | ------------------------------------------------- |
| Props Getter Pattern (`getBaseProps()`)       | Compose React Aria **Components** primitives      |
| A `use<Name>.ts` logic layer per component    | No hook unless the logic earns one                |
| `forwardRef` + `displayName` everywhere       | React 19 — `ref` is an ordinary prop              |
| `classNames={{base, label}}` slot bag         | `data-slot` attributes + BEM classes              |
| `tv()` holds the Tailwind classes             | `tv()` emits BEM names; CSS holds the Tailwind    |
| `cn` hand-built from `clsx` + `tailwind-merge`| `cn` / `cx` from `tailwind-variants`              |
| Floating UI for popovers/tooltips/menus       | the React Aria `Popover` primitive                |
| `as` prop for polymorphism                    | a `render` prop                                   |
| `react-i18next` for component strings         | React Aria i18n                                   |
| An "assembled" wrapper beside compound parts  | No such layer — the namespace **is** the Root     |
| `date-fns` for component internals            | `@internationalized/date`                         |

**Verify, don't recall.** HeroUI v3 is vendored read-only at `heroui/`. When you are unsure what a
pattern looks like, read it: `heroui/packages/react/src/components/<name>/`,
`heroui/packages/styles/src/components/<name>/`. One file read beats a confident memory.

**Where PeakUI differs on purpose.** Some differences from the reference are decisions, not drift, and
reading the reference will tempt you to "fix" them back. They are written down with their reasons —
check there before you change one:

- `docs/superpowers/specs/2026-10-02-react-package-button-design.md`, section 12 — the build tool
  (`tsdown` unbundle, not rollup), the absent vitest browser tier, the `--color-` token prefix, the
  missing ButtonGroup hook points in `Button`, and the two reaffirmed below.
- `docs/superpowers/specs/2026-10-02-composition-contract-design.md`, section 3 — utilities stay
  CSS-native instead of being exported as JS strings.
- `docs/superpowers/specs/2026-10-01-design-tokens-design.md` — `forced-colors` support, which the
  reference has none of.

The three rules in this file that were corrected *toward* the reference — hardcoded assistive strings,
the `any` boundary, test location — each carry their reason where they are stated.

## Philosophy: compose the primitive, don't rebuild it

React Aria Components (RAC) already owns behavior, state, focus, keyboard and ARIA. A PeakUI
component is a **thin, styled, named composition** over a RAC primitive.

- **Add styling and naming. Add nothing that RAC already provides.** Re-deriving `aria-*`, focus
  rings, dismiss handling or positioning by hand is a defect, not thoroughness.
- **Reach down only when RAC has no primitive.** Then use `react-aria` / `react-stately` hooks
  directly, and say why in a comment.
- **The component is the file.** One `.tsx` holds the context and every part. Splitting a component
  across a dozen files is the v2 habit this standard exists to stop.

## Tech Stack

| Purpose             | Library                                                              |
| ------------------- | -------------------------------------------------------------------- |
| Framework           | React 19+ (`ref` as prop, `use()`, no `forwardRef`)                  |
| Behavior + a11y     | `react-aria-components` — primary                                    |
| Behavior (fallback) | `react-aria` / `react-stately` hooks — only where RAC has no primitive |
| Styling             | `tailwind-variants` → BEM class names; Tailwind v4 CSS in `@peakui/styles` |
| Class composition   | `cn` / `cx` from `tailwind-variants` (`tailwind-merge` is its peer)   |
| Dates               | `@internationalized/date`                                            |
| i18n                | React Aria i18n (`useLocalizedStringFormatter`, `I18nProvider`)       |
| Tables              | `@tanstack/react-table`, `@tanstack/react-virtual`                    |
| Charts              | Recharts                                                             |
| Testing             | `vitest` + `@testing-library/react`; Playwright for the browser tier  |

**The library does no data fetching.** No `fetch`, no `axios`, no TanStack Query inside
`@peakui/react`. A component receives data through props. Loading and error *states* are props too.

## File Structure

Files are **kebab-case**, matching the BEM block and the CSS file, so `button.tsx` ↔ `button.css` ↔
`.button--primary` line up by name.

```
packages/react/src/components/<component-name>/
├── <component-name>.tsx          # "use client"; context + every part; types inline
├── <component-name>.stories.tsx  # title: "Components/<Name>"
└── index.ts                      # the three-section export contract

packages/react/tests/components/<component-name>/
├── <component-name>.test.tsx     # jsdom behaviour suite
└── <component-name>.ssr.test.tsx # SSR smoke — risk-based, not universal

packages/styles/src/components/<component-name>/
├── <component-name>.styles.ts    # tv() → BEM class names ONLY
└── index.ts

packages/styles/components/<component-name>.css   # the real Tailwind / CSS
```

### The foundation components assume

Every component imports these. They are part of the library's floor, not of any one component — if
they do not exist yet, creating them is the first task, not an improvisation inside a component.

| Module                                   | Exports                                          |
| ---------------------------------------- | ------------------------------------------------ |
| `packages/react/src/utils/compose.ts`    | `composeTwRenderProps`, `composeSlotClassName`    |
| `packages/react/src/utils/assertion.ts`  | `dataAttr` (and `Booleanish`)                      |
| `packages/react/src/utils/dom.tsx`       | `dom.*` — the `render`-prop element helper         |
| `packages/react/src/hooks/`              | cross-component hooks (`use-media-query`, …)      |

Both packages need `sideEffects: false`, and a new component must be registered in the
`@peakui/react` barrel and the styles CSS entry. **Never invent a local copy of one of these helpers
inside a component** — import it, or add it to the shared module.

Tests live under `packages/react/tests/`, mirroring the component path; **stories stay beside the
component**. This is the reference's own split, and it is why the package needs a `@/*` path alias
resolving to `./src/*` and `include: ["src", "tests"]` in its `tsconfig.json` — a test addresses the
component as `@/components/<component-name>`. `packages/styles` keeps its tests beside its source;
the two packages differ here by decision, not by accident.

Mandatory: the `.tsx`, the stories, the jsdom test, `index.ts`, the `.styles.ts`, the `.css`.
A separate `<component-name>.types.ts` is **not** created by default — types live beside the parts
that use them. Split a file out only when it genuinely earns it (a very large collection component,
or a type shared by several components). Browser tests live in `apps/storybook/e2e/`.

## The Export Contract

Every component's `index.ts` has the same three sections — leaf components included, no exceptions.
This is what makes both call styles work from one set of parts.

```typescript
/* ---------- Compound Component ---------- */
export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Popover: SelectPopover,
});

export type Select = {               // same name as the const: legal, gives dotted types
  Props: ComponentProps<typeof SelectRoot>;
  RootProps: ComponentProps<typeof SelectRoot>;
  TriggerProps: ComponentProps<typeof SelectTrigger>;
};

/* ---------- Named Component ---------- */
export {SelectRoot, SelectTrigger, SelectPopover};
export type {
  SelectRootProps,
  SelectRootProps as SelectProps,   // ergonomic alias
  SelectTriggerProps,
} from "./select";

/* ---------- Variants ---------- */
export {selectVariants} from "@peakui/styles";
export type {SelectVariants} from "@peakui/styles";
```

Rules:

- **`Object.assign` onto the Root.** `Select` **is** `SelectRoot` with statics attached — not a
  wrapper. `<Select>`, `<Select.Root>` and `<SelectRoot>` are the same component.
- **There is no assembled form.** Convenience lives as *defaults inside the parts* — a part
  defaulting `placement="bottom"`, or reading its parent's context for `size`. Never as an extra
  component that renders the other parts for you.
- **One set of parts.** Parts are declared under flat names; the namespace references those same
  identifiers. Both export lists sit in the same file and name the same members.
- **`sideEffects: false`** in `package.json` is required — without it `Object.assign` defeats
  tree-shaking and the flat exports stop paying for themselves.
- A leaf still ships the full shape: `Object.assign(ChipRoot, {Root: ChipRoot})`.

## The Rules You Hold In Your Head

### React 19

- `ref` is an ordinary prop. Type props with `ComponentPropsWithRef<typeof Primitive>`.
  **No `forwardRef`.**
- `use(Context)` instead of `useContext(Context)`.
- `"use client"` at the top of every component `.tsx` — these are client components.

### Styling — two layers, and only one of them is TypeScript

`tv()` maps variants to **BEM class names**. It contains no Tailwind utilities.

```typescript
// packages/styles/src/components/chip/chip.styles.ts
export const chipVariants = tv({
  base: "chip",
  variants: {
    size: {sm: "chip--sm", md: "chip--md", lg: "chip--lg"},
    variant: {solid: "chip--solid", outline: "chip--outline", soft: "chip--soft"},
  },
  defaultVariants: {size: "md", variant: "solid"},
});
```

The Tailwind lives in `chip.css` behind those names, with per-component CSS custom properties as the
theming seam (`--chip-bg`, `--chip-fg`). Full pattern: `references/styling.md`.

- **Every rendered element carries `data-slot="<component>-<part>"`.** That is the public contract
  for both styling and test queries. The attribute goes **after** the props spread — a consumer
  cannot clobber the contract attribute by accident. (Decided at the wave-1 review: the reference
  is inconsistent here, so this is PeakUI's own rule, not ported.)
- **State is styled through `data-*`** (`data-disabled`, `data-focus-visible`), never `is-*` classes.
- Compose with `composeTwRenderProps` / `composeSlotClassName`, never a hand-built `cn`.

### TypeScript

- No `any` — `unknown` plus narrowing, or generics. One scoped exception: the polymorphic spread
  boundary of a component taking `render` through `DOMRenderProps`, where the element type is a
  type parameter the spread erases. It carries a comment and an inline
  `eslint-disable-next-line @typescript-eslint/no-explicit-any`; the lint rule itself stays at
  `"error"`, which is what keeps the exception one line wide. `references/typescript.md`.
- `import type {...}` for types; named exports only.
- Literal unions (`'sm' | 'md' | 'lg'`), never bare `string`.
- Polymorphism is a **`render` prop**, not an `as` prop: the consumer must return the expected
  element type, a single root, and pass the ref through. See `references/typescript.md`.

### Compound structure

Context + Root + Parts in one file. Split the context by concern when parts would otherwise
re-render on unrelated changes. The Root carries the parts' **contract** (state, control, aria);
convenience belongs in a part's defaults or its own part — never bolted onto the Root.
Full pattern and the feature-routing table: `references/compound-components.md`.

## Forbidden Patterns

```typescript
// ❌ forwardRef — React 19 passes ref as a prop
export const Chip = forwardRef<ChipRef, ChipProps>((props, ref) => …);

// ❌ Props getters — RAC already owns these props
const getBaseProps = useCallback(() => ({"aria-expanded": isOpen, …}), [isOpen]);

// ❌ A classNames slot bag
<Chip classNames={{base: "…", label: "…"}} />

// ❌ Hand-built class merger
import {clsx} from "clsx"; import {twMerge} from "tailwind-merge";

// ❌ Floating UI anywhere — RAC owns positioning
import {useFloating, FloatingPortal} from "@floating-ui/react";

// ❌ Tailwind utilities inside tv() — they belong in the .css
export const chipVariants = tv({base: "inline-flex px-2 py-1 rounded-full"});

// ❌ Hardcoded Tailwind in JSX
<span className="px-4 py-2 bg-blue-500" />

// ❌ The container's radius reused on a nested element — the arcs lose a common centre
.card { border-radius: var(--radius-xl); }
.card__media { border-radius: var(--radius-xl); }   // use @apply concentric-inner

// ❌ Data fetching in a UI library
useEffect(() => { fetch("/api/items"); }, []);

// ❌ A hook per component, by regulation, with nothing in it
export const useChip = (props: ChipProps) => ({getRootProps: () => props});

// ❌ An assembled wrapper that renders the other parts for the consumer
const ChipBase = (props) => <ChipRoot><ChipLabel/><ChipDismiss/></ChipRoot>;

// ❌ Conditional hooks
const state = isRange ? useRangeCalendarState(o) : useCalendarState(o);

// ❌ useEffect + setState for a derived value — use useMemo
useEffect(() => { setLabel(compute(a, b)); }, [a, b]);

// ❌ Global useWindowSize() to observe one element — use ResizeObserver
// ❌ any (outside the DOMRenderProps spread); mutating props; eval
```

## Accessibility Floor

**WCAG 2.2 AA** — not 2.1. The criteria added in 2.2 are component-level, which makes them ours:
target size ≥ 24×24 CSS px, focus never obscured, a non-dragging alternative to any drag, consistent
help placement, no redundant entry. Plus: `forced-colors` support, `prefers-reduced-motion`
honoured, visible focus on every interactive element, contrast ≥ 4.5:1 for text.
Matrix and worked patterns: `references/accessibility-and-i18n.md`.

## Component Status Lifecycle

`alpha` — new, breaking changes possible · `beta` — API stable, compatibility kept ·
`stable` — production-ready, tested and documented.

Public API changes are **additive only**, and any breaking change ships a codemod in
`packages/codemodes` in the same PR: `references/api-evolution.md`.

## Reference Map

| Topic                                                                           | Reference                               |
| ------------------------------------------------------------------------------- | --------------------------------------- |
| RAC composition, context + Root + parts, React 19 idioms, `"use client"` / RSC   | `references/architecture.md`            |
| RAC primitive map, deep imports, render props, when to drop to raw hooks         | `references/react-aria-components.md`   |
| Compound structure, feature routing, context splitting, anti-patterns           | `references/compound-components.md`     |
| tv → BEM, the CSS layer, `data-slot`, CSS custom properties, Tailwind v4 tokens  | `references/styling.md`                 |
| Authoring the `.css`: default-size pattern, dual state forms, `@apply`, nesting, animation | `references/css-authoring.md`  |
| Types, `render`-prop polymorphism, generic parts, ref typing                     | `references/typescript.md`              |
| WCAG 2.2, `forced-colors`, reduced motion, aria matrix, React Aria i18n          | `references/accessibility-and-i18n.md`  |
| Test tiers, query rules, what never to assert, VRT                              | `references/testing.md`                 |
| Naming, import order, memoization, bundle and package hygiene                    | `references/code-quality.md`            |
| Additive-only API, deprecation, codemod protocol                                 | `references/api-evolution.md`            |
| Container queries, `@starting-style`, popover/anchor, `field-sizing` — opt-in     | `references/modern-css.md`              |
| What each component ships for AI consumers (`llms.txt`, MCP, docs contract)      | `references/agent-readiness.md`         |

## Pre-Review Checklist

- [ ] Built by composing a RAC primitive; nothing RAC provides is re-derived by hand
- [ ] `"use client"` present; no `forwardRef`; `use()` not `useContext()`
- [ ] Component is one `.tsx` (+ stories, tests, `index.ts`) — no per-component hook/types/parts sprawl
- [ ] A hook exists only if it carries real or reused logic
- [ ] `index.ts` has all three sections; namespace is `Object.assign` onto the Root; no assembled wrapper
- [ ] `sideEffects: false` holds for the package
- [ ] `tv()` emits BEM names only; every Tailwind utility is in the `.css`
- [ ] `data-slot` on every rendered element, placed after the props spread; states via `data-*`, not `is-*`
- [ ] Base class carries the default (`md`) size; the `--md` modifier exists but is empty
- [ ] Every interactive state written in both forms — pseudo-class **and** `data-*` — so the standalone CSS works without React
- [ ] Per-component CSS custom properties exposed for theming
- [ ] Nested elements use `concentric-inner`, never the container's own radius
- [ ] Gaps within a group are smaller than gaps between groups, and the container's padding is at least the largest inner gap
- [ ] No `classNames` prop; no `clsx`/`tailwind-merge` import; no `floating-ui`
- [ ] No `any` outside the `DOMRenderProps` spread boundary, and that one commented and lint-disabled inline; literal unions; `import type`; polymorphism via `render`
- [ ] WCAG 2.2 AA: target size, focus not obscured, visible focus, contrast; `forced-colors` handled; reduced motion honoured
- [ ] A string the component generates itself has a hardcoded **English** default at most, and a
      consumer-supplied label overrides it — the props spread comes *after* the `aria-label`.
      The formatter with a `ru-RU` entry arrives when a component owns many strings:
      `references/accessibility-and-i18n.md`
- [ ] Tests: jsdom behaviour suite queried by role/label/text; no assertions on colors, full class lists or RAC internals
- [ ] Stories titled `Components/<Name>`
- [ ] Derived values via `useMemo`; element size via `ResizeObserver`
- [ ] Public API additive only; any break ships a codemod in the same PR
- [ ] Agent-facing contract updated (`references/agent-readiness.md`)

Report violations as a numbered list citing file and broken rule.
