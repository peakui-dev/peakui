#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {mkdirSync, readFileSync} from "node:fs";

const LINT_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const FMT_EXTS = [...LINT_EXTS, ".json", ".md", ".mdx", ".css", ".scss"];
const SKIP_PREFIXES = ["node_modules/", "heroui/", "dist/", "storybook-static/"];
const TS_ROOT = "packages/react/src/";
const TS_CACHE = "node_modules/.cache/ai-ts-hook/react.tsbuildinfo";
const TIMEOUT_MS = 30_000;

export function buildCommands(filePath) {
  if (!filePath || typeof filePath !== "string") return [];
  if (SKIP_PREFIXES.some((p) => filePath.startsWith(p))) return [];
  const ext = filePath.slice(filePath.lastIndexOf("."));
  const quoted = JSON.stringify(filePath);
  const cmds = [];

  if (LINT_EXTS.includes(ext)) cmds.push(`eslint --fix ${quoted}`);
  if (FMT_EXTS.includes(ext)) cmds.push(`prettier --write ${quoted}`);

  return cmds;
}

// tsc-петля ограничена packages/react/src — ядро библиотеки
export function typecheckTarget(filePath) {
  if (!filePath || typeof filePath !== "string") return null;
  if (!filePath.startsWith(TS_ROOT)) return null;
  const ext = filePath.slice(filePath.lastIndexOf("."));

  return ext === ".ts" || ext === ".tsx" ? filePath : null;
}

const TS_ENTRY_RE = /^(.+?)\(\d+,\d+\): error TS\d+/;

// Из полного вывода tsc оставляет записи целевого файла (с многострочными
// продолжениями) и обрезает вывод до maxLines строк.
export function filterFileErrors(output, filePath, maxLines = 15) {
  const matched = [];
  let inTarget = false;

  for (const line of (output || "").split("\n")) {
    const entry = TS_ENTRY_RE.exec(line);

    if (entry) {
      inTarget = entry[1] === filePath;
      if (inTarget) matched.push(line);
    } else if (inTarget && line.trim() !== "") {
      matched.push(line);
    }
  }

  const count = matched.filter((l) => TS_ENTRY_RE.test(l)).length;

  if (count === 0) return {count: 0, text: ""};

  const shown = matched.slice(0, maxLines);
  const hidden = matched.length - shown.length;
  const text = hidden > 0 ? `${shown.join("\n")}\n… +${hidden} строк` : shown.join("\n");

  return {count, text};
}

const BIN_DIR = "./node_modules/.bin/";

function run(command) {
  // Локальные бинарники репо: PATH процесса их не содержит, поэтому префикс
  // node_modules/.bin + shell (путь закавычен JSON.stringify, shell-safe).
  return spawnSync(BIN_DIR + command, {encoding: "utf8", timeout: TIMEOUT_MS, shell: true});
}

function runTypecheck(target) {
  mkdirSync("node_modules/.cache/ai-ts-hook", {recursive: true});
  const cmd = `tsc -p packages/react/tsconfig.json --noEmit --incremental --tsBuildInfoFile ${TS_CACHE}`;
  const res = run(cmd);

  if (res.status !== 0) {
    const {count, text} = filterFileErrors(res.stdout, target);

    if (count > 0) {
      process.stdout.write(`[post-edit] tsc: ${target} — ${count} ошибок\n${text}\n`);
    } else if ((res.stderr || "").trim()) {
      // tsc упал сам (не ошибки типов) — показать причину
      process.stdout.write(
        `[post-edit] tsc: ${(res.stderr || "").trim().split("\n").slice(0, 5).join("\n")}\n`,
      );
    }
  }
}

function main() {
  let payload;

  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const file = payload?.tool_input?.file_path;

  for (const command of buildCommands(file)) {
    const res = run(command);

    if (res.status !== 0) {
      const out = `${res.stdout || ""}\n${res.stderr || ""}`.trim();

      process.stdout.write(`[post-edit] ${command} → ошибки:\n${out}\n`);
    }
  }

  const target = typecheckTarget(file);

  if (target) runTypecheck(target);
  process.exit(0);
}

if (process.argv[1].endsWith("post-edit.mjs")) main();
