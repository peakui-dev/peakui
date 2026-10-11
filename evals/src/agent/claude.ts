/**
 * Running Claude Code headless in a trial workspace: its argv, its environment, and what its
 * transcript says about the run. The invocation is section 6.2 of the evals design with skills
 * enabled; the adapter interface, registry and batch runner of that design are not built here.
 */

export const AGENT_TOOLS: readonly string[] = [
  "Bash",
  "Read",
  "Edit",
  "Write",
  "Glob",
  "Grep",
  "Skill",
];

/** Exact names passed from the caller's environment; everything else is dropped. */
const PASSED_THROUGH = [
  "PATH",
  "HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "USER",
  "SHELL",
  "TERM",
  "CLAUDE_CODE_OAUTH_TOKEN",
  "CLAUDE_CODE_USE_BEDROCK",
  "CLAUDE_CODE_USE_VERTEX",
];

/** Prefixes that carry credentials for the API or a cloud provider. */
const PASSED_PREFIXES = ["ANTHROPIC_", "AWS_", "GOOGLE_"];

export interface ClaudeArgsOptions {
  prompt: string;
  model: string;
  maxBudgetUsd: number;
  mcpConfigPath: string;
}

export function buildClaudeArgs(options: ClaudeArgsOptions): string[] {
  const tools = AGENT_TOOLS.join(",");

  return [
    "-p",
    options.prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--model",
    options.model,
    "--permission-mode",
    "acceptEdits",
    "--permission-prompts",
    "none",
    "--tools",
    tools,
    "--allowedTools",
    tools,
    "--setting-sources",
    "project",
    "--strict-mcp-config",
    "--mcp-config",
    options.mcpConfigPath,
    "--no-session-persistence",
    "--max-budget-usd",
    String(options.maxBudgetUsd),
  ];
}

/**
 * The agent's environment: an allow-list of the caller's, the documentation origin the skill's
 * scripts read, and — unless the caller's own login is inherited — a throwaway config directory.
 */
export function agentEnvironment(
  parent: NodeJS.ProcessEnv,
  options: {configDir?: string; docsUrl: string},
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};

  for (const [name, value] of Object.entries(parent)) {
    const passed =
      PASSED_THROUGH.includes(name) || PASSED_PREFIXES.some((prefix) => name.startsWith(prefix));

    if (passed && value !== undefined) env[name] = value;
  }

  if (options.configDir !== undefined) env.CLAUDE_CONFIG_DIR = options.configDir;
  env.PEAKUI_DOCS_URL = options.docsUrl;

  return env;
}

export interface RunSummary {
  outcome: "ok" | "agent-error" | "infra-error";
  model?: string;
  turns?: number;
  costUsd?: number;
  /** The agent loaded the `peakui-react` skill through the Skill tool. */
  skillLoaded: boolean;
  /** Shell commands that ran each of the skill's scripts. */
  scriptCalls: {docs: number; doctor: number};
}

interface ToolUse {
  name?: unknown;
  input?: Record<string, unknown>;
}

function toolUses(event: Record<string, unknown>): ToolUse[] {
  const content = (event.message as {content?: unknown} | undefined)?.content;

  if (event.type !== "assistant" || !Array.isArray(content)) return [];

  return content.filter(
    (block): block is ToolUse => (block as {type?: unknown} | null)?.type === "tool_use",
  );
}

/** Reads the raw `stream-json` lines of one run; a line that is not JSON is skipped. */
export function summarizeTranscript(lines: string[]): RunSummary {
  const summary: RunSummary = {
    outcome: "infra-error",
    scriptCalls: {docs: 0, doctor: 0},
    skillLoaded: false,
  };

  for (const line of lines) {
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }

    if (event === null || typeof event !== "object") continue;

    if (event.type === "system" && event.subtype === "init" && typeof event.model === "string") {
      summary.model = event.model;
    }

    for (const use of toolUses(event)) {
      const command = String(use.input?.command ?? "");

      if (use.name === "Skill" && String(use.input?.skill ?? "").includes("peakui-react")) {
        summary.skillLoaded = true;
      }
      if (use.name === "Bash" && command.includes("scripts/docs.mjs"))
        summary.scriptCalls.docs += 1;
      if (use.name === "Bash" && command.includes("scripts/doctor.mjs")) {
        summary.scriptCalls.doctor += 1;
      }
    }

    if (event.type === "result") {
      const failed = event.is_error === true;

      summary.outcome = !failed
        ? "ok"
        : event.terminal_reason === "api_error"
          ? "infra-error"
          : "agent-error";
      if (typeof event.num_turns === "number") summary.turns = event.num_turns;
      if (typeof event.total_cost_usd === "number") summary.costUsd = event.total_cost_usd;
    }
  }

  return summary;
}
