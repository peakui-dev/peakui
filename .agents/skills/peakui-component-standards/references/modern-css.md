# Modern CSS: what is required and what is opt-in

Two lists. The first is part of the standard. The second is allowed as progressive enhancement and
must never be the only way something works.

**Verify support before relying on anything here.** Browser baselines move; check the current status
rather than trusting a version number written in a document. The rule that does not move: if a
feature is absent, the component must still be usable.

## Required

### Container queries — size to the component, not the viewport

A component library's responsiveness belongs to the component's own box. A card in a 320px sidebar and
the same card in a 900px main column are the same component in different containers, and a viewport
media query cannot tell them apart.

```css
.card {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 28rem) {
  .card__header { @apply flex-row items-center; }
}
```

Use a container query wherever you would otherwise have reached for `md:` to change a component's
internal layout. Keep viewport media queries for genuinely page-level decisions.

### `:has()` for parent-dependent styling

Replaces the JS-flag-into-a-class pattern.

```css
.field:has(> .field__error) { --field-border: var(--color-danger); }
.chip:has(.chip__dismiss) { padding-inline-end: 0.25rem; }
```

Prefer a `data-*` attribute when the state is already known in React; use `:has()` when the condition
is purely structural and React would otherwise need to learn about it.

### `color-mix()` and OKLCH for derived colours

```css
.chip--soft { --chip-bg: color-mix(in oklab, var(--color-accent) 12%, transparent); }
```

Derive hover, pressed and soft variants from one token instead of declaring a parallel scale.
Declare colours in `oklch`, but **mix in `oklab`** — it blends more predictably.

### `text-wrap` for text parts

```css
.card__title { text-wrap: balance; }   /* headings: even line lengths */
.card__description { text-wrap: pretty; }  /* body: no orphans */
```

## Opt-in — progressive enhancement only

Each of these must degrade to a working component. Wrap in `@supports` when the fallback is not
automatic.

### `@starting-style` — enter animations without JS

```css
.popover { opacity: 1; transition: opacity 150ms var(--ease-out); }
@starting-style { .popover { opacity: 0; } }
```

If unsupported, the element simply appears. Acceptable. Never put meaning in the animation.

### `light-dark()`

```css
.surface { background: light-dark(var(--color-white), var(--color-eclipse)); }
```

Shortens a theme pair, but our themes are explicit CSS variable sets, so this is a convenience — the
`[data-theme]` definitions remain the source of truth.

### `field-sizing: content`

Auto-growing inputs and textareas without a JS measure loop.

```css
@supports (field-sizing: content) {
  .textarea--auto { field-sizing: content; }
}
```

Without support, fall back to rows or a `ResizeObserver` — not to nothing.

### Native `popover` and CSS anchor positioning

**Do not mix these with RAC overlays.** RAC's `Popover` owns the top layer, focus containment and
dismiss behaviour; adding the native `popover` attribute or `anchor-name` / `position-anchor` on top
of it produces two systems fighting for the same element.

The reference implementation deliberately uses neither: RAC positions in JS, which works everywhere
and keeps focus management in one place. Reach for anchor positioning only in a component RAC does not
cover, and only with a JS fallback.

### `interpolate-size` / `calc-size()`, scroll-driven animations

Animating to `auto`, and `animation-timeline`. Engine support is still uneven — treat as experimental,
behind `@supports`, never load-bearing.

## Anti-patterns

- A visual state that exists **only** in an opt-in feature, so it silently vanishes without support.
- `@container` and a viewport breakpoint controlling the same property — pick one owner.
- Reimplementing `color-mix()` by hand-declaring every tint as a separate token.
- An `@supports` block with no fallback branch.
