#!/usr/bin/env node
// PreToolUse-гард: блокирует правки защищённых файлов.
// stdin: JSON { tool_name, tool_input: { file_path } } (формат Claude Code / ZCode).
// exit 2 = блокировка действия, сообщение в stderr уходит агенту.

import {readFileSync} from "node:fs";

const PROTECTED_PATTERNS = [
  /(^|\/)\.env(\..+)?$/, // .env, .env.local — но не .env.example (проверка ниже)
  /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/,
  /scripts\/parity\/before\//, // снапшоты «до» — святое
  /(^|\/)\.codegraph\//,
  /(^|\/)heroui(-cli|-mcp)?\//, // вендоренные референсы: путь приходит абсолютным
  /storybook-static\//,
  /(^|\/)dist(-ssr)?\//,
];

/*
 * Generated registries: `pnpm registries` rebuilds them from the file system. A hand edit is how
 * parallel branches collide on them, so the hook refuses one and names the command.
 */
const GENERATED_PATTERNS = [
  /(^|\/)packages\/react\/src\/components\/index\.ts$/,
  /(^|\/)packages\/styles\/src\/components\/index\.ts$/,
  /(^|\/)packages\/styles\/components\/index\.css$/,
  /(^|\/)apps\/docs\/src\/demos\/index\.ts$/,
  /(^|\/)apps\/docs\/content\/docs\/en\/react\/components\/meta\.json$/,
];

export function isGenerated(filePath) {
  if (!filePath || typeof filePath !== "string") return false;

  return GENERATED_PATTERNS.some((re) => re.test(filePath));
}

export function isProtected(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  if (/(^|\/)\.env\.example$/.test(filePath)) return false;

  return PROTECTED_PATTERNS.some((re) => re.test(filePath));
}

function main() {
  let payload;

  try {
    payload = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    process.exit(0); // не наш формат — пропускаем молча
  }
  const file = payload?.tool_input?.file_path;

  if (isGenerated(file)) {
    process.stderr.write(
      `REJECTED: "${file}" is a generated registry. Add or remove the component's own files, ` +
        "then run `pnpm registries`.",
    );
    process.exit(2);
  }
  if (isProtected(file)) {
    process.stderr.write(
      `ОТКЛОНЕНО: «${file}» — защищённый файл (env/lock/parity-снапшоты/heroui/индекс). ` +
        "Правки здесь делают только люди, осознанно.",
    );
    process.exit(2);
  }
  process.exit(0);
}

if (process.argv[1].endsWith("protected-files.mjs")) main();
