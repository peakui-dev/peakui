# Component Page Template

Path: `apps/docs/content/docs/en/react/components/(category)/<component-name>.mdx`. Follow it
exactly; lines marked `{/* … */}` are instructions, not page content.

````mdx
---
title: ComponentName
description: Brief one-line description, 10 words or fewer
links:
  rac: ComponentName {/* only when the root wraps a React Aria component */}
  source: component-name/component-name.tsx
  styles: component-name.css
---

## Usage

```tsx
import {ComponentName} from "@peakui/react";
```

<ComponentPreview name="component-name-basic" />

### Anatomy {/* ONLY for compound components */}

```tsx
import {ComponentName} from "@peakui/react";

export default () => (
  <ComponentName>
    <ComponentName.Part>
      <ComponentName.SubPart />
    </ComponentName.Part>
  </ComponentName>
);
```

## Examples

### Variants

<ComponentPreview name="component-name-variants" />

### Sizes

<ComponentPreview name="component-name-sizes" />

### Feature Name {/* one per story: With Icons, Loading, Controlled… */}

<ComponentPreview name="component-name-feature" />

### Disabled State

<ComponentPreview name="component-name-disabled" />

### Adding Custom Variants {/* optional — only if relevant */}

<ComponentPreview name="component-name-custom-variants" />

## Customization

### Tailwind CSS

```tsx
<ComponentName className="custom-tailwind-classes">Content</ComponentName>
```

### Global CSS

```css
@layer components {
  .component-name {
    @apply custom-styles;
  }

  .component-name--modifier {
    --component-name-bg: var(--color-success);
  }
}
```

## Styling Reference

PeakUI follows the [BEM](https://getbem.com/) methodology, so variants and states are plain class names you can target.

### CSS Classes

The ComponentName component uses these CSS classes ([view source styles](https://github.com/peakui-dev/peakui/blob/main/packages/styles/components/component-name.css)):

#### Base & Size Classes [!toc]

- `.component-name` - Base component styles
- `.component-name--sm` - Small size
- `.component-name--md` - Medium size
- `.component-name--lg` - Large size

#### Variant Classes [!toc]

- `.component-name--primary`
- `.component-name--secondary`

#### Element Classes [!toc] {/* compound components */}

- `.component-name__part`

#### Modifier Classes [!toc] {/* if applicable */}

- `.component-name--modifier`

### Slots

- `[data-slot="component-name"]`
- `[data-slot="component-name-part"]`

### CSS Variables {/* only when the CSS file defines --component-name-* */}

| Variable | Purpose |
|----------|---------|
| `--component-name-bg` | Background color |

### Interactive States {/* only the states the CSS file styles */}

The component supports both CSS pseudo-classes and data attributes:

- **Hover**: `:hover` or `[data-hovered]`
- **Pressed**: `:active` or `[data-pressed]`
- **Focus**: `:focus-visible` or `[data-focus-visible]`
- **Disabled**: `:disabled`, `[data-disabled]` or `[aria-disabled="true"]`

## API Reference

### ComponentName

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `type` | `default` | Description |

### ComponentName.Part {/* one table per compound part */}

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `propName` | `type` | `default` | Description |

### Render Props {/* only if a part accepts function children or className */}

| Prop | Type | Description |
|------|------|-------------|
| `propName` | `type` | Description |
````

## Guides and migration guides

Guides live under `apps/docs/content/docs/en/react/getting-started/`. The same writing rules
apply: no introduction, one sentence then code, bullets for unordered information, numbers for
sequential steps. A setup guide always requires Tailwind CSS v4 — it is not optional — and shows
the CSS entry exactly as:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
```

A migration guide marks each breaking change with a before/after code pair.
