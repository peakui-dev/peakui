import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterAll, describe, expect, it} from "vitest";

import {runCommand} from "../../src/exec.ts";
import {PACKAGE_DIR} from "../../src/paths.ts";

const homes: string[] = [];

afterAll(() => {
  for (const home of homes) rmSync(home, {force: true, recursive: true});
});

/** One pack in its own process, with its own harness home; resolves to the library hash. */
async function packInProcess(shared?: string): Promise<string> {
  const home = shared ?? mkdtempSync(join(tmpdir(), "peakui-evals-pack-"));

  homes.push(home);

  const module = JSON.stringify(join(PACKAGE_DIR, "src/pack/stage.ts"));
  const result = await runCommand(
    [
      process.execPath,
      "--input-type=module",
      "-e",
      `import {packLibrary} from ${module}; process.stdout.write((await packLibrary()).libraryHash);`,
    ],
    {cwd: PACKAGE_DIR, env: {...process.env, PEAKUI_EVALS_HOME: home}, timeoutMs: 600_000},
  );

  if (result.exitCode !== 0) throw new Error(result.stderr || result.stdout);

  return result.stdout.trim();
}

describe("packLibrary determinism", () => {
  it("gives one hash for packs that run in parallel, in one home and one after another", async () => {
    const parallel = await Promise.all(Array.from({length: 6}, packInProcess));
    const sequential = [await packInProcess(), await packInProcess()];
    const together = mkdtempSync(join(tmpdir(), "peakui-evals-pack-"));
    const sharedHome = await Promise.all(Array.from({length: 3}, () => packInProcess(together)));

    expect(new Set([...parallel, ...sequential, ...sharedHome]).size).toBe(1);
  });
});
