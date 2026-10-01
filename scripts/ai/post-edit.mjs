#!/usr/bin/env node
import {spawnSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync} from "node:fs";

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

/*
 * Пока в репозитории нет eslint и prettier, вызов печатал бы ошибку на каждую правку.
 * Хук, который постоянно кричит вхолостую, перестают читать — поэтому недоступный
 * инструмент молча пропускается, а не сообщает о сбое.
 */
export function filterAvailable(commands, hasBin) {
  return commands.filter((command) => hasBin(command.split(" ", 1)[0]));
}

function run(command) {
  // Локальные бинарники репо: PATH процесса их не содержит, поэтому префикс
  // node_modules/.bin + shell (путь закавычен JSON.stringify, shell-safe).
  return spawnSync(BIN_DIR + command, {encoding: "utf8", timeout: TIMEOUT_MS, shell: true});
}

/*
 * Отчёт о прогоне tsc, или null если докладывать нечего.
 *
 * Ошибку уровня конфига (TS5058 и родственные) tsc пишет в stdout и без префикса
 * «(строка,столбец)», поэтому filterFileErrors её не видит. Прежний код смотрел в таких
 * случаях только в stderr — а он пуст — и молчал: петля типов не выполнялась, а хук
 * сообщал об успехе. Это ровно тот класс тихого отказа, из-за которого хук был нацелен
 * на несуществующий пакет и никто этого не замечал.
 */
export function typecheckReport({status, stdout, stderr, target, maxLines}) {
  if (status === 0) return null;

  const {count, text} = filterFileErrors(stdout, target, maxLines);

  if (count > 0) return `[post-edit] tsc: ${target} — ${count} ошибок\n${text}`;

  const raw = `${(stderr || "").trim()}\n${(stdout || "").trim()}`.trim();

  if (!raw) return null;

  return `[post-edit] tsc упал сам:\n${raw.split("\n").slice(0, 5).join("\n")}`;
}

function runTypecheck(target) {
  mkdirSync("node_modules/.cache/ai-ts-hook", {recursive: true});
  const cmd = `tsc -p packages/react/tsconfig.json --noEmit --incremental --tsBuildInfoFile ${TS_CACHE}`;

  if (filterAvailable([cmd], (bin) => existsSync(BIN_DIR + bin)).length === 0) return;

  const res = run(cmd);
  const report = typecheckReport({
    status: res.status,
    stdout: res.stdout,
    stderr: res.stderr,
    target,
  });

  if (report) process.stdout.write(`${report}\n`);
}

function main() {
  let payload;

  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0);
  }
  const file = payload?.tool_input?.file_path;

  const available = filterAvailable(buildCommands(file), (bin) => existsSync(BIN_DIR + bin));

  for (const command of available) {
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
