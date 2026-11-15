# @peakui/styles

The stylesheet of the PeakUI Design System: every component is a
[BEM](https://getbem.com/) block in plain CSS on top of
[Tailwind CSS v4](https://tailwindcss.com/), plus the theme tokens and the variant functions.
No React dependency, no runtime styling.

Needs Tailwind CSS v4 as a peer.

## Install

```bash
npm install @peakui/styles
```

Import it in your main CSS file:

```css
@import "tailwindcss";
@import "@peakui/styles";
```

The order matters: `@peakui/styles` extends Tailwind and does not import it. If Tailwind comes
second, or is missing, the component styles are silently absent.

## Theming

The theme is a set of CSS custom properties, not a theme object behind a provider. Set
`--accent`, `--surface` or `--radius` to your values — at build time or live at runtime — and
every component follows. Dark mode is a class: `default-dark` on any element switches the
theme of everything inside.

## Documentation

- [Theming](https://peakui.dev/docs/react/getting-started/theming) — the tokens and how to change them
- [Styling](https://peakui.dev/docs/react/getting-started/styling) — the ways to restyle a component

Apache License 2.0.
