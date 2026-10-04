---
name: peakui-docs
description: "Use when writing, updating, reviewing or curating PeakUI documentation — a component page under apps/docs/content, its demos in apps/docs/src/demos, the demo registry, a guide or a migration guide. Also use when a page reads verbose, an example may not match the component source, or a new or changed component needs its docs. Keywords: docs, documentation, MDX, Fumadocs, ComponentPreview, demo, frontmatter, links, API Reference, CSS Classes, Anatomy, curate, docs review."
---

# PeakUI Docs

Get to the code immediately. Show, don't tell. Every word that is not code must justify its
existence. A developer understands any section in 3 seconds, or the section is too verbose.

Writing a page and curating one are the same job with the same rules: verify against source,
then make the page match the shapes below. [`page-template.md`](page-template.md) is the full
page skeleton — open it when you write or restructure a page.

## Before you write or review: verify against source

Never assume a component's structure. Every claim on a page is copied from one of these files:

| Read | To learn |
| --- | --- |
| `packages/react/src/components/<name>/<name>.tsx` | Props, defaults, compound parts, `data-slot`s, whether it imports from `react-aria-components` |
| `packages/react/src/components/<name>/index.ts` | The exported name and the namespace parts (`Object.assign`) |
| `packages/react/src/utils/dom.tsx` | The `render` prop's type, `DOMRenderFunction` |
| `packages/react/src/components/<name>/<name>.stories.tsx` | **Primary reference for demos** — the examples that exist and their data |
| `packages/styles/src/components/<name>/<name>.styles.ts` | Variant names, values and defaults |
| `packages/styles/components/<name>.css` | BEM classes, modifiers, `--<name>-*` variables, state selectors |
| `apps/docs/source.config.ts` | The frontmatter schema: `links` has `rac`, `source`, `styles` and nothing else |
| `apps/docs/src/demos/index.ts` | Which demo names are already registered |

- **Compound means two or more parts** besides the `Root` alias. Only a compound component has an
  Anatomy subsection.
- **`links.rac`** is the React Aria component the root wraps. A component that wraps none has no
  `rac` line. `links.source` is relative to `packages/react/src/components`, `links.styles` to
  `packages/styles/components`.
- **Types in API tables are the real types.** A variant alias such as `SpinnerVariants["color"]`
  is written as its union from `.styles.ts`. Every other type is copied as written, generics
  included: `DOMRenderFunction<E, undefined>`, with the default `E` in the Description.
- **The skill outranks sibling pages.** Pages merged before it carry longer prose; they are
  curation work, not a model.

## The shape of a page

Frontmatter, then straight to `## Usage`. Sections in this order, and only these:

1. `## Usage` — the import code block, then `<ComponentPreview name="<name>-basic" />`.
   `### Anatomy` follows for compound components only: one code block with every part.
2. `## Examples` — one `### Feature Name` per feature, each a `<ComponentPreview />`.
3. `## Customization` — `### Tailwind CSS` and `### Global CSS`, one code block each.
4. `## Styling Reference` — `### CSS Classes`, `### Slots`, `### CSS Variables` (when the CSS file
   defines any), `### Interactive States` (when the CSS file styles any).
5. `## API Reference` — one `### <Part>` table per part, its last row `...rest` for the native or
   React Aria attributes the part accepts; `### Render Props` when `children` or `className`
   accepts a function.

A page has no H1, no Installation section, no introduction or overview, and no closing
"examples with code" section.

**A section is: its heading, at most one sentence that you write, then the code or the preview.**
Lines the template prints under `## Styling Reference` are copied verbatim and are not that
sentence. Your sentence is 15 words or fewer and starts with the prop or the verb. A fact code cannot show — an accessibility
requirement, a prop that does not exist — goes in a code comment, in the Description cell of the
API table, or is that one sentence. A table has no prose before or after it.

**The frontmatter `description` is 10 words or fewer**: "Dropdown menu triggered by button".

