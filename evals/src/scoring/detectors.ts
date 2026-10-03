import type {Finding, PitfallId, StaticContext} from "../types.ts";
import type {ParsedSource} from "./ast.ts";
import type {Location} from "./findings.ts";

import ts from "typescript";

import {SOURCE_FILE, canonicalTag, locate, parseSource} from "./ast.ts";
import {check} from "./findings.ts";
import {isExportedSpecifier, libraryFacts} from "./library.ts";

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

const STATE_PROPS: Record<string, Record<string, string>> = {
  Button: {disabled: "isDisabled", isLoading: "isPending", loading: "isPending"},
  TextField: {disabled: "isDisabled", readOnly: "isReadOnly", required: "isRequired"},
};

function attributeFindings(source: ParsedSource, context: StaticContext): Finding[] {
  const findings: Finding[] = [];

  for (const node of source.jsx) {
    const tag = canonicalTag(source, node, context);

    if (tag === undefined) continue;

    /** A finding points at the attribute, not at the element's opening tag. */
    function onAttribute(name: string, rule: string, pitfall: PitfallId, message: string) {
      const attribute = node.attributes.get(name);

      if (attribute) findings.push(fail(rule, pitfall, message, at(source, attribute.node)));
    }

    onAttribute(
      "classNames",
      "class-names-prop",
      "composition",
      `classNames on PeakUI ${tag}; style a part with className on that part`,
    );
    onAttribute(
      "as",
      "as-prop",
      "composition",
      `as on PeakUI ${tag}; use the render prop to change the element`,
    );

    if (tag === "Input" || tag === "TextField") {
      for (const name of ["label", "errorMessage", "description", "helperText"]) {
        onAttribute(
          name,
          "assembled-field-prop",
          "composition",
          `${name} on a PeakUI ${tag}; compose Label, Description and FieldError parts instead`,
        );
      }
    }

    if (tag === "Button") {
      onAttribute(
        "onClick",
        "dom-event-on-button",
        "rac-props",
        "onClick on a PeakUI Button; press events use onPress",
      );
      onAttribute(
        "color",
        "color-prop",
        "variants",
        "color on a PeakUI Button; choose a variant instead",
      );
    }

    for (const [name, use] of Object.entries(STATE_PROPS[tag] ?? {})) {
      onAttribute(
        name,
        "dom-state-prop",
        "rac-props",
        `${name} on a PeakUI ${tag}; use ${use}, the React Aria name`,
      );
    }
  }

  return findings;
}

function isForeignTailwindVariants(module: string): boolean {
  return module === "tailwind-variants" || module.startsWith("tailwind-variants/");
}

function importFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];

  for (const entry of source.imports) {
    const location = locate(source, entry);

    if (isExportedSpecifier(entry.module) === false) {
      findings.push(
        fail(
          "deep-import",
          "imports",
          `import from ${entry.module}, which the package does not export; import from @peakui/react, or a stylesheet entry of @peakui/styles`,
          location,
        ),
      );
    }

    const binds = entry.kind === "import" || entry.kind === "export";

    if (binds && entry.module.startsWith("@peakui/") && entry.imported.endsWith("Provider")) {
      findings.push(
        fail(
          "provider",
          "no-provider",
          `${entry.imported} imported from ${entry.module}; PeakUI needs no provider`,
          location,
        ),
      );
    }

    if (binds && isForeignTailwindVariants(entry.module) && entry.imported === "tv") {
      findings.push(
        fail(
          "foreign-tv",
          "styling",
          `tv taken from ${entry.module}; import tv from @peakui/react`,
          location,
        ),
      );
    }

    if (entry.kind === "import" && entry.module === "react" && entry.imported === "forwardRef") {
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

/** Characters that, next to a substitution, mean the class name is assembled from pieces. */
const JOINS_BEFORE = /[-[:/]$/;
const JOINS_AFTER = /^[-:\]/]/;

/**
 * The library's BEM classes (`button--sm`, `input-group__prefix`) are plain CSS in the package's own
 * stylesheets; Tailwind never has to find them in source. Whether the static text before a
 * substitution ends in one of those prefixes, as a whole token.
 */
function endsInBemPrefix(before: string): boolean {
  const token = before.split(/\s/).at(-1) ?? "";

  return libraryFacts().bemPrefixes.has(token);
}

function piecesAreJoined(before: string, after: string): boolean {
  if (endsInBemPrefix(before)) return false;

  return JOINS_BEFORE.test(before) || JOINS_AFTER.test(after);
}

function templateIsAssembled(template: ts.TemplateExpression): boolean {
  let before = template.head.text;

  for (const span of template.templateSpans) {
    const after = span.literal.text;

    if (piecesAreJoined(before, after)) return true;
    before = after;
  }

  return false;
}

function literalText(node: ts.Node): string | undefined {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : undefined;
}

/** The operands of an `a + b + c` chain; every `+` node of the chain goes into `chain`. */
function concatOperands(node: ts.BinaryExpression, chain?: Set<ts.Node>): ts.Expression[] {
  const operands: ts.Expression[] = [];

  function flatten(expression: ts.Expression) {
    let inner = expression;

    while (ts.isParenthesizedExpression(inner)) inner = inner.expression;

    if (isPlus(inner)) {
      chain?.add(inner);
      flatten(inner.left);
      flatten(inner.right);
    } else operands.push(expression);
  }

  flatten(node);

  return operands;
}

function concatIsAssembled(node: ts.BinaryExpression): boolean {
  const operands = concatOperands(node);

  return operands.some((operand, index) => {
    const text = literalText(operand);

    if (text === undefined) return false;

    const left = operands[index - 1];
    const right = operands[index + 1];
    const dynamicLeft = left !== undefined && literalText(left) === undefined;
    const dynamicRight = right !== undefined && literalText(right) === undefined;

    return (
      (dynamicRight && JOINS_BEFORE.test(text) && !endsInBemPrefix(text)) ||
      (dynamicLeft && JOINS_AFTER.test(text))
    );
  });
}

function isPlus(node: ts.Node): node is ts.BinaryExpression {
  return ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken;
}

function isCallTo(node: ts.Node): boolean {
  return (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    CLASS_BUILDERS.has(node.expression.text)
  );
}

/** Variables that hold an assembled class string: `const cls = `rounded-${r}``. */
function assembledVariables(source: ParsedSource): Map<string, ts.Node> {
  const found = new Map<string, ts.Node>();

  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      let init = node.initializer;

      while (ts.isParenthesizedExpression(init)) init = init.expression;

      if (
        (ts.isTemplateExpression(init) && templateIsAssembled(init)) ||
        (isPlus(init) && concatIsAssembled(init))
      ) {
        found.set(node.name.text, init);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source.source);

  return found;
}

function treeFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];
  const reactNames = new Set(
    source.imports.filter((entry) => entry.module === "react").map((entry) => entry.local),
  );
  const variables = assembledVariables(source);
  const reportedVariables = new Set<string>();
  const insideChain = new Set<ts.Node>();

  reactNames.add("React");

  const assembled = (node: ts.Node) =>
    fail(
      "interpolated-class",
      "tailwind-scanning",
      "a class name built from pieces never reaches the CSS; write whole class strings and choose between them",
      at(source, node),
    );

  function visit(node: ts.Node, inClassValue: boolean) {
    const inside =
      inClassValue ||
      isCallTo(node) ||
      (ts.isJsxAttribute(node) && node.name.getText(source.source) === "className");

    if (inClassValue) {
      if (ts.isTemplateExpression(node) && templateIsAssembled(node)) {
        findings.push(assembled(node));
      }

      if (isPlus(node) && !insideChain.has(node)) {
        // The whole chain is judged once, at its outermost `+`.
        concatOperands(node, insideChain);

        if (concatIsAssembled(node)) findings.push(assembled(node));
      }

      if (
        ts.isIdentifier(node) &&
        variables.has(node.text) &&
        !reportedVariables.has(node.text) &&
        !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)
      ) {
        reportedVariables.add(node.text);
        findings.push(assembled(variables.get(node.text)!));
      }
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

    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const asserted = ts.isAsExpression(node.parent) || ts.isTypeAssertionExpression(node.parent);

      findings.push(
        fail(
          "type-escape",
          "other",
          asserted ? "as any hides a type error" : "any switches the type-check off for this value",
          at(source, node),
        ),
      );
    }

    if (
      ts.isAsExpression(node) &&
      node.type.kind !== ts.SyntaxKind.UnknownKeyword &&
      ts.isAsExpression(node.expression) &&
      node.expression.type.kind === ts.SyntaxKind.UnknownKeyword
    ) {
      findings.push(
        fail("type-escape", "other", "as unknown as T bypasses the type-check", at(source, node)),
      );
    }

    ts.forEachChild(node, (child) => {
      visit(child, inside);
    });
  }

  visit(source.source, false);

  return findings;
}

