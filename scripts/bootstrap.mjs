/*
 * Bootstrap for a fresh clone, and the diagnostic behind `pnpm bootstrap --check`.
 *
 * The functions here are pure so they can be tested without touching the disk or the
 * network; the side-effecting parts live behind the entry point at the bottom.
 */

import {spawnSync} from "node:child_process";
import {existsSync, readFileSync} from "node:fs";
import {connect} from "node:net";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const STORYBOOK_PORT = 6007;

/** Parses "v24.21.0" or "24.21" into numbers. Missing segments count as zero. */
function parseVersion(raw) {
  return String(raw)
    .trim()
    .replace(/^v/, "")
    .split(".")
    .map((part) => Number.parseInt(part, 10) || 0);
}

/*
 * Segment-by-segment, never lexically: as strings "22.9" sorts after "22.18", which would
 * let a node below the floor pass.
 */
function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);

  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);

    if (diff !== 0) return diff;
  }

  return 0;
}

export function checkNodeVersion(actual, floor) {
  const ok = compareVersions(actual, floor) >= 0;

  return {
    name: "node",
    ok,
    detail: ok ? `${actual} (floor ${floor})` : `${actual} is below the required ${floor}`,
  };
}

export function checkPnpmVersion(actual, required) {
  const ok = compareVersions(actual, required) === 0;

  return {
    name: "pnpm",
    ok,
    detail: ok ? `${actual}` : `${actual} does not match the required ${required}`,
  };
}

/** Renders the findings and decides the exit code: any failure makes it non-zero. */
export function formatReport(findings) {
  const lines = findings.map(({detail, name, ok}) => `${ok ? "ok  " : "FAIL"}  ${name}: ${detail}`);
  const failed = findings.filter((finding) => !finding.ok);

  if (failed.length > 0) {
    lines.push("", `${failed.length} check(s) failed. See .agents/rules/onboarding.md.`);
  }

  return {text: lines.join("\n"), code: failed.length > 0 ? 1 : 0};
}

