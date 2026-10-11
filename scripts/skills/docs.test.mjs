import {strict as assert} from "node:assert";
import {test} from "node:test";

import {main} from "../../skills/peakui-react/scripts/docs.mjs";

import {SAMPLE_INDEX, makeProject, markdownPath, startDocsServer} from "./helpers.mjs";

const BUTTON =
  '<page url="https://docs.example.test/en/docs/react/components/button">\n# Button\n\nA pressable button.\n</page>\n';
const TEXT_FIELD =
  '<page url="https://docs.example.test/en/docs/react/components/text-field">\n# TextField\n</page>\n';

const SITE = {
  "/api/components": {body: JSON.stringify(SAMPLE_INDEX)},
  [markdownPath("button")]: {body: BUTTON},
  [markdownPath("text-field")]: {body: TEXT_FIELD},
};

const INSTALLED = (version) => ({
  "node_modules/@peakui/react/package.json": JSON.stringify({name: "@peakui/react", version}),
  "package.json": "{}",
});

async function run(argv, options = {}) {
  const server = await startDocsServer(options.routes ?? SITE);
  const stdout = [];
  const stderr = [];

  if (options.offline) await server.close();

  try {
    const code = await main(argv, {
      cwd: makeProject(options.project ?? INSTALLED("1.5.0")),
      env: {PEAKUI_DOCS_URL: server.origin},
      stderr: {write: (text) => stderr.push(text)},
      stdout: {write: (text) => stdout.push(text)},
    });

    return {code, stderr: stderr.join(""), stdout: stdout.join("")};
  } finally {
    if (!options.offline) await server.close();
  }
}

test("list prints the version line, then components, then guides", async () => {
  const {code, stdout} = await run(["list"]);
  const lines = stdout.split("\n");

  assert.equal(code, 0);
  assert.match(lines[0], /@peakui\/react/);
  assert.ok(stdout.indexOf("button — ") < stdout.indexOf("quick-start — "));
  assert.equal(lines.filter((line) => line.includes(" — ")).length, 4);
  assert.ok(lines.includes("text-field — A text input with a label."));
});

test("list --json", async () => {
  const {code, stdout} = await run(["list", "--json"]);
  const index = JSON.parse(stdout);

  assert.equal(code, 0);
  assert.deepEqual(Object.keys(index).sort(), ["components", "guides", "installed", "library"]);
  assert.equal(index.installed, "1.5.0");
  assert.equal(index.library.version, "1.5.0");
  assert.equal(index.components.length, 3);
});

test("pages print in the order asked, exactly as served", async () => {
  const {code, stdout} = await run(["text-field", "Button"]);

  assert.equal(code, 0);
  assert.match(stdout.split("\n")[0], /@peakui\/react/);
  assert.ok(stdout.includes(TEXT_FIELD));
  assert.ok(stdout.includes(BUTTON));
  assert.ok(stdout.indexOf(TEXT_FIELD) < stdout.indexOf(BUTTON));
});

test("an unknown name exits 1, names the closest pages, and still prints the rest", async () => {
  const {code, stderr, stdout} = await run(["buton", "button"]);

  assert.equal(code, 1);
  assert.equal(
    stderr.trim(),
    'Unknown page "buton". Closest: button, button-group. Run "list" to see every page.',
  );
  assert.ok(stdout.includes(BUTTON));
});

test("an unknown name with nothing close still points at list", async () => {
  const {code, stderr} = await run(["zzzzzz"]);

  assert.equal(code, 1);
  assert.equal(stderr.trim(), 'Unknown page "zzzzzz". Run "list" to see every page.');
});

test("a listed page whose markdown is gone exits 1 and still prints the rest", async () => {
  const routes = {...SITE};

  delete routes[markdownPath("text-field")];

  const {code, stderr, stdout} = await run(["button", "text-field"], {routes});

  assert.equal(code, 1);
  assert.match(stderr, /text-field/);
  assert.ok(stdout.includes(BUTTON));
});

test("no argument is wrong usage", async () => {
  const {code, stderr, stdout} = await run([]);

  assert.equal(code, 1);
  assert.match(stderr, /usage:/);
  assert.equal(stdout, "");
});

test("an unreachable site exits 2 and prints the fallback", async () => {
  const {code, stderr, stdout} = await run(["button"], {offline: true});

  assert.equal(code, 2);
  assert.match(stderr, /node_modules\/@peakui\/react\/dist\//);
  assert.match(stderr, /node_modules\/@peakui\/styles\/components\//);
  assert.equal(stdout, "");
});

test("an HTML index exits 2 with the contract message", async () => {
  const {code, stderr} = await run(["list"], {routes: {"/api/components": {body: "<html>"}}});

  assert.equal(code, 2);
  assert.match(stderr, /documentation index/);
  assert.doesNotMatch(stderr, /SyntaxError|\n\s+at /);
});

test("the version line warns when the installed version differs", async () => {
  const {stdout} = await run(["button"], {project: INSTALLED("1.2.0")});

  assert.match(stdout.split("\n")[0], /another version/);
});

test("--project selects the project the installed version is read from", async () => {
  const other = makeProject(INSTALLED("1.2.0"));
  const {stdout} = await run(["list", "--project", other]);

  assert.match(stdout.split("\n")[0], /installed: 1\.2\.0/);
});
