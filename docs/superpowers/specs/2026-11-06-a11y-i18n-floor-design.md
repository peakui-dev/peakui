# Accessibility and i18n floor

Raise every existing component to the floor in
`.agents/skills/peakui-component-standards/references/accessibility-and-i18n.md` without adding
components or changing public API.

## Task

Close the verified forced-colors, localized-string and automated-a11y gaps in `@peakui/styles` and
`@peakui/react`. Documentation-only spec; no product code here. Audit signals were re-checked
against the tree on `chore/bump-rac-1.22`; false ones are listed and dropped.

## Goals and non-goals

Goals:
- Every selected/checked/filled state stays distinguishable under `forced-colors: active`.
- Every assistive string a component generates is localized (`en-US`, `ru-RU`), and a consumer
  label still wins.
- An axe check runs in the jsdom tier for every interactive component.

Non-goals: new components, API changes, locales beyond en and ru, `prefers-reduced-transparency`
sweep, Pro and agents repositories, WCAG 3 / APCA gating, slider marks and steps (a feature, see
Open questions).

## Verified findings

| Component | Gap | Evidence |
| --- | --- | --- |
| 42 of 84 CSS files | No own `forced-colors` block: true, but misleading | 42 files contain the query. The missing list includes non-interactive ones (alert, card, kbd, separator, label, description). |
| All focus rings | Already covered, drop from scope | `utilities/index.css` `status-focused` and `status-focused-field` fall back to `outline` in forced colors. |
| Role tokens | Partly covered | `themes/default/variables.css:206` remaps `--accent`, `--field-*`, `--focus`, `--link` to system colors. |
| checkbox, radio, switch | Real gap | Selected state is `bg-accent` / `bg-danger` fill (`checkbox.css:105,156`); no border or Highlight fallback. A remapped fill alone does not mark the unchecked/checked difference reliably. |
| slider | Real gap | Fill and thumb are `bg-accent` (`slider.css:35,40`); no query. |
| tabs | Real gap | Indicator is `bg-segment` plus shadow (`tabs.css:232`); shadows vanish in forced colors. |
| list-box-item, menu-item, toggle-button-group | Needs browser check | Selection uses `data-selected` and background. tag and button already carry the pattern, so copy it. |
| link, tooltip, textfield, textarea, number-field, input-otp, radio-group, scroll-shadow | Probably fine | Borders come from remapped `--field-border`; focus from the shared utility. Confirm in the forced-colors VRT, add nothing blindly. |
| close-button, pagination, spinner, search-field, tag | Hardcoded English confirmed | `aria-label="Close"`, `"Pagination"`, `"Loading"`, `"Clear search"`, `"Remove tag"`; each is overridable by consumer props. |
| calendar | Not a string gap | Month and weekday text comes from `useLocale` and react-aria formatting. Dropped. |
| axe tests | Claim false as stated | `@storybook/addon-a11y` and `axe-playwright` exist, and `e2e/foundations.a11y.spec.ts` runs `checkA11y`. But no per-component run exists, and nothing in `packages/testing/helpers` (render, user, ssr). jsdom tier has none. |
| scroll-shadow reduced motion | False, dropped | The CSS has no `transition`; the fade is a scroll-driven animation tied to scroll position, not elapsed time. |
| slider marks and steps | Feature gap, not a floor gap | `slider.tsx:25-26,201` carry TODOs. Moved to Open questions. |

`@react-aria/i18n` is not yet imported in `packages/react/src` (only `react-aria-components/I18nProvider`).

## Approach per theme

**Forced colors.** Per the reference: transparent border in normal state, `ButtonBorder` in forced
colors, `Highlight`/`HighlightText` for selected, system colors only inside the query. Selected
indicators (checkbox box, radio dot, switch thumb/track, slider fill/thumb, tabs indicator) get an
explicit block. Prefer one shared utility (`status-selected-forced`) in `utilities/index.css` over
per-file copies if three or more components need identical rules. Verify with Chromium
`forcedColors: "active"` emulation.

