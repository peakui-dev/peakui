/** Runs the token layer's CI gates. Run: pnpm check:tokens */

import {checkTokens} from "../src/generator/check-tokens.ts";

const {errors} = checkTokens();

const ENFORCED = [
  "дрейф: закоммиченный CSS совпадает с выводом пресета",
  "контраст текста: каждая пара X / X-foreground ≥ 4.5:1 (полупрозрачный X — после композитинга)",
  "контраст границ: focus ≥ 3:1 (декоративные border/separator освобождены — см. спеку)",
  "висящие токены: каждый var() в поставляемом CSS объявлен",
  "полнота: каждая тема объявляет весь набор",
  "литеральные цвета и числовые токены в components/*.css",
];

if (errors.length === 0) {
  console.log("Гейты токенов пройдены. Проверено:");
  for (const line of ENFORCED) console.log(`  ✓ ${line}`);
  process.exit(0);
}

for (const error of errors) console.error(`  ✗ ${error}`);
console.error(`\nГейты токенов — ошибок: ${errors.length}.`);
process.exit(1);
