import {mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join} from "node:path";

import {copyDir} from "./files.ts";
import {REPO_DIR, evalsHome} from "./paths.ts";

/**
 * Starting states for a skill trial, as directories for `trial prepare --setup`: the consumer
 * skill installed the way Claude Code reads it, with or without the always-on pointer.
 */
export type SetupKind = "skill" | "skill-pointer";

export const SETUP_KINDS: readonly SetupKind[] = ["skill", "skill-pointer"];

const SKILL_DIR = join(REPO_DIR, "skills/peakui-react");
/** The docs page whose code block is the canonical text of the pointer. */
const POINTER_PAGE = join(
  REPO_DIR,
  "apps/docs/content/docs/en/react/getting-started/(ui-for-agents)/agent-skills.mdx",
);
const START = "<!-- peakui:start -->";
const END = "<!-- peakui:end -->";

/** The pointer block of the page, markers included. */
export function readPointer(mdx: string): string {
  const start = mdx.indexOf(START);

  if (start === -1) throw new Error(`the page has no ${START} marker`);

  const end = mdx.indexOf(END, start);

  if (end === -1) throw new Error(`the page has no ${END} marker after ${START}`);

  return mdx.slice(start, end + END.length);
}

/** Builds the setup directory afresh and returns its path. */
export function buildSetup(kind: SetupKind): string {
  const dir = join(evalsHome(), "setups", kind);

  rmSync(dir, {force: true, recursive: true});
  mkdirSync(join(dir, ".claude/skills"), {recursive: true});
  copyDir(SKILL_DIR, join(dir, ".claude/skills/peakui-react"));

  if (kind === "skill-pointer") {
    const pointer = `${readPointer(readFileSync(POINTER_PAGE, "utf8"))}\n`;

    writeFileSync(join(dir, "CLAUDE.md"), pointer);
    writeFileSync(join(dir, "AGENTS.md"), pointer);
  }

  return dir;
}
