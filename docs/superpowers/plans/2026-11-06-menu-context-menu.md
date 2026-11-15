# Menu and ContextMenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `Menu` (always-visible inline menu) and `ContextMenu` (popover menu opened by right-click, long-press, Shift+F10 or the ContextMenu key) to `@peakui/react`.

**Architecture:** `Menu` is a thin styled wrapper over RAC `Menu` that reuses the existing `menu-item` and `menu-section` parts as namespace aliases. `ContextMenu` is a controlled RAC `Popover` anchored to one hidden fixed element that an internal hook moves to the pointer or to the focused element. No new dependency, no Dropdown change.

**Tech Stack:** react-aria-components 1.22.1 (`Menu`, `Popover`), `react-aria` `useLongPress`, tailwind-variants, vitest + `@peakui/testing/helpers`, Playwright (Storybook iframe).

**Spec:** `C:\Users\Vlad\Desktop\projects\io\node\peakui-company\peakui\docs\superpowers\specs\2026-11-06-menu-context-menu-design.md`

## Global Constraints

Copied from the spec and from `peakui/AGENTS.md`; every task includes them.

- "Both live in the core package. No dependency on `peakui-pro`."
- "Namespace-first, one file per component, `Object.assign` onto the Root (composition contract)."
- "`Menu.Item` and `Menu.Section` are namespace aliases of the existing `MenuItemRoot` and `MenuSectionRoot` (one implementation, `Object.assign`), not new parts. `menu-item` and `menu-section` stay internal directories without docs pages. Same aliasing for `ContextMenu.Item`, `.Section`, `.ItemIndicator`, `.SubmenuTrigger`."
- "`Menu` root: RAC `Menu` props, `data-slot="menu"`, BEM `.menu`, `data-selection-mode` as in Dropdown."
- "`Trigger` is a `div` (`render` prop allowed), `data-slot="context-menu-trigger"`." `Trigger` carries no role and no `aria-haspopup`; it is not focusable.
- "`Popover` reads `SurfaceContext` like `DropdownPopover`." Default `placement="bottom start"`, `offset=0`.
- Anchor: one hidden `position: fixed; width: 0; height: 0` element, `aria-hidden` and `inert`, never focusable, portaled to `body` (transformed-ancestor risk).
- "Do not touch `Dropdown` in this task" (no class-name changes, no refactor).
- "A context menu must never be the only path to an action": docs and stories state it; the demo pairs the region with a visible `Dropdown`.
- Ignore `contextmenu` when `isDisabled`, when `event.defaultPrevented`, or when the target is inside `[data-context-menu-native]`.
- Repo rules: no `forwardRef`, named exports, `"use client"`, `data-slot` on every element, no Tailwind in JSX or `tv()`, no `any`, no reference-library name in docs/demos/UI text, English documents. WCAG 2.2 AA plus `forced-colors`.
- Registries (five generated files) are never hand-edited: `pnpm registries`.
- Stage 5 is switched off: write no changeset and no codemod.
- Tests use `@peakui/testing/helpers` (`render`, `setupUser`, `ssrSmoke`, `act`, `cleanup`); the package test command is `pnpm --filter @peakui/react exec vitest run <path>`.

## Review Focus

Input classes the spec implies but does not specify; each is pinned by a test in the owning task.

1. Right-click on a link or input marked `data-context-menu-native` keeps the browser menu (Task 4).
2. A right-click or Shift+F10 inside the open popover bubbles through the React portal to `Trigger`; it must not re-anchor or reopen (Task 4).
3. Releasing the finger after a long-press must not select the item under it (ghost activation) (Task 6).
4. `isDisabled` flipping to true, or the Trigger unmounting, while the menu is open closes it and leaves no stuck anchor (Task 4).
5. Shift+F10 from a focused element with a zero-size or detached rect (hidden, scrolled out) falls back to the Trigger's rect instead of anchoring at (0, 0) (Task 5).

---

### Task 0: CodeGraph context

**Files:** none changed.

- [ ] **Step 1: Sync, then query**

From `C:\Users\Vlad\Desktop\projects\io\node\peakui-company\peakui`: `pnpm codegraph:sync`, then `pnpm codegraph explore dropdown`, `pnpm codegraph callers menu-item`, `pnpm codegraph callers menu-section`, `pnpm codegraph callers surface`. If the CLI refuses because the index is missing, report it and stop; do not skip.

