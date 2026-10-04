import assert from "node:assert/strict";
import {test} from "node:test";

import {
  renderBarrel,
  renderCssLayer,
  renderDemos,
  renderDocsMeta,
  staleRegistries,
} from "./registries.mjs";

test("renderBarrel keeps the header and sorts entries the way the files sort", () => {
  const source = '/*\n * Header.\n */\nexport * from "./button/index.ts";\n';

  assert.equal(
    renderBarrel(source, ["input", "button", "input-group"]),
    "/*\n * Header.\n */\n" +
      'export * from "./button/index.ts";\n' +
      'export * from "./input-group/index.ts";\n' +
      'export * from "./input/index.ts";\n',
  );
});

test("renderBarrel repairs duplicates and disorder left by a union merge", () => {
  const merged =
    "/* Header. */\n" +
    'export * from "./select/index.ts";\n' +
    'export * from "./button/index.ts";\n' +
    'export * from "./select/index.ts";\n';

  assert.equal(
    renderBarrel(merged, ["button", "select"]),
    '/* Header. */\nexport * from "./button/index.ts";\nexport * from "./select/index.ts";\n',
  );
});

test("renderCssLayer keeps the blank line between the header and the imports", () => {
  const source = '/* Header. */\n\n@import "./button.css";\n';

  assert.equal(
    renderCssLayer(source, ["label", "button"]),
    '/* Header. */\n\n@import "./button.css";\n@import "./label.css";\n',
  );
});

const DEMOS_SOURCE =
  "export interface DemoItem {}\n\n" +
  "export const demos: Record<string, DemoItem> = {\n" +
  '  "stale-entry": {},\n' +
  "};\n\n" +
  "export function getDemo(name: string) {\n  return demos[name];\n}\n";

test("renderDemos writes one grouped entry per demo and keeps the code around the record", () => {
  const result = renderDemos(DEMOS_SOURCE, [
    {component: "spinner", exportName: "Basic", file: "basic"},
    {component: "button", exportName: "WithIcons", file: "with-icons"},
    {component: "button", exportName: "Basic", file: "basic"},
  ]);

  assert.equal(
    result,
    "export interface DemoItem {}\n\n" +
      "export const demos: Record<string, DemoItem> = {\n" +
      "  // button\n" +
      '  "button-basic": {\n' +
      '    loader: () => import("./button/basic").then((m) => m.Basic),\n' +
      '    file: "button/basic.tsx",\n' +
      "  },\n" +
      '  "button-with-icons": {\n' +
      '    loader: () => import("./button/with-icons").then((m) => m.WithIcons),\n' +
      '    file: "button/with-icons.tsx",\n' +
      "  },\n" +
      "  // spinner\n" +
      '  "spinner-basic": {\n' +
      '    loader: () => import("./spinner/basic").then((m) => m.Basic),\n' +
      '    file: "spinner/basic.tsx",\n' +
      "  },\n" +
      "};\n\n" +
      "export function getDemo(name: string) {\n  return demos[name];\n}\n",
  );
});

test("renderDemos refuses a file it cannot find the record in", () => {
  assert.throws(() => renderDemos("export const other = {};\n", []), /cannot find/);
});

test("renderDocsMeta keeps non-component entries on top and sorts pages by name", () => {
  const source =
    '{\n  "title": "Components",\n  "pages": [\n' +
    '    "---Overview---",\n    "index",\n    "---Components---",\n    "(forms)/input"\n  ]\n}\n';

  assert.equal(
    renderDocsMeta(source, ["(forms)/input", "(feedback)/spinner", "(buttons)/button"]),
    '{\n  "title": "Components",\n  "pages": [\n' +
      '    "---Overview---",\n    "index",\n    "---Components---",\n' +
      '    "(buttons)/button",\n    "(forms)/input",\n    "(feedback)/spinner"\n  ]\n}\n',
  );
});

test("renderDocsMeta repairs a list whose commas a merge broke", () => {
  const broken =
    '{\n  "pages": [\n    "index",\n    "(forms)/input"\n    "(forms)/label"\n  ]\n}\n';

  assert.equal(
    renderDocsMeta(broken, ["(forms)/label", "(forms)/input"]),
    '{\n  "pages": [\n    "index",\n    "(forms)/input",\n    "(forms)/label"\n  ]\n}\n',
  );
});

/*
 * The gate. Declared against the real tree: a registry that a branch forgot to regenerate, or that
 * someone edited by hand, fails here and therefore in `pnpm test:ai` and CI.
 */
test("the committed registries match the file system", async () => {
  assert.deepEqual(await staleRegistries(), [], "run `pnpm registries`");
});
