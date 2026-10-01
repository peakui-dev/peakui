import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCommands,
  filterAvailable,
  filterFileErrors,
  typecheckTarget,
} from "./post-edit.mjs";

test("ts-файл получает eslint и prettier", () => {
  assert.deepEqual(buildCommands("packages/react/src/components/button/button.tsx"), [
    'eslint --fix "packages/react/src/components/button/button.tsx"',
    'prettier --write "packages/react/src/components/button/button.tsx"',
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

test("typecheck-цель: только .ts/.tsx из packages/react/src", () => {
  assert.equal(
    typecheckTarget("packages/react/src/components/tag/tag.tsx"),
    "packages/react/src/components/tag/tag.tsx",
  );
  assert.equal(typecheckTarget("packages/react/src/index.ts"), "packages/react/src/index.ts");
  assert.equal(typecheckTarget("packages/tables/src/main.tsx"), null);
  assert.equal(typecheckTarget("packages/react/src/bem/tag.css"), null);
  assert.equal(typecheckTarget("packages/react/scripts/x.ts"), null);
  assert.equal(typecheckTarget(null), null);
});

test("filterFileErrors: только ошибки целевого файла, с продолжениями", () => {
  const out = [
    "packages/react/src/a.ts(1,1): error TS7006: Parameter 'e' implicitly has an 'any' type.",
    "packages/react/src/b.ts(2,2): error TS2339: Property 'x' does not exist.",
    "  Type 'string' is not assignable to type 'number'.",
    "packages/react/src/a.ts(9,9): error TS2322: Type 'string' is not assignable.",
  ].join("\n");
  const {count, text} = filterFileErrors(out, "packages/react/src/a.ts");

  assert.equal(count, 2);
  assert.match(text, /TS7006/);
  assert.match(text, /TS2322/);
  assert.doesNotMatch(text, /TS2339/);
});

test("filterFileErrors: пустой вывод и обрезка до maxLines", () => {
  assert.deepEqual(filterFileErrors("", "packages/react/src/a.ts"), {count: 0, text: ""});

  const many = Array.from(
    {length: 20},
    (_, i) => `packages/react/src/a.ts(${i},1): error TS2322: err ${i}`,
  ).join("\n");
  const cut = filterFileErrors(many, "packages/react/src/a.ts", 15);

  assert.equal(cut.count, 20);
  assert.match(cut.text, /err 14/);
  assert.doesNotMatch(cut.text, /err 15\)/);
  assert.match(cut.text, /\+5/);
});

test("отсутствующий бинарник отбрасывается: хук не кричит вхолостую", () => {
  const cmds = [
    'eslint --fix "packages/react/src/a.ts"',
    'prettier --write "packages/react/src/a.ts"',
  ];
  const hasBin = (name) => name === "prettier";

  assert.deepEqual(filterAvailable(cmds, hasBin), [
    'prettier --write "packages/react/src/a.ts"',
  ]);
  assert.deepEqual(filterAvailable(cmds, () => false), []);
  assert.deepEqual(filterAvailable(cmds, () => true), cmds);
});