- [ ] **Step 2: Planner's recorded result**

The index existed when this plan was written (queried `pnpm codegraph explore dropdown`, output truncated to its head; the source listing it appends is omitted):

```
**Exploration: dropdown**
Found 20 symbols across 1 file.
Blast radius:
- DropdownItem (packages/react/src/components/dropdown/dropdown.tsx:124) - 2 callers in dropdown/index.ts; no tests found within 3 caller hops
- DropdownMenu (dropdown.tsx:106) - 2 callers in dropdown/index.ts; no tests found within 3 caller hops
- DropdownRoot (dropdown.tsx:39) - 3 callers in dropdown/index.ts; tests: packages/react/tests/components/dropdown/dropdown.test.tsx
- DropdownContext (dropdown.tsx:29) - 4 callers in dropdown.tsx; tested via dropdown.test.tsx
calls: DropdownItem -> MenuItemRoot; MenuItemRoot -> menuItemVariants, composeTwRenderProps ...
references: Dropdown -> DropdownItem / DropdownTrigger / DropdownSubmenuIndicator / DropdownRoot / DropdownSection / DropdownItemIndicator ...
```

Callers: `menu-item` is imported only by `menu-item/index.ts`; `menu-section` only by `menu-section/index.ts`; `surface` shows no callers (symbol is a color token; the component is `SurfaceContext` from `../surface/index.ts`). Consequence: aliasing `MenuItemRoot`/`MenuSectionRoot` into `Menu` adds callers but changes nothing existing.

---

### Task 1: Install and Menu component

**Files:**
- Create (by `pnpm add:component Menu --rac Menu --category collections`): `packages/react/src/components/menu/{menu.tsx,index.ts,menu.stories.tsx}`, `packages/styles/src/components/menu/{menu.styles.ts,index.ts}`, `packages/styles/components/menu.css`, `packages/react/tests/components/menu/{menu.test.tsx,menu.ssr.test.tsx}`, `apps/docs/content/docs/en/react/components/(collections)/menu.mdx`
- Modify (generated): the five registry files, via `pnpm registries`
- Reference (verified paths): `packages/react/src/components/dropdown/dropdown.tsx`, `packages/react/src/components/menu-item/index.ts`, `packages/react/src/components/menu-section/index.ts`, `packages/styles/components/dropdown.css`

**Interfaces:**
- Consumes: `MenuItemRoot`, `MenuItemIndicator`, `MenuItemSubmenuIndicator` (menu-item); `MenuSectionRoot` (menu-section); `composeTwRenderProps`.
- Produces: `MenuRoot<T extends object>(props: MenuRootProps<T>)`; `Menu = Object.assign(MenuRoot, {Root, Item: MenuItemRoot, Section: MenuSectionRoot, ItemIndicator: MenuItemIndicator, SubmenuIndicator: MenuItemSubmenuIndicator})`; `menuVariants` from `@peakui/styles` (slot `base`, class `.menu`).

- [ ] **Step 1: Install**

Run: `pnpm install` (installed react-aria is 3.52.1, declared `^3.53.1`). Then `pnpm --filter @peakui/react exec vitest run tests/components/dropdown` as a baseline. Expected: PASS. Open `node_modules/react-aria`'s `useLongPress` source (or `packages/react/node_modules/react-aria`) and record its pointer-type and 500 ms default threshold in the Task 6 comment block; the spec says this was not verified.

- [ ] **Step 2: Scaffold**

Run: `pnpm add:component Menu --rac Menu --category collections`, then `pnpm codegraph:sync`. Expected: files above exist and `pnpm registries --check` passes. Resolve the spec's file list against what the scaffold produces (styles live in `menu/menu.styles.ts`, not `menu.ts`).

- [ ] **Step 3: Write failing tests** in `tests/components/menu/menu.test.tsx`

Tests: `renders role=menu with data-slot="menu" and the aria-label`; `renders Menu.Item and Menu.Section children with their own data-slots`; `onAction fires with the item id on click and on Enter`; `selectionMode="multiple" sets data-selection-mode="multiple" and toggles aria-checked`; `Menu.Item === MenuItemRoot (alias, not a copy)` asserting reference equality with the export from `@/components/menu-item/index.ts`; `Menu.Section === MenuSectionRoot`. SSR file: `ssrSmoke(<Menu aria-label="Actions">...)` renders without throwing.

