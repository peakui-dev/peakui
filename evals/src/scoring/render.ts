import type {
  Finding,
  FixtureDefinition,
  LayerResult,
  RenderSpec,
  TaskDefinition,
} from "../types.ts";
import type {Root} from "postcss";

import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

import {runCommand} from "../exec.ts";
import {walkFiles} from "../files.ts";
import {evalsHome} from "../paths.ts";

import {commandEnvironment} from "./commands.ts";
import {tryParseCss} from "./css.ts";
import {parseHtml} from "./dom.ts";
import {check, layerResult, notApplicable} from "./findings.ts";

const RUNNER = join(import.meta.dirname, "render-runner.mjs");

export type SsrResult = {documents: Record<string, string>; ok: true} | {error: string; ok: false};

function builtCssPaths(fixture: FixtureDefinition, dir: string): string[] {
  const cssDir = join(dir, fixture.builtCssDir);

  if (!existsSync(cssDir)) return [];

  return walkFiles(cssDir)
    .filter((path) => path.endsWith(".css"))
    .map((path) => join(cssDir, path));
}

/**
 * Every built CSS file on its own, parsed; a file that does not parse is left out.
 *
 * The files come in path order, which is NOT load order: a Next.js `.next/static` may hold several
 * chunks and the browser loads them as the pages ask. Anything that depends on which rule comes
 * later in the cascade (layer order, specificity ties) is only sound with one file. See
 * `builtLayerOrder`, which refuses to answer when the files disagree.
 */
export function readBuiltCssFiles(fixture: FixtureDefinition, dir: string): Root[] {
  return builtCssPaths(fixture, dir).flatMap((path) => {
    const root = tryParseCss(readFileSync(path, "utf8"));

    return root ? [root] : [];
  });
}

/**
 * All built CSS as one stylesheet, for checks that ask whether a rule exists. The files are joined
 * in path order, which is not necessarily the order they load in (see `readBuiltCssFiles`), so do
 * not read cascade order out of this: use `builtLayerOrder` on `readBuiltCssFiles` for that.
 */
export function readBuiltCss(fixture: FixtureDefinition, dir: string): Root | undefined {
  const paths = builtCssPaths(fixture, dir);

  if (paths.length === 0) return undefined;

  return tryParseCss(paths.map((path) => readFileSync(path, "utf8")).join("\n"));
}

export async function renderSsr(
  dir: string,
  ssr: NonNullable<RenderSpec["ssr"]>,
): Promise<SsrResult> {
  // The runner reports through a file: the agent's module runs in the same process and anything it
  // prints would corrupt a result on stdout.
  mkdirSync(evalsHome(), {recursive: true});

  const scratch = mkdtempSync(join(evalsHome(), "render-"));
  const resultPath = join(scratch, "result.json");

  try {
    const result = await runCommand(
      [
        process.execPath,
        RUNNER,
        dir,
        ssr.module,
        ssr.exportName,
        JSON.stringify(ssr.cases),
        resultPath,
      ],
      // It executes code the agent wrote, so it gets the allow-listed environment of the type-check
      // and build commands, never the parent's.
      {cwd: dir, env: commandEnvironment(), timeoutMs: 60_000},
    );

    if (result.timedOut) return {error: "rendering timed out after 60 s", ok: false};

    try {
      const parsed = JSON.parse(readFileSync(resultPath, "utf8")) as SsrResult;

      if (typeof parsed === "object" && parsed !== null && "ok" in parsed) return parsed;
    } catch {
      // No result file; reported below with whatever the process said.
    }

    return {
      error: `the render runner produced no result (exit ${result.exitCode}): ${(result.stderr || result.stdout).slice(0, 500)}`,
      ok: false,
    };
  } finally {
    rmSync(scratch, {force: true, recursive: true});
  }
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
    findings = spec.check({
      css: readBuiltCss(fixture, dir),
      cssFiles: readBuiltCssFiles(fixture, dir),
      documents,
    });
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
