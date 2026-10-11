import {describe, expect, it} from "vitest";

import {
  AGENT_TOOLS,
  agentEnvironment,
  buildClaudeArgs,
  summarizeTranscript,
} from "../src/agent/claude.ts";

describe("buildClaudeArgs", () => {
  it("builds the headless argv with skills enabled", () => {
    const args = buildClaudeArgs({
      maxBudgetUsd: 2,
      mcpConfigPath: "/x/mcp.json",
      model: "sonnet",
      prompt: "do it",
    });

    expect(args.slice(0, 2)).toEqual(["-p", "do it"]);

    for (const [flag, value] of [
      ["--output-format", "stream-json"],
      ["--model", "sonnet"],
      ["--permission-mode", "acceptEdits"],
      ["--permission-prompts", "none"],
      ["--setting-sources", "project"],
      ["--mcp-config", "/x/mcp.json"],
      ["--max-budget-usd", "2"],
      ["--tools", AGENT_TOOLS.join(",")],
      ["--allowedTools", AGENT_TOOLS.join(",")],
    ]) {
      expect(args[args.indexOf(flag!) + 1], flag).toBe(value);
    }

    expect(args).toEqual(
      expect.arrayContaining(["--verbose", "--strict-mcp-config", "--no-session-persistence"]),
    );
    expect(AGENT_TOOLS).toContain("Skill");
    expect(args).not.toContain("--disable-slash-commands");
  });
});

describe("agentEnvironment", () => {
  it("passes only allow-listed variables, the config directory and the docs origin", () => {
    const env = agentEnvironment(
      {
        ANTHROPIC_API_KEY: "k",
        CLAUDE_CODE_ENTRYPOINT: "cli",
        HOME: "/h",
        PATH: "/bin",
        SECRET: "s",
      },
      {configDir: "/cfg", docsUrl: "http://localhost:3100"},
    );

    expect(env).toEqual({
      ANTHROPIC_API_KEY: "k",
      CLAUDE_CONFIG_DIR: "/cfg",
      HOME: "/h",
      PATH: "/bin",
      PEAKUI_DOCS_URL: "http://localhost:3100",
    });
  });

  it("keeps the token and cloud credentials an agent authenticates with", () => {
    const env = agentEnvironment(
      {AWS_REGION: "r", CLAUDE_CODE_OAUTH_TOKEN: "t", GOOGLE_CLOUD_PROJECT: "p"},
      {docsUrl: "u"},
    );

    expect(env).toMatchObject({
      AWS_REGION: "r",
      CLAUDE_CODE_OAUTH_TOKEN: "t",
      GOOGLE_CLOUD_PROJECT: "p",
    });
  });

  it("passes a source mirror when one is given, and none otherwise", () => {
    expect(agentEnvironment({}, {docsUrl: "u", sourceUrl: "http://localhost:3101/"})).toMatchObject(
      {PEAKUI_SOURCE_URL: "http://localhost:3101/"},
    );
    expect(agentEnvironment({}, {docsUrl: "u"})).not.toHaveProperty("PEAKUI_SOURCE_URL");
  });

  it("omits the config directory in inherit mode", () => {
    expect(agentEnvironment({PATH: "/bin"}, {docsUrl: "u"})).not.toHaveProperty(
      "CLAUDE_CONFIG_DIR",
    );
  });
});

describe("summarizeTranscript", () => {
  const toolUse = (name: string, input: unknown) =>
    JSON.stringify({message: {content: [{input, name, type: "tool_use"}]}, type: "assistant"});

  it("summarizes a transcript", () => {
    const lines = [
      JSON.stringify({model: "claude-sonnet-x", subtype: "init", type: "system"}),
      toolUse("Skill", {skill: "peakui-react"}),
      toolUse("Bash", {command: "node .claude/skills/peakui-react/scripts/docs.mjs button"}),
      toolUse("Bash", {command: "node .claude/skills/peakui-react/scripts/doctor.mjs"}),
      "not json",
      JSON.stringify({is_error: false, num_turns: 9, total_cost_usd: 0.41, type: "result"}),
    ];

    expect(summarizeTranscript(lines)).toEqual({
      costUsd: 0.41,
      model: "claude-sonnet-x",
      outcome: "ok",
      scriptCalls: {docs: 1, doctor: 1},
      skillLoaded: true,
      turns: 9,
    });
  });

  it("counts a script however its path is written, once per invocation", () => {
    const summary = summarizeTranscript([
      toolUse("Bash", {
        command:
          "S=.claude/skills/peakui-react/scripts; node $S/doctor.mjs; node $S/docs.mjs list; node $S/docs.mjs modal dropdown",
      }),
      toolUse("Bash", {command: "cd .claude/skills/peakui-react/scripts && node docs.mjs button"}),
      toolUse("Bash", {command: "cat .claude/skills/peakui-react/scripts/docs.mjs | head"}),
      JSON.stringify({is_error: false, type: "result"}),
    ]);

    expect(summary.scriptCalls).toEqual({docs: 3, doctor: 1});
  });

  it("does not count another skill or an unrelated command", () => {
    const summary = summarizeTranscript([
      toolUse("Skill", {skill: "code-review"}),
      toolUse("Bash", {command: "npm run build"}),
      JSON.stringify({is_error: false, type: "result"}),
    ]);

    expect(summary.skillLoaded).toBe(false);
    expect(summary.scriptCalls).toEqual({docs: 0, doctor: 0});
  });

  it("classifies a missing result and an API error as infra-error, another error as agent-error", () => {
    const result = (fields: object) => [JSON.stringify({type: "result", ...fields})];

    expect(summarizeTranscript([]).outcome).toBe("infra-error");
    expect(
      summarizeTranscript(result({is_error: true, terminal_reason: "api_error"})).outcome,
    ).toBe("infra-error");
    expect(summarizeTranscript(result({is_error: true})).outcome).toBe("agent-error");
  });
});
