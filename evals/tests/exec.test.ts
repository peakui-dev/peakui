import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, beforeEach, describe, expect, it} from "vitest";

import {runCommand} from "../src/exec.ts";
import {installedVersions} from "../src/fixtures/prepare.ts";
import {npmEnvironment} from "../src/npm.ts";

let home: string;
let previousHome: string | undefined;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "evals-exec-"));
  previousHome = process.env.PEAKUI_EVALS_HOME;
  process.env.PEAKUI_EVALS_HOME = home;
});

afterEach(() => {
  if (previousHome === undefined) delete process.env.PEAKUI_EVALS_HOME;
  else process.env.PEAKUI_EVALS_HOME = previousHome;
  rmSync(home, {force: true, recursive: true});
});

describe("npmEnvironment", () => {
  it("points npm at an empty user config and a cache under the harness home", () => {
    const env = npmEnvironment();

    expect(env.npm_config_userconfig).toBeDefined();
    expect(readFileSync(env.npm_config_userconfig!, "utf8")).toBe("");
    expect(readFileSync(env.npm_config_globalconfig!, "utf8")).toBe("");
    expect(env.npm_config_globalconfig).not.toBe(env.npm_config_userconfig);
    expect(env.npm_config_cache!.startsWith(home)).toBe(true);
    expect(existsSync(env.npm_config_cache!)).toBe(true);
  });

  it("passes only an allow-list of the parent environment", () => {
    process.env.NPM_TOKEN = "secret";
    process.env.npm_config_registry = "https://example.invalid";
    process.env.SOME_OTHER_SECRET = "x";

    try {
      const env = npmEnvironment();

      expect(env.PATH).toBe(process.env.PATH);
      expect(env).not.toHaveProperty("NPM_TOKEN");
      expect(env).not.toHaveProperty("SOME_OTHER_SECRET");
      expect(env.npm_config_registry).toBeUndefined();
      expect(env.HOME!.startsWith(home)).toBe(true);
    } finally {
      delete process.env.NPM_TOKEN;
      delete process.env.npm_config_registry;
      delete process.env.SOME_OTHER_SECRET;
    }
  });

  it("makes npm itself resolve the isolated config", async () => {
    const result = await runCommand(["npm", "config", "get", "userconfig"], {
      cwd: home,
      env: npmEnvironment(),
      timeoutMs: 30_000,
    });

    expect(result.stdout.trim()).toBe(npmEnvironment().npm_config_userconfig);
  });
});

describe("installedVersions", () => {
  it("reads versions from node_modules and reports a missing package as null", () => {
    mkdirSync(join(home, "node_modules/@scope/pkg"), {recursive: true});
    writeFileSync(join(home, "node_modules/@scope/pkg/package.json"), '{"version":"1.2.3"}');

    expect(installedVersions(home, ["@scope/pkg", "absent"])).toEqual({
      "@scope/pkg": "1.2.3",
      absent: null,
    });
  });
});

describe("runCommand output cap", () => {
  const spew = [
    "node",
    "-e",
    "process.stdout.write('x'.repeat(200000)); process.stderr.write('e'.repeat(200000))",
  ];

  it("caps each stream and marks the truncation", async () => {
    const result = await runCommand(spew, {cwd: home, maxOutputBytes: 1000, timeoutMs: 30_000});

    expect(result.exitCode).toBe(0);
    expect(result.truncated).toBe(true);
    expect(result.stdout.length).toBeLessThan(1200);
    expect(result.stdout).toMatch(/\[output truncated at 1000 bytes\]$/);
    expect(result.stderr).toMatch(/\[output truncated at 1000 bytes\]$/);
  });

  it("does not mark output that fits", async () => {
    const result = await runCommand(["node", "-e", "process.stdout.write('ok')"], {
      cwd: home,
      timeoutMs: 30_000,
    });

    expect(result.truncated).toBe(false);
    expect(result.stdout).toBe("ok");
  });
});

describe("runCommand process control", () => {
  function alive(pid: number): boolean {
    try {
      process.kill(pid, 0);

      return true;
    } catch {
      return false;
    }
  }

  async function dead(pid: number, withinMs: number): Promise<boolean> {
    const until = Date.now() + withinMs;

    while (Date.now() < until) {
      if (!alive(pid)) return true;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    return !alive(pid);
  }

  const forever = "setInterval(() => {}, 1000)";

  it("kills the whole group on timeout, grandchildren included", async () => {
    const pidFile = join(home, "grandchild.pid");
    const parent = `
      const {spawn} = require("node:child_process");
      const {writeFileSync} = require("node:fs");
      const grandchild = spawn(process.execPath, ["-e", ${JSON.stringify(forever)}], {stdio: "ignore"});
      writeFileSync(${JSON.stringify(pidFile)}, String(grandchild.pid));
      ${forever};
    `;
    const result = await runCommand(["node", "-e", parent], {
      cwd: home,
      killGraceMs: 300,
      timeoutMs: 700,
    });
    const grandchild = Number(readFileSync(pidFile, "utf8"));

    try {
      expect(result.timedOut).toBe(true);
      expect(await dead(grandchild, 3000)).toBe(true);
    } finally {
      if (alive(grandchild)) process.kill(grandchild, "SIGKILL");
    }
  });

  it("escalates when the child ignores the first signal", async () => {
    const pidFile = join(home, "stubborn.pid");
    const parent = `
      require("node:fs").writeFileSync(${JSON.stringify(pidFile)}, String(process.pid));
      process.on("SIGTERM", () => {});
      ${forever};
    `;
    const started = Date.now();
    const result = await runCommand(["node", "-e", parent], {
      cwd: home,
      killGraceMs: 300,
      timeoutMs: 700,
    });
    const pid = Number(readFileSync(pidFile, "utf8"));

    try {
      expect(result.timedOut).toBe(true);
      expect(Date.now() - started).toBeLessThan(5000);
      expect(await dead(pid, 3000)).toBe(true);
    } finally {
      if (alive(pid)) process.kill(pid, "SIGKILL");
    }
  });

  it("settles on exit although a detached grandchild keeps the pipes open", async () => {
    const pidFile = join(home, "holder.pid");
    const parent = `
      const {spawn} = require("node:child_process");
      const {writeFileSync} = require("node:fs");
      const holder = spawn(process.execPath, ["-e", ${JSON.stringify(forever)}], {
        detached: true,
        stdio: ["ignore", "inherit", "inherit"],
      });
      holder.unref();
      writeFileSync(${JSON.stringify(pidFile)}, String(holder.pid));
      process.stdout.write("parent output");
    `;
    const started = Date.now();

    try {
      const result = await runCommand(["node", "-e", parent], {
        cwd: home,
        exitGraceMs: 200,
        timeoutMs: 20_000,
      });

      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.stdout).toBe("parent output");
      expect(Date.now() - started).toBeLessThan(5000);
    } finally {
      const holder = Number(readFileSync(pidFile, "utf8"));

      if (alive(holder)) process.kill(holder, "SIGKILL");
    }
  }, 15_000);
});
