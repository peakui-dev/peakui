import type {ProjectFile, StaticContext} from "../types.ts";
import type {Root} from "postcss";

import postcss from "postcss";

export interface CssRule {
  selector: string;
  /** The nearest enclosing `@layer` name. */
  layer: string | undefined;
  /** Values are lower-cased with whitespace removed. */
  declarations: Record<string, string>;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function tryParseCss(text: string): Root | undefined {
  try {
    return postcss.parse(text);
  } catch {
    return undefined;
  }
}

export interface CssImport {
  /** The imported stylesheet, without quotes or `url()`. */
  target: string;
  /** The full prelude as written, modifiers included. */
  params: string;
  /** The name inside `layer(...)`; the empty string for a bare `layer`; absent when there is none. */
  layer?: string;
  /** The inside of `source(...)`, quotes removed: a path or `none`. */
  source?: string;
}

function unquote(text: string): string {
  return text.trim().replace(/^(["'])(.*)\1$/, "$2");
}

export function importTargets(root: Root): CssImport[] {
  const targets: CssImport[] = [];

  root.walkAtRules("import", (rule) => {
    const params = rule.params.trim();
    const url = /^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/i.exec(params);
    const quoted = /^(?:"([^"]*)"|'([^']*)')/.exec(params);
    const match = url ?? quoted;
    const target = match?.slice(1).find((part) => part !== undefined);

    if (target === undefined || match === null) return;

    const modifiers = params.slice(match[0].length);
    const layer = /(?:^|\s)layer(?:\(([^)]*)\))?(?=\s|$)/i.exec(modifiers);
    const source = /(?:^|\s)source\(\s*([^)]*?)\s*\)/i.exec(modifiers);
    const entry: CssImport = {params, target};

    if (layer) entry.layer = (layer[1] ?? "").trim();
    if (source?.[1] !== undefined) entry.source = unquote(source[1]);

    targets.push(entry);
  });

  return targets;
}

export function layerOrder(root: Root): string[] {
  const order: string[] = [];

  for (const node of root.nodes) {
    if (node.type !== "atrule" || node.name.toLowerCase() !== "layer") continue;

    for (const name of node.params.split(",").map((part) => part.trim())) {
      if (name && !order.includes(name)) order.push(name);
    }
  }

  return order;
}

function enclosingLayer(node: postcss.Node): string | undefined {
  let current = node.parent;

  while (current) {
    if (current.type === "atrule" && (current as postcss.AtRule).name.toLowerCase() === "layer") {
      return (current as postcss.AtRule).params.trim() || undefined;
    }
    current = current.parent;
  }

  return undefined;
}

/** The selector with attribute selectors and strings blanked out, so only real class tokens remain. */
function withoutStringsAndAttributes(selector: string): string {
  let out = "";
  let depth = 0;
  let quote: string | undefined;

  for (let index = 0; index < selector.length; index += 1) {
    const character = selector[index]!;

    if (character === "\\" && depth === 0 && quote === undefined) {
      // An escape outside brackets belongs to a class name; keep it and what it escapes.
      out += character + (selector[index + 1] ?? "");
      index += 1;
    } else if (quote !== undefined) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") quote = character;
    else if (character === "[") depth += 1;
    else if (character === "]" && depth > 0) depth -= 1;
    else if (depth === 0) out += character;
  }

  return out;
}

function classPattern(className: string): RegExp {
  const escaped = escapeClass(className.replace(/^\./, "")).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");

  // A backslash after the name means the class continues with an escaped character, so it is a
  // different class (`.ring\/20` is not `.ring`).
  return new RegExp(`\\.${escaped}(?![\\w\\\\-])`);
}

function selectorHasClass(selector: string, pattern: RegExp): boolean {
  return pattern.test(withoutStringsAndAttributes(selector));
}

/** Rules whose selector contains the class `fragment` (with or without its dot) as a whole token. */
export function rulesWithSelector(root: Root, fragment: string): CssRule[] {
  const found: CssRule[] = [];
  const pattern = classPattern(fragment);

  root.walkRules((rule) => {
    if (!selectorHasClass(rule.selector, pattern)) return;

    const declarations: Record<string, string> = {};

    rule.each((child) => {
      if (child.type === "decl") declarations[child.prop] = normalize(child.value);
    });
    found.push({declarations, layer: enclosingLayer(rule), selector: rule.selector});
  });

  return found;
}

function escapeClass(className: string): string {
  return className.replace(/[^A-Za-z0-9_-]/g, (character) => `\\${character}`);
}

export function classRuleExists(root: Root, className: string): boolean {
  const pattern = classPattern(className);
  let exists = false;

  root.walkRules((rule) => {
    if (selectorHasClass(rule.selector, pattern)) exists = true;
  });

  return exists;
}

export function atRuleParams(root: Root, name: string): string[] {
  const found: string[] = [];

  root.walkAtRules(name, (rule) => {
    found.push(rule.params);
  });

  return found;
}

export function declarationValues(root: Root, property: string): string[] {
  const found: string[] = [];

  root.walkDecls(property, (declaration) => {
    found.push(normalize(declaration.value));
  });

  return found;
}

export function cssFiles(context: StaticContext): Array<{file: ProjectFile; root: Root}> {
  const found: Array<{file: ProjectFile; root: Root}> = [];

  for (const file of context.files) {
    if (!file.path.endsWith(".css")) continue;

    const root = tryParseCss(file.text);

    if (root) found.push({file, root});
  }

  return found;
}

export type LayerOrderResult =
  {available: true; order: string[]} | {available: false; reason: string};

/**
 * The cascade-layer order of the built CSS, given each built file on its own.
 *
 * The order only means something in LOAD order, and a build directory does not say what that is: a
 * Next.js `.next/static` may hold several chunks, listed by name. So the order is reported only when
 * it does not depend on which file loads first: one file declares layers, or every file that does
 * declares the same sequence. Anything else is unavailable, never a guess.
 */
export function builtLayerOrder(files: Root[]): LayerOrderResult {
  if (files.length === 0) return {available: false, reason: "the build produced no CSS"};

  const orders = files.map(layerOrder).filter((order) => order.length > 0);
  const [first] = orders;

  if (first === undefined) return {available: true, order: []};

  if (orders.some((order) => order.join("\0") !== first.join("\0"))) {
    return {
      available: false,
      reason: "the built CSS files declare different layer orders and their load order is unknown",
    };
  }

  return {available: true, order: first};
}
