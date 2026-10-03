import type {StaticContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {canonicalTag, parseSource, peakuiElements} from "../src/scoring/ast.ts";
import {pendingButton} from "../tasks/pending-button/task.ts";
import {pressStateLabel} from "../tasks/press-state-label/task.ts";

function contextOf(files: Record<string, string>): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {added: list.map((file) => file.path), deleted: [], modified: []},
    file: (path) => list.find((file) => file.path === path),
    files: list,
  };
}

const WRAPPER = {"src/ui/button.ts": `export {Button} from "@peakui/react";`};

/** Every way a consumer can spell the library's Button. */
const SPELLINGS: Array<[string, (attributes: string) => Record<string, string>]> = [
  [
    "Button",
    (a) => ({
      "src/A.tsx": `import {Button} from "@peakui/react";\nexport const a = <Button ${a} />;`,
    }),
  ],
  [
    "Button.Root",
    (a) => ({
      "src/A.tsx": `import {Button} from "@peakui/react";\nexport const a = <Button.Root ${a} />;`,
    }),
  ],
  [
    "ButtonRoot",
    (a) => ({
      "src/A.tsx": `import {ButtonRoot} from "@peakui/react";\nexport const a = <ButtonRoot ${a} />;`,
    }),
  ],
  [
    "an aliased import",
    (a) => ({
      "src/A.tsx": `import {Button as Btn} from "@peakui/react";\nexport const a = <Btn ${a} />;`,
    }),
  ],
  [
    "an aliased Root export",
    (a) => ({
      "src/A.tsx": `import {ButtonRoot as Btn} from "@peakui/react";\nexport const a = <Btn ${a} />;`,
    }),
  ],
  [
    "a namespace import",
    (a) => ({
      "src/A.tsx": `import * as P from "@peakui/react";\nexport const a = <P.Button ${a} />;`,
    }),
  ],
  [
    "a namespace import and Root",
    (a) => ({
      "src/A.tsx": `import * as P from "@peakui/react";\nexport const a = <P.Button.Root ${a} />;`,
    }),
  ],
  [
    "a local wrapper file",
    (a) => ({
      ...WRAPPER,
      "src/A.tsx": `import {Button} from "./ui/button";\nexport const a = <Button ${a} />;`,
    }),
  ],
  [
    "a simple alias",
    (a) => ({
      "src/A.tsx": `import {Button} from "@peakui/react";\nconst B = Button;\nexport const a = <B ${a} />;`,
    }),
  ],
];

describe("peakuiElements", () => {
  it.each(SPELLINGS)("finds Button spelled as %s", (_name, build) => {
    const found = peakuiElements(contextOf(build("onPress={() => {}}")), "Button");

    expect(found).toHaveLength(1);
    expect(found[0]?.attributes.has("onPress")).toBe(true);
  });

  it("names compound parts by their canonical dotted name", () => {
    const context = contextOf({
      "src/A.tsx": `import {FieldsetGroup, Fieldset} from "@peakui/react";\nexport const a = (<><FieldsetGroup /><Fieldset.Group /><Fieldset.Root /></>);`,
    });

    expect(peakuiElements(context, "Fieldset.Group")).toHaveLength(2);
    expect(peakuiElements(context, "Fieldset")).toHaveLength(1);
  });

  it("gives canonicalTag for an element that is not from the library as undefined", () => {
    const source = parseSource({
      path: "src/A.tsx",
      text: `const Button = () => null;\nexport const a = <Button />;`,
    });

    expect(canonicalTag(source, source.jsx[0]!)).toBeUndefined();
  });
});

describe.each(SPELLINGS)("the Button tasks' static checks with %s", (_name, build) => {
  it("pending-button sees the press handler", () => {
    const findings = pendingButton.staticChecks(contextOf(build("onPress={() => {}} isPending")));

    expect(findings.find((finding) => finding.rule === "press-handler")?.pass).toBe(true);
  });

  it("press-state-label sees the press state, the press handler and a raw handler", () => {
    const good = pressStateLabel.staticChecks(
      contextOf(build("onPress={() => {}} onPressChange={() => {}}")),
    );
    const bad = pressStateLabel.staticChecks(
      contextOf(build("onPress={() => {}} onMouseDown={() => {}}")),
    );
    const pass = (rule: string, findings: typeof good) =>
      findings.find((finding) => finding.rule === rule)?.pass;

    expect(pass("press-handler", good)).toBe(true);
    expect(pass("press-state-source", good)).toBe(true);
    expect(pass("no-pointer-handlers", good)).toBe(true);
    expect(pass("no-pointer-handlers", bad)).toBe(false);
  });
});