**An Examples section exists because a story or a source-backed prop exists.** A feature with
neither is not documented: there is no section explaining its absence and no demo invented for it.

Words that never appear: "powerful", "flexible", "modern", "beautiful", and the name of the
reference library — in pages, demos, UI text, anywhere a visitor or agent reads.

Formatting: title case for `##`, `###` and frontmatter `title`; no punctuation in headings; prop
names in backticks in tables; file names in code style; inline code for one-liners, code blocks
for the rest; examples progress from simple to complex and stay under 15 lines of JSX — trim the
story's data to fit. A class group is named after its variant axis: "Color Classes" for `color`.

## The shape of a demo

One file per example at `apps/docs/src/demos/<name>/<example>.tsx`, a named export. Its key is
`<name>-<example>`:

```tsx
"use client"; // only because this demo passes a function prop

import {Plus} from "@gravity-ui/icons";
import {Button} from "@peakui/react";

export function WithIcon() {
  return (
    <Button onPress={() => console.log("pressed")}>
      <Plus />
      Add member
    </Button>
  );
}
```

Then run `pnpm registries`. It writes the demo's entry into `apps/docs/src/demos/index.ts` and the
page's entry into `components/meta.json`; both files are generated, and the edit hook rejects a
hand edit to either.

- **Adapt the story** — its structure and data — into the demo, with every label in English and a
  plain `div` with layout utilities in place of the story's wrapper. Docs never import stories.
- **The file name** is the section heading in kebab-case: `### With Icons` → `with-icons.tsx`,
  export `WithIcons`.
- **`"use client"`** is the first line when the demo passes a function prop or calls a hook, and
  is absent otherwise.
- **Icons** are named imports from `@gravity-ui/icons`. No other icon library.
- Demos import only from `@peakui/react`, `@gravity-ui/icons` and `react`, and are type-checked.

## Curating an existing page

Cut to the shapes above: delete marketing words and introductions, replace a paragraph with the
code that shows it, merge near-duplicate examples, move facts from prose into tables. Target 80%
code to 20% text. A sentence you remove that held a fact found nowhere else on the page moves into
a code comment or a Description cell — it is never dropped. Report every factual error you fixed
with the source file that proves it.

## Before you call it done

- [ ] Every prop, default, variant, class, slot, variable and state on the page appears in the
      source files above; nothing in source that a consumer uses is missing from the page
- [ ] Sections in the order above; no H1, Installation, introduction or trailing examples section
- [ ] Anatomy present for a compound component, absent otherwise
- [ ] No section has more than one sentence; `description` is 10 words or fewer
- [ ] `pnpm registries` has run; every `<ComponentPreview name>` has its demo file
- [ ] Every Examples section traces to a story or a source-backed prop
- [ ] `"use client"`, icons and exports in each demo match the demo shape
- [ ] Prop names in backticks; types copied from source
- [ ] `/llms*.txt`, `<page>.md` and `/api/components` untouched — they are generated from the MDX
- [ ] `pnpm --filter @peakui/docs typecheck`, `pnpm --filter @peakui/docs test` and `pnpm lint`
      pass, and their output is in your summary

## Common mistakes

| Mistake | Fix |
| --- | --- |
| "`size` accepts `sm`, `md` or `lg`. The default is `md`." above a Sizes preview | Delete it. The preview and the API table already say it. |
| Two or three sentences explaining an example | One sentence; the rest becomes code comments or a Description cell. |
| "Renders a `<div>` and accepts its attributes." above a props table | Delete it, or make it a `...rest` row's Description. |
| A section for something the component cannot do | Delete the section. |
| A `render` type rewritten to be friendlier | Copy the type from source. |
| `links.storybook`, or `links.rac` on a component with no React Aria primitive | Remove the line. |
| A per-component `index.ts` in the demos folder, or a hand edit to the registry | Delete it; `pnpm registries` registers demos. |