const DIRECTIVE = /^@ts-(ignore|expect-error|nocheck)\b/;

/** Positions where no comment can start: string, template and regular-expression text, and JSX text. */
function textSpans(source: ts.SourceFile): Array<[number, number]> {
  const spans: Array<[number, number]> = [];

  function visit(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.JsxText) spans.push([node.pos, node.end]);
    else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isRegularExpressionLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      spans.push([node.getStart(source), node.end]);
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return spans;
}

/** Every real comment of the file: ranges the tokenizer reports as trivia, never text inside a literal. */
function commentRanges(source: ts.SourceFile): ts.CommentRange[] {
  const found = new Map<number, ts.CommentRange>();
  const spans = textSpans(source);
  const text = source.text;

  function note(ranges: ts.CommentRange[] | undefined) {
    for (const range of ranges ?? []) {
      if (!spans.some(([from, to]) => range.pos >= from && range.pos < to)) {
        found.set(range.pos, range);
      }
    }
  }

  function visit(node: ts.Node) {
    if (node.kind === ts.SyntaxKind.JsxText) return;

    note(ts.getLeadingCommentRanges(text, node.getFullStart()));
    note(ts.getTrailingCommentRanges(text, node.getEnd()));

    for (const child of node.getChildren(source)) visit(child);
  }

  visit(source);

  return [...found.values()];
}

function directiveFindings(source: ParsedSource): Finding[] {
  const findings: Finding[] = [];
  const text = source.file.text;

  for (const range of commentRanges(source.source)) {
    const body = text.slice(range.pos, range.end);
    const lines = body.split("\n");
    const firstLine = source.source.getLineAndCharacterOfPosition(range.pos).line;

    lines.forEach((raw, index) => {
      const content =
        range.kind === ts.SyntaxKind.SingleLineCommentTrivia
          ? raw.replace(/^\/\/+\s*/, "")
          : raw
              .replace(/^\s*\/\*+/, "")
              .replace(/\*+\/\s*$/, "")
              .replace(/^\s*\*+/, "")
              .trim();
      const match = DIRECTIVE.exec(content);

      if (!match) return;

      findings.push(
        fail("type-escape", "other", `@ts-${match[1]} hides a type error`, {
          excerpt: source.source.text.split("\n")[firstLine + index]?.trim(),
          file: source.file.path,
          line: firstLine + index + 1,
        }),
      );
    });
  }

  return findings;
}

const TSCONFIG = /(?:^|\/)(?:ts|js)config(?:\.[^/]+)?\.json$/;

export function runDetectors(context: StaticContext): Finding[] {
  const findings: Finding[] = [];
  const changed = [...context.changes.added, ...context.changes.modified];

  for (const path of changed) {
    const file = context.file(path);

    if (!file || !SOURCE_FILE.test(path)) continue;

    const source = parseSource(file);

    findings.push(
      ...importFindings(source),
      ...attributeFindings(source, context),
      ...treeFindings(source),
      ...directiveFindings(source),
    );
  }

  for (const path of changed) {
    if (TSCONFIG.test(path)) {
      findings.push(
        fail(
          "config-weakened",
          "other",
          `${path} was changed; the type-check contract is the project's, not the agent's`,
          {file: path},
        ),
      );
    }
  }

  return findings;
}
