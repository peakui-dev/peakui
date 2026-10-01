import assert from "node:assert/strict";
import {createServer} from "node:net";
import {test} from "node:test";

import {checkNodeVersion, checkPnpmVersion, formatReport, isPortBusy} from "./bootstrap.mjs";

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
