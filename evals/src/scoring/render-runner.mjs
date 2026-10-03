/*
 * Renders one exported component of a workspace to static markup, once per case.
 * Runs as a child process so that Vite, React and react-dom all come from the WORKSPACE's
 * node_modules: one React copy, the versions the project really has.
 *
 * argv: <workspaceDir> <module, e.g. /src/components/SaveBar.tsx> <exportName> <casesJson> <resultPath>
 * The result is written to <resultPath>, never to stdout: the agent's module runs in this process
 * and may print whatever it likes. The file holds {"ok":true,"documents":{"<case>":"<html>"}} or
 * {"ok":false,"error":"..."}.
 *
 * The workspace's own Vite configuration is honoured (plugins, `resolve.alias`) and so are the
 * `paths` of its tsconfig: a solution that builds must be able to render. A configuration that
 * cannot load fails the build as well.
 */
import {writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [, , workspaceDir, modulePath, exportName, casesJson = "[]", resultPath] = process.argv;
const require = createRequire(join(workspaceDir, "package.json"));
const reviveFunctions = (_key, value) => (value === "__fn__" ? () => {} : value);

// A function, a class, or an object that React tagged (`memo`, `forwardRef`, `lazy`, a context).
function isComponentType(value) {
  return (
    typeof value === "function" ||
    (typeof value === "object" && value !== null && typeof value.$$typeof === "symbol")
  );
}

let server;
let result;

try {
  const {createServer} = await import(pathToFileURL(require.resolve("vite")).href);

  server = await createServer({
    appType: "custom",
    css: {postcss: {}},
    logLevel: "silent",
    optimizeDeps: {include: [], noDiscovery: true},
    resolve: {tsconfigPaths: true},
    root: workspaceDir,
    server: {hmr: false, middlewareMode: true, watch: null, ws: false},
  });

  const loaded = await server.ssrLoadModule(modulePath);
  const component = loaded[exportName];

  if (!isComponentType(component)) {
    throw new Error(`${modulePath} has no exported component named ${exportName}`);
  }

  // Through require, not ssrLoadModule: Vite externalizes node_modules, so this is the same
  // CommonJS instance the component imports.
  const react = require("react");
  const {renderToStaticMarkup} = require("react-dom/server");
  const documents = {};

  for (const {name, props} of JSON.parse(casesJson, reviveFunctions)) {
    documents[name] = renderToStaticMarkup(react.createElement(component, props));
  }

  result = {documents, ok: true};
} catch (error) {
  result = {error: String(error?.stack ?? error), ok: false};
}

writeFileSync(resultPath, JSON.stringify(result));

// The module may have left a timer, a socket or a watcher behind. The result is on disk, so do not
// wait for the process to drain and do not let closing the server hold it up.
try {
  await Promise.race([server?.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);
} catch {
  // Nothing to do: the result is written.
}

process.exit(0);
