/** Runs the token layer's CI gates. Run: pnpm check:tokens */

import {checkTokens} from "../src/generator/check-tokens.ts";

const {errors} = checkTokens();

if (errors.length === 0) {
  console.log("Гейты токенов: все проверки пройдены.");
  process.exit(0);
}

for (const error of errors) console.error(`  ✗ ${error}`);
console.error(`\nГейты токенов — ошибок: ${errors.length}.`);
process.exit(1);
