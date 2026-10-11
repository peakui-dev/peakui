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
      env: {PEAKUI_DOCS_URL: server.origin, PEAKUI_SOURCE_URL: `${server.origin}/raw/`},
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

// A component page as the site serves it: a header, then the five sections every page has.
const HEADER =
  '<page url="https://docs.example.test/en/docs/react/components/modal">\n# Modal\n\n> Modal dialog overlay\n\n**Category**: components\n\n';
const USAGE = "## Usage\n\nusage text\n\n### Anatomy\n\nanatomy text\n\n";
const EXAMPLES = "## Examples\n\n### Controlled State\n\nexample text\n\n";
const CUSTOMIZATION = "## Customization\n\ncustomization text\n\n";
const STYLING = "## Styling Reference\n\nstyling text\n\n";
const API = "## API Reference\n\napi text\n";
const MODAL = `${HEADER}${USAGE}${EXAMPLES}${CUSTOMIZATION}${STYLING}${API}</page>\n`;
const MODAL_SOURCE = "export const Modal = () => null;\n";
const MODAL_ENTRY = {
  description: "Modal dialog overlay",
  links: {
    reactAria: null,
    source:
      "https://github.com/peakui-dev/peakui/blob/main/packages/react/src/components/modal/modal.tsx",
    styles: null,
  },
  markdownUrl: "https://docs.example.test/en/docs/react/components/modal.md",
  name: "modal",
  title: "Modal",
  url: "https://docs.example.test/en/docs/react/components/modal",
};
const RAW_SOURCE = "/raw/peakui-dev/peakui/main/packages/react/src/components/modal/modal.tsx";
const WITH_MODAL = {
  ...SITE,
  "/api/components": {
    body: JSON.stringify({
      ...SAMPLE_INDEX,
      components: [...SAMPLE_INDEX.components, MODAL_ENTRY],
    }),
  },
  "/en/docs/react/components/modal.md": {body: MODAL},
  [RAW_SOURCE]: {body: MODAL_SOURCE},
};

test("a component page prints its header, Usage and API Reference by default", async () => {
  const {code, stdout} = await run(["modal"], {routes: WITH_MODAL});

  assert.equal(code, 0);
  assert.ok(stdout.includes(HEADER));
  assert.ok(stdout.includes("anatomy text"));
  assert.ok(stdout.includes("api text"));
  assert.ok(stdout.indexOf("usage text") < stdout.indexOf("api text"));
  for (const left of ["example text", "customization text", "styling text"]) {
    assert.ok(!stdout.includes(left), `the default output leaves out "${left}"`);
  }
  assert.ok(stdout.trimEnd().endsWith("</page>"));
});

test("the default output says which flag prints the rest", async () => {
  const {stdout} = await run(["modal"], {routes: WITH_MODAL});
  const hint = stdout.split("\n").find((line) => line.includes("--examples"));

  assert.ok(hint, "a line names --examples");
  for (const flag of ["--styling", "--source", "--full"]) assert.ok(hint.includes(flag), flag);
});

test("--examples prints the header and the Examples section", async () => {
  const {code, stdout} = await run(["modal", "--examples"], {routes: WITH_MODAL});

  assert.equal(code, 0);
  assert.ok(stdout.includes(HEADER));
  assert.ok(stdout.includes("example text"));
  for (const left of ["usage text", "api text", "styling text"]) assert.ok(!stdout.includes(left));
});

test("--styling prints Customization and Styling Reference", async () => {
  const {code, stdout} = await run(["modal", "--styling"], {routes: WITH_MODAL});

  assert.equal(code, 0);
  assert.ok(stdout.includes("customization text"));
  assert.ok(stdout.includes("styling text"));
  for (const left of ["usage text", "api text", "example text"]) assert.ok(!stdout.includes(left));
});

test("--full prints the page exactly as served", async () => {
  const {code, stdout} = await run(["modal", "--full"], {routes: WITH_MODAL});

  assert.equal(code, 0);
  assert.ok(stdout.includes(MODAL));
});

test("a page without those sections prints whole, whatever the flag", async () => {
  const {stdout} = await run(["button", "--examples"], {routes: WITH_MODAL});

  assert.ok(stdout.includes(BUTTON));
});

test("--source prints the component's source file and says which branch it is from", async () => {
  const {code, stdout} = await run(["modal", "--source"], {routes: WITH_MODAL});
  const [first] = stdout.split("\n");

  assert.equal(code, 0);
  assert.match(first, /main branch/);
  assert.match(first, /installed.*1\.5\.0/);
  assert.ok(stdout.includes(MODAL_SOURCE));
  assert.ok(stdout.includes(MODAL_ENTRY.links.source), "the output names where the file lives");
  assert.ok(!stdout.includes("usage text"), "the documentation page is not printed with it");
});

test("--source for a file that cannot be fetched exits 1 and says the repository may be private", async () => {
  const routes = {...WITH_MODAL};

  delete routes[RAW_SOURCE];

  const {code, stderr} = await run(["modal", "--source"], {routes});

  assert.equal(code, 1);
  assert.match(stderr, /modal/);
  assert.match(stderr, /not be public/);
});

test("--source for a page that has no source exits 1", async () => {
  const {code, stderr} = await run(["quick-start", "--source"], {routes: WITH_MODAL});

  assert.equal(code, 1);
  assert.match(stderr, /quick-start.*no source/);
});

test("list ignores the section flags", async () => {
  const {code, stdout} = await run(["list", "--examples"], {routes: WITH_MODAL});

  assert.equal(code, 0);
  assert.ok(stdout.includes("modal — Modal dialog overlay"));
});

test("with no site and no installed package the message offers the install, not node_modules", async () => {
  const {code, stderr} = await run(["button"], {offline: true, project: {"package.json": "{}"}});

  assert.equal(code, 2);
  assert.match(stderr, /not installed/);
  assert.match(stderr, /npm install @peakui\/react @peakui\/styles/);
  assert.doesNotMatch(stderr, /dist\//);
});

test("a page whose body is cut off is a failure, not an empty page", async () => {
  const routes = {...SITE, [markdownPath("button")]: {body: "# Half", cutBody: true}};
  const {code, stderr, stdout} = await run(["button"], {routes});

  assert.equal(code, 2);
  assert.match(stderr, /could not be reached/);
  assert.ok(!stdout.includes("# Half"));
});
