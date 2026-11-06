# Menu and ContextMenu design

Status: draft for approval (stage 0). Branch `chore/bump-rac-1.22`, react-aria-components 1.22.1.

## Task

Add two core components to `@peakui/react`: `Menu`, a port of the reference's standalone inline menu
(`heroui/packages/react/src/components/menu`, a thin `Menu` over RAC with `.menu` styles), and
`ContextMenu`, new, opened by right-click, long-press, Shift+F10 or the ContextMenu key.

## Goals and non-goals

Goals:
- `Menu`: an always-visible list of actions, no popover. Reuses `menu-item` and `menu-section`.
- `ContextMenu`: a region that opens a popover menu at the pointer or at the focused element.
- Both live in the core package. No dependency on `peakui-pro`.

Non-goals: submenu redesign, nested context menus, a data-driven `items` prop, any change to
`Dropdown` in this task, native OS menu replacement (`preventDefault` is applied only inside the region).

## Verified facts (RAC 1.22.1 in node_modules)

- RAC exports no ContextMenu, no virtual-anchor type and no context-menu trigger. `MenuTrigger` opens
  on press only.
- `Popover` accepts `triggerRef: RefObject<Element | null>` plus `isOpen` / `onOpenChange`, so a
  controlled popover with a synthetic anchor is supported.
- `react-aria` exports `useLongPress` (present in the installed `react-aria` package). Its exact
  pointer-type and threshold behaviour was not read from source here: the plan must confirm it before
  relying on it. `packages/react` declares `react-aria ^3.53.1`; the installed copy resolved to 3.52.1,
  so run the install first.

## API

Namespace-first, one file per component, `Object.assign` onto the Root (composition contract).

```tsx
<Menu aria-label="Actions" onAction={fn}>
  <Menu.Section><Menu.Item id="copy">Copy</Menu.Item></Menu.Section>
</Menu>

<ContextMenu>
  <ContextMenu.Trigger className="canvas">…region…</ContextMenu.Trigger>
  <ContextMenu.Popover>
    <ContextMenu.Menu onAction={fn}><ContextMenu.Item id="copy">Copy</ContextMenu.Item></ContextMenu.Menu>
  </ContextMenu.Popover>
</ContextMenu>
```

Decisions:
- **`Menu.Item` and `Menu.Section` are namespace aliases** of the existing `MenuItemRoot` and
  `MenuSectionRoot` (one implementation, `Object.assign`), not new parts. `menu-item` and
  `menu-section` stay internal directories without docs pages. Same aliasing for
  `ContextMenu.Item`, `.Section`, `.ItemIndicator`, `.SubmenuTrigger`.
- `Menu` root: RAC `Menu` props, `data-slot="menu"`, BEM `.menu`, `data-selection-mode` as in Dropdown.
- `ContextMenu` root: holds state (`isOpen`, anchor point), exposes `isOpen`, `defaultOpen`,
  `onOpenChange`, `isDisabled`. `Trigger` is a `div` (`render` prop allowed), `data-slot="context-menu-trigger"`.
- `Popover` reads `SurfaceContext` like `DropdownPopover`.

### Dropdown refactor (recommendation only)

Dropdown's `DropdownMenu`, `DropdownItem`, `DropdownSection`, indicators and submenu trigger already
forward to the same parts. Recommend a follow-up that makes `Dropdown.Menu` reuse the `Menu` root
styles (one `.menu` block, dropdown-specific popover only). Do not do it in this task: it changes
class names (`dropdown__menu`) and needs its own spec and VRT baseline.

## Behaviour

### Pointer
`contextmenu` on the Trigger: `preventDefault`, set anchor to `(clientX, clientY)`, open. Ignore when
`isDisabled`, when `event.defaultPrevented` already, or when the target is inside an element with
`data-context-menu-native` (escape hatch for inputs/links). While open, the modal popover makes the rest of the
page inert, so a second right-click lands on BODY, not on the region: it closes the menu (the browser
menu may show) and the user right-clicks again to reopen at the new point. Left click outside closes (RAC dismiss).

### Touch
`useLongPress` on the Trigger with the platform default threshold; anchor to the touch point. Suppress
the browser's own `contextmenu` and text-selection callout inside the region (`-webkit-touch-callout: none`
and `user-select` scoped via the Trigger's CSS). Verify iOS Safari separately: it does not always fire
`contextmenu` after a long press.

### Keyboard
The Trigger itself is not focusable. Shift+F10 and the ContextMenu key, caught on `keydown` bubbling from
any focused descendant, open the menu anchored to that element's `getBoundingClientRect()` (bottom-start),
and `preventDefault`. Opened by keyboard, the menu autofocuses the first item; by pointer, it focuses
the menu container (RAC `autoFocus`).

