import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterEach, describe, expect, it} from "vitest";

import {agentConfigDir, evalsHome, templatesDir} from "../src/paths.ts";

describe("evalsHome", () => {
  const saved = process.env.PEAKUI_EVALS_HOME;

  afterEach(() => {
    if (saved === undefined) delete process.env.PEAKUI_EVALS_HOME;
    else process.env.PEAKUI_EVALS_HOME = saved;
  });

  it("defaults to a directory under the system temp directory", () => {
    delete process.env.PEAKUI_EVALS_HOME;
    expect(evalsHome()).toBe(join(tmpdir(), "peakui-evals"));
  });

  it("honours PEAKUI_EVALS_HOME", () => {
    process.env.PEAKUI_EVALS_HOME = "/tmp/elsewhere";
    expect(evalsHome()).toBe("/tmp/elsewhere");
    expect(templatesDir()).toBe("/tmp/elsewhere/templates");
    expect(agentConfigDir("b1")).toBe("/tmp/elsewhere/agent-config/b1");
  });
});
