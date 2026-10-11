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

## Round 1 — skill 0.9.0 with two rules (2026-10-11, setup `skill`, no pointer)

| Task | Model | typecheck | build | static | render | Failed gating rules | Skill loaded | `docs.mjs` | `doctor.mjs` | Turns | Seconds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile-settings` | `claude-sonnet-5-5` | pass | pass | pass | pass | — | yes | 2 | 1 | 10 | 31 |
| `team-members` | `claude-sonnet-5-5` | pass | pass | pass | pass | — | yes | 4 | 1 | 12 | 32 |
| `first-setup-action` | `claude-sonnet-5-5` | pass | pass | pass | pass | — | yes | 1 | 2 | 6 | 27 |
| `profile-settings` | `claude-haiku-5-5` | pass | pass | pass | pass | — | yes | 2 | 2 | 22 | 61 |
| `team-members` | `claude-haiku-5-5` | pass | pass | pass | pass | — | yes | 6 | 1 | 17 | 54 |
| `first-setup-action` | `claude-haiku-5-5` | pass | pass | pass | pass | — | yes | 2 | 2 | 14 | 32 |

**Against round 0.** F1, F2 and F3 are gone on the model that made each, and nothing that passed
now fails. One run per cell: this shows the failures can be removed, not how often they are.

| | Sonnet, round 0 → 1 | Haiku, round 0 → 1 |
| --- | --- | --- |
| Tasks passed | 2 of 3 → 3 of 3 | 1 of 3 → 3 of 3 |
| Seconds, three tasks | 142 → 90 | 285 → 147 |
| Turns, three tasks | 34 → 28 | 57 → 53 |
| Cached input tokens read, three tasks | 763k → 329k | 2.0M → 830k |

### Observations

- **The skill loaded in all six runs without the pointer**, as the first tool call. The pointer
  rule was not triggered. The project held one skill and every prompt named PeakUI, so this says
  little about a project with many skills or a prompt that does not name the library.
- **The scripts were run as written**, from the project root with the skill's path in front
  (`node .claude/skills/peakui-react/scripts/docs.mjs …`). No call failed; no agent ran one from the
  skill's own directory.
- **`doctor.mjs` removed F4.** On the app that was not set up it reported `styles-not-imported`
  with the line to add; both agents wrote `@import "@peakui/styles/css";` at the first attempt.
- **Agents wrote the rule's shape, not its text.** `isPending` with a spinner beside the kept
  label; one `Button` inside `Tooltip` inside `Dropdown`. Labels came from the task
  ("Member actions"), not from the example ("File actions").
- **A request for many pages is too large to read.** Three of six runs asked for six to ten pages
  in one call. The output exceeded what the agent harness returns inline and was saved to a file,
  which the agent then searched with `grep`, `sed` or several partial reads — two to five extra
  steps. Sonnet avoided it once by piping a page through `head` and `sed`. Page sizes on the site:
  `button` 16 KB, `toast` 37 KB, `modal` 41 KB, `dropdown` 51 KB; Examples is 50–65% of a page and
  API Reference 25–45%.
- **Sonnet still opened the type declarations once**, for the modal's controlled state, after
  reading the page: the answer sits 220 lines into a 41 KB page.
- **No reference file was needed**, and none exists.

## Round 2 — skill 0.10.0: `docs.mjs` prints by purpose (2026-10-11, setup `skill`, no pointer)

What changed since round 1: a component page is printed as Usage and API Reference by default,
with `--examples`, `--styling`, `--full` and `--source` for the rest; `SKILL.md` describes the
flags and says to ask for two or three components per call. `--source` read a local mirror of the
repository, which was private when the round started.

| Task | Model | Layers | Failed gating rules | Skill loaded | `docs.mjs` calls | `doctor.mjs` | Turns | Seconds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile-settings` | `claude-sonnet-5-5` | all pass | — | yes | 5 | 1 | 14 | 42 |
| `team-members` | `claude-sonnet-5-5` | all pass | — | yes | 4 | 1 | 11 | 31 |
| `first-setup-action` | `claude-sonnet-5-5` | all pass | — | yes | 1 | 2 | 6 | 29 |
| `profile-settings` | `claude-haiku-5-5` | all pass | — | yes | 6 | 1 | 14 | 45 |
| `team-members` | `claude-haiku-5-5` | all pass | — | yes | 7 | 2 | 14 | 53 |
| `first-setup-action` | `claude-haiku-5-5` | all pass | — | yes | 2 | 2 | 10 | 39 |

**No result changed against round 1**, which by the plan ends the rounds.

| Three tasks together | Sonnet, round 1 → 2 | Haiku, round 1 → 2 |
| --- | --- | --- |
| Seconds | 90 → 102 | 147 → 137 |
| Turns | 28 → 31 | 53 → 38 |
| Cached input tokens read | 329k → 343k | 830k → 572k |

