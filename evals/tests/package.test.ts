import {readFileSync} from "node:fs";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

import {PACKAGE_DIR} from "../src/paths.ts";

const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, "package.json"), "utf8")) as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  private: boolean;
};

describe("package manifest", () => {
  it("is private", () => {
    expect(manifest.private).toBe(true);
  });

  it("pins every dependency exactly", () => {
    const versions = Object.entries({...manifest.dependencies, ...manifest.devDependencies});

    for (const [name, version] of versions) {
      expect(version, name).toMatch(/^(workspace:\*|\d+\.\d+\.\d+)$/);
    }
  });
});
