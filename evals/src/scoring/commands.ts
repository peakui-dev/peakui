import type {Finding, FixtureDefinition, LayerResult, PitfallId} from "../types.ts";

import {mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join} from "node:path";

import {runCommand} from "../exec.ts";
import {evalsHome} from "../paths.ts";

import {check, layerResult} from "./findings.ts";

export interface Diagnostic {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
}

const DIAGNOSTIC_START = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const MESSAGE_LIMIT = 300;

export function parseTscOutput(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  let current: Diagnostic | undefined;

  for (const line of output.split(/\r?\n/)) {
    const match = DIAGNOSTIC_START.exec(line);

    if (match) {
      current = {
        code: match[4]!,
        column: Number(match[3]),
        file: match[1]!,
        line: Number(match[2]),
        message: match[5]!,
      };
      diagnostics.push(current);
    } else if (current && /^\s/.test(line)) {
      current.message += `\n${line}`;
    } else {
      current = undefined;
    }
  }

  return diagnostics;
}

interface Rule {
  test: (message: string) => boolean;
  rule: string;
  pitfall: PitfallId;
}

const DIAGNOSTIC_RULES: Rule[] = [
  {
    pitfall: "no-provider",
    rule: "provider",
    test: (m) => /has no exported member '\w*Provider'/.test(m),
  },
  {
    pitfall: "imports",
    rule: "deep-import",
    test: (m) => /Cannot find module '@peakui\/(react|styles)\//.test(m),
  },
  {
    pitfall: "imports",
    rule: "unknown-export",
    test: (m) => /Module '"@peakui\/[^"]+"' has no exported member/.test(m),
  },
  {
    pitfall: "composition",
    rule: "unknown-composition-prop",
    test: (m) =>
      /Property '(as|classNames|label|errorMessage|description|helperText|startContent|endContent|labelPlacement)' does not exist/.test(
        m,
      ),
  },
  {
    pitfall: "rac-props",
    rule: "unknown-state-prop",
    test: (m) =>
      /Property '(isLoading|loading|disabled|readOnly|required|onClick|isDisable)' does not exist/.test(
        m,
      ),
  },
  {
    pitfall: "variants",
    rule: "unknown-variant",
    test: (m) =>
      /Property '(color|radius|colorScheme)' does not exist/.test(m) ||
      /^Type '"[^"]*"' is not assignable to type '"[^']*" \| /.test(m),
  },
];

export function classifyDiagnostic(message: string): {rule: string; pitfall: PitfallId} {
  for (const entry of DIAGNOSTIC_RULES) {
    if (entry.test(message)) return {pitfall: entry.pitfall, rule: entry.rule};
  }

  return {pitfall: "other", rule: "type-error"};
}

const BUILD_RULES: {pattern: RegExp; rule: string; pitfall: PitfallId}[] = [
  {
    pattern:
      /Event handlers cannot be passed to Client Component props|Functions cannot be passed directly to Client Components/,
    pitfall: "peers-rsc",
    rule: "function-across-server-boundary",
  },
  {
    pattern: /Cannot apply unknown utility class/,
    pitfall: "css-order",
    rule: "styles-without-tailwind",
  },
];

function clip(text: string): string {
  return text.trim().slice(0, MESSAGE_LIMIT);
}

export function classifyBuildOutput(output: string): Finding[] {
  const lines = output.split(/\r?\n/);
  const findings: Finding[] = [];

  for (const {pattern, pitfall, rule} of BUILD_RULES) {
    const line = lines.find((candidate) => pattern.test(candidate));

    if (line !== undefined) findings.push(check(rule, pitfall, false, clip(line)));
  }

  if (findings.length > 0) return findings;

  const nonEmpty = lines.filter((line) => line.trim() !== "");
  const first = nonEmpty.find((line) => /error/i.test(line)) ?? nonEmpty.at(-1) ?? "build failed";

  return [check("build-error", "other", false, clip(first))];
}

export function cleanBuildOutput(fixture: FixtureDefinition, dir: string): void {
  for (const path of fixture.clean) rmSync(join(dir, path), {force: true, recursive: true});
}

const PASSED_THROUGH = ["PATH", "LANG", "LC_ALL", "TZ", "TMPDIR"];

/**
 * The environment of the type-check and build commands. They execute configuration files the
 * agent wrote, so they get an allow-list, never the parent's variables (API keys among them), and
 * a scratch home inside the harness home instead of the developer's.
 */
export function commandEnvironment(): NodeJS.ProcessEnv {
  const home = join(evalsHome(), "command-home");
  const env: NodeJS.ProcessEnv = {};

  mkdirSync(home, {recursive: true});
  for (const name of PASSED_THROUGH) {
    const value = process.env[name];

    if (value !== undefined) env[name] = value;
  }

  return {...env, CI: "1", HOME: home, NEXT_TELEMETRY_DISABLED: "1", NO_COLOR: "1"};
}

function lastLine(output: string): string {
  return (
    output
      .split(/\r?\n/)
      .filter((line) => line.trim() !== "")
      .at(-1) ?? ""
  );
}

function excerptOf(dir: string, file: string, line: number): string | undefined {
  try {
    const text = readFileSync(join(dir, file), "utf8").split(/\r?\n/)[line - 1];

    return text === undefined ? undefined : text.trim();
  } catch {
    return undefined;
  }
}

interface Pipeline {
  output: string;
  failed: boolean;
  timedOut: boolean;
  durationMs: number;
}

async function runAll(
  commands: string[][],
  dir: string,
  logPath: string,
  timeoutMs: number,
): Promise<Pipeline> {
  const started = Date.now();
  let output = "";
  let failed = false;
  let timedOut = false;

  for (const argv of commands) {
    const result = await runCommand(argv, {cwd: dir, env: commandEnvironment(), timeoutMs});

    output += `$ ${argv.join(" ")}\n${result.stdout}${result.stderr}\n`;
    if (result.timedOut) {
      timedOut = true;
      failed = true;
      break;
    }
    if (result.exitCode !== 0) {
      failed = true;
      break;
    }
  }

  writeFileSync(logPath, output);

  return {durationMs: Date.now() - started, failed, output, timedOut};
}

export async function runTypecheck(
  fixture: FixtureDefinition,
  dir: string,
  logPath: string,
): Promise<LayerResult> {
  const run = await runAll(fixture.typecheck, dir, logPath, 180_000);

  if (run.timedOut) {
    return layerResult(
      "typecheck",
      [check("type-error", "other", false, "type-check timed out")],
      run.durationMs,
    );
  }

  const diagnostics = parseTscOutput(run.output);
  const findings: Finding[] = diagnostics.map((diagnostic) => {
    const {pitfall, rule} = classifyDiagnostic(diagnostic.message);

    return check(rule, pitfall, false, clip(diagnostic.message), {
      excerpt: excerptOf(dir, diagnostic.file, diagnostic.line),
      file: diagnostic.file,
      line: diagnostic.line,
    });
  });

  if (run.failed && findings.length === 0) {
    findings.push(check("type-error", "other", false, clip(lastLine(run.output))));
  }

  return layerResult("typecheck", findings, run.durationMs);
}

export async function runBuild(
  fixture: FixtureDefinition,
  dir: string,
  logPath: string,
): Promise<LayerResult> {
  const run = await runAll(fixture.build, dir, logPath, 300_000);

  if (run.timedOut) {
    return layerResult(
      "build",
      [check("build-error", "other", false, "build timed out")],
      run.durationMs,
    );
  }

  return layerResult("build", run.failed ? classifyBuildOutput(run.output) : [], run.durationMs);
}
