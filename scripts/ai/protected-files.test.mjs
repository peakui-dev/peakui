import assert from "node:assert/strict";
import test from "node:test";

import {isProtected} from "./protected-files.mjs";

test(".env и его локальные варианты защищены, .env.example — нет", () => {
  assert.equal(isProtected(".env"), true);
  assert.equal(isProtected("apps/storybook/.env.local"), true);
  assert.equal(isProtected(".env.example"), false);
});

test("lock-файлы защищены", () => {
  assert.equal(isProtected("pnpm-lock.yaml"), true);
  assert.equal(isProtected("package-lock.json"), true);
});

test("parity-снапшоты «до» защищены", () => {
  assert.equal(isProtected("packages/elements/scripts/parity/before/Button.styles.ts"), true);
  assert.equal(isProtected("packages/elements/scripts/parity-check.mjs"), false);
});

test("вендоренный heroui и кодграф-индекс защищены", () => {
  assert.equal(isProtected("heroui/README.md"), true);
  assert.equal(isProtected(".codegraph/codegraph.db"), true);
});

test("обычные исходники не защищены", () => {
  assert.equal(isProtected("packages/elements/src/components/Button/Button.tsx"), false);
  assert.equal(isProtected("AGENTS.md"), false);
});
