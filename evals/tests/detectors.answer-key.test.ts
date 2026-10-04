import type {StaticContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {runDetectors} from "../src/scoring/detectors.ts";

function contextOf(files: Record<string, string>, changed?: string[]): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {
      added: changed ?? list.map((file) => file.path),
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

const IMPORT = `import {Button, TextField, tv} from "@peakui/react";\n`;

describe("interpolated-class", () => {
  it.each([
    ["a BEM modifier of the button block", "button button--${size}"],
    ["a BEM modifier alone", "button--${variant}"],
    ["a BEM element of the input-group block", "input-group__${part}"],
    ["a BEM modifier of the spinner block", "spinner spinner--${tone} text-sm"],
  ])("stays silent for %s", (_name, template) => {
    const source = `${IMPORT}export const a = (size: string, variant: string, part: string, tone: string) => <Button className={\`${template}\`}>x</Button>;`;

    expect(rules(source)).toEqual([]);
  });

  it.each([
    ["a prefix that only ends like a block", "my-button--${size}"],
    ["a Tailwind utility prefix", "bg-${role}"],
    ["a block name that is not in the library", "accordion--${size}"],
  ])("still fires for %s", (_name, template) => {
    const source = `${IMPORT}export const a = (size: string, role: string) => <Button className={\`${template}\`}>x</Button>;`;

    expect(rules(source)).toContain("interpolated-class");
  });

  it.each([
    ["string concatenation", `<Button className={"rounded-" + r}>x</Button>`],
    ["concatenation with the dash on the right", `<Button className={r + "-full"}>x</Button>`],
    ["concatenation inside clsx", `<Button className={clsx("rounded-" + r)}>x</Button>`],
    ["an arbitrary value", "<Button className={`w-[${n}px]`}>x</Button>"],
    ["a variant prefix", "<Button className={`${bp}:flex`}>x</Button>"],
    ["a variant prefix before the class", "<Button className={`md:${cls}`}>x</Button>"],
    ["an opacity modifier", "<Button className={`bg-accent/${o}`}>x</Button>"],
  ])("fires for %s", (_name, element) => {
    const source = `${IMPORT}declare const r: string, n: number, bp: string, cls: string, o: number;\ndeclare function clsx(...a: string[]): string;\nexport const a = ${element};`;

    expect(rules(source)).toContain("interpolated-class");
  });

  it("fires when the template is built into a variable and then passed to className", () => {
    const source = `${IMPORT}export function A({r}: {r: string}) {\n  const cls = \`rounded-\${r}\`;\n\n  return <Button className={cls}>x</Button>;\n}`;
    const found = runDetectors(contextOf({"src/A.tsx": source})).filter(
      (finding) => finding.rule === "interpolated-class",
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({excerpt: expect.stringContaining("rounded-"), line: 3});
  });

  it("fires for a concatenation built into a variable", () => {
    const source = `${IMPORT}export function A({r}: {r: string}) {\n  const cls = "rounded-" + r;\n\n  return <Button className={cls}>x</Button>;\n}`;

    expect(rules(source)).toContain("interpolated-class");
  });

  it("stays silent for interpolation that never reaches a class", () => {
    const source = `export function A({id}: {id: string}) {\n  const url = \`/api/items-\${id}\`;\n  const x = "a-" + id;\n\n  return <a href={url} title={x}>x</a>;\n}`;

    expect(rules(source)).toEqual([]);
  });

  it("stays silent for concatenation with whole class strings", () => {
    const source = `${IMPORT}export const a = (c: string) => <Button className={"flex " + c}>x</Button>;`;

    expect(rules(source)).toEqual([]);
  });
});

describe("type-escape", () => {
  it.each([
    ["a string literal", `export const a = "// @ts-ignore";`],
    ["a template literal", "export const a = `// @ts-expect-error`;"],
    ["JSX text", `export const a = <p>// @ts-nocheck</p>;`],
    [
      "a comment that only mentions the directive",
      `// we never use @ts-ignore here\nexport const a = 1;`,
    ],
    ["a regular expression", `export const a = /@ts-ignore/;`],
  ])("stays silent for @ts-ignore inside %s", (_name, source) => {
    expect(rules(source)).toEqual([]);
  });

  it.each([
    ["a line comment", `// @ts-ignore\nexport const a: number = "x";`],
    ["a block comment", `/* @ts-expect-error */\nexport const a: number = "x";`],
    [
      "a JSX comment",
      `export const a = (\n  <div>\n    {/* @ts-ignore */}\n    <b />\n  </div>\n);`,
    ],
    ["a file-level directive", `// @ts-nocheck\nexport const a = 1;`],
  ])("fires on a directive in %s", (_name, source) => {
    expect(rules(source)).toContain("type-escape");
  });

  it("points at the comment's line", () => {
    const [finding] = runDetectors(
      contextOf({"src/A.ts": `export const s = "x";\n  // @ts-ignore\nexport const a = 1;`}),
    );

    expect(finding).toMatchObject({excerpt: "// @ts-ignore", line: 2});
  });

  it.each([
    ["as unknown as T", `export const a = {} as unknown as {x: number};`],
    ["as any[]", `export const a = [] as any[];`],
    ["an any annotation on a parameter", `export function f(x: any) { return x; }`],
    ["an any annotation on a variable", `export const a: any = 1;`],
    ["any as a type argument", `export const a: Array<any> = [];`],
    ["an angle-bracket any assertion", `export const a = <any>{};`],
  ])("fires for %s", (_name, source) => {
    expect(rules(source, "src/A.ts")).toContain("type-escape");
  });

  it.each([
    ["unknown", `export function f(x: unknown) { return x; }`],
    ["a plain assertion", `export const a = {} as {x?: number};`],
    ["as const", `export const a = ["x"] as const;`],
    ["as unknown on its own", `export const a = {} as unknown;`],
  ])("stays silent for %s", (_name, source) => {
    expect(rules(source, "src/A.ts")).toEqual([]);
  });
});

describe("imports", () => {
  it.each([
    ["a side-effect import", `import "@peakui/react/button";`],
    ["export from", `export {Button} from "@peakui/react/button";`],
    ["export star from", `export * from "@peakui/react/button";`],
    ["a dynamic import", `export const load = () => import("@peakui/react/button");`],
    [
      "a styles subpath the package does not export",
      `import {x} from "@peakui/styles/components/button";`,
    ],
    ["a styles dist file", `import "@peakui/styles/dist/index.js";`],
    ["a styles source file", `import "@peakui/styles/src/index.ts";`],
    ["a styles stylesheet that does not exist as an export", `import "@peakui/styles/index.css";`],
  ])("deep-import fires for %s", (_name, source) => {
    expect(rules(source, "src/A.ts")).toContain("deep-import");
  });

  it.each([
    ["the package root", `import {Button} from "@peakui/react";`],
    ["the css entry", `import "@peakui/styles/css";`],
    ["a component stylesheet", `import "@peakui/styles/components/button.css";`],
    ["the base stylesheet", `import "@peakui/styles/base";`],
    ["a theme", `import "@peakui/styles/themes/default";`],
    ["the styles root", `import {buttonVariants} from "@peakui/styles";`],
    ["the manifest", `import pkg from "@peakui/react/package.json";`],
  ])("deep-import stays silent for %s", (_name, source) => {
    expect(rules(source, "src/A.ts")).toEqual([]);
  });

  it.each([
    ["tailwind-variants/lite", `import {tv} from "tailwind-variants/lite";`],
    ["a re-export of tv", `export {tv} from "tailwind-variants";`],
    ["a re-export of tv from lite", `export {tv} from "tailwind-variants/lite";`],
  ])("foreign-tv fires for %s", (_name, source) => {
    expect(rules(source, "src/A.ts")).toContain("foreign-tv");
  });
});

describe("files that are scanned", () => {
  it.each([
    [
      "src/A.jsx",
      `import {Button} from "@peakui/react";\nexport const a = <Button onClick={() => {}}>x</Button>;`,
      "dom-event-on-button",
    ],
    ["src/a.js", `import {tv} from "tailwind-variants";`, "foreign-tv"],
    ["src/a.mjs", `import {Button} from "@peakui/react/button";`, "deep-import"],
    ["src/a.mts", `// @ts-ignore\nexport const a = 1;`, "type-escape"],
    [
      "src/a.cjs",
      `const {tv} = require("tailwind-variants");\nconst x = import("@peakui/react/button");`,
      "deep-import",
    ],
  ])("%s", (path, source, rule) => {
    expect(rules(source, path)).toContain(rule);
  });

  it.each([
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.base.json",
    "apps/web/tsconfig.build.json",
  ])("flags a changed %s", (path) => {
    const context: StaticContext = {
      changes: {added: [], deleted: [], modified: [path]},
      file: () => undefined,
      files: [],
    };

    expect(runDetectors(context).map((finding) => finding.rule)).toEqual(["config-weakened"]);
  });

  it("does not flag a file that merely contains tsconfig in its name", () => {
    const context: StaticContext = {
      changes: {added: [], deleted: [], modified: ["docs/my-tsconfig.json", "src/tsconfig.ts"]},
      file: () => undefined,
      files: [],
    };

    expect(runDetectors(context)).toEqual([]);
  });
});

describe("local wrappers and aliases", () => {
  const MISUSE = `export const a = <Button onClick={() => {}}>x</Button>;`;

  it.each([
    [
      "a re-exporting wrapper file",
      {
        "src/ui/button.ts": `export {Button} from "@peakui/react";`,
        "src/A.tsx": `import {Button} from "./ui/button";\n${MISUSE}`,
      },
    ],
    [
      "a re-export under another name",
      {
        "src/ui/button.ts": `export {Button as Btn} from "@peakui/react";`,
        "src/A.tsx": `import {Btn as Button} from "./ui/button";\n${MISUSE}`,
      },
    ],
    [
      "an export star",
      {
        "src/ui/index.ts": `export * from "@peakui/react";`,
        "src/A.tsx": `import {Button} from "./ui";\n${MISUSE}`,
      },
    ],
    [
      "an import that is exported again",
      {
        "src/ui/button.ts": `import {Button} from "@peakui/react";\nexport {Button};`,
        "src/A.tsx": `import {Button} from "./ui/button";\n${MISUSE}`,
      },
    ],
    [
      "an exported alias",
      {
        "src/ui/button.ts": `import {Button as Lib} from "@peakui/react";\nexport const Button = Lib;`,
        "src/A.tsx": `import {Button} from "./ui/button.ts";\n${MISUSE}`,
      },
    ],
    [
      "a default export",
      {
        "src/ui/button.ts": `import {Button} from "@peakui/react";\nexport default Button;`,
        "src/A.tsx": `import Button from "./ui/button";\n${MISUSE}`,
      },
    ],
    [
      "a wrapper reached through the @/ alias",
      {
        "src/ui/button.ts": `export {Button} from "@peakui/react";`,
        "src/A.tsx": `import {Button} from "@/ui/button";\n${MISUSE}`,
      },
    ],
    [
      "a simple alias in the same file",
      {
        "src/A.tsx": `import {Button} from "@peakui/react";\nconst B = Button;\nexport const a = <B onClick={() => {}}>x</B>;`,
      },
    ],
    [
      "an alias of a namespace member",
      {
        "src/A.tsx": `import * as P from "@peakui/react";\nconst B = P.Button;\nexport const a = <B onClick={() => {}}>x</B>;`,
      },
    ],
  ])("sees through %s", (_name, files) => {
    const found = runDetectors(contextOf(files, ["src/A.tsx"])).map((finding) => finding.rule);

    expect(found).toContain("dom-event-on-button");
  });

  it("does not take a local component of the same name for the library's", () => {
    const files = {
      "src/ui/button.tsx": `export const Button = (props: object) => <button {...props} />;`,
      "src/A.tsx": `import {Button} from "./ui/button";\n${MISUSE}`,
    };

    expect(runDetectors(contextOf(files, ["src/A.tsx"]))).toEqual([]);
  });

  it("does not loop on wrappers that re-export each other", () => {
    const files = {
      "src/a.ts": `export {X} from "./b";`,
      "src/b.ts": `export {X} from "./a";`,
      "src/A.tsx": `import {X} from "./a";\nexport const a = <X onClick={() => {}} />;`,
    };

    expect(() => runDetectors(contextOf(files, ["src/A.tsx"]))).not.toThrow();
  });
});

describe("where a finding points", () => {
  it("names the offending attribute's line and excerpt in a multi-line element", () => {
    const source = `${IMPORT}export const a = (\n  <Button\n    variant="primary"\n    onClick={() => {}}\n  >\n    x\n  </Button>\n);`;
    const [finding] = runDetectors(contextOf({"src/A.tsx": source}));

    expect(finding).toMatchObject({line: 5, rule: "dom-event-on-button"});
    expect(finding?.excerpt).toBe("onClick={() => {}}");
  });

  it("gives each attribute finding its own line", () => {
    const source = `${IMPORT}export const a = (\n  <TextField\n    label="a"\n    errorMessage="b"\n  />\n);`;
    const lines = runDetectors(contextOf({"src/A.tsx": source}))
      .map((finding) => finding.line)
      .sort();

    expect(lines).toEqual([4, 5]);
  });

  it.each([
    ["disabled", "isDisabled", ["isPending", "isRequired", "isReadOnly"]],
    ["isLoading", "isPending", ["isDisabled", "isRequired", "isReadOnly"]],
    ["loading", "isPending", ["isDisabled", "isRequired", "isReadOnly"]],
  ])("dom-state-prop on a Button's %s names only %s", (prop, use, others) => {
    const [finding] = runDetectors(
      contextOf({"src/A.tsx": `${IMPORT}export const a = <Button ${prop}>x</Button>;`}),
    );

    expect(finding?.message).toContain(use);
    for (const other of others) expect(finding?.message).not.toContain(other);
  });

  it.each([
    ["disabled", "isDisabled", ["isRequired", "isReadOnly", "isPending"]],
    ["required", "isRequired", ["isDisabled", "isReadOnly", "isPending"]],
    ["readOnly", "isReadOnly", ["isDisabled", "isRequired", "isPending"]],
  ])("dom-state-prop on a TextField's %s names only %s", (prop, use, others) => {
    const [finding] = runDetectors(
      contextOf({"src/A.tsx": `${IMPORT}export const a = <TextField ${prop} />;`}),
    );

    expect(finding?.message).toContain(use);
    for (const other of others) expect(finding?.message).not.toContain(other);
  });
});
