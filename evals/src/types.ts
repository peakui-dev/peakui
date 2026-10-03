import type {Root} from "postcss";

export type PitfallId =
  | "css-order"
  | "tailwind-scanning"
  | "composition"
  | "styling"
  | "fields"
  | "rac-props"
  | "variants"
  | "peers-rsc"
  | "imports"
  | "no-provider"
  | "other";

export type LayerId = "typecheck" | "build" | "static" | "render";

export const LAYERS: readonly LayerId[] = ["typecheck", "build", "static", "render"];

export type LayerStatus = "pass" | "fail" | "not-applicable";

export interface Finding {
  rule: string;
  pitfall: PitfallId;
  pass: boolean;
  /** false: informational, never fails a layer. */
  gate: boolean;
  message: string;
  /** Workspace-relative, forward slashes. */
  file?: string;
  /** 1-based. */
  line?: number;
  excerpt?: string;
}

export interface LayerResult {
  layer: LayerId;
  status: LayerStatus;
  durationMs: number;
  findings: Finding[];
}

export interface Mistake {
  layer: LayerId;
  rule: string;
  pitfall: PitfallId;
  message: string;
  file?: string;
  line?: number;
  excerpt?: string;
  justification?: string;
}

export interface ProjectFile {
  path: string;
  text: string;
}

export interface FileChanges {
  added: string[];
  modified: string[];
  deleted: string[];
}

export interface FixtureDefinition {
  id: string;
  /** Absolute path of the fixture's source directory. */
  dir: string;
  /** Commands run once in the template after `npm install`. */
  prepare: string[][];
  typecheck: string[][];
  build: string[][];
  /** Output directories removed before scoring. */
  clean: string[];
  /** Directory, relative to the workspace, whose `.css` files are the built CSS. */
  builtCssDir: string;
}

export interface StaticContext {
  /** Every `.ts`, `.tsx` and `.css` project file after the run. */
  files: ProjectFile[];
  changes: FileChanges;
  file(path: string): ProjectFile | undefined;
}

export interface RenderCase {
  name: string;
  /** The string "__fn__" anywhere in props becomes a no-op function. */
  props: Record<string, unknown>;
}

export interface RenderContext {
  /** Keyed by case name; the document of `html` is keyed "html". */
  documents: Map<string, Document>;
  /** Parsed concatenation of the built CSS; undefined when the build left none. */
  css: Root | undefined;
}

export interface RenderSpec {
  ssr?: {module: string; exportName: string; cases: RenderCase[]};
  html?: {path: string};
  check(context: RenderContext): Finding[];
}

export interface TaskDefinition {
  id: string;
  title: string;
  fixture: string;
  pitfalls: PitfallId[];
  prompt: string;
  staticChecks(context: StaticContext): Finding[];
  render?: RenderSpec;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export type TranscriptEvent =
  | {kind: "text"; text: string}
  | {kind: "tool"; id: string; name: string; input: unknown; writes: string[]}
  | {kind: "tool-result"; id: string; isError: boolean; text: string};

export interface AgentSetup {
  tools: string[];
  skillsEnabled: boolean;
  mcpConfigPath?: string;
  allowedMcpServers: string[];
}

export interface AgentEnvironment {
  version?: string;
  model?: string;
  tools: string[];
  mcpServers: string[];
  skills: string[];
  plugins: string[];
}

export type AgentOutcome = "ok" | "timeout" | "budget" | "agent-error" | "infra-error";

export interface AgentRunRequest {
  taskId: string;
  cwd: string;
  prompt: string;
  model: string;
  timeoutMs: number;
  maxBudgetUsd: number;
  setup: AgentSetup;
  transcriptPath: string;
  stderrPath: string;
}

export interface AgentRunResult {
  outcome: AgentOutcome;
  exitCode: number | null;
  durationMs: number;
  usage?: TokenUsage;
  costUsd?: number;
  turns?: number;
  finalMessage?: string;
  error?: string;
  environment: AgentEnvironment;
  events: TranscriptEvent[];
}

export interface AdapterInfo {
  id: string;
  binary: string;
  version: string;
  authenticated: boolean;
  detail: string;
}

export interface AgentAdapter {
  readonly id: string;
  describe(): Promise<AdapterInfo>;
  run(request: AgentRunRequest): Promise<AgentRunResult>;
}

export interface ExpectedEnvironment {
  mcpServers: string[];
  skills: string[];
}

export type Availability = {ok: true} | {ok: false; reason: string};

export interface ConfigurationContext {
  workspaceDir: string;
  /** Per-run directory outside the workspace. */
  scratchDir: string;
  task: TaskDefinition;
}

export interface ConfigurationResult {
  setup: AgentSetup;
  expected: ExpectedEnvironment;
  /** Artifact name to version, stored in the record. */
  artifacts: Record<string, string>;
}

export interface Configuration {
  readonly id: string;
  readonly description: string;
  available(): Promise<Availability>;
  apply(context: ConfigurationContext): Promise<ConfigurationResult>;
}

export interface RunKey {
  task: string;
  configuration: string;
  repetition: number;
}

export type RunStatus = "completed" | "infra-error";

export interface RunRecord {
  schemaVersion: 1;
  key: string;
  batch: string;
  task: string;
  configuration: string;
  repetition: number;
  fixture: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  agent: {
    adapter: string;
    outcome: AgentOutcome;
    durationMs: number;
    turns?: number;
    usage?: TokenUsage;
    costUsd?: number;
    error?: string;
    finalMessage?: string;
    narration: string[];
    environment: AgentEnvironment;
    artifacts: Record<string, string>;
  };
  /** Absent when status is "infra-error". */
  layers?: Record<LayerId, LayerResult>;
  passed: boolean;
  mistakes: Mistake[];
  changes: FileChanges;
  outsideAccess: string[];
}

export interface BatchManifest {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  adapter: AdapterInfo;
  model: string;
  tasks: string[];
  configurations: string[];
  repetitions: number;
  libraryHash: string;
  templateHashes: Record<string, string>;
  node: string;
  npm: string;
  platform: string;
  isolation: "isolated" | "inherit";
  timeoutMs: number;
  maxBudgetUsd: number;
}
