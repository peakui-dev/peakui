import type {ProjectFile, StaticContext} from "../types.ts";
import type {Location} from "./findings.ts";

import {posix} from "node:path";

import ts from "typescript";

import {libraryFacts} from "./library.ts";

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
  /** `default` for a default import and `*` for a namespace import or `export *`. */
  imported: string;
  local: string;
  line: number;
  excerpt: string;
  /**
   * `import` binds a name; `side-effect` is `import "x"` with no clause; `export` is
   * `export … from "x"`; `dynamic` is `import("x")` or `require("x")`.
   */
  kind: "import" | "side-effect" | "export" | "dynamic";
}

export interface ParsedSource {
  file: ProjectFile;
  source: ts.SourceFile;
  imports: ImportedName[];
  /** Local names that stand for `@peakui/react` or one of its members: its imports and simple aliases of them. */
  peakui: Set<string>;
  /** Each such name to the member path from the package root: `Btn` is `["Button"]`, a namespace is `[]`. */
  bindings: Map<string, string[]>;
  /** Exported name to the local name it exports, for `export {a as b}`, `export const a` and `export default a`. */
  localExports: Map<string, string>;
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

  function at(node: ts.Node) {
    return {
      excerpt: excerptOf(source, node.getStart(source)),
      line: lineOf(source, node.getStart(source)),
    };
  }

  for (const statement of source.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const at_ = {
        ...at(statement),
        kind: "export" as const,
        module: statement.moduleSpecifier.text,
      };
      const clause = statement.exportClause;

      if (!clause) found.push({...at_, imported: "*", local: "*"});
      else if (ts.isNamespaceExport(clause)) {
        found.push({...at_, imported: "*", local: clause.name.text});
      } else {
        for (const element of clause.elements) {
          found.push({
            ...at_,
            imported: (element.propertyName ?? element.name).text,
            local: element.name.text,
          });
        }
      }

      continue;
    }

    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }

    const module = statement.moduleSpecifier.text;
    const location = at(statement);
    const clause = statement.importClause;

    if (!clause) {
      found.push({...location, imported: "", kind: "side-effect", local: "", module});
      continue;
    }

    const base = {...location, kind: "import" as const, module};

    if (clause.name) found.push({...base, imported: "default", local: clause.name.text});

    const bindings = clause.namedBindings;

    if (bindings && ts.isNamespaceImport(bindings)) {
      found.push({...base, imported: "*", local: bindings.name.text});
    } else if (bindings) {
      for (const element of bindings.elements) {
        found.push({
          ...base,
          imported: (element.propertyName ?? element.name).text,
          local: element.name.text,
        });
      }
    }
  }

  return found;
}

