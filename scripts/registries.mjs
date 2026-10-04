#!/usr/bin/env node
/*
 * Generates the five registries that list every component, from the file system.
 *
 * A registry is a file each new component would otherwise add a line to. Hand-edited, those lines
 * are where parallel branches collide; generated, a branch only adds its own files and the
 * registries are rebuilt after a merge. Nothing here reads the entries a registry already holds —
 * only its header — so a registry left unsorted or duplicated by a `merge=union` merge (see
 * `.gitattributes`) is repaired by the next run.
 *
 *   pnpm registries          rewrite the registries
 *   pnpm registries --check  exit 1 and name every registry that is out of date
 */
import {existsSync, readFileSync, readdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";

export const REACT_BARREL = "packages/react/src/components/index.ts";
export const STYLES_BARREL = "packages/styles/src/components/index.ts";
export const CSS_LAYER = "packages/styles/components/index.css";
export const DEMOS = "apps/docs/src/demos/index.ts";
export const DOCS_META = "apps/docs/content/docs/en/react/components/meta.json";

export const REGISTRY_PATHS = [REACT_BARREL, STYLES_BARREL, CSS_LAYER, DEMOS, DOCS_META];

const DEMOS_OPEN = "export const demos: Record<string, DemoItem> = {\n";
const DEMOS_CLOSE = "export function getDemo";

/** Code-point order, so `input-group` sorts before `input/` and `input.` the way the files do. */
const byCodePoint = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function subdirectories(path) {
  if (!existsSync(path)) return [];

  return readdirSync(path, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(byCodePoint);
}

/** Everything above the first entry: the header comment and the blank line after it. */
function headerBefore(source, isEntry) {
  const lines = source.split("\n");
  const first = lines.findIndex(isEntry);

  if (first === -1) return source.replace(/\n*$/, "\n");

  return first === 0 ? "" : `${lines.slice(0, first).join("\n")}\n`;
}

function lineRegistry(source, entries, isEntry) {
  const header = headerBefore(source, isEntry);

  return `${header}${entries.sort(byCodePoint).join("\n")}\n`;
}

export function renderBarrel(source, names) {
  return lineRegistry(
    source,
    names.map((name) => `export * from "./${name}/index.ts";`),
    (line) => line.startsWith("export * from "),
  );
}

export function renderCssLayer(source, names) {
  return lineRegistry(
    source,
    names.map((name) => `@import "./${name}.css";`),
    (line) => line.startsWith("@import "),
  );
}

/**
 * `demos` is `[{component, file, exportName}]`. A key is `<component>-<file>`, which is what
 * `<ComponentPreview name="…">` refers to.
 */
export function renderDemos(source, demos) {
  const open = source.indexOf(DEMOS_OPEN);
  const close = source.indexOf(DEMOS_CLOSE);

  if (open === -1 || close === -1) {
    throw new Error(`${DEMOS}: cannot find the \`demos\` record or \`getDemo\` to write between`);
  }

  const groups = new Map();

  for (const demo of demos) {
    groups.set(demo.component, [...(groups.get(demo.component) ?? []), demo]);
  }

  const body = [...groups.keys()]
    .sort(byCodePoint)
    .map((component) => {
      const entries = groups
        .get(component)
        .sort((a, b) => byCodePoint(a.file, b.file))
        .map(
          ({exportName, file}) =>
            `  "${component}-${file}": {\n` +
            `    loader: () => import("./${component}/${file}").then((m) => m.${exportName}),\n` +
            `    file: "${component}/${file}.tsx",\n` +
            `  },\n`,
        );

      return `  // ${component}\n${entries.join("")}`;
    })
    .join("");

  return `${source.slice(0, open + DEMOS_OPEN.length)}${body}};\n\n${source.slice(close)}`;
}

/**
 * `pages` is `["(category)/name"]`. Entries that are not component pages — separators, `index` —
 * keep their place at the top. The list is read line by line rather than parsed, so a trailing
 * comma lost in a merge does not stop the repair.
 */
export function renderDocsMeta(source, pages) {
  const marker = '"pages": [';
  const open = source.indexOf(marker);

  if (open === -1) throw new Error(`${DOCS_META}: no "pages" array`);

  const listed = [...source.slice(open + marker.length).matchAll(/^\s*"([^"]+)",?\s*$/gm)].map(
    (match) => match[1],
  );
  const kept = listed.filter((page) => !page.startsWith("("));
  const basename = (page) => page.slice(page.indexOf("/") + 1);
  const sorted = [...pages].sort((a, b) => byCodePoint(basename(a), basename(b)));
  const lines = [...kept, ...sorted].map((page) => `    "${page}"`).join(",\n");

  return `${source.slice(0, open + marker.length)}\n${lines}\n  ]\n}\n`;
}

function collectDemos(root) {
  const base = join(root, "apps/docs/src/demos");
  const demos = [];

  for (const component of subdirectories(base)) {
    for (const entry of readdirSync(join(base, component)).sort(byCodePoint)) {
      if (!entry.endsWith(".tsx")) continue;

      const match = /^export function (\w+)/m.exec(
        readFileSync(join(base, component, entry), "utf8"),
      );

      if (!match) {
        throw new Error(
          `apps/docs/src/demos/${component}/${entry}: no \`export function <Name>\` to register`,
        );
      }
      demos.push({component, exportName: match[1], file: entry.slice(0, -".tsx".length)});
    }
  }

  return demos;
}

function collectPages(root) {
  const base = join(root, "apps/docs/content/docs/en/react/components");

  return subdirectories(base)
    .filter((category) => category.startsWith("("))
    .flatMap((category) =>
      readdirSync(join(base, category))
        .filter((entry) => entry.endsWith(".mdx"))
        .map((entry) => `${category}/${entry.slice(0, -".mdx".length)}`),
    );
}

/** Formats `content` the way Prettier would format the file at `path`. */
export async function format(root, path, content) {
  const prettier = await import("prettier");
  const filepath = join(root, path);
  const options = (await prettier.resolveConfig(filepath)) ?? {};

  return prettier.format(content, {...options, filepath});
}

/** Returns `[{path, content}]` — what every registry should hold for the tree at `root`. */
export async function generate(root = process.cwd()) {
  const read = (path) => readFileSync(join(root, path), "utf8");
  const components = subdirectories(join(root, "packages/react/src/components"));
  const styles = subdirectories(join(root, "packages/styles/src/components"));
  const rendered = [
    [REACT_BARREL, renderBarrel(read(REACT_BARREL), components)],
    [STYLES_BARREL, renderBarrel(read(STYLES_BARREL), styles)],
    [CSS_LAYER, renderCssLayer(read(CSS_LAYER), styles)],
    [DEMOS, renderDemos(read(DEMOS), collectDemos(root))],
    [DOCS_META, renderDocsMeta(read(DOCS_META), collectPages(root))],
  ];

  return Promise.all(
    rendered.map(async ([path, content]) => ({content: await format(root, path, content), path})),
  );
}

/** Paths of the registries whose content on disk differs from what `generate` returns. */
export async function staleRegistries(root = process.cwd()) {
  const generated = await generate(root);

  return generated
    .filter(({content, path}) => readFileSync(join(root, path), "utf8") !== content)
    .map(({path}) => path);
}

export async function writeRegistries(root = process.cwd()) {
  const written = [];

  for (const {content, path} of await generate(root)) {
    if (readFileSync(join(root, path), "utf8") === content) continue;
    writeFileSync(join(root, path), content);
    written.push(path);
  }

  return written;
}

async function main() {
  if (process.argv.includes("--check")) {
    const stale = await staleRegistries();

    if (stale.length === 0) return;
    process.stderr.write(
      `Out of date: ${stale.join(", ")}.\nRun \`pnpm registries\` — these files are generated.\n`,
    );
    process.exit(1);
  }

  const written = await writeRegistries();

  process.stdout.write(
    written.length === 0 ? "Registries are up to date.\n" : `Rewrote ${written.join(", ")}.\n`,
  );
}

if (process.argv[1]?.endsWith("registries.mjs")) await main();