- [ ] **Step 4: Run to see failure**

Run: `pnpm --filter @peakui/react exec vitest run tests/components/menu`
Expected: FAIL (scaffold stub renders a bare element / alias assertions fail).

- [ ] **Step 5: Implement** `MenuRoot` in `menu.tsx`

Wrap RAC `Menu` from `react-aria-components/Menu`; `className` via `composeTwRenderProps(className, menuVariants().base())`, `data-slot="menu"`, `data-selection-mode={props.selectionMode}`. Styles: `.menu` copies the list/padding/gap custom properties of `.dropdown__menu` in `packages/styles/components/dropdown.css` without a popover surface; no popover rule. `index.ts` follows the `menu-item/index.ts` pattern (compound, `type Menu`, named exports, variants export).

- [ ] **Step 6: Run to see pass**

Run: `pnpm --filter @peakui/react exec vitest run tests/components/menu && pnpm typecheck && pnpm check:tokens`
Expected: PASS.

- [ ] **Step 7: Story and commit**

In `menu.stories.tsx` (beside the component): `Default`, `WithSections`, `WithSelection`, `WithDisabledItems`; a story states the "never the only path" note is for ContextMenu only (skip here). Run `pnpm registries --check && pnpm lint`. Open question 1 (`Menu.Separator`): leave consumers on `Separator`; recorded in the docs page in Task 2.

```bash
git add packages apps/docs
git commit -m "feat(menu): add inline Menu reusing menu-item and menu-section"
```

---

### Task 2: Menu docs

**Files:**
- Modify: `apps/docs/content/docs/en/react/components/(collections)/menu.mdx` (scaffolded)
- Create: `apps/docs/src/demos/menu/{basic.tsx,with-sections.tsx,with-selection.tsx}` (registered by `pnpm registries`)
- Test: `pnpm --filter @peakui/docs typecheck` (demos are type-checked)

**Interfaces:** Consumes `Menu` (Task 1). Produces demo names `menu-basic`, `menu-with-sections`, `menu-with-selection`.

- [ ] **Step 1:** Load the `peakui-docs` skill. Write the page in the order Usage, Examples, Customization, Styling Reference, API Reference; frontmatter `links: {rac: Menu, source: menu/menu.tsx, styles: menu.css}`. Adapt demos from the stories; a demo with `onAction` starts with `"use client"`. Do not name the reference library; mention that `Menu.Item`/`Menu.Section` are aliases and `Separator` is used for dividers.
- [ ] **Step 2:** Run `pnpm registries && pnpm --filter @peakui/docs typecheck`. Expected: PASS and `git status` shows registry diffs only for menu.
- [ ] **Step 3: Commit**

```bash
git add apps/docs packages
git commit -m "docs(menu): add Menu page and demos"
```

---

### Task 3: ContextMenu scaffold, anchor hook, closed render

**Files:**
- Create (scaffold `pnpm add:component ContextMenu --category collections`): `packages/react/src/components/context-menu/{context-menu.tsx,index.ts,context-menu.stories.tsx,use-context-menu-anchor.ts}`, `packages/styles/src/components/context-menu/{context-menu.styles.ts,index.ts}`, `packages/styles/components/context-menu.css`, `tests/components/context-menu/{context-menu.test.tsx,context-menu.ssr.test.tsx}`, docs mdx
- Test: those two test files

**Interfaces:**
- Produces (`use-context-menu-anchor.ts`, internal, not exported from index):
  `interface ContextMenuAnchor { ref: RefObject<HTMLDivElement | null>; point: {x: number; y: number} | null; setPoint(x: number, y: number): void; setFromElement(el: Element): void }` and `function useContextMenuAnchor(): ContextMenuAnchor`. `setFromElement` uses `getBoundingClientRect()` bottom-start and falls back per Task 5.
- `ContextMenuRoot` props: `{isOpen?: boolean; defaultOpen?: boolean; onOpenChange?(open: boolean): void; isDisabled?: boolean; children}`. Context value: `{slots, state: {isOpen, setOpen}, anchor: ContextMenuAnchor, isDisabled}`.
- `ContextMenu = Object.assign(ContextMenuRoot, {Root, Trigger: ContextMenuTrigger, Popover: ContextMenuPopover, Menu: ContextMenuMenu, Item: MenuItemRoot, Section: MenuSectionRoot, ItemIndicator: MenuItemIndicator, SubmenuTrigger: <RAC SubmenuTrigger re-export as in dropdown.tsx>})`. `ContextMenuMenu` reuses the Task 1 `MenuRoot` (same `.menu` styles), changing only `data-slot="context-menu-menu"`.

