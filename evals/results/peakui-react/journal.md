# peakui-react — journal

The record of every agent run made while writing the `peakui-react` consumer skill, and of the
finding behind each rule in it. Spec: `docs/superpowers/specs/2026-10-11-peakui-react-skill-design.md`.

**Environment of every run below.** Claude Code CLI 2.1.293, headless, tools
`Bash, Read, Edit, Write, Glob, Grep, Skill`, no MCP server, project settings only. Agent
configuration `inherit`: the CLI's only login on this machine is in the keychain, so the user's own
config directory is used and user-level memory cannot be ruled out. Each run reported 19 built-in
skills and three built-in plugins. Cost is the figure the CLI reports; the runs were billed to a
subscription, not per token. Local paths are written `<workspace>`.

## Round 0 — baseline (2026-10-11, no skill)

Results as scored after the corrections listed at the end of this section. Every re-score read the
saved workspace; no agent was run twice.

| Task | Model | typecheck | build | static | render | Failed gating rules | Turns | Seconds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile-settings` | `claude-sonnet-5-5` | pass | pass | pass | pass | — | 12 | 49 |
| `team-members` | `claude-sonnet-5-5` | pass | pass | **fail** | pass | `menu.no-button-in-trigger` | 10 | 42 |
| `first-setup-action` | `claude-sonnet-5-5` | pass | pass | pass | pass | — | 12 | 51 |
| `profile-settings` | `claude-haiku-5-5` | pass | pass | pass | **fail** | `submit.pending` | 25 | 130 |
| `team-members` | `claude-haiku-5-5` | pass | pass | pass | **fail** | `menu.no-nested-interactive` | 18 | 91 |
| `first-setup-action` | `claude-haiku-5-5` | pass | pass | pass | pass | — | 14 | 64 |

Every run type-checks and builds. The three failures are all mistakes that compile.

### How the agents got there

No run had documentation. Each agent read the installed package instead — the `.d.mts` and `.mjs`
of every component it meant to use, each compound's `index.mjs` for the part names, and
`@peakui/styles/components/<name>.css` for variant names — then wrote the file and ran the
type-check and the build itself. Sonnet spent seven shell calls on reading; Haiku twelve to
fourteen, and unpacked the package tarball it found in the project to do it.

### What the agents wrote wrong

- **F1 — a button inside the menu's trigger part** (`team-members`, Sonnet,
  `src/pages/TeamMembers.tsx`).

  ```tsx
  <Tooltip.Root>
    <Dropdown.Trigger>
      <Button isIconOnly aria-label="More" size="sm" variant="ghost">
  ```

  `Dropdown.Trigger` renders a button itself, so this is a button in a button: invalid markup and
  two nested pressable elements. The agent read `Dropdown.Trigger` in the type declarations and
  treated it as a wrapper for the trigger.

- **F2 — a pressable element inside the tooltip's trigger part** (`team-members`, Haiku, same file).

  ```tsx
  <Tooltip.Trigger render={(props) => <span {...props} role={undefined} />}>
    <Dropdown.Root>
      <Dropdown.Trigger aria-label="Member actions" className={buttonVariants({…})}>
  ```

  `Tooltip.Trigger` makes non-interactive content focusable. Wrapping the menu button in it adds a
  second tab stop with no role and no name; the agent removed the role to silence the nesting.

  F1 and F2 are the same gap: neither agent knew that one `Button`, placed directly inside both
  `Dropdown` and `Tooltip`, is the trigger of both.

- **F3 — disabled instead of pending** (`profile-settings`, Haiku,
  `src/pages/ProfileSettings.tsx:139`).

  ```tsx
  <Button type="submit" variant="primary" isDisabled={saving}>
    {saving && <Spinner />}
  ```

  A disabled button drops out of the focus order and announces nothing about the wait; the pending
  state keeps focus and ignores presses.

- **F4 — the bare stylesheet specifier** (`first-setup-action`, Sonnet, `app/globals.css`). The
  agent first wrote `@import "@peakui/styles";`. The build failed with `CssSyntaxError: …
  @peakui/styles/dist/index.js:1:10: Invalid declaration: alertVariants`, which does not name the
  cause. Its words after reading the error: "The bare import resolved to the JS entry; the CSS
  export is `@peakui/styles/css`." Three turns went into recovering; the final result passes.
  Reproduced by hand under Vite: the same specifier fails that build too.

### The reference solution, checked in a browser

`team-members/solutions/good` was served with the Vite dev server and driven through the whole
flow: keyboard focus on the row button shows the tooltip and sets `aria-describedby`; the button
opens the menu with both items; "Remove" opens the dialog titled "Remove member?"; its "Remove"
button calls `onRemove("m1")` and the toast "Member removed" appears. No console error. Hover was
not confirmed: the automation's synthetic hover did not open the tooltip, which says nothing about
a real pointer.

### Corrections made after reading this round

| What | Why |
| --- | --- |
| `insideRoot` in `evals/src/scoring/ast.ts`; used by `tooltip.wraps-trigger` and `form.error-in-each-required-field`. | Both rules looked for an ancestor spelled `Tooltip` or `TextField`. Sonnet wrote `Tooltip.Root`, the same component, and was failed for it. |
| New rule `menu.no-button-in-trigger` (static), with the reference solution `bad-nested-button`. | F1 passed every rule. The rendered layer cannot see it: an HTML parser closes the outer button when it meets the inner one. |
| New rule `menu.no-nested-interactive` (render), with the reference solution `bad-interactive-in-tooltip-trigger`. | F2 passed every rule about nesting. |
| `menu.trigger-named` accepts the Dropdown's trigger part as well as a `Button`. | Haiku's trigger has an accessible name; the rule failed it for the element it chose, which F2 already covers. |
| `doctor.mjs` reports `css-wrong-specifier` for `@import "@peakui/styles";`. | F4. Before this round the script accepted the bare specifier and would have answered "No problems found" about the line that broke the build. |
| `summarizeTranscript` needed no change. | The `tool_use` shape of the real transcript matches its tests; CLI 2.1.293 accepted every flag. |

## Rules and the findings behind them

The skill holds no rule yet. Its `SKILL.md` is the skeleton: the workflow, the routing table and
the fallback. The findings a rule may answer are F1–F3 above; F4 is answered by `doctor.mjs`.
