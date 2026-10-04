#!/usr/bin/env node
/*
 * Scaffolds a component across the packages it lives in, then rebuilds the registries.
 *
 *   pnpm add:component <Name> [--rac <Primitive>] [--category <category>]
 *
 *   --rac <Primitive>      wrap `react-aria-components/<Primitive>` instead of a plain <div>
 *   --category <category>  also create the docs page under `components/(<category>)/` and a
 *                          `basic` demo
 *
 * The output is a starting shape that already passes typecheck, lint and tests — not a finished
 * component. The standard it has to reach is the `peakui-component-standards` skill; the page and
 * demos, the `peakui-docs` skill.
 */
import {existsSync, mkdirSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";

import {format, writeRegistries} from "./registries.mjs";

const RULE = "-".repeat(97);
const banner = (title) => `/* ${RULE}\n * ${title}\n * ${"-".repeat(95)}*/`;

/** `DatePicker`, `datePicker` and `date-picker` all name the same component. */
export function componentNames(input) {
  if (typeof input !== "string" || !/^[A-Za-z][A-Za-z0-9-]*$/.test(input)) {
    throw new Error(
      `"${input ?? ""}" is not a component name. Use PascalCase or kebab-case: DatePicker, date-picker.`,
    );
  }

  const kebab = input
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
  // A PascalCase input is kept as written, so `InputOTP` does not become `InputOtp`.
  const pascal = /^[A-Z][A-Za-z0-9]*$/.test(input)
    ? input
    : kebab
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("");

  return {camel: pascal.charAt(0).toLowerCase() + pascal.slice(1), kebab, pascal};
}

function componentSource({camel, kebab, pascal}, rac) {
  if (rac) {
    return `"use client";

import type {${pascal}Variants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {${camel}Variants} from "@peakui/styles";
import {${rac} as ${rac}Primitive} from "react-aria-components/${rac}";

import {composeTwRenderProps} from "../../utils/compose.ts";

${banner(`${pascal} Root`)}
interface ${pascal}RootProps
  extends ComponentPropsWithRef<typeof ${rac}Primitive>, ${pascal}Variants {}

/*
 * composeTwRenderProps is for a primitive whose className may be a function of its state. A
 * primitive that takes a string only (Label, Heading, Dialog) gets
 * \`className={${camel}Variants({className})}\` instead.
 */
const ${pascal}Root = ({children, className, ...rest}: ${pascal}RootProps) => {
  return (
    <${rac}Primitive
      className={composeTwRenderProps(className, ${camel}Variants())}
      {...rest}
      data-slot="${kebab}"
    >
      {children}
    </${rac}Primitive>
  );
};

${banner("Exports")}
export {${pascal}Root};

export type {${pascal}RootProps};
`;
  }

  return `"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {JSX, ReactNode} from "react";

import {${camel}Variants} from "@peakui/styles";

import {dom} from "../../utils/dom.tsx";

${banner(`${pascal} Root`)}
interface ${pascal}RootProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ${pascal}Root = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ${pascal}RootProps<E> & Omit<JSX.IntrinsicElements[E], keyof ${pascal}RootProps<E>>) => {
  return (
    <dom.div
      /*
       * The permitted \`any\`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="${kebab}"
      className={${camel}Variants({className})}
    >
      {children}
    </dom.div>
  );
};

${banner("Exports")}
export {${pascal}Root};

export type {${pascal}RootProps};
`;
}

function indexSource({camel, kebab, pascal}) {
  return `import type {ComponentProps} from "react";

import {${pascal}Root} from "./${kebab}.tsx";

${banner("Compound Component")}
export const ${pascal} = Object.assign(${pascal}Root, {
  Root: ${pascal}Root,
});

export type ${pascal} = {
  Props: ComponentProps<typeof ${pascal}Root>;
  RootProps: ComponentProps<typeof ${pascal}Root>;
};

${banner("Named Component")}
export {${pascal}Root};

export type {${pascal}RootProps, ${pascal}RootProps as ${pascal}Props} from "./${kebab}.tsx";

${banner("Variants")}
export {${camel}Variants} from "@peakui/styles";

export type {${pascal}Variants} from "@peakui/styles";
`;
}

function storiesSource({pascal}) {
  return `import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {${pascal}} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: ${pascal},
  parameters: {
    layout: "padded",
  },
  title: "Components/${pascal}",
} satisfies Meta<typeof ${pascal}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <${pascal}>${pascal}</${pascal}>
    </Showcase>
  ),
};
`;
}

function testSource({kebab, pascal}) {
  return `import {render, screen} from "@peakui/testing/helpers";

import {${pascal}, ${pascal}Root} from "@/components/${kebab}/index.ts";

describe("${pascal}", () => {
  it("exposes BEM block and data-slot", () => {
    render(<${pascal}>Content</${pascal}>);
    const element = screen.getByText("Content");

    expect(element.className).toEqual(expect.stringContaining("${kebab}"));
    expect(element).toHaveAttribute("data-slot", "${kebab}");
  });

  it("merges a consumer className with the block", () => {
    render(<${pascal} className="custom">Content</${pascal}>);

    expect(screen.getByText("Content").className).toEqual(expect.stringContaining("custom"));
  });

  it("behaves identically as ${pascal}.Root and ${pascal}Root", () => {
    render(
      <>
        <${pascal}.Root>Namespaced</${pascal}.Root>
        <${pascal}Root>Flat</${pascal}Root>
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByText(name)).toHaveAttribute("data-slot", "${kebab}");
    }
  });
});
`;
}

function ssrTestSource({kebab, pascal}) {
  return `import {ssrSmoke} from "@peakui/testing/helpers";

import {${pascal}} from "@/components/${kebab}";

describe("${pascal} SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<${pascal}>Content</${pascal}>);

    expect(html).toContain('data-slot="${kebab}"');
  });
});
`;
}

function stylesSource({camel, kebab, pascal}) {
  return `import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/${kebab}.css. */
export const ${camel}Variants = tv({
  base: "${kebab}",
});

export type ${pascal}Variants = VariantProps<typeof ${camel}Variants>;
`;
}

function cssSource({kebab, pascal}) {
  return `/*
 * ${pascal}. Class names come from src/components/${kebab}/${kebab}.styles.ts.
 */

.${kebab} {
  /* Base styles, and the default (md) size when the component has sizes. */
}
`;
}

function pageSource({kebab, pascal}, rac) {
  return `---
title: ${pascal}
description: ${pascal} component
links:
${rac ? `  rac: ${rac}\n` : ""}  source: ${kebab}/${kebab}.tsx
  styles: ${kebab}.css
---

## Usage

\`\`\`tsx
import {${pascal}} from "@peakui/react";
\`\`\`

<ComponentPreview name="${kebab}-basic" />
`;
}

function demoSource({pascal}) {
  return `import {${pascal}} from "@peakui/react";

export function Basic() {
  return <${pascal}>${pascal}</${pascal}>;
}
`;
}

/** Returns `[{path, content}]` for a component; paths are relative to the repository root. */
export function componentFiles(names, {category, rac} = {}) {
  const {kebab} = names;
  const react = `packages/react/src/components/${kebab}`;
  const tests = `packages/react/tests/components/${kebab}`;
  const styles = `packages/styles/src/components/${kebab}`;
  const files = [
    {content: stylesSource(names), path: `${styles}/${kebab}.styles.ts`},
    {content: `export * from "./${kebab}.styles.ts";\n`, path: `${styles}/index.ts`},
    {content: cssSource(names), path: `packages/styles/components/${kebab}.css`},
    {content: componentSource(names, rac), path: `${react}/${kebab}.tsx`},
    {content: indexSource(names), path: `${react}/index.ts`},
    {content: storiesSource(names), path: `${react}/${kebab}.stories.tsx`},
    {content: testSource(names), path: `${tests}/${kebab}.test.tsx`},
    {content: ssrTestSource(names), path: `${tests}/${kebab}.ssr.test.tsx`},
  ];

  if (category) {
    files.push(
      {
        content: pageSource(names, rac),
        path: `apps/docs/content/docs/en/react/components/(${category})/${kebab}.mdx`,
      },
      {content: demoSource(names), path: `apps/docs/src/demos/${kebab}/basic.tsx`},
    );
  }

  return files;
}

export function parseArgs(argv) {
  const options = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--rac" || arg === "--category") {
      const value = argv[++i];

      if (!value || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = value;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) {
    throw new Error("Usage: pnpm add:component <Name> [--rac <Primitive>] [--category <category>]");
  }
  if (options.category && !/^[a-z][a-z-]*$/.test(options.category)) {
    throw new Error(`--category is a lowercase folder name without parentheses: forms, overlays`);
  }
  if (options.rac && !/^[A-Z][A-Za-z]*$/.test(options.rac)) {
    throw new Error(`--rac is a react-aria-components export in PascalCase: Button, ListBox`);
  }

  return {input: positional[0], options};
}

/** Writes the files, refusing to overwrite any, and rebuilds the registries. */
export async function addComponent(root, input, options = {}) {
  const names = componentNames(input);
  const files = componentFiles(names, options);
  const taken = files.filter(({path}) => existsSync(join(root, path))).map(({path}) => path);

  if (taken.length > 0) {
    throw new Error(`"${names.kebab}" already exists: ${taken.join(", ")}`);
  }

  for (const {content, path} of files) {
    mkdirSync(dirname(join(root, path)), {recursive: true});
    // Formatted here, not in the templates: where a line breaks depends on the name's length.
    writeFileSync(join(root, path), await format(root, path, content));
  }

  return {files: files.map(({path}) => path), names, registries: await writeRegistries(root)};
}

async function main() {
  const {input, options} = parseArgs(process.argv.slice(2));
  const {files, names, registries} = await addComponent(process.cwd(), input, options);
  const lines = [
    `Created ${names.pascal}:`,
    ...files.map((path) => `  ${path}`),
    registries.length > 0 ? `Rebuilt ${registries.join(", ")}.` : "Registries were up to date.",
    "",
    "Next:",
    "  1. pnpm codegraph:sync — the new files are not in the index yet",
    "  2. Build the component through the peakui-component-standards skill",
    options.category
      ? "  3. Replace the placeholder page and demo through the peakui-docs skill"
      : "  3. Add the page with the peakui-docs skill (rerun with --category to scaffold one)",
  ];

  process.stdout.write(`${lines.join("\n")}\n`);
}

if (process.argv[1]?.endsWith("add-component.mjs")) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}