- [ ] **Step 1: Scaffold and failing tests**

Run `pnpm add:component ContextMenu --category collections`, `pnpm codegraph:sync`. Tests: `renders the Trigger as a div with data-slot="context-menu-trigger" and no role/aria-haspopup/tabindex`; `renders no menu and no anchor-visible popover when closed`; `renders the anchor aria-hidden and inert, portaled to body`; `Item/Section aliases are the same references as MenuItemRoot/MenuSectionRoot`; SSR smoke of the closed state.

- [ ] **Step 2:** Run `pnpm --filter @peakui/react exec vitest run tests/components/context-menu`. Expected: FAIL.
- [ ] **Step 3: Implement** root, context, `ContextMenuTrigger` (div, `render` prop via the repo's `DOMRenderProps` pattern, children plus portaled anchor), `ContextMenuPopover` (RAC `Popover`, `triggerRef={anchor.ref}`, `isOpen`/`onOpenChange` from context, `placement="bottom start"`, `offset={0}`, wrapped in `SurfaceContext value={{variant: "default"}}` exactly like `DropdownPopover`, `data-slot="context-menu-popover"`). Anchor styles in `context-menu.css`: `position: fixed; width: 0; height: 0; pointer-events: none`; Trigger gets scoped `-webkit-touch-callout: none` and `user-select` rule for touch (used in Task 6).
- [ ] **Step 4:** Run the same command plus `pnpm typecheck && pnpm check:tokens`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages apps/docs
git commit -m "feat(context-menu): scaffold ContextMenu with anchor hook and aliases"
```

---

### Task 4: Pointer open, state, dismissal

**Files:** Modify `context-menu.tsx`, `use-context-menu-anchor.ts`; Test `tests/components/context-menu/context-menu.test.tsx`.

**Interfaces:** Consumes Task 3 context. Produces handler `onContextMenu` on Trigger.

- [ ] **Step 1: Write failing tests** (user-event `pointer` with `{keys: "[MouseRight]", coords}` or `fireEvent.contextMenu(el, {clientX: 40, clientY: 60})`):
  - `opens at the pointer`: after contextmenu at (40, 60) the menu role is present and the anchor's inline style is `left: 40px; top: 60px`; event default is prevented.
  - `a second contextmenu while open moves the anchor and keeps the menu open` (style becomes the new point; `onOpenChange` not called with false).
  - `isDisabled ignores contextmenu` and the event is not prevented.
  - `ignores an already-defaultPrevented event`.
  - `ignores targets inside [data-context-menu-native]` and does not prevent default (Review 1).
  - `contextmenu inside the open popover does not re-anchor or call onOpenChange` (Review 2).
  - `onOpenChange(true/false) fires; controlled isOpen is respected (no internal open without parent update); defaultOpen mounts open`.
  - `Escape closes; selecting an item closes and fires onAction`.
  - `isDisabled turning true while open closes the menu; unmounting the Trigger while open leaves no popover or anchor in body` (Review 4).
- [ ] **Step 2:** Run `pnpm --filter @peakui/react exec vitest run tests/components/context-menu -t "contextmenu|isDisabled|controlled"`. Expected: FAIL (no handler).
- [ ] **Step 3: Implement** `onContextMenu` on the Trigger: guard order disabled, `defaultPrevented`, `event.target.closest("[data-context-menu-native]")`, and `popoverRef.contains(target)` (React portal events reach Trigger); then `preventDefault()`, `anchor.setPoint(clientX, clientY)`, `setOpen(true)`. State via `useControlledState` from `react-stately` (add nothing new if already used by the package; check imports first). A `useEffect` closes when `isDisabled` becomes true. Anchor writes inline `left/top` only.
- [ ] **Step 4:** Run the full context-menu test file. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages
git commit -m "feat(context-menu): open on contextmenu with pointer anchor"
```

---

### Task 5: Keyboard open and focus

**Files:** Modify `context-menu.tsx`, `use-context-menu-anchor.ts`; Test same file.

- [ ] **Step 1: Write failing tests**:
  - `Shift+F10 on a focused descendant opens the menu anchored to its rect (mock getBoundingClientRect: left 10, bottom 50 gives left: 10px; top: 50px) and prevents default`.
  - `the ContextMenu key does the same`.
  - `keyboard-open focuses the first item; pointer-open focuses the menu container` (`document.activeElement`).
  - `Escape closes and focus returns to the descendant that opened it`.
  - `Shift+F10 from a zero-size rect falls back to the Trigger rect` (Review 5).
  - `keydown inside the open popover does not reopen or re-anchor` (Review 2).
  - `Shift+F10 inside an input in the region still opens the menu` (documented; native escape applies only to pointer).
  - `isDisabled ignores keys`.
- [ ] **Step 2:** Run `pnpm --filter @peakui/react exec vitest run tests/components/context-menu -t "Shift+F10|ContextMenu key|focus"`. Expected: FAIL.
- [ ] **Step 3: Implement** `onKeyDown` on Trigger: match `key === "ContextMenu" || (shiftKey && key === "F10")`, same guards as Task 4, `anchor.setFromElement(event.target as Element)` (fallback when width and height are 0: Trigger rect), record `openedBy: "keyboard" | "pointer"` in a ref and pass `autoFocus={openedBy === "keyboard" ? "first" : true}` through context to `ContextMenuMenu` (RAC `autoFocus`). Do not add a tabindex.
- [ ] **Step 4:** Run the file. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages
git commit -m "feat(context-menu): open from Shift+F10 and the ContextMenu key"
```

---

### Task 6: Touch long-press

**Files:** Modify `context-menu.tsx`; Test same file (fake timers).

**Interfaces:** Consumes `useLongPress` from `react-aria` (confirmed in Task 1 step 1).

- [ ] **Step 1: Write failing tests** with `vi.useFakeTimers()` and pointer events of `pointerType: "touch"` via the helpers:
  - `a touch held past the threshold opens the menu anchored to the touch point`.
  - `a touch released before the threshold does not open`.
  - `a mouse press held past the threshold does not open` (long-press is touch-only here; confirm against Task 1 step 1 notes).
  - `releasing the finger after the open does not activate the item under it` (Review 3).
  - `moving past tolerance cancels the long-press`.
  - `the native contextmenu event that follows a long-press does not reopen or re-anchor`.
  - `Trigger has the touch-callout/user-select suppression class or attribute` (assert the data attribute or class the CSS keys on).
- [ ] **Step 2:** Run `pnpm --filter @peakui/react exec vitest run tests/components/context-menu -t "touch|long"`. Expected: FAIL.
- [ ] **Step 3: Implement** `useLongPress({onLongPress(e){...}, isDisabled})` merged into the Trigger via `mergeProps`; filter to `e.pointerType === "touch"`; anchor at `(e.x, e.y)` (client coordinates, check the event shape in source); set a short suppression flag so the paired release/click and the native `contextmenu` are ignored. iOS Safari is verified by hand and recorded as a note in the docs page (not testable in Chromium).
- [ ] **Step 4:** Run the file. Expected: PASS. Run `pnpm test` for the whole package. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add packages
git commit -m "feat(context-menu): open on touch long-press"
```

---

### Task 7: ContextMenu stories

**Files:** Modify `packages/react/src/components/context-menu/context-menu.stories.tsx`.

- [ ] **Step 1:** Stories: `Default` (region plus a visible `Dropdown` with the same actions, and a caption stating the rule), `WithSections`, `WithNativeEscape` (a link marked `data-context-menu-native`), `Disabled`, `Controlled`, `NearViewportEdge` (region at bottom-right). Every story's region has an `aria-label` where interactive children exist.
- [ ] **Step 2:** Run `pnpm lint && pnpm typecheck`. Expected: PASS. Smoke the iframe with agent-browser per `apps/storybook/AGENTS.md` (text snapshots only).
- [ ] **Step 3: Commit**

```bash
git add packages
git commit -m "feat(context-menu): add stories"
```

---

### Task 8: ContextMenu docs

**Files:** Modify `apps/docs/content/docs/en/react/components/(collections)/context-menu.mdx`; Create `apps/docs/src/demos/context-menu/{basic.tsx,with-sections.tsx,with-native-escape.tsx,controlled.tsx}`.

- [ ] **Step 1:** Load `peakui-docs`. Page sections: Usage, Examples, Customization, Styling Reference (`.context-menu__*`, the anchor, `data-slot`s), API Reference (root, Trigger, Popover, Menu, aliases). Include: the "never the only path" rule, keyboard keys, long-press not discoverable, `data-context-menu-native`, iOS Safari caveat, and that `stopPropagation` in descendants swallows the event. Basic demo pairs the region with `Dropdown`. Demos with function props start with `"use client"`.
- [ ] **Step 2:** Run `pnpm registries && pnpm --filter @peakui/docs typecheck && pnpm build:docs` (needs `NEXT_PUBLIC_SITE_URL`). Expected: PASS; `/context-menu.md` route exists in dev.
- [ ] **Step 3: Commit**

```bash
git add apps/docs packages
git commit -m "docs(context-menu): add ContextMenu page and demos"
```

---

### Task 9: Playwright spec

**Files:** Create `apps/storybook/e2e/ContextMenu.spec.ts` (PascalCase like `Dropdown.spec.ts`; the spec's lowercase name differs from the repo).

- [ ] **Step 1:** Load `playwright-e2e`. Model the structure on `Dropdown.spec.ts` (iframe URL via `page.goto('/iframe.html?id=components-contextmenu--default')`, wait for story, axe on the open menu in both themes). Tests: `right-click places the menu at the pointer (bounding box within a few px)`; `flips at the bottom-right viewport edge (NearViewportEdge story)`; `Shift+F10 anchors to the focused element and Escape returns focus`; `touch long-press` in a `test.use({hasTouch: true})` block opens and a release does not select; `ancestor scroll closes the menu`; axe passes with the menu open.
- [ ] **Step 2:** Run `STORYBOOK_PORT=<free> pnpm test:e2e -- ContextMenu`. Expected: PASS. WebKit run only if CI allows (open question 4); otherwise skip with a note in the spec file header.
- [ ] **Step 3: Commit**

```bash
git add apps/storybook/e2e/ContextMenu.spec.ts
git commit -m "test(context-menu): add Playwright overlay spec"
```

---

### Task 10: Ecosystem amendments (two repositories)

**Files:**
- Modify: `C:\Users\Vlad\Desktop\projects\io\node\peakui-company\docs\ecosystem\boundaries.md` (repo `peakui-company`)
- Modify: `C:\Users\Vlad\Desktop\projects\io\node\peakui-company\peakui\docs\superpowers\specs\2026-10-04-component-roadmap-design.md` (repo `peakui`, the line "**Build only what the reference already has.**")

- [ ] **Step 1:** In `boundaries.md` add an English subsection (the file's legacy Russian stays untouched) "Core scope exceptions", after "Три продукта", with the spec's sentence verbatim: "`ContextMenu` belongs to the core (`peakui`). It is the one core component the reference does not have, admitted because it is a behaviour primitive over RAC with no premium content; pro never reimplements it." There is no "core's scope" heading today; this new subsection is the anchor.
- [ ] **Step 2:** In the roadmap spec append after that sentence: "Exception, by owner decision of 2026-11-06: `ContextMenu` is built without a reference counterpart. Any further exception needs the same explicit decision."
- [ ] **Step 3:** In `peakui-company` run `node scripts/check-agents-sync.mjs` (only needed if CLAUDE.md/AGENTS.md changed; they do not). Expected: no-op or PASS.
- [ ] **Step 4: Commit in each repository separately**

```bash
git -C C:/Users/Vlad/Desktop/projects/io/node/peakui-company add docs/ecosystem/boundaries.md
git -C C:/Users/Vlad/Desktop/projects/io/node/peakui-company commit -m "docs(ecosystem): admit ContextMenu as a core component without a reference counterpart"
git -C C:/Users/Vlad/Desktop/projects/io/node/peakui-company/peakui add docs/superpowers/specs/2026-10-04-component-roadmap-design.md
git -C C:/Users/Vlad/Desktop/projects/io/node/peakui-company/peakui commit -m "docs(specs): record ContextMenu exception to build-only-what-the-reference-has"
```

---

### Final gate

- [ ] `pnpm registries --check && pnpm lint && pnpm typecheck && pnpm test && pnpm check:tokens && pnpm lint:package && pnpm test:ai` all pass; the task summary cites `peakui-component-standards`, `peakui-docs`, `playwright-e2e`, `superpowers:writing-plans`, and quotes the Task 0 result.
