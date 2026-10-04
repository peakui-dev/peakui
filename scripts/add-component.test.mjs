import assert from "node:assert/strict";
import {test} from "node:test";

import {componentFiles, componentNames, parseArgs} from "./add-component.mjs";

test("componentNames accepts PascalCase, camelCase and kebab-case for one component", () => {
  const expected = {camel: "datePicker", kebab: "date-picker", pascal: "DatePicker"};

  for (const input of ["DatePicker", "datePicker", "date-picker"]) {
    assert.deepEqual(componentNames(input), expected, input);
  }
});

test("componentNames splits an acronym from the word after it", () => {
  assert.equal(componentNames("InputOTP").kebab, "input-otp");
  assert.equal(componentNames("InputOTP").pascal, "InputOTP");
  assert.equal(componentNames("InputOTP").camel, "inputOTP");
  assert.equal(componentNames("OTPField").kebab, "otp-field");
});

test("componentNames rejects a name that is not an identifier", () => {
  for (const input of ["", "date picker", "../escape", "1button", undefined]) {
    assert.throws(() => componentNames(input), /not a component name/, String(input));
  }
});

test("componentFiles covers both packages, stories and both test suites", () => {
  const paths = componentFiles(componentNames("Badge")).map(({path}) => path);

  assert.deepEqual(paths, [
    "packages/styles/src/components/badge/badge.styles.ts",
    "packages/styles/src/components/badge/index.ts",
    "packages/styles/components/badge.css",
    "packages/react/src/components/badge/badge.tsx",
    "packages/react/src/components/badge/index.ts",
    "packages/react/src/components/badge/badge.stories.tsx",
    "packages/react/tests/components/badge/badge.test.tsx",
    "packages/react/tests/components/badge/badge.ssr.test.tsx",
  ]);
});

test("componentFiles writes no registry: those are generated", () => {
  const paths = componentFiles(componentNames("Badge"), {category: "feedback"}).map(
    ({path}) => path,
  );

  for (const registry of [
    "packages/react/src/components/index.ts",
    "packages/styles/src/components/index.ts",
    "packages/styles/components/index.css",
    "apps/docs/src/demos/index.ts",
    "apps/docs/content/docs/en/react/components/meta.json",
  ]) {
    assert.ok(!paths.includes(registry), registry);
  }
});

test("componentFiles adds the page and a basic demo only with a category", () => {
  const paths = componentFiles(componentNames("Badge"), {category: "feedback"}).map(
    ({path}) => path,
  );

  assert.ok(paths.includes("apps/docs/content/docs/en/react/components/(feedback)/badge.mdx"));
  assert.ok(paths.includes("apps/docs/src/demos/badge/basic.tsx"));
});

test("the plain component renders through dom.div; --rac wraps the primitive", () => {
  const source = (options) =>
    componentFiles(componentNames("Badge"), options).find(({path}) => path.endsWith("badge.tsx"))
      .content;

  assert.match(source(), /<dom\.div/);
  assert.match(
    source({rac: "Link"}),
    /import \{Link as LinkPrimitive\} from "react-aria-components\/Link";/,
  );
  assert.doesNotMatch(source({rac: "Link"}), /dom\.div/);
});

test("the page sets links.rac only when a primitive is wrapped", () => {
  const page = (options) =>
    componentFiles(componentNames("Badge"), {category: "feedback", ...options}).find(({path}) =>
      path.endsWith(".mdx"),
    ).content;

  assert.doesNotMatch(page({}), /rac:/);
  assert.match(page({rac: "Link"}), /^ {2}rac: Link$/m);
});

test("parseArgs reads the name and both options, and rejects the rest", () => {
  assert.deepEqual(parseArgs(["Badge", "--rac", "Link", "--category", "feedback"]), {
    input: "Badge",
    options: {category: "feedback", rac: "Link"},
  });
  assert.throws(() => parseArgs([]), /Usage/);
  assert.throws(() => parseArgs(["A", "B"]), /Usage/);
  assert.throws(() => parseArgs(["Badge", "--rac"]), /needs a value/);
  assert.throws(() => parseArgs(["Badge", "--force"]), /Unknown option/);
  assert.throws(() => parseArgs(["Badge", "--category", "(forms)"]), /without parentheses/);
});
