import {mkdirSync, mkdtempSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";

/*
 * Test helpers for the scripts of the consumer skill in skills/peakui-react. They live here, not
 * in the skill directory: that directory is copied whole into a consumer's project.
 */

const BUILD_ORIGIN = "https://docs.example.test";

function entry(kind, name, title, description) {
  const path = kind === "component" ? `components/${name}` : `getting-started/${name}`;
  const url = `${BUILD_ORIGIN}/en/docs/react/${path}`;

  return {description, markdownUrl: `${url}.md`, name, title, url};
}

/** An index in the shape of the docs site contract, built for another origin than any test server. */
export const SAMPLE_INDEX = {
  components: [
    entry("component", "button", "Button", "A pressable button."),
    entry("component", "button-group", "ButtonGroup", "Groups related buttons."),
    entry("component", "text-field", "TextField", "A text input with a label."),
  ],
  guides: [entry("guide", "quick-start", "Quick Start", "Install PeakUI.")],
  library: {name: "@peakui/react", version: "1.5.0"},
  schemaVersion: 1,
  site: BUILD_ORIGIN,
};

/** The path a page of SAMPLE_INDEX is served at. */
export function markdownPath(name) {
  const found = [...SAMPLE_INDEX.components, ...SAMPLE_INDEX.guides].find(
    (candidate) => candidate.name === name,
  );

  return new URL(found.markdownUrl).pathname;
}

/**
 * Starts a local HTTP server. `routes` maps a request path to its response; a path that is not
 * listed answers 404 with an empty body, as the docs site does for an unknown markdown page.
 * `requests` records every request received, in order. A route with `cutBody` drops the connection
 * partway through its body.
 */
export async function startDocsServer(routes) {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({headers: request.headers, method: request.method, url: request.url});

    const route = routes[new URL(request.url, "http://localhost").pathname];

    if (!route) {
      response.writeHead(404).end();

      return;
    }

    setTimeout(() => {
      if (route.cutBody) {
        // Headers and the start of the body arrive, then the connection drops.
        response.writeHead(200, {"Content-Length": String((route.body ?? "").length + 1000)});
        response.write(route.body ?? "");
        setTimeout(() => response.socket?.destroy(), 20);

        return;
      }

      response.writeHead(route.status ?? 200, route.headers ?? {});
      response.end(route.body ?? "");
    }, route.delayMs ?? 0);
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    close() {
      server.closeAllConnections();

      return new Promise((resolve) => server.close(resolve));
    },
    origin: `http://127.0.0.1:${server.address().port}`,
    requests,
  };
}

/** Writes `files` (path to text) into a fresh temporary directory and returns its path. */
export function makeProject(files) {
  const root = mkdtempSync(join(tmpdir(), "peakui-skill-test-"));

  for (const [path, text] of Object.entries(files)) {
    if (text === null) continue;

    const target = join(root, path);

    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, text);
  }

  return root;
}
