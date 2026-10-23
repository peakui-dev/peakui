import {readFile} from "node:fs/promises";
import {join} from "node:path";

import {describe, expect, it} from "vitest";

const root = join(import.meta.dirname, "..");

describe("vitest.config.ts", () => {
  // A test run that writes the Vite flavor into the shared `.source/` breaks a running `next dev`
  // with "It must not start with './' or '../'" until restart.
  it("generates the fumadocs sources outside the directory `next dev` reads", async () => {
    const config = await readFile(join(root, "vitest.config.ts"), "utf-8");

    expect(config).toMatch(/const vitestOutDir = "\.source-vitest"/);
    expect(config).toMatch(/mdx\(mdxConfig, \{outDir: vitestOutDir\}\)/);
    expect(config).toMatch(/replacement: join\(root, vitestOutDir, "server\.ts"\)/);
    expect(config).not.toMatch(/join\(root, "\.source/);
  });
});