### Positioning
Anchor is one hidden `position: fixed; width: 0; height: 0` element, rendered inside the Trigger, moved with
inline `left/top`, passed as `Popover triggerRef`. RAC flips and shifts at viewport edges. Default
`placement="bottom start"`, `offset=0`. The anchor is `aria-hidden` and `inert` and never focusable.

### Focus
RAC `Popover` restores focus to the previously focused element on close. For a pointer open on a
non-focusable region, nothing was focused, so nothing is restored. Escape closes and restores.
Selecting an item closes (`shouldCloseOnSelect` default). The popover is modal and locks page scroll, like Dropdown, so there is no ancestor scroll to close it. A right-click outside the region, the popover and any submenu popover closes the menu and leaves the browser menu to show.

## Accessibility

- A context menu must **never be the only path to an action**: every action it offers has a visible,
  keyboard-reachable equivalent (button, toolbar, row menu via `Dropdown`). Docs and Storybook
  state this rule; the demo pairs the region with a visible `Dropdown`.
- Keyboard opening is a requirement, not an enhancement (WCAG 2.1.1). Touch long-press is not
  discoverable; never rely on it alone (2.5.1 alternatives).
- Menu role, arrow keys, typeahead, Escape, `aria-label` requirement come from RAC. `forced-colors`
  states for items already exist.
- Trigger carries no role. Do not add `aria-haspopup` to a non-interactive region.
- Target size and focus rings follow existing `menu-item` styles (WCAG 2.2 AA).

## File list

- `packages/react/src/components/menu/{menu.tsx,index.ts,menu.stories.tsx}`
- `packages/react/src/components/context-menu/{context-menu.tsx,index.ts,context-menu.stories.tsx}`
- `packages/react/src/components/context-menu/use-context-menu-anchor.ts` (internal hook)
- `packages/styles/src/components/menu.ts`, `context-menu.ts`; `packages/styles/components/menu.css`, `context-menu.css`
- `packages/react/tests/components/menu/` and `context-menu/`: `*.test.tsx`, `*.ssr.test.tsx`
- `apps/storybook/e2e/context-menu.spec.ts`
- Docs: `apps/docs/content/docs/en/react/components/(category)/menu.mdx`, `context-menu.mdx`; demos under `apps/docs/src/demos/menu/` and `context-menu/`
- Generated by `pnpm registries`: never hand-edit. Scaffold with `pnpm add:component`.

## Required amendments elsewhere (not edited here)

- `docs/ecosystem/boundaries.md` (in `peakui-company`): add under the core's scope: "`ContextMenu` belongs to the
  core (`peakui`). It is the one core component the reference does not have, admitted because it is a
  behaviour primitive over RAC with no premium content; pro never reimplements it."
- Roadmap spec `2026-10-04-component-roadmap-design.md`, line 18, "Build only what the reference already has.": append
  "Exception, by owner decision of 2026-11-06: `ContextMenu` is built without a reference counterpart.
  Any further exception needs the same explicit decision."

## Testing strategy

jsdom (`@peakui/testing/helpers`): Menu renders items, sections, `onAction`, selection modes, `data-slot`s;
ContextMenu opens on `contextmenu` with correct anchor style, ignores disabled and native-escape targets,
opens on Shift+F10 and ContextMenu key from a focused child, Escape closes, `onOpenChange` fires,
controlled mode, a contextmenu on the region while open re-anchors (an event the browser does not send once the modal popover is open; the browser tier pins that it closes). Long-press via fake timers and pointer events (jsdom has
no layout: assert anchor inline style, not real position). SSR smoke renders closed state.

Playwright (Storybook iframe, overlay spec): real right-click places the menu at the pointer; viewport-edge
flip; keyboard open anchors to the focused element and focus returns on Escape; touch emulation long-press
(Chromium `hasTouch`); the open menu scroll-locks the page; a right-click elsewhere closes it. WebKit run for long-press/contextmenu differences if CI allows.

## Risks

- Safari/iOS long-press does not reliably emit `contextmenu`; `useLongPress` plus callout suppression may
  conflict with native text selection.
- Hidden fixed anchor inside a transformed ancestor mis-positions (fixed becomes relative). Mitigation:
  portal the anchor to `body`.
- `useLongPress` and RAC `Menu` press handling could double-fire on touch; needs the e2e spec.
- Third-party handlers on descendants calling `stopPropagation` swallow the event.
- Dropdown divergence if the follow-up refactor never lands.

## Open questions

1. Should `Menu` ship `Menu.Separator` as an alias of the existing separator, or leave consumers on `Separator`?
2. Does the owner want an `isDisabled` per-target escape (`data-context-menu-native`) named this way?
3. Keyboard-open placement: anchored to the focused element, or to the caret/selection when inside text?
4. Is a WebKit CI job in scope for the touch tests?
