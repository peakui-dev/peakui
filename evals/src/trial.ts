import type {RunSummary} from "./agent/claude.ts";
import type {
  FileChanges,
  FixtureDefinition,
  LayerId,
  LayerStatus,
  PitfallId,
  TaskDefinition,
} from "./types.ts";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {dirname, join, relative, resolve, sep} from "node:path";

import {getFixture} from "../fixtures/index.ts";

import {agentEnvironment, buildClaudeArgs, summarizeTranscript} from "./agent/claude.ts";
import {runCommand} from "./exec.ts";
import {copyDir, readFiles, walkFiles} from "./files.ts";
import {agentConfigDir, workspacesDir} from "./paths.ts";
import {scoreWorkspace} from "./scoring/score.ts";
import {LAYERS} from "./types.ts";
import {
  assertSegment,
  commitInitialState,
  createWorkspace,
  diffSnapshots,
  isStrictlyInside,
  overlayDirOf,
  realResolve,
  removeWorkspace,
  snapshot,
  toolchainChanged,
  toolchainHash,
} from "./workspace/workspace.ts";

export interface PrepareOutput {
  task: string;
  label: string;
  workspace: string;
  prompt: string;
  fixture: string;
}

export interface TrialFinding {
  layer: LayerId;
  id: string;
  pitfall: PitfallId;
  pass: boolean;
  gate: boolean;
  message: string;
  file?: string;
  line?: number;
  /** Present when the finding names a file: the trial added or modified it. */
  changedDuringTrial?: boolean;
}

export interface TrialResult {
  task: string;
  label: string;
  workspace: string;
  passed: boolean;
  layers: Record<LayerId, {status: LayerStatus; durationMs: number}>;
  findings: TrialFinding[];
  changedFiles: FileChanges;
  toolchainChanged: boolean;
}

interface TrialMeta {
  schemaVersion: 1;
  task: string;
  label: string;
  fixture: string;
  toolchain: string;
  /** Hashes of the workspace files after the setup was copied, before the trial began. */
  before: Record<string, string>;
}

const META_FILE = "trial.json";
const RESULT_FILE = "result.json";
const REFERENCE_LIBRARY = /heroui/i;

/** The harness batch that holds every workspace of one label. */
export function trialBatch(label: string): string {
  assertSegment("label", label);

  return `trial-${label}`;
}

function assertSetupIsClean(setupDir: string): void {
  if (!existsSync(setupDir) || !statSync(setupDir).isDirectory()) {
    throw new Error(`setup directory ${setupDir} does not exist or is not a directory`);
  }

  for (const file of readFiles(setupDir, walkFiles(setupDir))) {
    if (REFERENCE_LIBRARY.test(file.path) || REFERENCE_LIBRARY.test(file.text)) {
      throw new Error(
        `setup file ${file.path} names the reference library (heroui); a workspace must never contain it`,
      );
    }
  }
}

export async function createTrial(options: {
  task: TaskDefinition;
  label: string;
  templateDir: string;
  setupDir?: string;
}): Promise<PrepareOutput> {
  const {label, setupDir, task, templateDir} = options;
  const batch = trialBatch(label);

  if (setupDir !== undefined) assertSetupIsClean(setupDir);

  const workspace = createWorkspace({
    batch,
    key: task.id,
    overlayDir: overlayDirOf(task),
    templateDir,
  });
  const base = dirname(workspace.dir);

  try {
    // Before the commit: what the setup adds is part of the starting point, not a trial change.
    if (setupDir !== undefined) copyDir(setupDir, workspace.dir);

    const meta: TrialMeta = {
      before: Object.fromEntries(snapshot(workspace.dir)),
      fixture: task.fixture,
      label,
      schemaVersion: 1,
      task: task.id,
      toolchain: toolchainHash(workspace.dir),
    };

    await commitInitialState(workspace.dir);
    writeFileSync(join(base, META_FILE), `${JSON.stringify(meta, null, 2)}\n`);
  } catch (error) {
    rmSync(base, {force: true, recursive: true});
    throw error;
  }

  return {
    fixture: task.fixture,
    label,
    prompt: task.prompt,
    task: task.id,
    workspace: resolve(workspace.dir),
  };
}

function locateTrial(path: string): {dir: string; meta: TrialMeta} {
  const refused = (why: string): Error =>
    new Error(`${path} is not a workspace created by prepare under ${workspacesDir()}: ${why}`);
  const root = realResolve(workspacesDir());
  const dir = realResolve(path);

  if (!isStrictlyInside(root, dir)) throw refused("outside the harness home");

  const parts = relative(root, dir).split(sep);

  if (parts.length !== 3 || parts[2] !== "app" || !parts[0]!.startsWith("trial-")) {
    throw refused("not of the shape trial-<label>/<task>/app");
  }

  let meta: TrialMeta;

  try {
    meta = JSON.parse(readFileSync(join(dirname(dir), META_FILE), "utf8")) as TrialMeta;
  } catch {
    throw refused(`no ${META_FILE} next to it`);
  }

  if (meta.schemaVersion !== 1 || typeof meta.task !== "string") throw refused("malformed record");

  return {dir, meta};
}

