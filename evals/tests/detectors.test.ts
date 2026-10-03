import type {StaticContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {runDetectors} from "../src/scoring/detectors.ts";

function contextOf(files: Record<string, string>, unchanged: string[] = []): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {
      added: list.map((file) => file.path).filter((path) => !unchanged.includes(path)),
      deleted: [],
      modified: [],
    },
    file: (path) => list.find((file) => file.path === path),
    files: list,
  };
}

function rules(source: string, path = "src/A.tsx"): string[] {
  return runDetectors(contextOf({[path]: source}))
    .map((finding) => finding.rule)
    .sort();
}

const IMPORT = `import {Button, Fieldset, Input, TextField, tv} from "@peakui/react";\n`;

describe("runDetectors", () => {
  it.each([
    ["deep-import", `import {Button} from "@peakui/react/button";`],
    ["provider", `import {PeakUIProvider} from "@peakui/react";`],
    ["foreign-tv", `import {tv} from "tailwind-variants";`],
    ["forward-ref", `import {forwardRef} from "react";`],
    [
      "forward-ref",
      `import * as React from "react";\nexport const A = React.forwardRef(() => null);`,
    ],
    ["class-names-prop", `${IMPORT}export const a = <Button classNames={{base: "x"}}>x</Button>;`],
    ["as-prop", `${IMPORT}export const a = <Fieldset.Group as="section">x</Fieldset.Group>;`],
    ["assembled-field-prop", `${IMPORT}export const a = <Input label="Email" />;`],
    ["assembled-field-prop", `${IMPORT}export const a = <TextField errorMessage="x" />;`],
    ["dom-event-on-button", `${IMPORT}export const a = <Button onClick={() => {}}>x</Button>;`],
    ["dom-state-prop", `${IMPORT}export const a = <Button isLoading>x</Button>;`],
    ["dom-state-prop", `${IMPORT}export const a = <TextField required />;`],
    ["color-prop", `${IMPORT}export const a = <Button color="danger">x</Button>;`],
    [
      "interpolated-class",
      `${IMPORT}export const a = (r: string) => <Button className={\`rounded-\${r}\`}>x</Button>;`,
    ],
    [
      "interpolated-class",
      `${IMPORT}export const v = (r: string) => tv({base: \`rounded-\${r}\`});`,
    ],
    ["type-escape", `// @ts-ignore\nexport const a = 1;`],
    ["type-escape", `export const a = {} as any;`],
  ])("fires %s", (rule, source) => {
    expect(rules(source)).toContain(rule);
  });

  it.each([
    [
      "a plain button with onClick and disabled",
      `export const a = <button disabled onClick={() => {}}>x</button>;`,
    ],
    [
      "disabled on a standalone Input and on Fieldset",
      `${IMPORT}export const a = <Fieldset disabled><Input disabled /></Fieldset>;`,
    ],
    ["tv from the package root", `${IMPORT}export const v = tv({base: "rounded-full"});`],
    [
      "a conditional between whole class strings",
      `${IMPORT}export const a = (f: boolean) => <Button className={f ? "rounded-full" : "rounded-sm"}>x</Button>;`,
    ],
    [
      "a template literal that joins whole classes",
      `${IMPORT}export const a = (c: string) => <Button className={\`rounded-full \${c}\`}>x</Button>;`,
    ],
    [
      "React Aria props",
      `${IMPORT}export const a = <Button isDisabled isPending onPress={() => {}}>x</Button>;`,
    ],
  ])("stays silent for %s", (_name, source) => {
    expect(rules(source)).toEqual([]);
  });

  it("reports file, line and excerpt", () => {
    const [finding] = runDetectors(
      contextOf({"src/A.tsx": `${IMPORT}export const a = <Button color="danger">x</Button>;`}),
    );

    expect(finding).toMatchObject({
      excerpt: expect.stringContaining('color="danger"'),
      file: "src/A.tsx",
      gate: true,
      line: 2,
      pass: false,
      pitfall: "variants",
    });
  });

  it("looks only at changed or added files", () => {
    const context = contextOf({"src/Old.tsx": `import {tv} from "tailwind-variants";`}, [
      "src/Old.tsx",
    ]);

    expect(runDetectors(context)).toEqual([]);
  });

  it("flags a changed tsconfig.json", () => {
    const context: StaticContext = {
      changes: {added: [], deleted: [], modified: ["tsconfig.json"]},
      file: () => undefined,
      files: [],
    };

    expect(runDetectors(context).map((finding) => finding.rule)).toEqual(["config-weakened"]);
  });

  it("does not throw on a file that does not parse", () => {
    expect(() => rules("export function B() { return <div><Button")).not.toThrow();
  });
});

describe("runDetectors against the library's real spellings", () => {
  it.each([
    [
      "an aliased import",
      `import {Button as Btn} from "@peakui/react";\nexport const a = <Btn color="danger">x</Btn>;`,
    ],
    [
      "the Button.Root part",
      `import {Button} from "@peakui/react";\nexport const a = <Button.Root onClick={() => {}}>x</Button.Root>;`,
    ],
    [
      "the ButtonRoot export",
      `import {ButtonRoot} from "@peakui/react";\nexport const a = <ButtonRoot isLoading>x</ButtonRoot>;`,
    ],
    [
      "a namespace import",
      `import * as P from "@peakui/react";\nexport const a = <P.TextField label="x" />;`,
    ],
  ])("recognises %s", (_name, source) => {
    expect(rules(source).length).toBeGreaterThan(0);
  });

  it("does not flag color on the Spinner, where it is a real variant", () => {
    expect(
      rules(`import {Spinner} from "@peakui/react";\nexport const a = <Spinner color="accent" />;`),
    ).toEqual([]);
  });

  it("does not flag the standard names of the state props", () => {
    expect(
      rules(
        `import {TextField} from "@peakui/react";\nexport const a = <TextField isRequired isReadOnly isDisabled />;`,
      ),
    ).toEqual([]);
  });
});
