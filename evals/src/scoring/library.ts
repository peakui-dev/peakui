import {readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

import postcss from "postcss";

import {rewriteReactManifest, rewriteStylesManifest} from "../pack/stage.ts";
import {REPO_DIR} from "../paths.ts";

/**
 * What the detectors need to know about the library, read from the library itself rather than
 * written down by hand: the packages' sources are the ground truth, and the staged manifests are
 * produced by the same rewrite functions the pack uses.
 */
export interface LibraryFacts {
  /** A named export of `@peakui/react` to its canonical dotted name: `FieldsetGroup` to `Fieldset.Group`, `ButtonRoot` to `Button`. */
  components: Map<string, string>;
  /** Every `block--` and `block__` prefix of the stylesheets' BEM classes. */
  bemPrefixes: Set<string>;
  /** The `exports` keys of the staged packages, by package name. */
  exports: Record<string, string[]>;
}

let cached: LibraryFacts | undefined;

function readText(path: string): string {
  return readFileSync(path, "utf8");
}

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readText(path)) as Record<string, unknown>;
}

function componentNames(reactDir: string): Map<string, string> {
  const names = new Map<string, string>();
  const componentsDir = join(reactDir, "src/components");

  for (const entry of readdirSync(componentsDir, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;

    let text: string;

    try {
      text = readText(join(componentsDir, entry.name, "index.ts"));
    } catch {
      continue;
    }

    // `export const Fieldset = Object.assign(FieldsetRoot, {Root: FieldsetRoot, Group: FieldsetGroup})`
    for (const match of text.matchAll(
      /export const (\w+) = Object\.assign\(\s*(\w+),\s*\{([^}]*)\}\s*\)/g,
    )) {
      const [, compound, root, body] = match;

      if (compound === undefined || root === undefined || body === undefined) continue;
      names.set(compound, compound);
      names.set(root, compound);

      for (const part of body.matchAll(/(\w+)\s*:\s*(\w+)/g)) {
        const [, key, local] = part;

        if (key === undefined || local === undefined) continue;
        names.set(local, key === "Root" ? compound : `${compound}.${key}`);
      }
    }
  }

  return names;
}

function bemPrefixes(stylesDir: string): Set<string> {
  const blocks = new Set<string>();
  const componentsDir = join(stylesDir, "components");

  for (const file of readdirSync(componentsDir)) {
    if (!file.endsWith(".css") || file === "index.css") continue;
    blocks.add(file.slice(0, -".css".length));

    postcss.parse(readText(join(componentsDir, file))).walkRules((rule) => {
      for (const match of rule.selector.matchAll(/\.([A-Za-z][\w-]*?)(?:--|__)[\w-]/g)) {
        if (match[1] !== undefined) blocks.add(match[1]);
      }
    });
  }

  const prefixes = new Set<string>();

  for (const block of blocks) {
    prefixes.add(`${block}--`);
    prefixes.add(`${block}__`);
  }

  return prefixes;
}

function exportKeys(manifest: Record<string, unknown>): string[] {
  return Object.keys((manifest.exports as Record<string, unknown> | undefined) ?? {});
}

export function libraryFacts(): LibraryFacts {
  if (cached) return cached;

  const reactDir = join(REPO_DIR, "packages/react");
  const stylesDir = join(REPO_DIR, "packages/styles");
  const stylesManifest = readJson(join(stylesDir, "package.json"));
  const reactManifest = readJson(join(reactDir, "package.json"));

  cached = {
    bemPrefixes: bemPrefixes(stylesDir),
    components: componentNames(reactDir),
    exports: {
      "@peakui/react": exportKeys(
        rewriteReactManifest(reactManifest, String(stylesManifest.version)),
      ),
      "@peakui/styles": exportKeys(rewriteStylesManifest(stylesManifest)),
    },
  };

  return cached;
}

function matchesExportKey(key: string, subpath: string): boolean {
  const star = key.indexOf("*");

  if (star === -1) return key === subpath;

  const prefix = key.slice(0, star);
  const suffix = key.slice(star + 1);

  return (
    subpath.length > prefix.length + suffix.length &&
    subpath.startsWith(prefix) &&
    subpath.endsWith(suffix)
  );
}

/**
 * Whether the staged package really exports `specifier`. `undefined` when the specifier is not
 * one of the library's packages.
 */
export function isExportedSpecifier(specifier: string): boolean | undefined {
  for (const [name, keys] of Object.entries(libraryFacts().exports)) {
    if (specifier === name) return true;
    if (!specifier.startsWith(`${name}/`)) continue;

    const subpath = `.${specifier.slice(name.length)}`;

    return keys.some((key) => matchesExportKey(key, subpath));
  }

  return undefined;
}
