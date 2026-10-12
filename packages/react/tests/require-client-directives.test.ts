import {expect, test} from "vitest";

import {matchDeclared} from "../scripts/require-client-directives";

/*
 * Rolldown keeps entry ids exactly as tsdown.config.ts passes them, and node:path join on
 * Windows produces backslashes there, while output file names are always posix. The matcher
 * therefore normalizes separators and compares by the module path under `src/` — a bare
 * suffix compare both misses Windows ids and collides (`index.js` would match every
 * `<dir>/index` module).
 */

test("matchDeclared matches windows and posix module ids by their path under src", () => {
  const declared = matchDeclared(
    ["components/button/index.js", "hooks/index.js", "index.js"],
    [
      "C:\\repo\\packages\\react\\src\\components\\button\\index.ts",
      "src\\components\\button\\index.ts",
      "/repo/packages/react/src/hooks/index.ts",
      "C:\\repo\\packages\\react\\src\\index.ts",
    ],
  );

  expect([...declared].sort()).toEqual([
    "components/button/index.js",
    "hooks/index.js",
    "index.js",
  ]);
});

test("matchDeclared leaves outputs without a declaring module out", () => {
  const declared = matchDeclared(
    ["components/select/index.js", "use-button.js"],
    ["C:\\repo\\packages\\react\\src\\components\\button\\index.tsx"],
  );

  expect(declared.size).toBe(0);
});
