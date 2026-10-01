import assert from "node:assert/strict";
import test from "node:test";

import {buildCommands, filterFileErrors, typecheckTarget} from "./post-edit.mjs";

test("ts-файл получает eslint и prettier", () => {
  assert.deepEqual(buildCommands("packages/elements/src/components/Button/Button.tsx"), [
    'eslint --fix "packages/elements/src/components/Button/Button.tsx"',
    'prettier --write "packages/elements/src/components/Button/Button.tsx"',
  ]);
});

test("md-файл получает только prettier", () => {
  assert.deepEqual(buildCommands("docs/superpowers/README.md"), [
    'prettier --write "docs/superpowers/README.md"',
  ]);
});

test("не-код и мусорные пути не обрабатываются", () => {
  assert.deepEqual(buildCommands("assets/logo.svg"), []);
  assert.deepEqual(buildCommands("node_modules/x/y.js"), []);
  assert.deepEqual(buildCommands("heroui/src/a.ts"), []);
});

test("typecheck-цель: только .ts/.tsx из packages/elements/src", () => {
  assert.equal(
    typecheckTarget("packages/elements/src/components/Tag/Tag.tsx"),
    "packages/elements/src/components/Tag/Tag.tsx",
  );
  assert.equal(typecheckTarget("packages/elements/src/index.ts"), "packages/elements/src/index.ts");
  assert.equal(typecheckTarget("packages/tables/src/main.tsx"), null);
  assert.equal(typecheckTarget("packages/elements/src/bem/tag.css"), null);
  assert.equal(typecheckTarget("packages/elements/scripts/x.ts"), null);
  assert.equal(typecheckTarget("packages/elements/src/base-apca/BInputText/useInputText.ts"), null);
  assert.equal(
    typecheckTarget("packages/elements/src/organism/ChipsFilter/useChipsFilter.ts"),
    null,
  );
  assert.equal(typecheckTarget(null), null);
});

test("filterFileErrors: только ошибки целевого файла, с продолжениями", () => {
  const out = [
    "packages/elements/src/a.ts(1,1): error TS7006: Parameter 'e' implicitly has an 'any' type.",
    "packages/elements/src/b.ts(2,2): error TS2339: Property 'x' does not exist.",
    "  Type 'string' is not assignable to type 'number'.",
    "packages/elements/src/a.ts(9,9): error TS2322: Type 'string' is not assignable.",
  ].join("\n");
  const {count, text} = filterFileErrors(out, "packages/elements/src/a.ts");

  assert.equal(count, 2);
  assert.match(text, /TS7006/);
  assert.match(text, /TS2322/);
  assert.doesNotMatch(text, /TS2339/);
});

test("filterFileErrors: пустой вывод и обрезка до maxLines", () => {
  assert.deepEqual(filterFileErrors("", "packages/elements/src/a.ts"), {count: 0, text: ""});

  const many = Array.from(
    {length: 20},
    (_, i) => `packages/elements/src/a.ts(${i},1): error TS2322: err ${i}`,
  ).join("\n");
  const cut = filterFileErrors(many, "packages/elements/src/a.ts", 15);

  assert.equal(cut.count, 20);
  assert.match(cut.text, /err 14/);
  assert.doesNotMatch(cut.text, /err 15\)/);
  assert.match(cut.text, /\+5/);
});
