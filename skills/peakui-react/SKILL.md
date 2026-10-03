---
name: peakui-react
description: Use when writing or changing React code that imports @peakui/react or @peakui/styles, or when setting up PeakUI styles in an app - buttons, pending or loading buttons, text fields, forms with validation, spinners, a link that must look like a button, changing the HTML element a component renders, or Tailwind classes that are missing from the build.
metadata:
  version: "0.3.0"
---

# PeakUI React

PeakUI components wrap React Aria Components. Their props are React Aria's, not the DOM's, so
habits from plain React compile into code that fails the type-check or quietly misbehaves.

Read first, write second, type-check last. All three, every time.

## 1. Read the docs for the installed version

Take the first of these that exists:

1. `.peakui/docs/` in the project. Read `components/<name>.md` for every component you will use.
   For anything that is not one component - a form, a link styled as a button, a custom variant -
   also read `guides/composition.md` or `guides/styling.md`.
2. No `.peakui/docs/`: run `npx @peakui/cli agents-md`. It creates that folder.
3. That command is unavailable: read the types in
   `node_modules/@peakui/react/dist/components/<name>/` and the variant names in
   `node_modules/@peakui/styles/components/<name>.css`.

The table below is a reminder of the shape, not the reference. Variant names, sizes and the props
of each part come from step 1.

## 2. Write it the PeakUI way

| You need | Write |
| --- | --- |
| A click handler | `onPress` |
| A busy button | `isPending`, with a `<Spinner>` you add next to the label |
| A disabled button | `isDisabled` |
| Content that depends on the button's state | children as a function: `{({isPressed, isPending}) => ...}` |
| A link that looks like a button | `<a className={buttonVariants({variant: "primary"})} href="...">` |
| A required or length-limited field | `isRequired`, `minLength`, `type`, `validate` on `TextField` |
| An error message under a field | `<FieldError />` inside that `TextField` |
| A different HTML element for a part | `render={(props) => <footer {...props} />}` on that part |
| PeakUI styles in a new app | `@import "tailwindcss";` then `@import "@peakui/styles/css";`, in that order |
| Classes from another package missing in the build | `@source "../node_modules/<package>";` in the CSS entry file |

A busy button keeps its label. `isPending` blocks presses by itself; it draws no spinner:

```tsx
import {Button, Spinner} from "@peakui/react";

<Button isPending={publishing} onPress={onPublish}>
  {publishing ? <Spinner aria-hidden color="current" size="sm" /> : null}
  Publish
</Button>
```

A field is a root with sibling parts. The field owns the value, the validation and the wiring
between label, input and message, so the form holds no error state of its own:

```tsx
import {Button, FieldError, Input, Label, TextField} from "@peakui/react";

<form onSubmit={handleSubmit}>
  <TextField isRequired name="name">
    <Label>Name</Label>
    <Input />
    <FieldError />
  </TextField>
  <TextField isRequired minLength={3} name="username">
    <Label>Username</Label>
    <Input />
    <FieldError>
      {({validationDetails}) =>
        validationDetails.valueMissing ? "Choose a username." : "Use at least 3 characters."
      }
    </FieldError>
  </TextField>
  <Button type="submit">Create profile</Button>
</form>
```

`Button` always renders a `<button>`. A real link stays an `<a>` and borrows the classes:

```tsx
import {buttonVariants} from "@peakui/react";

<a className={buttonVariants({variant: "primary"})} href="/dashboard">Open dashboard</a>
```

There is no `as` prop. A part keeps its classes, `data-slot` and ref only when you change its
element through `render` and spread the props it hands you; replacing the part with a plain
element throws all of that away:

```tsx
<Fieldset.Actions render={(props) => <footer {...props} />}>
  <Button type="submit">Save changes</Button>
</Fieldset.Actions>
```

Tailwind v4 reads its configuration from CSS. It does not scan `node_modules`, and it ignores a
`tailwind.config` file with `content` or `safelist`. Point it at a package from the CSS entry file:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
@source "../node_modules/some-package";
```

Examples show the pattern. Labels, text, names and variants come from the request you were given,
not from the example.

## 3. Type-check before you finish

Run the project's own check: its `typecheck` script, or `npx tsc --noEmit`. Run it after every
change, including a one-line change copied from an example: the example compiled in the docs, your
file has not compiled yet.

| Thought | Reality |
| --- | --- |
| "The project does not need a type-check" | It has a `tsconfig.json`. Run `npx tsc --noEmit`. |
| "I copied the documented pattern" | Around different props and imports. Run it. |
| "The types disagree but it works at runtime" | A type error on a PeakUI component is a wrong prop. |

When you touched a CSS file or the setup, also run the build (`npm run build`). A wrong import
path or a missing `@source` passes the type-check and fails, or silently drops styles, in the build.

A type error means go back to step 1 and find the right prop. Never silence it: no `as any`, no
`@ts-ignore`, no hooks from `react-aria` wired onto a PeakUI component by hand. Code that needed a
cast to compile is not finished.
