import {strict as assert} from "node:assert";
import {test} from "node:test";

import {renderVersionConst} from "./sync-versions.mjs";

test("renderVersionConst swaps the version in place", () => {
  const source = 'export {cn} from "tailwind-variants";\nexport const version = "0.0.0";\n';

  assert.equal(
    renderVersionConst(source, "0.0.1"),
    'export {cn} from "tailwind-variants";\nexport const version = "0.0.1";\n',
  );
});

test("renderVersionConst refuses a source without the const", () => {
  assert.throws(() => renderVersionConst("export {};\n", "0.0.1"), /version/);
});
