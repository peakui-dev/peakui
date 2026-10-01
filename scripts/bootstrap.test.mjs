import assert from "node:assert/strict";
import {createServer} from "node:net";
import {test} from "node:test";

import {
  checkNodeVersion,
  checkPnpmVersion,
  collectFindings,
  formatReport,
  isMcpCommandPortable,
  isPortBusy,
  setupSteps,
} from "./bootstrap.mjs";

test("checkNodeVersion rejects below the floor and names the actual version", () => {
  const r = checkNodeVersion("v22.11.0", "22.18.0");

  assert.equal(r.ok, false);
  assert.match(r.detail, /22\.11\.0/);
});

test("checkNodeVersion accepts the floor itself and above", () => {
  assert.equal(checkNodeVersion("v22.18.0", "22.18.0").ok, true);
  assert.equal(checkNodeVersion("v24.21.0", "22.18.0").ok, true);
});

test("checkNodeVersion compares segments numerically, not lexically", () => {
  // "22.9" sorts after "22.18" as a string; it must not pass a 22.18 floor.
  assert.equal(checkNodeVersion("v22.9.0", "22.18.0").ok, false);
});

test("checkPnpmVersion requires an exact match and names the actual version", () => {
  assert.equal(checkPnpmVersion("12.3.4", "12.3.4").ok, true);

  const r = checkPnpmVersion("11.0.0", "12.3.4");

  assert.equal(r.ok, false);
  assert.match(r.detail, /11\.0\.0/);
});

test("formatReport marks failures and returns a non-zero code when any fail", () => {
  const out = formatReport([
    {name: "node", ok: true, detail: "v24.21.0"},
    {name: "codegraph index", ok: false, detail: "missing"},
  ]);

  assert.match(out.text, /codegraph index/);
  assert.equal(out.code, 1);
});

test("formatReport returns zero when every finding passes", () => {
  assert.equal(formatReport([{name: "node", ok: true, detail: "ok"}]).code, 0);
});

test("isPortBusy sees a listening port and a free one", async () => {
  const server = createServer();

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const {port} = server.address();

  assert.equal(await isPortBusy(port), true);

  await new Promise((resolve) => server.close(resolve));

  assert.equal(await isPortBusy(port), false);
});

test("isMcpCommandPortable accepts the pnpm exec form", () => {
  const config = {
    mcpServers: {
      codegraph: {type: "stdio", command: "pnpm", args: ["exec", "codegraph", "serve", "--mcp"]},
    },
  };

  assert.equal(isMcpCommandPortable(config), true);
});

test("isMcpCommandPortable rejects a bare PATH command", () => {
  // This is what `codegraph install` writes, and what breaks without a global install.
  const config = {
    mcpServers: {codegraph: {type: "stdio", command: "codegraph", args: ["serve", "--mcp"]}},
  };

  assert.equal(isMcpCommandPortable(config), false);
});

test("isMcpCommandPortable reports a config with no codegraph server as not portable", () => {
  assert.equal(isMcpCommandPortable({mcpServers: {other: {command: "node"}}}), false);
  assert.equal(isMcpCommandPortable({}), false);
});

test("collectFindings reports a missing codegraph index", () => {
  const findings = collectFindings(
    {existsSync: (p) => !String(p).includes(".codegraph"), readFileSync: () => "{}"},
    {},
  );
  const index = findings.find((f) => f.name === "codegraph index");

  assert.equal(index.ok, false);
});

test("collectFindings reports an occupied port as information, not a failure", () => {
  const findings = collectFindings(
    {existsSync: () => true, readFileSync: () => "{}"},
    {portBusy: true, port: 6007},
  );
  const port = findings.find((f) => f.name === "storybook port");

  assert.equal(port.ok, true);
  assert.match(port.detail, /6007/);
});

test("collectFindings flags an .mcp.json whose command is not portable", () => {
  const findings = collectFindings(
    {
      existsSync: () => true,
      readFileSync: () =>
        JSON.stringify({mcpServers: {codegraph: {command: "codegraph", args: ["serve"]}}}),
    },
    {},
  );
  const mcp = findings.find((f) => f.name === ".mcp.json");

  assert.equal(mcp.ok, false);
  assert.match(mcp.detail, /portable|pnpm/i);
});

test("setupSteps skips building the index when one already exists", () => {
  const withIndex = setupSteps({existsSync: () => true}, "/repo");
  const withoutIndex = setupSteps({existsSync: () => false}, "/repo");

  assert.equal(
    withIndex.some((s) => s.args.includes("codegraph")),
    false,
  );
  assert.equal(
    withoutIndex.some((s) => s.args.includes("codegraph")),
    true,
  );
});

test("setupSteps always installs dependencies and the browser", () => {
  const steps = setupSteps({existsSync: () => true}, "/repo");

  assert.equal(steps[0].args.includes("install"), true);
  assert.equal(
    steps.some((s) => s.args.includes("playwright")),
    true,
  );
});
