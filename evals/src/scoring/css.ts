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

export function importTargets(root: Root): string[] {
  const targets: string[] = [];

  root.walkAtRules("import", (rule) => {
    const params = rule.params.trim();
    const url = /^url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/i.exec(params);
    const quoted = /^(?:"([^"]*)"|'([^']*)')/.exec(params);
    const match = url ?? quoted;
    const target = match?.slice(1).find((part) => part !== undefined);

    if (target !== undefined) targets.push(target);
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

export function rulesWithSelector(root: Root, fragment: string): CssRule[] {
  const found: CssRule[] = [];

  root.walkRules((rule) => {
    if (!rule.selector.includes(fragment)) return;

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
  const escaped = escapeClass(className).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
  // A backslash after the name means the class continues with an escaped character, so it is a
  // different class (`.ring\/20` is not `.ring`).
  const pattern = new RegExp(`\\.${escaped}(?![\\w\\\\-])`);
  let exists = false;

  root.walkRules((rule) => {
    if (pattern.test(rule.selector)) exists = true;
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
