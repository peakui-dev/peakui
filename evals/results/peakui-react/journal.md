# peakui-react — journal

The record of every agent run made while writing the `peakui-react` consumer skill, and of the
finding behind each rule in it. Spec: `docs/superpowers/specs/2026-10-11-peakui-react-skill-design.md`.

**Environment of every run below.** Claude Code CLI 2.1.293, headless, tools
`Bash, Read, Edit, Write, Glob, Grep, Skill`, no MCP server, project settings only. Agent
configuration `inherit`: the CLI's only login on this machine is in the keychain, so the user's own
config directory is used and user-level memory cannot be ruled out. Each run reported 19 built-in
skills and three built-in plugins. Cost is the figure the CLI reports; the runs were billed to a
subscription, not per token. Local paths are written `<workspace>`.

## Round 0 — baseline (2026-10-11, `claude-sonnet-5-5`, no skill)

| Task | typecheck | build | static | render | Failed gating rules | Turns | Seconds | Cost USD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `profile-settings` | pass | pass | pass | pass | — | 12 | 49 | 0.28 |
| `team-members` | pass | pass | pass | pass | — (see the correction below) | 10 | 42 | 0.24 |
| `first-setup-action` | pass | pass | pass | pass | — | 12 | 51 | 0.16 |

**All three tasks pass without the skill.** By section 8.4 of the spec a task the baseline passes
outright discriminates nothing, and no skill text is written for it.

### How the agent got there

In every run the agent spent its first seven shell calls reading the installed package, and nothing
else: `node_modules/@peakui/react/dist/index.d.mts`, the `.d.mts` and `.mjs` of each component it
meant to use, each compound's `index.mjs` for the part names, and
`node_modules/@peakui/styles/components/<name>.css` for variant names. It then wrote the file in
one call and ran the type-check and the build itself.

### What the agent wrote wrong

Nothing that a gating rule catches. One mistake cost turns:

- **`first-setup-action`, `app/globals.css`.** The agent first wrote `@import "@peakui/styles";`.
  The build failed with `CssSyntaxError: … @peakui/styles/dist/index.js:1:10: Invalid declaration:
  alertVariants`, which does not name the cause. Its words after reading the error: "The bare
  import resolved to the JS entry; the CSS export is `@peakui/styles/css`." Three turns went into
  recovering. Reproduced by hand under Vite: the same specifier fails that build too.

### Not verified by the stand

- `team-members`: the agent nested `Dropdown.Trigger` inside `Tooltip.Root`. It compiles and
  renders closed; whether the tooltip and the menu both open is outside what the render layer sees.

### Corrections made after reading this round

| What | Why |
| --- | --- |
| The stand reported `tooltip.wraps-trigger` as failed for `team-members`; it now passes. | The rule looked for an ancestor spelled `Tooltip`; the agent wrote `Tooltip.Root`, which is the same component. `insideRoot` in `evals/src/scoring/ast.ts` accepts `X`, `X.Root` and `XRoot`; `form.error-in-each-required-field` had the same defect. Re-scored from the saved workspace, no agent call. |
| `doctor.mjs` now reports `css-wrong-specifier` for `@import "@peakui/styles";`. | Before this round the script accepted the bare specifier as a correct stylesheet import. It would have told the agent "No problems found" about the very line that broke the build. |
| `summarizeTranscript` needed no change. | The `tool_use` shape in the real transcript matches the one its tests assume; every flag of the invocation was accepted by CLI 2.1.293. |

## Rules and the findings behind them

The skill holds no rule yet. Its `SKILL.md` is the skeleton: the workflow, the routing table and
the fallback.
