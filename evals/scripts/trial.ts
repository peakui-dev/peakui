import type {SetupKind} from "../src/setup.ts";
import type {AgentConfigMode} from "../src/trial.ts";

import {resolve} from "node:path";
import {parseArgs} from "node:util";

import {getFixture} from "../fixtures/index.ts";
import {prepareTemplate} from "../src/fixtures/prepare.ts";
import {packLibrary} from "../src/pack/stage.ts";
import {SETUP_KINDS, buildSetup} from "../src/setup.ts";
import {cleanTrials, createTrial, formatList, runTrial, scoreTrial} from "../src/trial.ts";
import {getTask, tasks} from "../tasks/index.ts";

const USAGE = `usage:
  trial prepare --task <id> --label <name> [--setup <dir>]
  trial setup --kind <skill|skill-pointer>
  trial run --task <id> --workspace <path> --model <alias> --docs-url <url>
            [--source-url <url>] [--max-budget-usd <n>] [--agent-config <isolated|inherit>]
  trial score --task <id> --workspace <path>
  trial list
  trial clean --label <name>`;

// pnpm runs the script from the package directory; relative paths are the caller's.
function fromCaller(path: string): string {
  return resolve(process.env.INIT_CWD ?? process.cwd(), path);
}

function need(value: string | undefined, name: string): string {
  if (value === undefined) throw new UsageError(`missing --${name}`);

  return value;
}

class UsageError extends Error {}

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;
  const {values} = parseArgs({
    allowPositionals: false,
    args: rest,
    options: {
      "agent-config": {type: "string"},
      "docs-url": {type: "string"},
      kind: {type: "string"},
      label: {type: "string"},
      "max-budget-usd": {type: "string"},
      model: {type: "string"},
      "source-url": {type: "string"},
      setup: {type: "string"},
      task: {type: "string"},
      workspace: {type: "string"},
    },
  });

  switch (command) {
    case "prepare": {
      const task = getTask(need(values.task, "task"));
      const label = need(values.label, "label");
      const fixture = getFixture(task.fixture);
      const template = await prepareTemplate(fixture, await packLibrary(), {force: false});
      const out = await createTrial({
        label,
        task,
        templateDir: template.dir,
        ...(values.setup === undefined ? {} : {setupDir: fromCaller(values.setup)}),
      });

      process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);

      return;
    }
    case "score": {
      const task = getTask(need(values.task, "task"));
      const result = await scoreTrial({
        task,
        workspace: fromCaller(need(values.workspace, "workspace")),
      });

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

      return;
    }
    case "setup": {
      const kind = need(values.kind, "kind") as SetupKind;

      if (!SETUP_KINDS.includes(kind)) {
        throw new UsageError(`--kind must be one of ${SETUP_KINDS.join(", ")}`);
      }

      process.stdout.write(`${JSON.stringify({dir: buildSetup(kind), kind}, null, 2)}\n`);

      return;
    }
    case "run": {
      const agentConfig = (values["agent-config"] ?? "isolated") as AgentConfigMode;
      const budget = values["max-budget-usd"];

      if (agentConfig !== "isolated" && agentConfig !== "inherit") {
        throw new UsageError("--agent-config must be isolated or inherit");
      }
      if (budget !== undefined && !(Number(budget) > 0)) {
        throw new UsageError("--max-budget-usd must be a positive number");
      }

      const summary = await runTrial({
        agentConfig,
        docsUrl: need(values["docs-url"], "docs-url"),
        ...(budget === undefined ? {} : {maxBudgetUsd: Number(budget)}),
        model: need(values.model, "model"),
        ...(values["source-url"] === undefined ? {} : {sourceUrl: values["source-url"]}),
        task: getTask(need(values.task, "task")),
        workspace: fromCaller(need(values.workspace, "workspace")),
      });

      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      // An agent that never ran is a failed command; a run that ended badly is still a result.
      if (summary.outcome === "infra-error") process.exitCode = 1;

      return;
    }
    case "list":
      process.stdout.write(`${formatList(tasks)}\n`);

      return;
    case "clean": {
      const removed = cleanTrials(need(values.label, "label"));

      process.stdout.write(`${JSON.stringify({removed}, null, 2)}\n`);

      return;
    }
    default:
      throw new UsageError(command ? `unknown command ${command}` : "missing command");
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const usage =
    error instanceof UsageError || (error as {code?: string}).code?.startsWith("ERR_PARSE_ARGS");

  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  if (usage) process.stderr.write(`${USAGE}\n`);
  process.exitCode = usage ? 2 : 1;
});