**Reduced motion.** No new work for scroll-shadow. One sweep: grep `transition` and `animate-` in all
CSS and confirm `motion-reduce:transition-none` follows each, per `styling.md` ordering.

**Localized strings.** Five labels is below the standards file's "many strings" threshold, so this
is a deliberate raise of the bar, justified by the owner's criterion. One shared module
`packages/react/src/i18n/strings.ts` holds a dictionary keyed `close`, `pagination`, `loading`,
`clearSearch`, `removeTag` with `en-US` and `ru-RU`. Components call
`useLocalizedStringFormatter(strings, "@peakui/react")` and keep the existing prop order, so a
consumer `aria-label` still wins. Add `@react-aria/i18n` as a dependency. Note the cost: every
component using it becomes a client hook consumer, so check the client-directive tests.

**Axe helper and smoke tests.** Add `packages/testing/helpers/axe.ts` exporting
`expectNoAxeViolations(container, options?)` wrapping `axe-core` (jsdom config: `color-contrast`
and `region` disabled, since jsdom has no layout). Re-export from `helpers/index.ts`. Each
interactive component gets one `it("не имеет нарушений axe")` in its existing
`tests/components/<name>/<name>.test.tsx`, rendered with its accessible name supplied. Contrast
stays with the Playwright tier.

## Work slicing

Batches are independent; file lists do not overlap.

| Batch | Scope | Files |
| --- | --- | --- |
| 1 Axe helper | helper, dependency, docs line in `testing.md` | `packages/testing/helpers/axe.ts`, `helpers/index.ts`, `packages/testing/package.json`, `testing.md` |
| 2 Strings | dictionary, five components, tests | `packages/react/src/i18n/strings.ts`, `close-button.tsx`, `pagination.tsx`, `spinner.tsx`, `search-field.tsx`, `tag.tsx`, `packages/react/package.json`, their five test files |
| 3 Forced colors, controls | checkbox, radio, switch | `checkbox.css`, `radio.css`, `switch.css`, shared utility in `utilities/index.css`, matching stories |
| 4 Forced colors, selection | slider, tabs, list-box-item, menu-item, toggle-button-group | those five CSS files, stories |
| 5 Axe smoke tests | one test per interactive component, after batch 1 | `packages/react/tests/components/*/*.test.tsx` except the five in batch 2 |
| 6 VRT | forced-colors snapshot spec per touched component | `apps/storybook/e2e/ForcedColors.spec.ts` |

Batch 2 owns the five string components' tests, so batch 5 excludes them. Batch 3 alone edits
`utilities/index.css`.

## Testing strategy

- jsdom: axe per component; string tests assert `getByRole("button", {name: "Закрыть"})` under
  `I18nProvider locale="ru-RU"`, the English default, and that a consumer label wins.
- Playwright: forced-colors emulation snapshots of checked/unchecked, selected tab, slider at
  mid-range; extend `foundations.a11y.spec.ts` pattern to a story sweep with `checkA11y`.
- No assertions on computed colors (testing standard).

## Risks

- jsdom axe misses contrast and layout rules; false confidence. Mitigated by the Playwright sweep.
- Hook in five leaf components may break server-component usage; run `require-client-directives`.
- A shared forced-colors utility may over-reach; keep it opt-in via `@apply`.
- Russian text in tests follows the repo convention; Russian in JSX would be a defect.

## Open questions

1. Slider marks and steps: separate feature spec, or fold in here?
2. Is the five-string dictionary worth a new runtime dependency given the standards file's measured
   argument against it? The owner's criterion implies yes; confirm.
3. Should the axe check also gate Storybook's addon-a11y (`test: "error"`) instead of a second runner?
4. Do the "needs browser check" rows justify a measurement pass before batch 4 is scoped?