export async function scoreTrial(options: {
  task: TaskDefinition;
  workspace: string;
  scorer?: typeof scoreWorkspace;
}): Promise<TrialResult> {
  const {task, workspace} = options;
  const scorer = options.scorer ?? scoreWorkspace;
  const {dir, meta} = locateTrial(workspace);

  if (meta.task !== task.id) {
    throw new Error(`${workspace} was prepared for task ${meta.task}, not ${task.id}`);
  }

  const fixture: FixtureDefinition = getFixture(task.fixture);
  const base = dirname(dir);
  const scratchDir = join(base, "scratch");
  const logsDir = join(scratchDir, "logs");

  mkdirSync(logsDir, {recursive: true});

  const changes = diffSnapshots(new Map(Object.entries(meta.before)), snapshot(dir));
  const score = await scorer({changes, dir, fixture, logsDir, task});
  const touched = new Set([...changes.added, ...changes.modified]);
  const result: TrialResult = {
    changedFiles: changes,
    findings: LAYERS.flatMap((layer) =>
      score.layers[layer].findings.map((finding) => ({
        gate: finding.gate,
        id: finding.rule,
        layer,
        message: finding.message,
        pass: finding.pass,
        pitfall: finding.pitfall,
        ...(finding.file === undefined
          ? {}
          : {changedDuringTrial: touched.has(finding.file), file: finding.file}),
        ...(finding.line === undefined ? {} : {line: finding.line}),
      })),
    ),
    label: meta.label,
    layers: Object.fromEntries(
      LAYERS.map((layer) => [
        layer,
        {durationMs: score.layers[layer].durationMs, status: score.layers[layer].status},
      ]),
    ) as TrialResult["layers"],
    passed: score.passed,
    task: task.id,
    toolchainChanged: toolchainChanged({dir, scratchDir, toolchain: meta.toolchain}),
    workspace: resolve(workspace),
  };

  writeFileSync(join(base, RESULT_FILE), `${JSON.stringify(result, null, 2)}\n`);

  return result;
}

/** Removes every workspace created with `label`; returns the workspace directories removed. */
export type AgentConfigMode = "isolated" | "inherit";

/** The cap of one agent run in USD; a composite task fits well under it. */
const DEFAULT_BUDGET_USD = 2;
const RUN_TIMEOUT_MS = 15 * 60 * 1000;
/** A transcript carries every file the agent read; the default 8 MiB would cut it. */
const TRANSCRIPT_BYTES = 64 * 1024 * 1024;
const TRANSCRIPT_FILE = "transcript.jsonl";

/**
 * Runs Claude Code headless in a prepared workspace with the task's prompt. The raw transcript and
 * stderr are saved beside the workspace; scoring stays with `scoreTrial`.
 */
export async function runTrial(options: {
  task: TaskDefinition;
  workspace: string;
  model: string;
  /** Where the skill's scripts read the documentation from. */
  docsUrl: string;
  maxBudgetUsd?: number;
  /** `inherit` keeps the caller's own login, for a machine with no token in the environment. */
  agentConfig?: AgentConfigMode;
  bin?: string;
}): Promise<RunSummary & {transcript: string}> {
  const {task, workspace} = options;
  const {dir, meta} = locateTrial(workspace);

  if (meta.task !== task.id) {
    throw new Error(`${workspace} was prepared for task ${meta.task}, not ${task.id}`);
  }

  const base = dirname(dir);
  const mcpConfigPath = join(base, "mcp.json");
  const transcript = join(base, TRANSCRIPT_FILE);
  let configDir: string | undefined;

  if ((options.agentConfig ?? "isolated") === "isolated") {
    configDir = agentConfigDir(trialBatch(meta.label));
    mkdirSync(configDir, {recursive: true});
  }

  writeFileSync(mcpConfigPath, `${JSON.stringify({mcpServers: {}})}\n`);

  const result = await runCommand(
    [
      options.bin ?? process.env.PEAKUI_EVALS_CLAUDE_BIN ?? "claude",
      ...buildClaudeArgs({
        maxBudgetUsd: options.maxBudgetUsd ?? DEFAULT_BUDGET_USD,
        mcpConfigPath,
        model: options.model,
        prompt: task.prompt,
      }),
    ],
    {
      cwd: dir,
      env: agentEnvironment(process.env, {configDir, docsUrl: options.docsUrl}),
      maxOutputBytes: TRANSCRIPT_BYTES,
      timeoutMs: RUN_TIMEOUT_MS,
    },
  );

  writeFileSync(transcript, result.stdout);
  writeFileSync(join(base, "stderr.txt"), result.stderr);

  return {...summarizeTranscript(result.stdout.split("\n")), transcript};
}

export function cleanTrials(label: string): string[] {
  const batchDir = join(workspacesDir(), trialBatch(label));
  const removed: string[] = [];

  if (!existsSync(batchDir)) return removed;

  for (const entry of readdirSync(batchDir, {withFileTypes: true})) {
    const dir = join(batchDir, entry.name, "app");

    if (!entry.isDirectory() || !existsSync(dir)) continue;
    removeWorkspace({dir, scratchDir: join(batchDir, entry.name, "scratch"), toolchain: ""});
    removed.push(dir);
  }

  try {
    rmdirSync(batchDir);
  } catch {
    // Something other than a workspace is in there; it is not ours to delete.
  }

  return removed;
}

export function formatList(tasks: TaskDefinition[]): string {
  return tasks.map((task) => `${task.id}\t${task.fixture}\t${task.title}`).join("\n");
}