/** `import("x")` and `require("x")` with a literal specifier, anywhere in the file. */
function readDynamicImports(source: ts.SourceFile): ImportedName[] {
  const found: ImportedName[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const [first] = node.arguments;
      const callee = node.expression;
      const dynamic =
        callee.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(callee) && callee.text === "require");

      if (dynamic && first && ts.isStringLiteralLike(first)) {
        found.push({
          excerpt: excerptOf(source, node.getStart(source)),
          imported: "*",
          kind: "dynamic",
          line: lineOf(source, node.getStart(source)),
          local: "",
          module: first.text,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return found;
}

/** The member path of a `Name` or `Name.Part.Part` expression when its root is a known binding. */
function pathOfExpression(
  expression: ts.Expression,
  bindings: Map<string, string[]>,
): string[] | undefined {
  let current = expression;

  while (ts.isParenthesizedExpression(current)) current = current.expression;

  if (ts.isIdentifier(current)) return bindings.get(current.text);

  if (ts.isPropertyAccessExpression(current) && ts.isIdentifier(current.name)) {
    const base = pathOfExpression(current.expression, bindings);

    return base ? [...base, current.name.text] : undefined;
  }

  return undefined;
}

function libraryBindings(
  source: ts.SourceFile,
  imports: ImportedName[],
): {bindings: Map<string, string[]>; localExports: Map<string, string>} {
  const bindings = new Map<string, string[]>();
  const localExports = new Map<string, string>();

  for (const entry of imports) {
    if (entry.kind !== "import" || entry.module !== PEAKUI_MODULE) continue;
    bindings.set(entry.local, entry.imported === "*" ? [] : [entry.imported]);
  }

  function hasExport(node: ts.Node): boolean {
    return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
  }

  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;

        const alias = declaration.initializer
          ? pathOfExpression(declaration.initializer, bindings)
          : undefined;

        if (alias) bindings.set(declaration.name.text, alias);
        if (hasExport(node)) localExports.set(declaration.name.text, declaration.name.text);
      }
    } else if (ts.isExportDeclaration(node) && !node.moduleSpecifier && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          localExports.set(element.name.text, (element.propertyName ?? element.name).text);
        }
      }
    } else if (ts.isExportAssignment(node) && ts.isIdentifier(node.expression)) {
      localExports.set("default", node.expression.text);
    } else if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name &&
      hasExport(node)
    ) {
      localExports.set(
        ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Default ? "default" : node.name.text,
        node.name.text,
      );
    }

    ts.forEachChild(node, visit);
  }

  visit(source);

  return {bindings, localExports};
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
  // JavaScript is parsed as JSX: a `.js` file may hold JSX, and plain JavaScript is a subset.
  const kind = /\.[cm]?ts$/.test(file.path)
    ? ts.ScriptKind.TS
    : /\.[cm]?js$|\.jsx$/.test(file.path)
      ? ts.ScriptKind.JSX
      : ts.ScriptKind.TSX;
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, kind);
  const jsx: JsxNode[] = [];

  function visit(node: ts.Node) {
    if (ts.isJsxElement(node)) jsx.push(jsxNodeOf(source, node.openingElement, node));
    else if (ts.isJsxSelfClosingElement(node)) jsx.push(jsxNodeOf(source, node, node));
    ts.forEachChild(node, visit);
  }

  visit(source);

  const imports = [...readImports(source), ...readDynamicImports(source)];
  const {bindings, localExports} = libraryBindings(source, imports);
  const parsed: ParsedSource = {
    bindings,
    directives: readDirectives(source),
    file,
    imports,
    jsx,
    localExports,
    peakui: new Set(bindings.keys()),
    source,
  };

  cache.set(file, parsed);

  return parsed;
}

/** `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.mts` and `.cts`. */
export const SOURCE_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;

export function parsedSources(context: StaticContext): ParsedSource[] {
  return context.files.filter((file) => SOURCE_FILE.test(file.path)).map(parseSource);
}

export function isPeakui(source: ParsedSource, node: JsxNode): boolean {
  return source.peakui.has(node.root);
}

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"];

/** The project file a local specifier names, or undefined. `@/` and `~/` stand for the project root or `src/`. */
function resolveLocal(
  context: StaticContext,
  from: string,
  specifier: string,
): ProjectFile | undefined {
  const bases: string[] = [];

  if (specifier.startsWith(".")) bases.push(posix.join(posix.dirname(from), specifier));
  else if (/^[@~]\//.test(specifier)) {
    bases.push(specifier.slice(2), posix.join("src", specifier.slice(2)));
  } else return undefined;

  for (const base of bases) {
    const stem = base.replace(/\.(?:[cm]?js|jsx)$/, "");
    const candidates = [
      base,
      ...EXTENSIONS.map((extension) => `${base}${extension}`),
      ...EXTENSIONS.map((extension) => `${stem}${extension}`),
      ...EXTENSIONS.map((extension) => `${base}/index${extension}`),
    ];

    for (const candidate of candidates) {
      const file = context.file(posix.normalize(candidate));

      if (file) return file;
    }
  }

  return undefined;
}

