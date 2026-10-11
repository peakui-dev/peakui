import {strict as assert} from "node:assert";
import {join} from "node:path";
import {test} from "node:test";

import {
  DEFAULT_ORIGIN,
  DocsError,
  SKILL_VERSION,
  closestNames,
  fetchIndex,
  fetchText,
  installedVersion,
  normalizeName,
  pageUrl,
  resolveOrigin,
  resolvePage,
  sourceUrl,
  splitProjectFlag,
  versionLine,
} from "../../skills/peakui-react/scripts/lib.mjs";

import {SAMPLE_INDEX, makeProject, startDocsServer} from "./helpers.mjs";

async function withServer(routes, run) {
  const server = await startDocsServer(routes);

  try {
    await run(server);
  } finally {
    await server.close();
  }
}

function rejectsWith(code, message) {
  return (error) => {
    assert.ok(error instanceof DocsError, `expected a DocsError, got ${error}`);
    assert.equal(error.code, code);
    if (message) assert.match(error.message, message);

    return true;
  };
}

test("resolveOrigin: default, override, trailing slash", () => {
  assert.equal(DEFAULT_ORIGIN, "https://peakui.dev");
  assert.equal(resolveOrigin({}).href, "https://peakui.dev/");
  assert.equal(
    resolveOrigin({PEAKUI_DOCS_URL: "http://localhost:3100"}).href,
    "http://localhost:3100/",
  );
  assert.equal(
    resolveOrigin({PEAKUI_DOCS_URL: "https://mirror.test/peakui"}).href,
    "https://mirror.test/peakui/",
  );
});

test("resolveOrigin: a malformed override throws a contract error naming the variable", () => {
  assert.throws(
    () => resolveOrigin({PEAKUI_DOCS_URL: "not a url"}),
    rejectsWith("contract", /PEAKUI_DOCS_URL/),
  );
});

test("pageUrl takes the path of markdownUrl and keeps the origin's prefix", () => {
  const entry = {markdownUrl: "https://docs.example.test/en/docs/react/components/button.md"};

  assert.equal(
    pageUrl(new URL("http://localhost:3100/"), entry).href,
    "http://localhost:3100/en/docs/react/components/button.md",
  );
  assert.equal(
    pageUrl(new URL("https://mirror.test/peakui/"), entry).href,
    "https://mirror.test/peakui/en/docs/react/components/button.md",
  );
});

test("normalizeName", () => {
  assert.equal(normalizeName("Button"), "button");
  assert.equal(normalizeName("TextField"), "text-field");
  assert.equal(normalizeName("text-field"), "text-field");
  assert.equal(normalizeName(" ButtonGroup "), "button-group");
});

test("resolvePage and closestNames", () => {
  assert.equal(resolvePage(SAMPLE_INDEX, "TextField").name, "text-field");
  assert.equal(resolvePage(SAMPLE_INDEX, "quick-start").name, "quick-start");
  assert.equal(resolvePage(SAMPLE_INDEX, "buton"), undefined);
  assert.deepEqual(closestNames(SAMPLE_INDEX, "buton"), ["button", "button-group"]);
});

test("fetchIndex returns the index of a contract-shaped response", async () => {
  await withServer({"/api/components": {body: JSON.stringify(SAMPLE_INDEX)}}, async (server) => {
    const index = await fetchIndex(resolveOrigin({PEAKUI_DOCS_URL: server.origin}));

    assert.equal(index.library.version, "1.5.0");
    assert.deepEqual(
      index.components.map((component) => component.name),
      ["button", "button-group", "text-field"],
    );
    assert.equal(index.guides[0].name, "quick-start");
  });
});

test("fetchIndex: schemaVersion 2 is a contract error telling the user to update the skill", async () => {
  const body = JSON.stringify({...SAMPLE_INDEX, schemaVersion: 2});

  await withServer({"/api/components": {body}}, async (server) => {
    await assert.rejects(
      fetchIndex(resolveOrigin({PEAKUI_DOCS_URL: server.origin})),
      rejectsWith("contract", /update the skill/i),
    );
  });
});

test("fetchIndex: an HTML body is a contract error", async () => {
  await withServer({"/api/components": {body: "<html>"}}, async (server) => {
    await assert.rejects(
      fetchIndex(resolveOrigin({PEAKUI_DOCS_URL: server.origin})),
      rejectsWith("contract"),
    );
  });
});

