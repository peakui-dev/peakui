# Agent Readiness

A component library in 2026 is consumed by AI coding tools as much as by people. If an agent cannot
generate correct PeakUI code, the library is not adopted — regardless of how good the components are.
This is a shipping requirement, not documentation polish.

The PeakUI ecosystem already has the consumers: `peakui-mcp` serves component documentation to AI
assistants, and `peakui-agents` drives model-generated UI. Both read what a component publishes here.

## The failure this prevents

An agent's training data contains the *old* version of every library. Left alone, it writes
confidently wrong code from memory and never consults the docs. This is not hypothetical — it is how
PeakUI's own component standard came to describe a v2 architecture, and it was reproduced
deliberately: an agent that read the correct vendored reference still overrode it with the
instructions it had been given.

So the agent-facing surface leads with an explicit correction, before any API detail:

```markdown
## CRITICAL: ignore what you remember

PeakUI follows HeroUI v3 conventions. Material in your training data is likely v2.

| You may remember (WRONG) | Correct |
| ------------------------ | ------- |
| `classNames={{...}}`     | `data-slot` + BEM |
| `<Card title="…" />`     | `<Card><Card.Header>…` |
| …                        | … |

Fetch the current docs before implementing.
```

A version table of wrong→right beats a prose description of right, because it intercepts the specific
thing the agent is about to do.

## What every component publishes

| Artifact                  | Where                           | Content                                                      |
| ------------------------- | ------------------------------- | ------------------------------------------------------------ |
| Canonical example         | `apps/docs/content/components/<component-name>.mdx` | One copy-pasteable example per variant, imports included      |
| Props reference           | generated from the types        | Never hand-maintained — a hand-written table drifts within a release |
| Part list                 | the same docs page              | Every part, both call styles, which are required              |
| `data-slot` list          | the same docs page              | The styling contract consumers and agents target              |
| Common mistakes           | the same docs page              | The v2-shaped errors specific to this component               |
| Stories                   | `<component-name>.stories.tsx`  | The example corpus; VRT and docs both read it                 |

## Machine-readable entry points

- **`llms.txt`** at the documentation root — a flat, link-rich index an agent can fetch in one request
  to discover every component and its docs URL. Kept generated, never hand-edited.
- **MCP** — `peakui-mcp` exposes list-components / get-component-docs / get-theme over the same source
  of truth as the docs site. Adding a component means it appears there automatically; if it does not,
  the component is not finished.
- **A skill** — the installable equivalent of this file for *consumers* of PeakUI, carrying the
  version guard above plus the import and theming basics.

## Rules

- **Generated, not written.** Props, parts and `data-slot` lists are derived from source. A
  hand-written copy is a future lie.
- **One source of truth.** Docs site, MCP and `llms.txt` serve the same data. Three hand-maintained
  copies is the failure mode this ecosystem already documents.
- **A story per variant.** A variant with no story is invisible to docs, to VRT, and to any agent
  looking for an example.
- **Stated constraints, not implied ones.** "Must render the expected element type" and "a part must
  be inside its Root" are written down, because an agent cannot infer them from a signature.
- **No component reaches `stable`** without its agent-facing entry. This is in the status criteria in
  `api-evolution.md`.

## Writing for a model and a person at once

The same text serves both, if it is specific:

- Lead with the wrong→right correction, then the API.
- Give a complete example with its imports — a fragment makes an agent invent the surrounding code.
- Name the thing exactly: `data-slot="select-trigger"`, not "the trigger slot".
- State what is forbidden, not only what is allowed. `floating-ui` is absent from this library; saying
  so prevents an agent from adding it back.