/** True when something already listens on the port. Used to report, not to fail. */
export function isPortBusy(port) {
  return new Promise((resolve) => {
    const socket = connect({host: "127.0.0.1", port});

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const PORTABLE_ARGS = ["exec", "codegraph"];

/*
 * `codegraph install` writes `command: "codegraph"`, which resolves from PATH. MCP servers
 * do not see node_modules/.bin, so on a machine with only the devDependency that form fails.
 * The committed .mcp.json uses `pnpm exec` instead; this reports when it has been clobbered.
 */
export function isMcpCommandPortable(config) {
  const server = config?.mcpServers?.codegraph;

  if (!server) return false;

  return (
    server.command === "pnpm" &&
    PORTABLE_ARGS.every((arg, i) => Array.isArray(server.args) && server.args[i] === arg) &&
    server.alwaysLoad === true
  );
}

/** Пороги версий живут в package.json; дублировать их здесь значит разойтись с ним. */
export function versionFloors(pkg) {
  return {
    node: String(pkg?.engines?.node ?? "").replace(/[^\d.]/g, ""),
    pnpm:
      String(pkg?.packageManager ?? "")
        .split("@")
        .pop() ?? "",
  };
}

/** Команды хуков из обеих форм: Claude Code держит их в hooks.*, ZCode — в hooks.events.*. */
export function hookCommands(parsed) {
  const events = parsed?.hooks?.events ?? parsed?.hooks ?? {};

  return Object.values(events)
    .filter(Array.isArray)
    .flatMap((matchers) => matchers.flatMap((matcher) => matcher?.hooks ?? []))
    .map((hook) => hook?.command)
    .filter((command) => typeof command === "string");
}

/*
 * Судит по содержимому. Проверка существования файла объявляла здоровьем пустой {} — та же
 * ошибка, что и документ, утверждающий несуществующее, только в новом месте.
 */
export function hookConfigFinding(name, parsed, expectedScripts) {
  const commands = hookCommands(parsed);
  const missing = expectedScripts.filter(
    (script) => !commands.some((command) => command.includes(script)),
  );

  return {
    name,
    ok: missing.length === 0,
    detail:
      missing.length === 0
        ? `wires ${expectedScripts.join(", ")}`
        : `does not wire ${missing.join(", ")}`,
  };
}

/*
 * Пути установки chromium из вывода `playwright install --dry-run`. Существование каталога
 * кэша ничего не доказывает: он появляется от любого браузера, а ревизия может быть старой.
 */
export function chromiumPaths(dryRunOutput) {
  return String(dryRunOutput)
    .split("\n")
    .map((line) => line.match(/^\s*Install location:\s*(\S+)\s*$/)?.[1])
    .filter((path) => path && /chromium/i.test(path));
}

export function storybookPort(env) {
  return Number(env?.STORYBOOK_PORT ?? STORYBOOK_PORT);
}

/*
 * The whole state of the harness, as data. `fsLike` is injected so this stays testable
 * without a disk; the port probe and the Playwright dry-run are passed in because they are
 * asynchronous and spawn processes.
 */
export function collectFindings(fsLike, env = {}) {
  const root = env.root ?? ROOT;
  const at = (relative) => `${root}/${relative}`;
  const state = (name, exists, what, remedy) => ({
    name,
    ok: exists,
    detail: exists ? what : `missing — ${remedy}`,
  });
  const parse = (relative) => {
    try {
      return JSON.parse(fsLike.readFileSync(at(relative), "utf8"));
    } catch {
      return null;
    }
  };

  const findings = [
    state(
      "dependencies",
      fsLike.existsSync(at("node_modules")),
      "node_modules",
      "run pnpm install",
    ),
    state(
      "codegraph index",
      fsLike.existsSync(at(".codegraph")),
      ".codegraph/",
      "run pnpm bootstrap",
    ),
  ];

  for (const [file, label] of [
    [".zcode/config.json", "ZCode"],
    [".claude/settings.json", "Claude Code"],
  ]) {
    if (!fsLike.existsSync(at(file))) {
      findings.push(state(file, false, "", `restore it from git (${label} agent hooks)`));
      continue;
    }

    findings.push(hookConfigFinding(file, parse(file), ["protected-files.mjs", "post-edit.mjs"]));
  }

  if (!fsLike.existsSync(at(".mcp.json"))) {
    findings.push({
      name: ".mcp.json",
      ok: false,
      detail: "missing — it is committed; restore it with git checkout .mcp.json",
    });
  } else {
    const portable = isMcpCommandPortable(parse(".mcp.json"));

    findings.push({
      name: ".mcp.json",
      ok: portable,
      detail: portable
        ? "codegraph server is the portable pnpm exec form, loaded eagerly"
        : 'not the portable form — restore with `git checkout .mcp.json`; the codegraph server must be command "pnpm", args ["exec","codegraph","serve","--mcp"], alwaysLoad true. Do NOT re-run `codegraph install`: that is what overwrites it',
    });
  }

  if (env.chromiumPaths) {
    const missing = env.chromiumPaths.filter((path) => !fsLike.existsSync(path));

    findings.push({
      name: "playwright browser",
      ok: env.chromiumPaths.length > 0 && missing.length === 0,
      detail:
        env.chromiumPaths.length === 0
          ? "could not ask playwright which revision it needs"
          : missing.length === 0
            ? `chromium present at the pinned revision (${env.chromiumPaths.length} path(s))`
            : `missing ${missing.join(", ")} — run pnpm --filter @peakui/storybook exec playwright install chromium`,
    });
  }

  const port = env.port ?? STORYBOOK_PORT;

  findings.push({
    name: "storybook port",
    ok: true,
    detail: env.portBusy
      ? `${port} is occupied by another process — set STORYBOOK_PORT to a free one`
      : `${port} is free`,
  });

  return findings;
}

/*
 * The steps setup will run, as data. Building the index is skipped when one exists, so a
 * second `pnpm bootstrap` is cheap instead of a full re-index.
 */
export function setupSteps(fsLike, root) {
  const steps = [
    {label: "install dependencies", command: "pnpm", args: ["install"]},
    {
      // @playwright/test — зависимость apps/storybook, не корня: из корня бинарь не резолвится.
      label: "install the Playwright browser",
      command: "pnpm",
      args: ["--filter", "@peakui/storybook", "exec", "playwright", "install", "chromium"],
    },
  ];

  if (!fsLike.existsSync(join(root, ".codegraph"))) {
    steps.push({
      label: "build the CodeGraph index",
      command: "pnpm",
      args: ["exec", "codegraph", "init"],
    });
  }

  return steps;
}

/* ---------- Entry point: everything below touches the machine ---------- */

function readPackage() {
  return JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
}

/** Спрашивает у Playwright, какая ревизия ему нужна, вместо догадки по каталогу кэша. */
function playwrightDryRun() {
  const result = spawnSync(
    "pnpm",
    ["--filter", "@peakui/storybook", "exec", "playwright", "install", "--dry-run", "chromium"],
    {encoding: "utf8"},
  );

  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function pnpmVersion() {
  return spawnSync("pnpm", ["--version"], {encoding: "utf8"}).stdout?.trim() ?? "not found";
}

async function gather() {
  const floors = versionFloors(readPackage());
  const port = storybookPort(process.env);

  return [
    checkNodeVersion(process.version, floors.node),
    checkPnpmVersion(pnpmVersion(), floors.pnpm),
    ...collectFindings(
      {existsSync, readFileSync},
      {
        chromiumPaths: chromiumPaths(playwrightDryRun()),
        port,
        portBusy: await isPortBusy(port),
      },
    ),
  ];
}

async function check() {
  const {code, text} = formatReport(await gather());

  console.log(text);
  process.exit(code);
}

function step(label, command, args) {
  console.log(`\n→ ${label}`);

  const result = spawnSync(command, args, {stdio: "inherit"});

  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed. See .agents/rules/onboarding.md.`);
    process.exit(result.status ?? 1);
  }
}

async function setup() {
  const floors = versionFloors(readPackage());

  for (const gate of [
    checkNodeVersion(process.version, floors.node),
    checkPnpmVersion(pnpmVersion(), floors.pnpm),
  ]) {
    if (!gate.ok) {
      console.error(`✗ ${gate.name}: ${gate.detail}`);
      process.exit(1);
    }

    console.log(`ok  ${gate.name}: ${gate.detail}`);
  }

  for (const {args, command, label} of setupSteps({existsSync}, ROOT)) {
    step(label, command, args);
  }

  console.log(`
Done. What this script did NOT do:

  • .zcode/config.json is committed and maintained by hand — ZCode is not a target of
    \`codegraph install\`, so no tool regenerates it.
  • .mcp.json is committed in the portable \`pnpm exec\` form. Running
    \`codegraph install\` later overwrites it with a PATH command; \`--check\` reports that.
  • Storybook's port ${storybookPort(process.env)} may be held by another project, in which
    case set STORYBOOK_PORT to a free one. Check with --check.

Verify with: pnpm bootstrap --check`);
}

if (process.argv[1]?.endsWith("bootstrap.mjs")) {
  await (process.argv.includes("--check") ? check() : setup());
}
