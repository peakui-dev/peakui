# API Evolution & Compatibility

The public API of a component is: its exported parts, their props types, its `data-slot` values, and
its BEM class names. All four are contracts.

## Additive only

| Allowed                        | Forbidden                             |
| ------------------------------ | ------------------------------------- |
| Add a prop                     | Remove a prop                         |
| Widen a prop's type            | Narrow a prop's type                  |
| Add a part                     | Remove or rename a part               |
| Add a variant value            | Rename or remove a variant value      |
| Add a `data-slot`              | Rename a `data-slot`                  |
| Add a BEM modifier             | Rename a BEM block or modifier        |
| Add a CSS custom property      | Remove one consumers may have themed  |

Renaming a `data-slot` or a BEM class is as breaking as renaming a prop — consumers style against
them. This is why `styling.md` calls them public.

## Deprecation

Mark, don't delete. Removal happens in a major only.

```tsx
/**
 * @deprecated Используйте `isDisabled`. Будет удалено в 2.0.
 */
disabled?: boolean;
```

A deprecated prop keeps working for its whole deprecation window, and its replacement is named in the
message.

## Every breaking change ships a codemod

A change that renames, removes or retypes anything in the list above must land **in the same PR** as a
transform in `packages/codemodes` (`@peakui/codemodes`, jscodeshift):

- An automated transform where the change is mechanical (a renamed prop, a renamed part, a moved
  import).
- A manifest entry with manual instructions where it is not (a restructured compound API) — so the
  consumer at least gets an actionable list.

A breaking change with no codemod entry is incomplete and is rejected in review. Full protocol: the
`changeset-release` skill.

## Changesets

Every user-visible change carries a changeset. `patch` for a fix, `minor` for an addition, `major`
only with the codemod above and a migration note.

## Component status

`alpha` — breaking changes possible without a major; the component says so in its docs.
`beta` — API stable, compatibility kept, polish ongoing.
`stable` — production-ready, tested, documented, and bound by everything on this page.

A component is only `stable` once it has a jsdom suite, stories covering every variant, an
accessibility pass, and an agent-facing entry (`agent-readiness.md`).
