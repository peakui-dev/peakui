import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

/*
 * A module that calls `createContext` is client-only, and the package index re-exports contexts.
 * A server component importing from the index therefore loads that module in the server layer,
 * where a bundler that checks it (webpack in Next.js) fails the whole route unless the module
 * itself carries the directive. Turbopack does not report it, so the docs app stays green.
 */

const walk = (dir: string): string[] =>
  readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(path);
    }

    return /(?<!\.stories)\.tsx?$/.test(entry.name) ? [path] : [];
  });

const contextModules = walk("src").filter((path) =>
  /\bcreateContext\s*[<(]/.test(readFileSync(path, "utf8")),
);

describe("client directives", () => {
  it("finds the modules that create a context", () => {
    expect(contextModules.length).toBeGreaterThan(0);
  });

  it.each(contextModules)('%s opens with "use client"', (path) => {
    expect(readFileSync(path, "utf8")).toMatch(/^["']use client["'];/);
  });
});
