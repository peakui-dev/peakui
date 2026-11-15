# @peakui/react

Accessible React components with styles you can read. Behavior comes from
[React Aria Components](https://react-aria.adobe.com/); the styles are plain CSS in
[`@peakui/styles`](https://www.npmjs.com/package/@peakui/styles) — no provider, no styling
runtime, theming through CSS custom properties.

Needs React 19 and Tailwind CSS v4.

## Install

```bash
npm install @peakui/react @peakui/styles
```

npm (7 or later), pnpm and Bun install peer dependencies automatically. With Yarn, add
`react-aria-components` and `@react-aria/utils` yourself.

Import the styles in your main CSS file:

```css
@import "tailwindcss";
@import "@peakui/styles";
```

The order matters: `@peakui/styles` extends Tailwind and does not import it.

## Example

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

## Documentation

- [Quick start](https://peakui.dev/docs/react/getting-started/quick-start)
- [All components](https://peakui.dev/docs/react/components) — 50 components across 10 categories
- [Theming](https://peakui.dev/docs/react/getting-started/theming)

Apache License 2.0.
