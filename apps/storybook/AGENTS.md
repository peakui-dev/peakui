# @peakui/storybook — AI Context

Storybook for the PeakUI core. It is the only place a component is seen rendered, and the host for
browser-level tests (Playwright e2e, a11y, VRT).

Parent context: [`../../AGENTS.md`](../../AGENTS.md). Component rules:
[`peakui-component-standards`](../../.agents/skills/peakui-component-standards/SKILL.md).
E2E rules: [`playwright-e2e`](../../.agents/skills/playwright-e2e/SKILL.md).

## Commands

| Action            | Command                              |
| ----------------- | ------------------------------------ |
| Dev               | `pnpm dev` (port **6007**)           |
| Build static      | `pnpm build` → `storybook-static/`   |
| E2E (dev server)  | `pnpm test:e2e`                      |
| E2E (build first) | `pnpm test:e2e:ci`                   |
| Typecheck         | `pnpm typecheck`                     |

From the repo root the same work runs as `pnpm dev:storybook`, `pnpm build:storybook`,
`pnpm test:e2e`, `pnpm test:e2e:ci`.

**Port 6007 is a default, not a guarantee.** `storybook dev` prompts for another port when 6007 is
taken and exits on `--ci`. Playwright reads `STORYBOOK_PORT` and launches Storybook itself on that
port, so `STORYBOOK_PORT=6017 pnpm test:e2e` works. The `dev` script cannot: pnpm does not expand
`${VAR}` in a script body and passes it to Storybook literally, so a manual server on another port is
`pnpm exec storybook dev --host 127.0.0.1 --port 6017 --no-open`.

Playwright never reuses a server it did not start (`reuseExistingServer: false`). If 6007 is held by
another project it fails with "already used" instead of silently testing that project's Storybook.

## Layout

```
apps/storybook/
├── .storybook/
│   ├── main.ts                 # framework, addons, story globs
│   ├── preview.tsx             # decorators, globals, parameters
│   ├── globals.css             # the ONLY CSS entry point
│   └── decorators/theme.tsx    # theme switcher
├── src/stories/                # foundation stories (tokens, colors)
├── e2e/                        # Playwright specs
├── playwright.config.ts
└── vite.config.ts              # react + tailwind plugins
```

Component stories do **not** live here. They sit beside their component in
`packages/react/src/components/<component-name>/<component-name>.stories.tsx` and are picked up by
the glob in `main.ts`. Only foundation stories — things that belong to `@peakui/styles` rather than
to a component — belong in `src/stories/`.

## The CSS contract

`@peakui/styles` does **not** import Tailwind. It ships `@theme inline`, `@utility` and
`@custom-variant`, all of which extend an already-declared Tailwind. So `globals.css` imports
Tailwind first and the styles package second, and that order is load-bearing:

```css
@import "tailwindcss";
@import "@peakui/styles/css";
```

Two consequences for anything written here:

- **Never build a class name from a variable.** Tailwind finds classes by scanning source text, so
  `` className={`bg-${role}`} `` compiles to nothing. Write the full class and pick between whole
  strings.
- **`@source` is manual.** `node_modules` is outside Tailwind's autodetection. When
  `packages/react` lands, uncomment the `@source` line in `globals.css` or its components' utilities
  will not be generated.

## Themes

`@peakui/styles` generates `default-light` and `default-dark` (see `packages/styles/presets`). The
theme decorator writes both `data-theme` and a class onto the preview's `<html>`, because
`variables.css` declares theme selectors on `:root`/`[data-theme]` — a wrapper element around the
story would not activate them.

A story can be opened at a given theme directly:
`/iframe.html?id=<story-id>&globals=theme:default-dark`.

## Story ids are ASCII

`title` is ASCII (`Foundations/Colors`, `Components/<Name>`) because Storybook derives the story id
from it, and that id becomes the e2e URL and the VRT snapshot name. Cyrillic belongs in the
story's `name` and in its rendered content, not in `title`.

## `export default` here is not a convention violation

The repo rule is named exports only. CSF and Storybook's config loader read a module's default
export, so `main.ts`, `preview.tsx` and every `*.stories.tsx` meta must use `export default`. This
is the contract of the tool, and it stops at these files.

## Behavioral smoke with agent-browser

Text feedback only — screenshots are VRT's job, not an agent's. Open the **iframe** URL, not the
manager, so the tree is the story and nothing else:

```bash
agent-browser open "http://127.0.0.1:6007/iframe.html?id=<story-id>"
agent-browser snapshot -i          # interactive elements with refs
agent-browser click @e3            # act on a ref
agent-browser snapshot --delta     # what the action changed
agent-browser errors               # page errors (empty = clean)
agent-browser console              # console output
agent-browser a11y --tags wcag2a,wcag2aa,wcag22aa
```

The audit command is `a11y`. There is no `agent-browser axe`.

## Accessibility

The floor is WCAG 2.2 AA plus `forced-colors`.

**The gate is `e2e/foundations.a11y.spec.ts`, not the addon.** `preview.tsx` sets
`a11y.test: "error"`, but nothing consumes that flag here: it needs `@storybook/addon-vitest`, which
this app does not install, and `storybook build` checks no accessibility. The addon gives a panel in
the Storybook UI and nothing more.

The spec audits a story by navigating to `/iframe.html?id=<story-id>` and running axe over the whole
page. Do not audit through the manager with a frame selector: `injectAxe` only reaches the page's
main frame, and `checkA11y(page, "#storybook-preview-iframe")` therefore measures the iframe element
in the manager rather than the story inside it — it reports success having inspected nothing. That
exact mistake shipped here once and hid a real contrast defect.

Two exclusions are in the spec, each with its reason in a comment: the `status-disabled` demos, which
carry `opacity: 0.5` by design and which WCAG 1.4.3 exempts as inactive components, and
`.bg-accent-hover`, a confirmed token-layer defect tracked in the ecosystem backlog. Adding an
exclusion to turn a story green is not a fix; adding one with a tracked reason is.