/**
 * What a local file exports of the library, one level deep: `export {A as B} from "@peakui/react"`,
 * `export * from "@peakui/react"`, and exports of its own direct imports and aliases. Exported name
 * to member path; `*` stands for every name.
 */
function wrapperExports(wrapper: ParsedSource): Map<string, string[]> {
  const exported = new Map<string, string[]>();

  for (const entry of wrapper.imports) {
    if (entry.kind !== "export" || entry.module !== PEAKUI_MODULE) continue;
    if (entry.imported === "*" && entry.local === "*") exported.set("*", []);
    else exported.set(entry.local, entry.imported === "*" ? [] : [entry.imported]);
  }

  for (const [name, local] of wrapper.localExports) {
    const path = wrapper.bindings.get(local);

    if (path) exported.set(name, path);
  }

  return exported;
}

const bindingCache = new WeakMap<StaticContext, Map<ParsedSource, Map<string, string[]>>>();

/** The source's own library bindings, plus the ones it imports from local files that re-export the library. */
export function bindingsOf(context: StaticContext, source: ParsedSource): Map<string, string[]> {
  let perContext = bindingCache.get(context);

  if (!perContext) {
    perContext = new Map();
    bindingCache.set(context, perContext);
  }

  const cached = perContext.get(source);

  if (cached) return cached;

  const bindings = new Map(source.bindings);

  for (const entry of source.imports) {
    if (entry.kind !== "import" || entry.module === PEAKUI_MODULE) continue;

    const target = resolveLocal(context, source.file.path, entry.module);

    if (!target || target === source.file) continue;

    const exported = wrapperExports(parseSource(target));
    const direct = exported.get(entry.imported === "default" ? "default" : entry.imported);

    if (entry.imported === "*") {
      if (exported.has("*")) bindings.set(entry.local, []);
    } else if (direct) {
      bindings.set(entry.local, direct);
    } else if (exported.has("*")) {
      bindings.set(entry.local, [entry.imported]);
    }
  }

  perContext.set(source, bindings);

  return bindings;
}

/** Joins a member path into the library's canonical name: `FieldsetGroup` is `Fieldset.Group`, and `ButtonRoot`, `Button.Root` and `Button` are all `Button`. */
export function canonicalName(path: string[]): string {
  const [head, ...rest] = path;

  if (head === undefined) return "";

  const known = libraryFacts().components.get(head) ?? head;
  const joined = [known, ...rest].join(".");

  return joined.replace(/\.Root$/, "");
}

/**
 * The library's name for an element: the import's own name, not the local alias, with parts joined
 * by dots and the root spelled without `Root` (`Button.Root`, `ButtonRoot` and `Button` are one
 * component). Resolves namespace imports, simple aliases and, when `context` is given, local
 * files that re-export the library. `undefined` for an element that is not from `@peakui/react`.
 */
export function canonicalTag(
  source: ParsedSource,
  node: JsxNode,
  context?: StaticContext,
): string | undefined {
  const bindings = context ? bindingsOf(context, source) : source.bindings;
  const path = bindings.get(node.root);

  if (!path) return undefined;

  return canonicalName([...path, ...node.tag.split(".").slice(1)]);
}

/** Every element of the library whose canonical name is `tag`, however it was imported or spelled. */
export function peakuiElements(context: StaticContext, tag: string): JsxNode[] {
  return parsedSources(context).flatMap((source) =>
    source.jsx.filter((node) => canonicalTag(source, node, context) === tag),
  );
}

/**
 * Whether `node` sits inside the compound root `name`. A root has three spellings — `Tooltip`,
 * `Tooltip.Root` and `TooltipRoot` — and a rule about what a root contains must accept all three.
 */
export function insideRoot(node: JsxNode, name: string): boolean {
  return node.ancestors.some(
    (ancestor) => ancestor === name || ancestor === `${name}.Root` || ancestor === `${name}Root`,
  );
}

export function locate(source: ParsedSource, node: {line: number; excerpt: string}): Location {
  return {excerpt: node.excerpt, file: source.file.path, line: node.line};
}
