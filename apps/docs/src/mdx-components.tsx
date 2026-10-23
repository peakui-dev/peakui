import type {AlertProps} from "@peakui/react";
import type {CalloutType} from "fumadocs-ui/components/callout";
import type {MDXComponents} from "mdx/types";
import type {ComponentProps, ReactNode} from "react";

import {Alert, Card} from "@peakui/react";
import {Pre} from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {Children, Suspense, isValidElement} from "react";

import {CollapsibleCode} from "./components/collapsible-code";
import {
  ColorSectionFormField,
  ColorSectionSideBySide,
  ColorSectionStacked,
} from "./components/color-section";
import {ComponentPreview, ComponentPreviewFallback} from "./components/component-preview";
import {ComponentsCategory} from "./components/components-category";
import {Iconify} from "./components/iconify";
import {LocaleLink} from "./components/locale-link";
import {getComponentCount, getExampleCount} from "./demos";
import {FumadocsCustomCodeblock as CodeBlock} from "./mdx-components/fumadocs-custom-codeblock";
import {PackageManagers} from "./mdx-components/package-managers";
import * as TabsComponents from "./mdx-components/tabs";
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

/*
 * MDX `Callout` on Alert. Each fumadocs type maps to the closest Alert status; `idea` has no
 * Alert equivalent and falls back to the informational accent.
 */
const CALLOUT_STATUS = {
  info: "accent",
  warning: "warning",
  warn: "warning",
  error: "danger",
  success: "success",
  idea: "accent",
} as const satisfies Record<CalloutType, AlertProps["status"]>;

interface CalloutProps extends Omit<ComponentProps<typeof Alert>, "status"> {
  type?: CalloutType;
  title?: ReactNode;
  /** Replaces the status icon. */
  icon?: ReactNode;
}

function Callout({children, className, icon, title, type = "info", ...props}: CalloutProps) {
  return (
    <Alert className={cn("my-4", className)} status={CALLOUT_STATUS[type]} {...props}>
      <Alert.Indicator>{icon}</Alert.Indicator>
      <Alert.Content>
        {title ? <Alert.Title>{title}</Alert.Title> : null}
        {/* MDX children arrive as <p> flow content, so the container is a plain div — Alert.Description's span is phrasing-only. The BEM class carries the same muted styling. */}
        <div className="alert__description prose-no-margin">{children}</div>
      </Alert.Content>
    </Alert>
  );
}

/*
 * The `Cards` grouping wrapper for MDX card grids. PeakUI's Card ships no plural wrapper, so
 * this is a plain list container: it lays the cards out and styles nothing else.
 */
function Cards({children, ...props}: ComponentProps<"div">) {
  return (
    <div className="grid grid-cols-2 gap-3 @container" {...props}>
      {children}
    </div>
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
    ColorSectionFormField,
    ColorSectionSideBySide,
    ColorSectionStacked,
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
