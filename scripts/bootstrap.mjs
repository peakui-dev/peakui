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
const NODE_FLOOR = "22.18.0";
const PNPM_REQUIRED = "12.3.4";

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
  const lines = findings.map(
    ({name, ok, detail}) => `${ok ? "ok  " : "FAIL"}  ${name}: ${detail}`,
  );
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
    PORTABLE_ARGS.every((arg, i) => Array.isArray(server.args) && server.args[i] === arg)
  );
}

/*
 * The whole state of the harness, as data. `fsLike` is injected so this stays testable
 * without a disk, and the port result is passed in because probing it is async.
 */
export function collectFindings(fsLike, env = {}) {
  const root = env.root ?? ROOT;
  const at = (relative) => `${root}/${relative}`;
  const state = (name, exists, what, remedy) => ({
    name,
    ok: exists,
    detail: exists ? what : `missing — ${remedy}`,
  });
  const present = (relative, what) =>
    state(relative, fsLike.existsSync(at(relative)), what, "see the onboarding rule");

  const findings = [
    state("dependencies", fsLike.existsSync(at("node_modules")), "node_modules", "run pnpm install"),
    state(
      "codegraph index",
      fsLike.existsSync(at(".codegraph")),
      ".codegraph/",
      "run pnpm bootstrap",
    ),
    present(".zcode/config.json", "ZCode MCP servers and agent hooks"),
    present(".claude/settings.json", "Claude Code agent hooks"),
  ];

  if (!fsLike.existsSync(at(".mcp.json"))) {
    findings.push({name: ".mcp.json", ok: false, detail: "missing — should be committed"});
  } else {
    let portable = false;

    try {
      portable = isMcpCommandPortable(JSON.parse(fsLike.readFileSync(at(".mcp.json"), "utf8")));
    } catch {
      portable = false;
    }

    findings.push({
      name: ".mcp.json",
      ok: portable,
      detail: portable
        ? "codegraph server uses the portable pnpm exec form"
        : "codegraph server is not the portable pnpm exec form — a later `codegraph install` may have overwritten it",
    });
  }

  if (env.playwrightCache) {
    findings.push(
      state(
        "playwright browser",
        fsLike.existsSync(env.playwrightCache),
        "chromium present",
        "run pnpm exec playwright install chromium",
      ),
    );
  }

  const port = env.port ?? STORYBOOK_PORT;

  findings.push({
    name: "storybook port",
    ok: true,
    detail: env.portBusy
      ? `${port} is occupied by another process — Storybook will ask for a different one`
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
      label: "install the Playwright browser",
      command: "pnpm",
      args: ["exec", "playwright", "install", "chromium"],
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

function playwrightCacheDir() {
  const home = process.env.HOME ?? "";

  return process.platform === "darwin"
    ? join(home, "Library/Caches/ms-playwright")
    : join(home, ".cache/ms-playwright");
}

function pnpmVersion() {
  return spawnSync("pnpm", ["--version"], {encoding: "utf8"}).stdout?.trim() ?? "not found";
}

async function gather() {
  return [
    checkNodeVersion(process.version, NODE_FLOOR),
    checkPnpmVersion(pnpmVersion(), PNPM_REQUIRED),
    ...collectFindings(
      {existsSync, readFileSync},
      {
        playwrightCache: playwrightCacheDir(),
        portBusy: await isPortBusy(STORYBOOK_PORT),
      },
    ),
  ];
}

async function check() {
  const {text, code} = formatReport(await gather());

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
  for (const gate of [
    checkNodeVersion(process.version, NODE_FLOOR),
    checkPnpmVersion(pnpmVersion(), PNPM_REQUIRED),
  ]) {
    if (!gate.ok) {
      console.error(`✗ ${gate.name}: ${gate.detail}`);
      process.exit(1);
    }

    console.log(`ok  ${gate.name}: ${gate.detail}`);
  }

  for (const {label, command, args} of setupSteps({existsSync}, ROOT)) {
    step(label, command, args);
  }

  console.log(`
Done. What this script did NOT do:

  • .zcode/config.json is committed and maintained by hand — ZCode is not a target of
    \`codegraph install\`, so no tool regenerates it.
  • .mcp.json is committed in the portable \`pnpm exec\` form. Running
    \`codegraph install\` later overwrites it with a PATH command; \`--check\` reports that.
  • Storybook's port ${STORYBOOK_PORT} may be held by another project. Check with --check.

Verify with: pnpm bootstrap --check`);
}

if (process.argv[1]?.endsWith("bootstrap.mjs")) {
  await (process.argv.includes("--check") ? check() : setup());
}
