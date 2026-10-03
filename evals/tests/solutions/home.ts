import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {afterAll, beforeAll} from "vitest";

/**
 * Points the harness at a fresh directory for the whole file and removes it afterwards, so these
 * tests can neither read nor destroy a harness home that was really prepared.
 */
export function useFreshHarnessHome(): void {
  let home = "";
  let previous: string | undefined;

  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), "peakui-evals-test-"));
    previous = process.env.PEAKUI_EVALS_HOME;
    process.env.PEAKUI_EVALS_HOME = home;
  });

  afterAll(() => {
    if (previous === undefined) delete process.env.PEAKUI_EVALS_HOME;
    else process.env.PEAKUI_EVALS_HOME = previous;
    rmSync(home, {force: true, recursive: true});
  });
}
