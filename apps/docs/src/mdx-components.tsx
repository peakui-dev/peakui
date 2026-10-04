import type {MDXComponents} from "mdx/types";
import type {ComponentProps, ReactNode} from "react";

import {Surface} from "@peakui/react";
import {Callout as FDCallout} from "fumadocs-ui/components/callout";
import {Card, Cards} from "fumadocs-ui/components/card";
import {Pre} from "fumadocs-ui/components/codeblock";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {Children, Suspense, isValidElement} from "react";

import {CollapsibleCode} from "./components/collapsible-code";
import {ComponentPreview, ComponentPreviewFallback} from "./components/component-preview";
import {ComponentsCategory} from "./components/components-category";
import {Iconify} from "./components/iconify";
import {LocaleLink} from "./components/locale-link";
import {getComponentCount, getExampleCount} from "./demos";
import {FumadocsCustomCodeblock as CodeBlock} from "./mdx-components/fumadocs-custom-codeblock";
import {PackageManagers} from "./mdx-components/package-managers";
import {cn} from "./utils/cn";

function ComponentCount() {
  return <>{getComponentCount()}</>;
}

function ExampleCount() {
  return <>{getExampleCount()}</>;
}

const MAX_LINES_FOR_LINE_NUMBERS = 20;

function ComponentPreviewWithSuspense(props: ComponentProps<typeof ComponentPreview>) {
  return (
    <Suspense fallback={<ComponentPreviewFallback />}>
      <ComponentPreview {...props} />
    </Suspense>
  );
}

function Callout({className, ...props}: ComponentProps<typeof FDCallout>) {
  return (
    <Surface className={cn("shadow-surface", className)}>
      <FDCallout {...props} />
    </Surface>
  );
}

/** Collects the text of a rendered code block, to count its lines. */
function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);

  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string") return child;
      if (isValidElement<{children?: ReactNode}>(child)) return extractText(child.props.children);

      return "";
    })
    .join("");
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    Callout,
    Card,
    Cards,
    CodeBlock,
    CollapsibleCode,
    ComponentCount,
    ComponentPreview: ComponentPreviewWithSuspense,
    ComponentsCategory,
    ExampleCount,
    Icon: Iconify,
    Link: LocaleLink,
    PackageManagers,
    Pre,
    // `ref` is dropped: the block is wrapped, so it would land on the wrong element.
    pre: ({children, ref: _ref, ...props}) => {
      const lineCount = extractText(children).split("\n").length;

      // Short snippets read better without a gutter.
      const classes = cn(
        "mdx-code-block",
        lineCount > MAX_LINES_FOR_LINE_NUMBERS ? "docs-code-block-line-numbers" : undefined,
        props.className,
      );

      return (
        <CodeBlock {...props} className={classes}>
          <Pre>{children}</Pre>
        </CodeBlock>
      );
    },
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
