import {strict as assert} from "node:assert";
import {mkdirSync, renameSync, symlinkSync} from "node:fs";
import {join} from "node:path";
import {test} from "node:test";

import {inspect, main} from "../../skills/peakui-react/scripts/doctor.mjs";

import {makeProject} from "./helpers.mjs";

const IN_ORDER = '@import "tailwindcss";\n@import "@peakui/styles/css";\n';
const REVERSED = '@import "@peakui/styles/css";\n@import "tailwindcss";\n';

const manifest = (name, version, extra = {}) => JSON.stringify({name, version, ...extra});

/** A healthy Vite consumer project; `overrides` replaces files, and `null` removes one. */
function consumer(overrides = {}) {
  return makeProject({
    "node_modules/@peakui/react/package.json": manifest("@peakui/react", "1.0.0", {
      peerDependencies: {react: ">=19.0.0", "react-aria-components": "^1.21.1"},
    }),
    "node_modules/@peakui/styles/package.json": manifest("@peakui/styles", "1.0.0", {
      peerDependencies: {tailwindcss: ">=4.0.0"},
    }),
    "node_modules/react-aria-components/package.json": manifest("react-aria-components", "1.21.1"),
    "node_modules/react/package.json": manifest("react", "19.1.0"),
    "node_modules/tailwindcss/package.json": manifest("tailwindcss", "4.1.0"),
    "package.json": JSON.stringify({devDependencies: {vite: "^8.0.0"}, name: "app"}),
    "src/index.css": IN_ORDER,
    ...overrides,
  });
}

const ids = (project) => inspect(project).findings.map((finding) => finding.id);

async function run(project) {
  const stdout = [];
  const stderr = [];
  const code = await main([], {
    cwd: project,
    env: {},
    stderr: {write: (text) => stderr.push(text)},
    stdout: {write: (text) => stdout.push(text)},
  });

  return {code, stderr: stderr.join(""), stdout: stdout.join("")};
}

test("a healthy project has no finding", async () => {
  const project = consumer();
  const {context, findings} = inspect(project);

  assert.deepEqual(findings, []);
  assert.equal(context.framework, "vite");
  assert.equal(context.cssEntry, "src/index.css");
  assert.equal(context.peakuiReact, "1.0.0");
  assert.equal(context.peakuiStyles, "1.0.0");
  assert.equal(context.react, "19.1.0");
  assert.equal(context.tailwind, "4.1.0");
  assert.equal((await run(project)).code, 0);
});

test("next is recognised", () => {
  const project = consumer({"package.json": JSON.stringify({dependencies: {next: "16.3.6"}})});

  assert.equal(inspect(project).context.framework, "next");
});

test("a missing package", async () => {
  const project = consumer({"node_modules/@peakui/styles/package.json": null});
  const {findings} = inspect(project);

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["missing-package"],
  );
  assert.match(findings[0].fix, /@peakui\/styles/);
  assert.equal((await run(project)).code, 1);
});

test("a missing peer", () => {
  const project = consumer({"node_modules/react-aria-components/package.json": null});
  const {findings} = inspect(project);

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["missing-peer"],
  );
  assert.match(findings[0].what, /react-aria-components/);
});

test("a peer installed beside the package in a symlinked store is found", () => {
  const project = consumer();
  const store = join(project, "node_modules/.store/peakui-react/node_modules");

  // The layout a strict package manager produces: the package is a symlink into a store, and its
  // peers sit beside it there rather than in the project's own node_modules.
  mkdirSync(join(store, "@peakui"), {recursive: true});
  renameSync(join(project, "node_modules/@peakui/react"), join(store, "@peakui/react"));
  renameSync(
    join(project, "node_modules/react-aria-components"),
    join(store, "react-aria-components"),
  );
  symlinkSync(join(store, "@peakui/react"), join(project, "node_modules/@peakui/react"), "dir");

  assert.deepEqual(ids(project), []);
});