With one run per cell the Sonnet difference is within what two runs of the same thing would show;
the Haiku drop in turns and tokens is the only movement large enough to mention.

### Observations

- **Agents asked for three components per call, as told.** The largest single output fell from
  150–250 KB to 34–39 KB.
- **Three calls of nineteen still exceeded what the harness shows inline**, all just over its
  limit of about 30 KB: `modal dropdown tooltip`, `dropdown modal button`, and two calls chained
  in one shell command. Three overlay pages do not fit; two do, barely.
- **`--examples` was used nine times, all by Haiku**; Sonnet read the default output only.
  `--styling` and `--full` were never used: no task restyles anything.
- **`--source` was never used.** No run reached a question the page did not answer.
- **The skill loaded in all six runs without the pointer**, as in round 1 and with the same caveat.

### Change made after this round, not yet run

`SKILL.md` now says two components per call instead of two or three. The final check runs with
that text.

## Final check — skill 0.10.0, final text (2026-10-11, setup `skill`, no pointer)

`--source` read the real repository: it was made public and `main` was pushed before this check.

| Task | Model | Layers | Failed gating rules | Skill loaded | `docs.mjs` calls | `doctor.mjs` | Turns | Seconds |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile-settings` | `claude-haiku-5-5` | all pass | — | yes | 7 | 1 | 18 | 74 |
| `team-members` | `claude-haiku-5-5` | all pass | — | yes | 7 | 1 | 15 | 47 |
| `first-setup-action` | `claude-haiku-5-5` | all pass | — | yes | 2 | 2 | 11 | 33 |
| `profile-settings` | `claude-opus-5-5` | all pass | — | yes | 9 | 1 | 10 | 50 |
| `team-members` | `claude-opus-5-5` | all pass | — | yes | 5 | 0 | 13 | 43 |
| `first-setup-action` | `claude-opus-5-5` | all pass | — | yes | 1 | 1 | 8 | 30 |

### Observations

- **"Two components per call" held.** Of thirty-one calls one exceeded the inline limit — Haiku
  asked for four pages at once.
- **`--source` was used once, by Opus**, for `link`, while deciding how to render a link that looks
  like a button. The file came from GitHub; the agent then wrote a plain anchor with the button's
  classes, which is what the composition guide shows.
- **Opus skipped `doctor.mjs` in `team-members`**, the one run of eighteen that did. The project was
  already set up, so nothing was lost.
- **Opus has no baseline.** It was never run without the skill, so this table says the skill does
  not get in its way, not that it helps.

## Readiness (spec 8.4)

| # | Condition | Verdict |
| --- | --- | --- |
| 1 | Every gating rule that failed in the baseline passes with the skill on `sonnet` in the last round | Met: `menu.no-button-in-trigger` passes in rounds 1 and 2. |
| 2 | No gating rule that passed in the baseline fails with the skill | Met, on all three models. |
| 3 | On `haiku` and `opus` every task type-checks and builds; any other failed gating rule is listed for a decision | Met; no rule failed, nothing to decide. |
| 4 | Every with-skill run loaded the skill and called `docs.mjs` | Met: 18 of 18, all with the `skill` setup. The pointer was never needed here. |
| 5 | The offline gates pass | Met at commit `58e2e4a`: 139 script tests, 484 stand tests, 147 docs tests, lint, format. |
| 6 | The owner has read the skill and the results and accepts them | **Open.** |

**What the numbers are.** Twenty-four agent runs: six without the skill, eighteen with it. Without
it three of six passed; with it eighteen of eighteen. Each cell is one run, the three tasks were
written by the author of the skill, and the two rules answer failures seen on these same tasks. That
is evidence the rules remove the failures they were written for. It is not a measure of how much
the skill helps on tasks nobody has looked at.

**Not covered.** A tooltip opening on pointer hover (the browser check confirmed keyboard focus
only); a project with the skill installed and the package absent (the fixtures ship the package);
any agent other than Claude Code; a project with many skills, where loading is less certain.

**Install channel.** `npx skills add <this repository> --skill peakui-react --agent claude-code
codex --yes`, skills CLI 1.7.2, into an empty project: `.agents/skills/peakui-react/` holds the
skill and `.claude/skills/peakui-react` links to it; both scripts run through the link. Before the
contributor skills were marked internal the installer offered six skills from this repository; it
now offers one.

## Rules and the findings behind them

| Rule in the skill | File | Finding | Rule of the stand it answers |
| --- | --- | --- | --- |
| A busy button is pending, not disabled | `SKILL.md` | F3 | `submit.pending` |
| One button is the trigger of everything attached to it | `SKILL.md` | F1, F2 | `menu.no-button-in-trigger`, `menu.no-nested-interactive` |
| Workflow step 1, `doctor.mjs`: `css-wrong-specifier` | `scripts/doctor.mjs` | F4 | — (cost turns; the result passed) |

No reference file exists: no finding belongs to setup, composition of fields, or styling.
