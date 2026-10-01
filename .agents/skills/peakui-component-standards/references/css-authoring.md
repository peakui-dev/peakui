# Writing a Component's CSS

How to author `packages/styles/components/<component-name>.css` — the layer that holds every
Tailwind utility. What goes in the `tv()` recipe, the `data-slot` contract and the token rules is in
`styling.md`; this file is about the CSS file itself.

## Two file-level patterns

These two are easy to get wrong and cheap to check, so they are reviewed on every component.

### The default size lives in the base class

The base class carries the default (`md`) dimensions. The `--md` modifier exists but is **empty**.

```css
.chip {
  @apply inline-flex h-7 items-center px-2.5 text-sm;   /* the md defaults */
}

.chip--sm { @apply h-6 px-2 text-xs; }

.chip--md {
  /* No styles as this is the default size */
}

.chip--lg { @apply h-8 px-3 text-base; }
```

Why: one source of truth for the default. A component rendered with no `size` prop and one rendered
with `size="md"` must be byte-identical, and duplicating the md values in both places guarantees they
drift. Keep the empty `--md` rule with its comment — deleting it makes the next author think the
modifier was forgotten.

Touch targets: a control's base height accounts for pointer vs touch, which is how WCAG 2.2 target
size is met without a special case — `@apply h-10 md:h-9` is 40px where input is coarse and 36px
where it is fine. See `accessibility-and-i18n.md`.

### Interactive states carry both forms

Every interactive state is written as the pseudo-class **and** the `data-*` attribute.

```css
.chip__dismiss {
  &:hover,
  &[data-hovered] {
    background-color: var(--chip-dismiss-bg-hover);
  }

  &:active,
  &[data-pressed] {
    background-color: var(--chip-dismiss-bg-pressed);
  }

  &:focus-visible,
  &[data-focus-visible] {
    @apply status-focused;
  }

  &:disabled,
  &[aria-disabled="true"],
  &[data-disabled] {
    @apply pointer-events-none;
    opacity: var(--disabled-opacity);
    cursor: var(--cursor-disabled);
  }
}
```

Why both: `data-hovered` and friends are set by React Aria **at runtime**. The stylesheet also ships
as a standalone artifact for consumers who are not on React (`styling.md`), and for them only the
pseudo-classes exist. A `data-*`-only rule means that consumer gets no hover and no disabled state at
all. This is still not a licence for `is-*` classes — those are forbidden either way.

## Concentric nesting

A nested element inside a rounded container needs **its own** radius. Reuse the container's and the
arcs lose a common centre: the diagonal gap goes uneven and the corner reads as pinched.

```
R_inner = max(0, R_outer − padding − border)
```

Use the utility pair; do not hand-roll the arithmetic.

```css
.card {
  @apply concentric-host;
  --concentric-radius: var(--radius-xl);
  --concentric-pad-inline: calc(var(--spacing) * 4);
}

.card__media {
  @apply concentric-inner;
}
```

Two decisions inside the utility worth knowing:

- **One radius, not per-axis — deliberately against the geometry.** Strictly, with
  `padding-inline ≠ padding-block` no circular radius is concentric: for the arcs to share a centre
  the semi-axes must be `R − pad-inline` and `R − pad-block`, i.e. an *ellipse*. We don't do that,
  because **Figma cannot express an elliptical corner** — one value per corner is all it has. Any
  handoff therefore specifies a scalar, and emitting an ellipse would put the implementation
  permanently at odds with the design source. No major system (Material, Spectrum, Polaris, Carbon,
  Tokens Studio) computes per-axis either.
- **With unequal padding, the larger inset wins.** Deriving from the smaller one would give a radius
  bigger than the space on the tight axis, pushing the inner arc toward the outer one — which is the
  original defect. The larger inset makes the corner marginally squarer and is always safe.
  Verified in-engine: `pad-inline: 8px; pad-block: 16px` on a 24px container computes `8px`, as does
  the reverse ordering.
- **It belongs in CSS, not in a build-time token.** Padding is often responsive (container queries),
  and a baked number stops being concentric the moment the padding changes.