test("fetchText: a stalled response times out as unreachable after one retry", async () => {
  await withServer({"/slow": {body: "late", delayMs: 200}}, async (server) => {
    await assert.rejects(
      fetchText(new URL("/slow", server.origin), {timeoutMs: 50}),
      rejectsWith("unreachable"),
    );
    assert.equal(server.requests.length, 2);
  });
});

test("fetchText: a redirect to another origin is unreachable, not followed", async () => {
  const routes = {"/moved": {headers: {Location: "https://elsewhere.test/"}, status: 302}};

  await withServer(routes, async (server) => {
    await assert.rejects(
      fetchText(new URL("/moved", server.origin)),
      rejectsWith("unreachable", /redirect.*elsewhere\.test/i),
    );
  });
});

test("fetchText: a redirect inside the origin is followed", async () => {
  const routes = {
    "/new": {body: "moved here"},
    "/old": {headers: {Location: "/new"}, status: 308},
  };

  await withServer(routes, async (server) => {
    assert.equal(await fetchText(new URL("/old", server.origin)), "moved here");
  });
});

test("fetchText: 404 is not-found and is not retried", async () => {
  await withServer({}, async (server) => {
    await assert.rejects(fetchText(new URL("/nope.md", server.origin)), rejectsWith("not-found"));
    assert.equal(server.requests.length, 1);
  });
});

test("fetchText sends the skill user agent and no query string", async () => {
  await withServer({"/page.md": {body: "# Page"}}, async (server) => {
    assert.equal(await fetchText(new URL("/page.md", server.origin)), "# Page");
    assert.equal(server.requests[0].headers["user-agent"], `peakui-react-skill/${SKILL_VERSION}`);
    assert.equal(server.requests[0].url, "/page.md");
  });
});

test("installedVersion resolves upward from a subdirectory and from a workspace package", () => {
  const root = makeProject({
    "node_modules/@peakui/react/package.json":
      '{"name":"@peakui/react","version":"1.2.0","exports":{"./package.json":"./package.json"}}',
    "package.json": "{}",
    "packages/web/package.json": "{}",
    "src/pages/.keep": "",
  });

  assert.equal(installedVersion(join(root, "packages/web"), "@peakui/react"), "1.2.0");
  assert.equal(installedVersion(join(root, "src/pages"), "@peakui/react"), "1.2.0");
  assert.equal(installedVersion(root, "@peakui/styles"), undefined);
});

test("versionLine", () => {
  assert.match(versionLine("1.5.0", "1.5.0"), /1\.5\.0/);
  assert.doesNotMatch(versionLine("1.5.0", "1.5.0"), /another version/);
  assert.match(versionLine("1.5.0", "1.2.0"), /another version.*node_modules/s);
  assert.match(versionLine("1.5.0", undefined), /not installed/);
});

test("splitProjectFlag", () => {
  assert.deepEqual(splitProjectFlag(["list", "--project", "/a"], "/b"), {
    project: "/a",
    rest: ["list"],
  });
  assert.deepEqual(splitProjectFlag(["button"], "/b"), {project: "/b", rest: ["button"]});
});

test("sourceUrl turns the index's repository link into a raw file URL", () => {
  const entry = {
    links: {
      source:
        "https://github.com/peakui-dev/peakui/blob/main/packages/react/src/components/modal/modal.tsx",
    },
  };

  assert.equal(
    sourceUrl(entry, {}).href,
    "https://raw.githubusercontent.com/peakui-dev/peakui/main/packages/react/src/components/modal/modal.tsx",
  );
  assert.equal(
    sourceUrl(entry, {PEAKUI_SOURCE_URL: "http://127.0.0.1:1/raw"}).href,
    "http://127.0.0.1:1/raw/peakui-dev/peakui/main/packages/react/src/components/modal/modal.tsx",
  );
});

test("sourceUrl is undefined for a page without a repository link", () => {
  assert.equal(sourceUrl({links: {source: null}}, {}), undefined);
  assert.equal(sourceUrl({}, {}), undefined);
  assert.equal(sourceUrl({links: {source: "https://example.test/modal.tsx"}}, {}), undefined);
});

test("fetchText: a body cut off mid-transfer is unreachable, not an empty page", async () => {
  await withServer({"/page.md": {body: "# Half a pa", cutBody: true}}, async (server) => {
    await assert.rejects(fetchText(new URL("/page.md", server.origin)), rejectsWith("unreachable"));
    assert.equal(server.requests.length, 2, "the read was retried once");
  });
});
