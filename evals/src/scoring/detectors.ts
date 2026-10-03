import type {Finding, PitfallId, StaticContext} from "../types.ts";
import type {JsxNode, ParsedSource} from "./ast.ts";
import type {Location} from "./findings.ts";

import ts from "typescript";

import {isPeakui, locate, parseSource} from "./ast.ts";
import {check} from "./findings.ts";

const CLASS_BUILDERS = new Set(["tv", "cn", "clsx", "twMerge"]);

function fail(rule: string, pitfall: PitfallId, message: string, at: Location): Finding {
  return check(rule, pitfall, false, message, at);
}

function at(source: ParsedSource, node: ts.Node): Location {
  const position = node.getStart(source.source);
  const {line} = source.source.getLineAndCharacterOfPosition(position);
  const starts = source.source.getLineStarts();
  const start = starts[line] ?? 0;
  const end = starts[line + 1] ?? source.source.text.length;

  return locate(source, {
    excerpt: source.source.text.slice(start, end).trim(),
    line: line + 1,
  });
}

/**
 * The library's name for the element: the import's own name, not the local alias, and the part
 * name without the `.Root` / `Root` spelling (`Button.Root`, `ButtonRoot` and `Button` are one
 * component). `undefined` for an element that is not from `@peakui/react`.
 */
function canonicalTag(source: ParsedSource, node: JsxNode): string | undefined {
  if (!isPeakui(source, node)) return undefined;

  const entry = source.imports.find(
    (candidate) => candidate.local === node.root && candidate.module === "@peakui/react",
  );
  const rest = node.tag.split(".").slice(1);
  const head =
    entry && entry.imported !== "*" && entry.imported !== "default" ? entry.imported : undefined;
  const parts = head ? [head, ...rest] : rest;
  const joined = parts.join(".").replace(/\.Root$/, "");

  return joined.replace(/^(Button|TextField|Input)Root$/, "$1");
}

function attributeFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];

  for (const node of source.jsx) {
    const tag = canonicalTag(source, node);

    if (tag === undefined) continue;

    const location = locate(source, node);
    const has = (name: string) => node.attributes.has(name);

    if (has("classNames")) {
      findings.push(
        fail(
          "class-names-prop",
          "composition",
          `classNames on PeakUI ${tag}; style a part with className on that part`,
          location,
        ),
      );
    }

    if (has("as")) {
      findings.push(
        fail(
          "as-prop",
          "composition",
          `as on PeakUI ${tag}; use the render prop to change the element`,
          location,
        ),
      );
    }

    if (tag === "Input" || tag === "TextField") {
      for (const name of ["label", "errorMessage", "description", "helperText"]) {
        if (has(name)) {
          findings.push(
            fail(
              "assembled-field-prop",
              "composition",
              `${name} on a PeakUI ${tag}; compose Label, Description and FieldError parts instead`,
              location,
            ),
          );
        }
      }
    }

    if (tag === "Button" && has("onClick")) {
      findings.push(
        fail(
          "dom-event-on-button",
          "rac-props",
          "onClick on a PeakUI Button; press events use onPress",
          location,
        ),
      );
    }

    const domState =
      tag === "Button"
        ? ["disabled", "loading", "isLoading"]
        : tag === "TextField"
          ? ["disabled", "required", "readOnly"]
          : [];

    for (const name of domState.filter(has)) {
      findings.push(
        fail(
          "dom-state-prop",
          "rac-props",
          `${name} on a PeakUI ${tag}; state props use the React Aria names (isDisabled, isPending, isRequired, isReadOnly)`,
          location,
        ),
      );
    }

    if (tag === "Button" && has("color")) {
      findings.push(
        fail(
          "color-prop",
          "variants",
          "color on a PeakUI Button; choose a variant instead",
          location,
        ),
      );
    }
  }

  return findings;
}

function importFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];

  for (const entry of source.imports) {
    const location = locate(source, entry);

    if (entry.module.startsWith("@peakui/react/")) {
      findings.push(
        fail(
          "deep-import",
          "imports",
          `import from ${entry.module}; import from @peakui/react only`,
          location,
        ),
      );
    }

    if (entry.module.startsWith("@peakui/") && entry.imported.endsWith("Provider")) {
      findings.push(
        fail(
          "provider",
          "no-provider",
          `${entry.imported} imported from ${entry.module}; PeakUI needs no provider`,
          location,
        ),
      );
    }

    if (entry.module === "tailwind-variants" && entry.imported === "tv") {
      findings.push(
        fail(
          "foreign-tv",
          "styling",
          "tv imported from tailwind-variants; import tv from @peakui/react",
          location,
        ),
      );
    }

    if (entry.module === "react" && entry.imported === "forwardRef") {
      findings.push(
        fail(
          "forward-ref",
          "composition",
          "forwardRef imported from react; React 19 passes ref as a prop",
          location,
        ),
      );
    }
  }

  return findings;
}

function templateIsAdjacentToDash(template: ts.TemplateExpression): boolean {
  let before = template.head.text;

  for (const span of template.templateSpans) {
    const after = span.literal.text;

    if (before.endsWith("-") || after.startsWith("-")) return true;
    before = after;
  }

  return false;
}

function isCallTo(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    CLASS_BUILDERS.has(node.expression.text)
  );
}

function treeFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];
  const reactNames = new Set(
    source.imports.filter((entry) => entry.module === "react").map((entry) => entry.local),
  );

  reactNames.add("React");

  function visit(node: ts.Node, inClassValue: boolean) {
    const inside =
      inClassValue ||
      isCallTo(node) ||
      (ts.isJsxAttribute(node) && node.name.getText(source.source) === "className");

    if (ts.isTemplateExpression(node) && inClassValue && templateIsAdjacentToDash(node)) {
      findings.push(
        fail(
          "interpolated-class",
          "tailwind-scanning",
          "a class name built by interpolation never reaches the CSS; write whole class strings and choose between them",
          at(source, node),
        ),
      );
    }

    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === "forwardRef" &&
      ts.isIdentifier(node.expression) &&
      reactNames.has(node.expression.text)
    ) {
      findings.push(
        fail(
          "forward-ref",
          "composition",
          "React.forwardRef; React 19 passes ref as a prop",
          at(source, node),
        ),
      );
    }

    if (
      (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) &&
      node.type.kind === ts.SyntaxKind.AnyKeyword
    ) {
      findings.push(fail("type-escape", "other", "as any hides a type error", at(source, node)));
    }

    ts.forEachChild(node, (child) => {
      visit(child, inside);
    });
  }

  visit(source.source, false);

  return findings;
}

function directiveFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];
  const lines = source.file.text.split("\n");
  const pattern = /@ts-(ignore|expect-error|nocheck)/;

  lines.forEach((text, index) => {
    const match = pattern.exec(text);

    if (match) {
      findings.push(
        fail("type-escape", "other", `@ts-${match[1]} hides a type error`, {
          excerpt: text.trim(),
          file: source.file.path,
          line: index + 1,
        }),
      );
    }
  });

  return findings;
}

export function runDetectors(context: StaticContext): Finding[] {
  const findings: Finding[] = [];
  const changed = [...context.changes.added, ...context.changes.modified];

  for (const path of changed) {
    const file = context.file(path);

    if (!file || !/\.tsx?$/.test(path)) continue;

    const source = parseSource(file);

    findings.push(
      ...importFindings(source),
      ...attributeFindings(source),
      ...treeFindings(source),
      ...directiveFindings(source),
    );
  }

  for (const path of changed) {
    if (path === "tsconfig.json" || path.endsWith("/tsconfig.json")) {
      findings.push(
        fail(
          "config-weakened",
          "other",
          "tsconfig.json was changed; the type-check contract is the project's, not the agent's",
          {file: path},
        ),
      );
    }
  }

  return findings;
}
