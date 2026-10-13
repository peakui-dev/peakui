<p align="center">
  <a href="https://peakui.dev">
    <img alt="PeakUI" width="100%" src="https://peakui.dev/og/peakui-banner.png">
  </a>
</p>

<h3 align="center">Accessible React components with styles you can read</h3>

<p align="center">
  Accessible React components: behavior from React Aria, styles that are plain CSS you can read,
  theming with CSS variables. No provider, no styling runtime.
  <br />
  <a href="https://peakui.dev/docs/react/getting-started/quick-start"><strong>Quick start</strong></a>
  ·
  <a href="https://peakui.dev/docs/react/components"><strong>50 components</strong></a>
  ·
  <a href="https://peakui.dev/llms.txt"><strong>Built for AI agents</strong></a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@peakui/react"><img src="https://img.shields.io/npm/v/@peakui/react.svg?style=flat-round" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@peakui/react"><img src="https://img.shields.io/npm/dm/@peakui/react.svg?style=flat-round" alt="npm downloads"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg?style=flat-round" alt="License: Apache-2.0"></a>
</p>

## Why PeakUI?

PeakUI is a React component library: 50 accessible components whose behavior comes from
[React Aria Components](https://react-aria.adobe.com/) and whose styles are plain CSS on top of
[Tailwind CSS v4](https://tailwindcss.com/). It fits any React 19 product — a SaaS, a dashboard,
an internal tool, a storefront — and takes on your design language instead of imposing its own.

- **Accessible behavior** — focus management, keyboard interaction and ARIA wiring come from React
  Aria Components. The accessibility floor is WCAG 2.2 AA, including `forced-colors` mode.
- **Styles you can read** — every component is a [BEM](https://getbem.com/) block in
  `@peakui/styles`. There is no runtime styling and nothing hidden in JavaScript.
- **Adapts to your product, not the other way around** — the theme is a set of CSS custom
  properties, not a theme object behind a provider. Set `--accent`, `--surface` or `--radius` to
  your values — at build time or live at runtime — and every component follows.
- **Dark mode is a class** — both themes ship in the box; put `default-dark` on any element and
  everything inside switches.
- **No provider** — the theme is CSS, so there is nothing to wrap your app in and no setup before
  the first component renders.
- **Compound components** — a component is a root plus named parts, such as `Fieldset.Legend`. You
  compose the parts; the library does not assemble them for you.
- **React 19** — `ref` is an ordinary prop, and every component is a client component.

## Quick start

PeakUI needs [React 19](https://react.dev/) or later and
[Tailwind CSS v4](https://tailwindcss.com/docs/installation).

Install the two packages:

```bash
npm install @peakui/react @peakui/styles
```

npm (7 or later), pnpm and Bun install peer dependencies automatically, so the React Aria
packages arrive with `@peakui/react`. With Yarn, add `react-aria-components` and
`@react-aria/utils` yourself.

Import the styles in your main CSS file:

```css
@import "tailwindcss";
@import "@peakui/styles";
```

> The order matters. `@peakui/styles` extends Tailwind and does not import it. If Tailwind comes
> second, or is missing, the component styles are silently absent.

Render your first component:

```tsx
import {Button, Input, Label, TextField} from "@peakui/react";

export function SignUp() {
  return (
    <form className="flex w-64 flex-col gap-3">
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="jane@example.com" />
      </TextField>
      <Button type="submit">Sign up</Button>
    </form>
  );
}
```

There is no provider to add. The theme lives in CSS.

## Packages

| Package | Purpose |
| --- | --- |
| [`@peakui/react`](https://www.npmjs.com/package/@peakui/react) | The React components. Everything is exported from the package root. |
| [`@peakui/styles`](https://www.npmjs.com/package/@peakui/styles) | The stylesheet, the theme tokens and the variant functions. It has no React dependency. |

## Built for AI-assisted development

PeakUI treats AI coding assistants as first-class readers of its documentation.

| Resource | What it gives the agent |
| --- | --- |
| Agent skill | `npx skills add peakui-dev/peakui --skill peakui-react` — teaches an agent how PeakUI components are composed and styled, and reads each component's documentation page on demand |
| [`llms.txt`](https://peakui.dev/llms.txt) | An index of the whole documentation: one line per page |
| [`llms-components.txt`](https://peakui.dev/llms-components.txt) | Every component page as markdown, concatenated |
| [`llms-patterns.txt`](https://peakui.dev/llms-patterns.txt) | Every guide as markdown, concatenated |
| Per-page markdown | Any page as plain markdown by appending `.md` — for example `peakui.dev/docs/react/components/button.md` |

Works with any assistant that loads agent skills or can read `llms.txt` — Cursor, Claude Code,
Windsurf, and the rest.

## Documentation

- [Quick start](https://peakui.dev/docs/react/getting-started/quick-start) — install the packages
  and render a component
- [All components](https://peakui.dev/docs/react/components) — 50 components across 10 categories
- [Theming](https://peakui.dev/docs/react/getting-started/theming) — the tokens and how to change
  them
- [Styling](https://peakui.dev/docs/react/getting-started/styling) — the ways to restyle a
  component
- [Composition](https://peakui.dev/docs/react/getting-started/composition) — compound parts, the
  `render` prop and variant functions

## Contributing

Contributions are welcome! The repository is a pnpm workspaces monorepo and needs Node 22.18+.

```bash
git clone https://github.com/peakui-dev/peakui.git
cd peakui
pnpm bootstrap
pnpm test
```

## License

PeakUI is released under the [Apache License 2.0](./LICENSE).
