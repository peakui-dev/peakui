# The component roadmap: what to build, in what order

`@peakui/react` ships nine components. The reference ships 88 packages behind 72 documentation
pages. This spec fixes the order in which the gap closes, and derives that order from two measured
facts rather than from taste: the dependency graph between components, and the list of files in
`apps/docs` that still render hand-written markup.

## Task

Produce a single total order over the components still to build, in three priority bands:

1. **P1 — the docs chrome.** Every presentational primitive `apps/docs` currently takes from
   `fumadocs-ui`, or hand-rolls in Tailwind, replaced by a `@peakui/react` component. The
   documentation site becomes the library's first consumer.
2. **P2 — form elements.** The reference's `(forms)` and `(controls)` categories.
3. **P3 — everything else.**

**Build only what the reference already has.** Every entry below maps to a directory in
`heroui/packages/react/src/components/`. Nothing is invented. Where a component exists upstream as a
package but carries no documentation page, the entry says so.

## Why this order

Two rules, applied in sequence:

- **The dependency graph is the spine.** A component is never scheduled before the components it
  imports.
- **Docs impact breaks ties.** Among components at equal depth, the one that closes more files in
  `apps/docs` goes first.

### The measured graph

Computed over `heroui/packages/react/src/components/` by resolving every `from "../<name>"` import,
excluding tests and stories:

```
surface       <- 13  popover card modal drawer dropdown accordion alert autocomplete
                     combo-box date-picker date-range-picker select color-picker
close-button  <-  6  toast alert-dialog drawer modal search-field tag
icons.tsx     <- ~15 (internal module, not a component)
link          <-  1  breadcrumbs
scroll-shadow <-  1  tabs
```

41 of the 88 packages import no other component at all. This is the direct consequence of the
"compose the primitive" rule in `AGENTS.md`: each component is a thin styled composition over a
`react-aria-components` primitive, so it reaches for RAC rather than for a sibling. `Dropdown` does
**not** depend on `Popover`, and `Select` does **not** depend on `ListBox`.

`Surface` is therefore the first component to build. It is also cheap: its tokens already exist in
`@peakui/styles` (`bg-surface`, `shadow-surface`), and `apps/docs` already writes those class names
by hand in `component-preview-container.tsx` and `demos`-adjacent code.

### The audit of `apps/docs`

Each P1 entry below names the file it closes. The audit found three kinds of debt:

- **`fumadocs-ui` presentational imports** — `components/ui/button`, `components/ui/popover`,
  `components/ui/collapsible`, `components/tabs`, `components/card`, `components/callout`.
- **Raw `react-aria-components` with inline Tailwind** — `components/ai/page-actions.tsx` imports
  `Menu`, `MenuItem`, `MenuTrigger`, `Popover` and `Text` directly and styles them in JSX.
- **Hand-rolled components that a library primitive replaces outright** —
  `components/status-chip.tsx`, `components/version-badge.tsx`,
  `components/fumadocs/ui/theme-toggle.tsx`, and the skeleton at
  `components/component-preview.tsx:22`.

### The boundary we do not cross

`fumadocs` keeps everything that is the documentation *engine* rather than a UI primitive: the page
tree, the TOC observer, the search index (`fumadocs-core/search/server`), i18n, sidebar state, and
Shiki highlighting. P1 replaces presentation, not the Next.js layer.

## Wave 0 — the internal icon module

`packages/react/src/components/icons.tsx`: 15 glyphs, inlined. Not a component, no documentation
page, **not exported from the package root**.

Required by `Link`, `CloseButton`, `Disclosure`, `Alert`, `Tabs`, `Breadcrumbs`, `Toast`,
`NumberField`, `menu-item`, and most of P3.