The rule is platform-level, not taste: iOS 26 ships `ConcentricRectangle` with the same zero-clamping
semantics when the inset exceeds the container's radius.

## Spacing hierarchy

Proximity is what groups things, so the gaps inside a group must be smaller than the gaps between
groups:

```
gap(within a group) < gap(between groups) ≤ container padding
```

A card's own padding is at least its largest inner gap — otherwise the group reads as touching its
edge rather than as a unit. Express gaps with `gap` on a flex/grid container, never with margins on
children, so the hierarchy stays readable in one place.

## Tailwind v4 mechanics

### `@apply` versus plain CSS

`@apply` for properties with a direct utility. Plain CSS for everything else — tokens, `color-mix()`,
`calc()`, custom properties, multi-part `transition`.

```css
.link {
  @apply underline-offset-4 hover:underline;

  color: var(--color-link);
  text-decoration-color: color-mix(in oklab, var(--color-link) 50%, transparent);
  cursor: var(--cursor-interactive);
}
```

Group related utilities into one `@apply` instead of splitting them line by line. A **second**
`@apply` in the same rule is correct when plain CSS must sit between them for ordering reasons — the
reduced-motion case in `styling.md` is exactly that, and it is why "one `@apply` per rule" is not a
real rule.

### Native nesting

v4 nests natively — no plugin. Nest states and children with `&`.

```css
.card {
  @apply bg-surface text-surface-foreground rounded-xl;

  & > .card__header { @apply flex items-center justify-between; }

  &:has(.card__footer) { padding-block-end: 0; }
}
```

### `:where()` for specificity control

`:where()` contributes zero specificity, so a consumer's single class can still override.

```css
/* A consumer's .my-avatar wins over this */
.avatar-group :where(.avatar) {
  @apply overflow-hidden rounded-full;
}
```

Use it for structural descendant rules. Do not use it for a component's own modifiers — those should
win.

### Enter and exit animation

RAC sets `data-entering` / `data-exiting`. Animate with `tw-animate-css`.

```css
.popover[data-entering] { @apply animate-in fade-in-0 zoom-in-95 duration-200 ease-out; }
.popover[data-exiting]  { @apply animate-out fade-out-0 zoom-out-95 duration-150 ease-in; }

/* Placement-aware entry */
.popover[data-entering][data-placement="top"] { @apply slide-in-from-bottom-1; }
```

Keep the motion non-essential — see the reduced-motion rule in `accessibility-and-i18n.md`.

### Arbitrary values and `@property`

```css
.spinner { @apply duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]; }
```

Reach for an arbitrary value only when the token scale genuinely has no entry; if you need it twice,
it wants to be a token. Register an animatable custom property with `@property` when you transition
it, otherwise it jumps instead of animating.

### Forced colors and print

A central `@media (forced-colors: active)` block in the theme already remaps the token roles to
system colours, so a component only handles its **structural** part — keeping a boundary present.

```css
.chip {
  border: 1px solid transparent;   /* held in the normal state so nothing shifts */

  @media (forced-colors: active) {
    border-color: ButtonBorder;
  }
}
```

## Common mistakes

| Mistake                                                        | Fix                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| Tailwind utilities inside `tv()`                               | They belong here, in the `.css` — `styling.md`         |
| `--md` carrying values while the base has none                 | Move the md values to the base; empty the modifier    |
| State written only as `data-*`                                 | Add the pseudo-class form                             |
| A raw hex, `rgb()` or a numbered token (`accent-9`)            | Reference a semantic token                            |
| `motion-reduce` declared before the `transition`               | After it — specificity, see `styling.md`              |
| `@apply` split across five consecutive lines                   | One grouped `@apply`                                  |
| `:where()` around a component's own modifier                   | Let modifiers keep their specificity                  |
| Hand-written `color-mix()` for a theme colour                  | Derived tokens come from the theme, not the component |
| The container's radius reused on a nested element              | `@apply concentric-inner` — see Concentric nesting    |
| `R_inner` arithmetic written out by hand in a component        | Use the utility pair; it handles both axes and the clamp |
| Inner gaps ≥ gaps between groups                              | Tighten the inner gaps — proximity is what groups      |
