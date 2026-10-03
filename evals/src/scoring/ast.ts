import type {ProjectFile, StaticContext} from "../types.ts";
import type {Location} from "./findings.ts";

import ts from "typescript";

export interface JsxAttr {
  name: string;
  /** The string literal's text, the expression's source text for `{…}`, or `true` when bare. */
  value: string | true;
  /** An arrow function or function expression. */
  isFunction: boolean;
  node: ts.JsxAttribute;
}

export interface JsxNode {
  /** The full tag text, e.g. `Fieldset.Group`. */
  tag: string;
  /** The identifier before the first dot. */
  root: string;
  line: number;
  excerpt: string;
  attributes: Map<string, JsxAttr>;
  /** Tags of the enclosing JSX elements, nearest first. */
  ancestors: string[];
  hasFunctionChild: boolean;
}

export interface ImportedName {
  module: string;
  /** `default` for a default import and `*` for a namespace import. */
  imported: string;
  local: string;
  line: number;
  excerpt: string;
}

export interface ParsedSource {
  file: ProjectFile;
  source: ts.SourceFile;
  imports: ImportedName[];
  /** Local names imported from `@peakui/react`. */
  peakui: Set<string>;
  jsx: JsxNode[];
  /** Leading string-literal statements, such as `use client`. */
  directives: string[];
}

const PEAKUI_MODULE = "@peakui/react";
const cache = new WeakMap<ProjectFile, ParsedSource>();

function lineOf(source: ts.SourceFile, position: number): number {
  return source.getLineAndCharacterOfPosition(position).line + 1;
}

function excerptOf(source: ts.SourceFile, position: number): string {
  const {line} = source.getLineAndCharacterOfPosition(position);
  const starts = source.getLineStarts();
  const start = starts[line] ?? 0;
  const end = starts[line + 1] ?? source.text.length;

  return source.text.slice(start, end).trim();
}

function isFunctionExpression(node: ts.Node | undefined): boolean {
  let current = node;

  while (current && ts.isParenthesizedExpression(current)) current = current.expression;

  return current !== undefined && (ts.isArrowFunction(current) || ts.isFunctionExpression(current));
}

function readAttributes(source: ts.SourceFile, attributes: ts.JsxAttributes): Map<string, JsxAttr> {
  const found = new Map<string, JsxAttr>();

  for (const attribute of attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) continue;

    const name = attribute.name.getText(source);
    const initializer = attribute.initializer;
    let value: string | true = true;
    let isFunction = false;

    if (initializer && ts.isStringLiteral(initializer)) {
      value = initializer.text;
    } else if (initializer && ts.isJsxExpression(initializer)) {
      value = initializer.expression?.getText(source) ?? "";
      isFunction = isFunctionExpression(initializer.expression);
    }

    found.set(name, {isFunction, name, node: attribute, value});
  }

  return found;
}

function enclosingTags(source: ts.SourceFile, element: ts.Node): string[] {
  const tags: string[] = [];
  let current: ts.Node | undefined = element.parent;

  while (current) {
    if (ts.isJsxElement(current)) tags.push(current.openingElement.tagName.getText(source));
    current = current.parent;
  }

  return tags;
}

function jsxNodeOf(
  source: ts.SourceFile,
  opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  element: ts.JsxElement | ts.JsxSelfClosingElement,
): JsxNode {
  const tag = opening.tagName.getText(source);
  const start = opening.getStart(source);
  const hasFunctionChild =
    ts.isJsxElement(element) &&
    element.children.some(
      (child) => ts.isJsxExpression(child) && isFunctionExpression(child.expression),
    );

  return {
    ancestors: enclosingTags(source, element),
    attributes: readAttributes(source, opening.attributes),
    excerpt: excerptOf(source, start),
    hasFunctionChild,
    line: lineOf(source, start),
    root: tag.split(".")[0] ?? tag,
    tag,
  };
}

function readImports(source: ts.SourceFile): ImportedName[] {
  const found: ImportedName[] = [];

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const module = statement.moduleSpecifier.text;
    const at = {
      excerpt: excerptOf(source, statement.getStart(source)),
      line: lineOf(source, statement.getStart(source)),
      module,
    };
    const clause = statement.importClause;

    if (!clause) continue;
    if (clause.name) found.push({...at, imported: "default", local: clause.name.text});

    const bindings = clause.namedBindings;

    if (bindings && ts.isNamespaceImport(bindings)) {
      found.push({...at, imported: "*", local: bindings.name.text});
    } else if (bindings) {
      for (const element of bindings.elements) {
        found.push({
          ...at,
          imported: (element.propertyName ?? element.name).text,
          local: element.name.text,
        });
      }
    }
  }

  return found;
}

function readDirectives(source: ts.SourceFile): string[] {
  const found: string[] = [];

  for (const statement of source.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    found.push(statement.expression.text);
  }

  return found;
}

export function parseSource(file: ProjectFile): ParsedSource {
  const cached = cache.get(file);

  if (cached) return cached;

  // Declaration-style `<T>x` casts are only legal outside TSX, so `.ts` files are parsed as TS.
  const kind = file.path.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.TSX;
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, kind);
  const jsx: JsxNode[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) jsx.push(jsxNodeOf(source, node.openingElement, node));
    else if (ts.isJsxSelfClosingElement(node)) jsx.push(jsxNodeOf(source, node, node));
    ts.forEachChild(node, visit);
  }

  visit(source);

  const imports = readImports(source);
  const parsed: ParsedSource = {
    directives: readDirectives(source),
    file,
    imports,
    jsx,
    peakui: new Set(
      imports.filter((entry) => entry.module === PEAKUI_MODULE).map((entry) => entry.local),
    ),
    source,
  };

  cache.set(file, parsed);

  return parsed;
}

export function parsedSources(context: StaticContext): ParsedSource[] {
  return context.files.filter((file) => /\.tsx?$/.test(file.path)).map(parseSource);
}

export function isPeakui(source: ParsedSource, node: JsxNode): boolean {
  return source.peakui.has(node.root);
}

export function peakuiElements(context: StaticContext, tag: string): JsxNode[] {
  return parsedSources(context).flatMap((source) =>
    source.jsx.filter((node) => node.tag === tag && isPeakui(source, node)),
  );
}

export function locate(source: ParsedSource, node: {line: number; excerpt: string}): Location {
  return {excerpt: node.excerpt, file: source.file.path, line: node.line};
}