**Source: `@gravity-ui/icons` (MIT), inlined from its `svgs/` directory.** The glyphs are
`chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `xmark`, `plus`, `minus`,
`magnifier`, `calendar`, `arrow-up-right-from-square`, `circle-info`, `triangle-exclamation`,
`circle-xmark`, `circle-check`, `circle-dashed`.

Three findings drove this choice, and they are recorded because the obvious alternatives are wrong:

1. **The reference's `icons.tsx` is this same set, inlined.** Of its 15 glyphs, four are
   byte-identical to `@gravity-ui/icons@2.22.0` (`chevron-down`, `chevron-left`, `plus`, `minus`).
   Roughly nine more are identical up to encoding: `CloseIcon` differs from `xmark` by a trailing
   `Z`; `IconChevronUp` differs from `chevron-up` in arc flags (`0 0 1` versus `1 1`);
   `IconSearch` differs from `magnifier` by one space before `4.5`. Only `calendar` and two status
   glyphs are genuinely redrawn. Taking the glyphs from upstream instead of from the reference
   leaves `@peakui/react` with no derivation from `heroui` and therefore no `NOTICE` obligation —
   today only `apps/docs/NOTICE` exists, and the core package should stay that way.
2. **The geometry already matches.** `@gravity-ui/icons` ships `viewBox="0 0 16 16"`,
   `fill="none"` on the `svg`, `fill="currentColor"` with `evenodd` on the path — filled, 16px,
   exactly what the styles are sized for. A stroke-based set such as Lucide would have forced a
   visual-identity change (16px at `stroke-width: 2` reads heavy) on top of the plumbing.
3. **Inline, not a dependency.** `@gravity-ui/icons` is MIT with a single `tslib` dependency, but
   `@peakui/react` has exactly two dependencies today (`@peakui/styles`, `tailwind-variants`) and
   should not acquire a third to obtain 15 glyphs out of 799. MIT requires only that the copyright
   notice be retained: one third-party licence block in `packages/react`. The reference took the
   same position. `@gravity-ui/icons` may be added as a `devDependency` of `packages/react` if a
   regeneration script is wanted.

Icons stay internal rather than public, diverging from the reference
(`heroui/packages/react/src/components/index.ts:95` re-exports them). Exporting them would commit
us to maintaining an icon API we have no reason to own.

## P1 — the docs chrome

### Wave 1: hubs, and leaves that delete hand-written files

| # | Component | Category | Depends on | Closes in `apps/docs` |
| --- | --- | --- | --- | --- |
| 1 | `Surface` | layout | — | 13 later dependents; hand-written `bg-surface` / `shadow-surface` in `component-preview-container.tsx` |
| 2 | `CloseButton` | buttons | icons | 6 later dependents: `Modal`, `Toast`, `Tag`, `SearchField`, `Drawer`, `AlertDialog` |
| 3 | `Chip` | data-display | — | `components/status-chip.tsx` and `components/version-badge.tsx`, both deleted outright |
| 4 | `Separator` | layout | — | `<hr className="w-full border-separator">` in the docs layout sidebar banner |
| 5 | `Link` | navigation | icons | `components/github-link.tsx`, `components/component-item.tsx`, and `className="button button--md button--tertiary"` in `app/[lang]/not-found.tsx` |
| 6 | `Kbd` | typography | — | raw `<kbd className="bg-fd-background rounded-md border px-1.5">` in `LargeSearchToggle` |
| 7 | `Tooltip` | overlays | — | the `<span title={shortcut}>` wrapper in `components/fumadocs/ui/search-toggle.tsx` |
| 8 | `Skeleton` | feedback | — | `animate-pulse rounded-lg border bg-muted/30` at `components/component-preview.tsx:22` |
| 9 | `ScrollShadow` | utilities | — | required by `Tabs`; sidebar and TOC overflow |

### Wave 2: built on wave 1

| # | Component | Category | Depends on | Closes in `apps/docs` |
| --- | --- | --- | --- | --- |
| 10 | `Card` | layout | Surface | `fumadocs-ui/components/card` in `mdx-components.tsx` |
| 11 | `Popover` | overlays | Surface | `fumadocs-ui/components/ui/popover` in `components/fumadocs/layouts/notebook/client.tsx` |
| 12 | `Alert` | feedback | icons, Surface | `fumadocs-ui/components/callout` in `mdx-components.tsx` |
| 13 | `Disclosure` + `DisclosureGroup` | navigation | icons | `fumadocs-ui/components/ui/collapsible` in `notebook/page/client.tsx` |
| 14 | `Tabs` | navigation | icons, ScrollShadow | `fumadocs-ui/components/tabs` in `mdx-components.tsx` and `mdx-components/package-managers.tsx` |
| 15 | `ToggleButton` + `ToggleButtonGroup` | buttons | mutual pair | all of `components/fumadocs/ui/theme-toggle.tsx`: three raw `<button>` and a local `tv()` |
| 16 | `ButtonGroup` | buttons | Button | the faked split button (`rounded-e-none` / `rounded-s-none`) in `components/ai/page-actions.tsx` |
| 17 | `Breadcrumbs` | navigation | icons, Link | the docs page breadcrumb |
| 18 | `EmptyState` | — | — | the body of `app/[lang]/not-found.tsx`. **No documentation page upstream** — the only P1 entry without a reference page |

### Wave 3: the menu and overlay block

The most expensive slice of P1. Entries 21–25 together replace the default `fumadocs` search dialog
with our own. They can be deferred as a unit: everything before them already leaves the site fully
on `@peakui/react` except search.

| # | Component | Category | Depends on | Closes in `apps/docs` |
| --- | --- | --- | --- | --- |
| 19 | `menu-item` + `menu-section` | — | icons | internal parts, no pages of their own |
| 20 | `Dropdown` | collections | menu-item, menu-section, Surface | raw RAC `Menu` / `MenuTrigger` / `Popover` / `Text` in `components/ai/page-actions.tsx`; `fumadocs-ui/components/sidebar/tabs/dropdown` |
| 21 | `ListBox` + item + section | collections | — | search results |
| 22 | `Modal` | overlays | CloseButton, Surface | the search dialog container |
| 23 | `SearchField` | forms | CloseButton, icons | the search dialog input. Formally a P2 category, pulled forward because the dialog cannot be built without it |
| 24 | `Tag` + `TagGroup` | collections | CloseButton (mutual pair) | search dialog filters. `tag` is a package with no documentation page upstream; `tag-group` has one |
| 25 | `Toast` | overlays | Button, CloseButton, icons, Spinner | the manual `checked` timeout in `page-actions.tsx`; adds the `Toast` mount that `app/custom-root-provider.tsx` lacks |

### Deliberately not in P1

`Badge`, `Avatar`, `AvatarGroup`, `Typography`, `Toolbar`, `Accordion`, `Drawer`, `AlertDialog` and
`Pagination` all exist upstream but have no consumer in our chrome. The home-page showcase
(`components/demo/index.tsx`) is not treated as a driver either: it demonstrates whatever is ready
and grows on its own as components land.

## P2 — forms and controls

Already shipped: `Description`, `FieldError`, `Fieldset`, `Input`, `InputGroup`, `Label`,
`TextField`. `SearchField` is entry 23, pulled into P1.

| # | Component | Depends on | Note |
| --- | --- | --- | --- |
| 26 | `Checkbox` + `CheckboxGroup` | mutual pair | the most-demanded control; needed by the home-page showcase |
| 27 | `Radio` + `RadioGroup` | — | leaves. `radio` is a package with no documentation page upstream; `radio-group` has one |
| 28 | `Switch` + `SwitchGroup` | — | `switch-group` is a package with no documentation page upstream |
| 29 | `TextArea` | textfield | cheap, sits on what already exists |
| 30 | `NumberField` | icons | needs `plus` / `minus` from wave 0 |
| 31 | `Form` | — | submission and validation wiring |
| 32 | `ErrorMessage` | — | pairs with `Form`; distinct from the `FieldError` we already ship |
| 33 | `Slider` | — | a leaf, but costlier: thumb, range, keyboard interaction |
| 34 | `InputOTP` | — | pulls in third-party `input-otp` (upstream pins `1.5.0`) |

## P3 — everything else

Cheap leaves and showcase-completing components first; heavy families last.

| Wave | Components | Cost driver |
| --- | --- | --- |
| 3.1 | `Badge`, `Typography`, `Avatar` + `AvatarGroup`, `ProgressBar`, `ProgressCircle`, `Meter` | leaves, near-trivial. Upstream `Avatar` uses `@radix-ui/react-avatar` |
| 3.2 | `Accordion`, `Pagination`, `Toolbar`, `Drawer`, `AlertDialog` | every dependency (`Surface`, `CloseButton`, icons) already landed in P1 |
| 3.3 | `Select`, `ComboBox`, `Autocomplete` | collections, filtering, virtualization; each depends on icons + Surface |
| 3.4 | `DateField`, `TimeField`, `Calendar`, `RangeCalendar`, `DatePicker`, `DateRangePicker`, plus internal `date-input-group` and `calendar-year-picker` | `@internationalized/date`, locales — the largest behavioural surface in the set |
| 3.5 | `ColorSwatch`, `ColorField`, `ColorArea`, `ColorSlider`, `ColorSwatchPicker`, `ColorPicker`, plus internal `color-input-group` | `@react-types/color`, `parseColor`, colour-space handling |
| 3.6 | `Table` | `@tanstack/react-table` + `react-virtual`, sorting, selection, virtualization — the single largest component |

## Totals

Entries group mutual pairs, so entry counts and component counts differ. Both are given.

| Band | Entries | Documented components |
| --- | --- | --- |
| P1 | 25 | 25 |
| P2 | 9 | 10 |
| P3 | 28 | 28 |
| **Total** | **62** | **63** |

The 63 reconciles exactly against the upstream catalogue: 72 documented pages minus the nine
components `@peakui/react` already ships (`button`, `description`, `field-error`, `fieldset`,
`input`, `input-group`, `label`, `spinner`, `text-field`). Per category, the 72 split as
buttons 5, collections 3, colors 6, controls 2, data-display 3, date-and-time 6, feedback 6,
forms 16, layout 4, media 2, navigation 7, overlays 6, pickers 3, typography 2, utilities 1.

On top of the 63 come components that exist upstream as packages with **no documentation page**, and
which therefore do not appear in that reconciliation: `empty-state` (entry 18), `tag` (entry 24),
`radio` (entry 27), `switch-group` (entry 28), and the internal parts `icons.tsx` (wave 0), `menu-item` and
`menu-section` (entry 19), `list-box-item` and `list-box-section` (entry 21), `date-input-group` and
`calendar-year-picker` (3.4), `color-input-group` (3.5).

## New third-party dependencies

`input-otp` (entry 34), `@internationalized/date` (3.4), `@react-types/color` (3.5),
`@tanstack/react-table` + `react-virtual` (3.6), `@radix-ui/react-avatar` (3.1). All five are
already named in `AGENTS.md` as binding library choices for the core, so none is a new decision.
`@peakui/react` was to keep its two dependencies through all of P1; entry 7 (Tooltip) amended
that once, at wave-1 review: `react-aria` and `@react-aria/ssr` became required peers (the
reference's own declarations, identical versions), and `@peakui/styles` took `tw-animate-css`.
Both additions are the reference's own dependency set, not new decisions.

## Definition of done

An entry is closed when it has passed all five pipeline stages from `AGENTS.md`:

1. the component under `packages/react/src/components/<name>/`, styles in `@peakui/styles`;
2. `<name>.stories.tsx` beside it;
3. tests in `packages/react/tests/components/<name>/` — `<name>.test.tsx` and `<name>.ssr.test.tsx`,
   plus a Playwright spec in `apps/storybook/e2e/` for an overlay or portal;
4. the documentation page and its demos, registered in `apps/docs/src/demos/index.ts` and in
   `COMPONENT_GROUPS` in `apps/docs/src/lib/component-groups.ts`;
5. a changeset.

### Stage 1 entry point, and naming

Stage 1 starts from `pnpm add:component`, the scaffold generator in `scripts/add-component.mjs`. It
writes the component directory, the stories file, the test files, the `@peakui/styles` entry and the
barrel export, then `pnpm registries` regenerates `packages/react/src/components/index.ts`. No entry
in this roadmap is hand-created.

**Scaffold output is not an implementation.** As of this spec the `feat/cobalt-accent` working tree
carries uncommitted scaffold output for `input-otp`, `scaffold-link` and `scaffold-probe`; each
renders a bare `<div>` with its own name as text, and all three are exported from the public barrel.
`InputOTP` (entry 34) is therefore **not** in flight, despite the directory existing. A reader
checking progress against the tree should treat a directory as evidence of nothing until stage 3
tests assert real behaviour.

That scaffold also fixes a naming question once, rather than 63 times: it produced `InputOtp` and
`InputOtpRoot`, where the reference exports `InputOTP`. **Our casing wins** — component identifiers
follow the generator's `PascalCase` of the kebab-case directory name, so `input-otp` yields
`InputOtp`, and the directory, the BEM block and the CSS file stay `input-otp` per `AGENTS.md`. The
same rule covers `ListBox`, `ComboBox`, `InputGroup` and the colour components, all of which already
agree with the reference.

**P1 entries carry a sixth stage:** migrate the `apps/docs` file the entry names, and delete the
hand-rolled equivalent. Without it the dogfooding this band exists for has not happened. An entry
whose component ships while `status-chip.tsx` or `theme-toggle.tsx` still stands is not closed.

`EmptyState` (18), `Tag` (24), `Radio` (27) and `SwitchGroup` (28) have no upstream documentation page to compare
against. They still get stages 1–5; their page shape follows the Usage → Examples → Customization →
Styling Reference → API Reference order from the `peakui-docs` skill like any other.

New categories appear as entries land: `components/index.mdx` currently renders Buttons, Feedback
and Forms. P1 adds Layout, Navigation, Overlays, Data Display, Typography, Utilities and
Collections. Each new route group needs its `COMPONENT_GROUPS` entry in the same pull request as the
first component in it.

## Risks

- **Entries 21–25 are a project, not a component.** Replacing the search dialog touches
  `fumadocs-ui`'s search context and the keyboard shortcut handling. If the band runs long, cut it:
  the site is fully migrated without it.
- **`Surface` blocks 13 components.** A wrong public API here is expensive to correct. It gets the
  same written-spec treatment as `button` and the input field family before implementation.
- **The order assumes the graph holds for our implementations.** It was measured on the reference.
  If a peakui component reaches for a sibling where the reference reached for RAC, the order needs
  revisiting — `codegraph impact` on the changed symbol is the check.

## CodeGraph

`codegraph explore "docs app UI chrome"` — "Found 39 symbols across 4 files". The index covers
`packages/` only; `apps/docs` is not in it, which is why the chrome audit above was done by reading
imports directly. Blast radius reported `composeTwRenderProps`
(`packages/react/src/utils/compose.ts:13`) with 3 callers in
`packages/react/src/components/button/button.tsx`.