test("react 18", () => {
  const project = consumer({"node_modules/react/package.json": manifest("react", "18.3.1")});
  const {findings} = inspect(project);

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["version-too-old"],
  );
  assert.match(findings[0].what, /18\.3\.1/);
  assert.match(findings[0].what, /19/);
});

test("tailwind 3", () => {
  const project = consumer({
    "node_modules/tailwindcss/package.json": manifest("tailwindcss", "3.4.0"),
  });
  const {findings} = inspect(project);

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["version-too-old"],
  );
  assert.match(findings[0].what, /3\.4\.0/);
  assert.match(findings[0].what, /4/);
});

test("styles never imported", () => {
  assert.deepEqual(ids(consumer({"src/index.css": '@import "tailwindcss";\n'})), [
    "styles-not-imported",
  ]);
});

test("reversed order", () => {
  const {findings} = inspect(consumer({"src/index.css": REVERSED}));

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["css-import-order"],
  );
  assert.equal(findings[0].where, "src/index.css:1");
});

test("order is read through comments, url() and layer()", () => {
  const css =
    '/* a */\n@import url("tailwindcss") layer(base);\n/* b\n@import "@peakui/styles/css";\n*/\n@import "@peakui/styles/css";\n';

  assert.deepEqual(ids(consumer({"src/index.css": css})), []);
});

test("an import inside a comment does not count", () => {
  const css = '@import "tailwindcss";\n/* @import "@peakui/styles/css"; */\n';

  assert.deepEqual(ids(consumer({"src/index.css": css})), ["styles-not-imported"]);
});

test("the root stylesheet specifier counts", () => {
  const css = '@import "tailwindcss";\n@import "@peakui/styles";\n';

  assert.deepEqual(ids(consumer({"src/index.css": css})), []);
});

test("styles imported from a script", () => {
  const {findings} = inspect(
    consumer({"src/main.tsx": 'import React from "react";\nimport "@peakui/styles/css";\n'}),
  );

  assert.deepEqual(
    findings.map((finding) => finding.id),
    ["styles-imported-from-script"],
  );
  assert.equal(findings[0].where, "src/main.tsx:2");
});

test("importing a value from the styles package in a script is fine", () => {
  const project = consumer({"src/variants.ts": 'import {buttonVariants} from "@peakui/styles";\n'});

  assert.deepEqual(ids(project), []);
});

test("node_modules and build output are not scanned", () => {
  const project = consumer({
    ".next/x.css": REVERSED,
    "dist/x.css": REVERSED,
    "node_modules/y/z.css": REVERSED,
  });

  assert.deepEqual(ids(project), []);
});

test("a directory without package.json", async () => {
  const {code, stderr} = await run(makeProject({"readme.txt": "empty"}));

  assert.equal(code, 2);
  assert.match(stderr, /package\.json/);
});

test("output shape", async () => {
  const {code, stdout} = await run(consumer({"src/index.css": REVERSED}));
  const lines = stdout.split("\n");

  assert.equal(code, 1);
  for (const label of ["@peakui/react", "@peakui/styles", "react", "tailwindcss"]) {
    assert.ok(
      lines.some((line) => line.trim().startsWith(label) && /\d+\.\d+\.\d+$/.test(line)),
      `the context block lists ${label} with its version`,
    );
  }

  const what = lines.findIndex((line) => line.startsWith("what:"));

  assert.ok(what > 0, "a finding starts with a what: line");
  assert.match(lines[what + 1], /^where:\s+src\/index\.css:1$/);
  assert.match(lines[what + 2], /^fix:\s+\S/);
});

test("--project inspects another directory", async () => {
  const project = consumer({"src/index.css": REVERSED});
  const stdout = [];
  const code = await main(["--project", project], {
    cwd: makeProject({"readme.txt": "elsewhere"}),
    env: {},
    stderr: {write() {}},
    stdout: {write: (text) => stdout.push(text)},
  });

  assert.equal(code, 1);
  assert.match(stdout.join(""), /src\/index\.css:1/);
});
