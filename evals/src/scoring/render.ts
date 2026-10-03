import type {
  Finding,
  FixtureDefinition,
  LayerResult,
  RenderSpec,
  TaskDefinition,
} from "../types.ts";
import type {Root} from "postcss";

import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

import {runCommand} from "../exec.ts";
import {walkFiles} from "../files.ts";

import {tryParseCss} from "./css.ts";
import {parseHtml} from "./dom.ts";
import {check, layerResult, notApplicable} from "./findings.ts";

const RUNNER = join(import.meta.dirname, "render-runner.mjs");

export type SsrResult = {documents: Record<string, string>; ok: true} | {error: string; ok: false};

export function readBuiltCss(fixture: FixtureDefinition, dir: string): Root | undefined {
  const cssDir = join(dir, fixture.builtCssDir);

  if (!existsSync(cssDir)) return undefined;

  const files = walkFiles(cssDir).filter((path) => path.endsWith(".css"));

  if (files.length === 0) return undefined;

  return tryParseCss(files.map((path) => readFileSync(join(cssDir, path), "utf8")).join("\n"));
}

export async function renderSsr(
  dir: string,
  ssr: NonNullable<RenderSpec["ssr"]>,
): Promise<SsrResult> {
  const result = await runCommand(
    [process.execPath, RUNNER, dir, ssr.module, ssr.exportName, JSON.stringify(ssr.cases)],
    {cwd: dir, timeoutMs: 60_000},
  );

  if (result.timedOut) return {error: "rendering timed out after 60 s", ok: false};

  try {
    const parsed = JSON.parse(result.stdout) as SsrResult;

    if (typeof parsed === "object" && parsed !== null && "ok" in parsed) return parsed;
  } catch {
    // Not the runner's JSON; reported below with whatever the process said.
  }

  return {
    error: `the render runner printed no result (exit ${result.exitCode}): ${(result.stderr || result.stdout).slice(0, 500)}`,
    ok: false,
  };
}

function unavailable(message: string): Finding {
  return check("render-unavailable", "other", false, message);
}

function firstLine(text: string): string {
  return text.split("\n")[0] ?? text;
}

export async function runRender(
  task: TaskDefinition,
  fixture: FixtureDefinition,
  dir: string,
  logPath: string,
): Promise<LayerResult> {
  const started = Date.now();
  const spec = task.render;

  if (!spec) return notApplicable("render");

  const documents = new Map<string, Document>();
  const raw: Record<string, string> = {};

  function finish(findings: Finding[]): LayerResult {
    mkdirSync(dirname(logPath), {recursive: true});
    writeFileSync(logPath, `${JSON.stringify({documents: raw, findings}, null, 2)}\n`);

    return layerResult("render", findings, Date.now() - started);
  }

  if (spec.ssr) {
    const rendered = await renderSsr(dir, spec.ssr);

    if (!rendered.ok) return finish([unavailable(firstLine(rendered.error))]);

    for (const [name, html] of Object.entries(rendered.documents)) {
      raw[name] = html;
      documents.set(name, parseHtml(html));
    }
  }

  if (spec.html) {
    const path = join(dir, spec.html.path);

    if (!existsSync(path)) {
      return finish([unavailable(`the build did not produce ${spec.html.path}`)]);
    }

    raw.html = readFileSync(path, "utf8");
    documents.set("html", parseHtml(raw.html));
  }

  let findings: Finding[];

  try {
    findings = spec.check({css: readBuiltCss(fixture, dir), documents});
  } catch (error) {
    findings = [
      check(
        "render-check-crashed",
        "other",
        false,
        `the render checks of ${task.id} threw: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ];
  }

  return finish(findings);
}
