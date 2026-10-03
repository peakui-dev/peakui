/*
 * Renders one exported component of a workspace to static markup, once per case.
 * Runs as a child process so that Vite, React and react-dom all come from the WORKSPACE's
 * node_modules: one React copy, the versions the project really has.
 *
 * argv: <workspaceDir> <module, e.g. /src/components/SaveBar.tsx> <exportName> <casesJson>
 * stdout: {"ok":true,"documents":{"<case>":"<html>"}} or {"ok":false,"error":"..."}
 */
import {createRequire} from "node:module";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const [, , workspaceDir, modulePath, exportName, casesJson = "[]"] = process.argv;
const require = createRequire(join(workspaceDir, "package.json"));
const reviveFunctions = (_key, value) => (value === "__fn__" ? () => {} : value);

let server;

try {
  const {createServer} = await import(pathToFileURL(require.resolve("vite")).href);

  // configFile: false — the agent's Vite config must not be able to break scoring.
  server = await createServer({
    appType: "custom",
    configFile: false,
    css: {postcss: {}},
    logLevel: "silent",
    optimizeDeps: {include: [], noDiscovery: true},
    root: workspaceDir,
    server: {hmr: false, middlewareMode: true, watch: null, ws: false},
  });

  const loaded = await server.ssrLoadModule(modulePath);
  const component = loaded[exportName];

  if (typeof component !== "function") {
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

  process.stdout.write(JSON.stringify({documents, ok: true}));
} catch (error) {
  process.stdout.write(JSON.stringify({error: String(error?.stack ?? error), ok: false}));
} finally {
  await server?.close();
}
