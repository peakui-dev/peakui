import {existsSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {buildSetup, readPointer} from "../src/setup.ts";

const BLOCK = "<!-- peakui:start -->\nUse the skill.\n<!-- peakui:end -->";
let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "setup-"));
  process.env.PEAKUI_EVALS_HOME = home;
});

afterEach(() => {
  delete process.env.PEAKUI_EVALS_HOME;
  rmSync(home, {force: true, recursive: true});
});

describe("readPointer", () => {
  it("returns the marked block, markers included", () => {
    expect(readPointer(`# Page\n\n\`\`\`md\n${BLOCK}\n\`\`\`\n\nMore.`)).toBe(BLOCK);
  });

  it("throws when a marker is missing", () => {
    expect(() => readPointer("<!-- peakui:start -->\nno end")).toThrow(/peakui:end/);
    expect(() => readPointer("nothing here")).toThrow(/peakui:start/);
  });
});

describe("buildSetup", () => {
  it("skill: holds the skill and no agent file", () => {
    const dir = buildSetup("skill");

    expect(dir).toBe(join(home, "setups", "skill"));
    expect(existsSync(join(dir, ".claude/skills/peakui-react/SKILL.md"))).toBe(true);
    expect(existsSync(join(dir, "CLAUDE.md"))).toBe(false);
    expect(existsSync(join(dir, "AGENTS.md"))).toBe(false);
  });

  it("leaves no stale file from an earlier build", () => {
    const dir = buildSetup("skill");

    writeFileSync(join(dir, ".claude/skills/peakui-react/stale.md"), "old");
    buildSetup("skill");

    expect(existsSync(join(dir, ".claude/skills/peakui-react/stale.md"))).toBe(false);
  });

  it.todo("skill-pointer: also holds CLAUDE.md and AGENTS.md with exactly the pointer block");
});
