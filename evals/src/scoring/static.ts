import type {Finding, LayerResult, StaticContext, TaskDefinition} from "../types.ts";

import {tryParseCss} from "./css.ts";
import {runDetectors} from "./detectors.ts";
import {check, layerResult} from "./findings.ts";

function unparseableCss(context: StaticContext): Finding[] {
  const changed = [...context.changes.added, ...context.changes.modified];

  return changed
    .filter((path) => path.endsWith(".css"))
    .flatMap((path) => {
      const file = context.file(path);

      if (!file || tryParseCss(file.text) !== undefined) return [];

      return [
        check("unparseable-css", "other", false, `${path} does not parse as CSS`, {file: path}),
      ];
    });
}

export function runStatic(task: TaskDefinition, context: StaticContext): LayerResult {
  const started = Date.now();
  const findings: Finding[] = [...runDetectors(context), ...unparseableCss(context)];

  try {
    findings.push(...task.staticChecks(context));
  } catch (error) {
    findings.push(
      check(
        "static-check-crashed",
        "other",
        false,
        `the static checks of ${task.id} threw: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }

  return layerResult("static", findings, Date.now() - started);
}
