# `Surface` — the layout hub component (roadmap entry 1)

`Surface` is the first component of the roadmap's wave 1 and the one thirteen later components
(`popover`, `card`, `modal`, `drawer`, `dropdown`, `accordion`, `alert`, `autocomplete`,
`combo-box`, `date-picker`, `date-range-picker`, `select`, `color-picker`) import. This spec fixes
its public API before implementation, per the roadmap's risk note: a wrong API here is expensive
to undo.

## Task

Port the reference's `surface` component 1:1 into `@peakui/react`, through all five pipeline
stages (stage 5 is switched off), plus the P1 sixth stage: migrate the hand-written
`bg-surface` / `shadow-surface` sites in `apps/docs` to `<Surface>`.

**Posture (human directive, 2026-10-04): components are maximally similar to the vendored
reference.** For `Surface` that means the reference's API is copied, not redesigned: same variant
set, same context, same export contract, same BEM classes, same CSS. PeakUI diverges only where a
decision is already recorded — and for `Surface` every needed divergence (tokens, test location,
English docs) exists and costs the port nothing.

## The reference, measured

`heroui/packages/react/src/components/surface/` (read-only):

- `SurfaceRoot<E extends keyof React.JSX.IntrinsicElements = "div">` — polymorphism through
  `DOMRenderProps<E, undefined>` and the `dom.div` render-prop helper. **It wraps no React Aria
  primitive**: a surface is layout, not behaviour.
- Props: `children: ReactNode` (required), `className?: string`,
  `variant?: "default" | "secondary" | "tertiary" | "transparent"`, `@default "default"`.
- `SurfaceContext` — `createContext<{variant?: SurfaceVariants["variant"]}>`, **exported from the
  package**. Consumers (`card.tsx:62`, `accordion.tsx:64` in the reference) *provide* it to
  declare the ambient surface level; nested controls read it to re-base their fills.
- `data-slot="surface"`; `{...(rest as any)}` at the spread boundary — exactly PeakUI's one
  documented `any` exception (commented and lint-disabled inline).
- Styles: `tv()` base `"surface"`, one `variant` axis with `surface--default`,
  `surface--secondary`, `surface--tertiary`, `surface--transparent`. CSS: `.surface` is
  `relative text-foreground`; each level modifier applies `bg-surface{,-secondary,-tertiary}`
  plus its matching `text-surface{,…}-foreground`; `--transparent` is `bg-transparent` only.
  **No shadow in the block**: `--surface-shadow` / `shadow-surface` stays a consumer utility.
- `index.ts`: the three-section export contract (namespace `Surface = Object.assign(SurfaceRoot,
  {Root})`, named `SurfaceRoot` + `SurfaceProps` alias, variants re-export) **plus a fourth
  Context section** exporting `SurfaceContext`. A leaf with a context, not an assembled wrapper.

## What PeakUI already has

- Tokens: `--surface`, `--surface-foreground`, `--surface-secondary(-foreground)`,
  `--surface-tertiary(-foreground)`, `--surface-hover`, `--surface-shadow` — both schemes, with
  forced-colors mappings (`Canvas`). Tailwind mappings `--color-surface*` in
  `packages/styles/themes/shared/theme.css`. **No new token is needed.**
- The `on-surface-*` family (nine tokens, `2026-10-03-on-surface-tokens-design.md`) exists ahead
  of its first consumer. Nothing in this spec consumes it yet — that arrives with the first
  component that nests a control on a surface level and is its own design decision then.
- `packages/react/src/utils/dom.tsx` already ships `DOMRenderProps` and the `dom` proxy.

## Decisions

1. **API = the reference's, verbatim.** Variant values, defaults, context shape, export
   sections, `data-slot`, class names, CSS rules — copied. Rationale: the directive; and the 13
   dependents were scheduled against the reference's shape.
2. **Context, not `data-surface`.** The ambient-level mechanism is `SurfaceContext` because that
   is the reference's. A CSS-native `data-surface` attribute would be a divergence with no
   consumer yet; deferred with the `on-surface` family's first consumer.
3. **No RAC primitive.** `dom.div` with the `render` prop, as the reference.
4. **Sixth-stage sites (spec drift recorded).** The roadmap named
   `apps/docs/src/components/component-preview-container.tsx`; that file was refactored since and
   no longer carries the classes. The debt lives at:
   - `apps/docs/src/mdx-components.tsx:43` — the block wrapper
     `cn("bg-surface text-surface-foreground shadow-surface", className)` → `<Surface>` with the
     shadow kept consumer-side (the block keeps `shadow-surface` in its own class list).
   - `apps/docs/src/components/demo/index.tsx:22` — the home-page showcase card
     `rounded-3xl bg-surface p-5 … shadow-surface` → `<Surface>` (shadow stays consumer-side).
   - `apps/docs/src/components/fumadocs/layouts/notebook/page/client.tsx:285` uses
     `bg-surface-secondary` in a hover string — **left alone**: it is a hover state inside a
     fumadocs layout, not a surface container; migrating it is not this entry's debt.
5. **Docs page category:** `Layout`, route group `(layout)/surface` — the first Layout component;
   the components index gains the category with it.

## Definition of done

1. `packages/react/src/components/surface/` + `@peakui/styles` entry, scaffolded via
   `pnpm add:component Surface --category layout` (no RAC primitive flag).
2. `surface.stories.tsx` beside the component — adapted from the reference's stories.
3. `packages/react/tests/components/surface/surface.test.tsx` (jsdom: render + variant modifiers
   via `data-slot`/class semantics, context provision, render-prop polymorphism, props spread)
   and `surface.ssr.test.tsx` via `ssrSmoke()`. No Playwright spec — no overlay, no portal.
4. Docs page + demos per `peakui-docs`; registered via `pnpm registries`; the
   `component-groups.ts` entry (Layout) is applied by the orchestrator at wave join.
5. Sixth stage: the two `apps/docs` sites above migrated, with the docs typecheck/test green.

## Out of scope

- The `on-surface-*` family's first consumption, and any `data-surface` CSS hook.
- Shadows on the block itself; `--surface-shadow` stays consumer-side.
- The notebook layout's `bg-surface-secondary` hover string.
- `apps/docs/src/lib/component-groups.ts` (orchestrator applies at wave join).

## Risks

- **Context export becomes load-bearing.** The 13 dependents provide/read `SurfaceContext`; its
  type must stay `{variant?: SurfaceVariants["variant"]}` exactly. Test pins the provided value.
- **The transparent variant inherits `text-foreground`** from the base, not a level foreground —
  a port that "fixes" this to `text-surface-foreground` would diverge silently. Test pins the
  class set per variant.
- **Generic spread boundary** — the one `any`, commented and inline-disabled, keeps the lint rule
  at `error`; a reviewer re-checks it stays one line wide.
