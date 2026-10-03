import type {ProjectFile} from "../types.ts";

import {mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join} from "node:path";

import postcss from "postcss";
import ts from "typescript";

import {runCommand} from "../exec.ts";
import {copyDir, hashFiles, readFiles, walkFiles} from "../files.ts";
import {PACKAGE_DIR, REPO_DIR, evalsHome, tarballsDir} from "../paths.ts";

export interface PackageManifest {
  [key: string]: unknown;
}

export interface CommentSample {
  file: string;
  text: string;
}

/** What an agent can read in the shipped JavaScript and declaration files. Informational only. */
export interface CommentInventory {
  /** JavaScript and TypeScript files looked at. */
  files: number;
  comments: number;
  /** Comments containing Cyrillic characters. */
  cyrillic: number;
  samples: CommentSample[];
}

export interface PackResult {
  commentInventory: CommentInventory;
  libraryHash: string;
  tarballs: {react: string; styles: string; acmeStatus: string};
}

export function rewriteReactManifest(
  manifest: PackageManifest,
  stylesVersion: string,
): PackageManifest {
  const out: PackageManifest = {...manifest};
  const dependencies = {...(manifest.dependencies as Record<string, string> | undefined)};

  for (const [name, version] of Object.entries(dependencies)) {
    if (version.startsWith("workspace:")) dependencies[name] = stylesVersion;
  }

  out.dependencies = dependencies;
  out.exports = {
    ".": {default: "./dist/index.mjs", import: "./dist/index.mjs", types: "./dist/index.d.mts"},
    "./package.json": "./package.json",
  };
  out.files = ["dist"];
  delete out.scripts;
  delete out.devDependencies;

  return out;
}

export function rewriteStylesManifest(manifest: PackageManifest): PackageManifest {
  const out: PackageManifest = {...manifest};
  const exports = {...(manifest.exports as Record<string, unknown>)};

  exports["."] = {
    default: "./dist/index.js",
    import: "./dist/index.js",
    style: "./index.css",
    types: "./dist/index.d.ts",
  };
  delete exports["./components/*"];
  delete exports["./generator"];
  delete exports["./presets"];

  out.exports = exports;
  out.files = [
    "dist",
    ...((manifest.files as string[] | undefined) ?? []).filter(
      (entry) => entry !== "src" && entry !== "presets",
    ),
  ];
  delete out.scripts;
  delete out.devDependencies;

  return out;
}

const COMMENT = /\/\*[\s\S]*?\*\//g;

function stripRawComments(node: {raws: object}): void {
  const raws = node.raws as Record<string, unknown>;

  for (const [key, value] of Object.entries(raws)) {
    if (typeof value === "string") raws[key] = value.replace(COMMENT, "");
    // `{value, raw}`: postcss keeps the raw form (with comments) only when it differs from the
    // clean one, so dropping it makes the serialiser use the clean value.
    else if (typeof value === "object" && value !== null && "raw" in value) delete raws[key];
  }
}

export function stripCssComments(css: string): string {
  const root = postcss.parse(css);

  root.walkComments((comment) => {
    comment.remove();
  });
  stripRawComments(root);
  root.walk((node) => {
    stripRawComments(node);
  });

  const out = root.toString();

  if (out.includes("/*")) {
    throw new Error("a CSS comment survived stripping; inspect the stylesheet");
  }

  return out;
}

const CODE_FILE = /\.(?:[cm]?js|[cm]?ts)$/;
const SAMPLE_LIMIT = 5;
const SAMPLE_LENGTH = 80;

function commentTexts(file: ProjectFile): string[] {
  const kind = file.path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file.path, file.text, ts.ScriptTarget.Latest, true, kind);
  const seen = new Map<number, string>();

  function note(ranges: ts.CommentRange[] | undefined) {
    for (const range of ranges ?? []) {
      if (!seen.has(range.pos)) seen.set(range.pos, file.text.slice(range.pos, range.end));
    }
  }

  function visit(node: ts.Node) {
    note(ts.getLeadingCommentRanges(file.text, node.getFullStart()));
    note(ts.getTrailingCommentRanges(file.text, node.getEnd()));
    for (const child of node.getChildren(source)) visit(child);
  }

  visit(source);

  return [...seen.values()].map((raw) =>
    raw
      .replace(/^\/\/+|^\/\*+|\*+\/$/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function commentInventory(files: ProjectFile[]): CommentInventory {
  const code = files.filter((file) => CODE_FILE.test(file.path));
  const all: CommentSample[] = [];

  for (const file of code) {
    for (const text of commentTexts(file)) all.push({file: file.path, text});
  }

  const cyrillic = all.filter((entry) => /\p{Script=Cyrillic}/u.test(entry.text));
  const others = all.filter((entry) => !cyrillic.includes(entry));
  const samples = [...cyrillic, ...others]
    .slice(0, SAMPLE_LIMIT)
    .map((entry) => ({file: entry.file, text: entry.text.slice(0, SAMPLE_LENGTH)}));

  return {comments: all.length, cyrillic: cyrillic.length, files: code.length, samples};
}

export function findForbidden(files: ProjectFile[]): string[] {
  return files
    .filter((file) => /hero\s?ui/i.test(file.text))
    .map((file) => file.path)
    .sort();
}

async function run(argv: string[], cwd: string, timeoutMs = 600_000): Promise<string> {
  const result = await runCommand(argv, {cwd, timeoutMs});

  if (result.exitCode !== 0) {
    throw new Error(
      `${argv.join(" ")} failed (exit ${result.exitCode}): ${result.stderr || result.stdout}`,
    );
  }

  return result.stdout;
}

function readJson(path: string): PackageManifest {
  return JSON.parse(readFileSync(path, "utf8")) as PackageManifest;
}

export async function packLibrary(): Promise<PackResult> {
  const stage = join(evalsHome(), "stage");
  const reactSource = join(REPO_DIR, "packages/react");
  const stylesSource = join(REPO_DIR, "packages/styles");
  const tsdown = join(PACKAGE_DIR, "node_modules/.bin/tsdown");

  rmSync(stage, {force: true, recursive: true});
  mkdirSync(join(stage, "react"), {recursive: true});
  mkdirSync(join(stage, "styles"), {recursive: true});
  mkdirSync(tarballsDir(), {recursive: true});

  await run([tsdown, "--out-dir", join(stage, "react/dist")], reactSource);
  await run(
    [
      tsdown,
      "src/index.ts",
      "--no-config",
      "--format",
      "esm",
      "--dts",
      "--unbundle",
      "--platform",
      "neutral",
      "--out-dir",
      join(stage, "styles/dist"),
    ],
    stylesSource,
  );

  for (const name of ["index.css", "base", "components", "themes", "utilities", "variants"]) {
    copyDir(join(stylesSource, name), join(stage, "styles", name));
  }

  for (const path of walkFiles(join(stage, "styles")).filter((file) => file.endsWith(".css"))) {
    const full = join(stage, "styles", path);

    writeFileSync(full, stripCssComments(readFileSync(full, "utf8")));
  }

  const stylesManifest = readJson(join(stylesSource, "package.json"));

  writeFileSync(
    join(stage, "react/package.json"),
    `${JSON.stringify(rewriteReactManifest(readJson(join(reactSource, "package.json")), String(stylesManifest.version)), null, 2)}\n`,
  );
  writeFileSync(
    join(stage, "styles/package.json"),
    `${JSON.stringify(rewriteStylesManifest(stylesManifest), null, 2)}\n`,
  );
  copyDir(join(PACKAGE_DIR, "fixtures/packages/acme-status"), join(stage, "acme-status"));

  const files = readFiles(stage, walkFiles(stage));
  const forbidden = findForbidden(files);

  if (forbidden.length > 0) {
    throw new Error(`staged files name the reference library: ${forbidden.join(", ")}`);
  }

  const libraryHash = hashFiles(files);
  const inventory = commentInventory(
    files.filter((file) => file.path.startsWith("react/") || file.path.startsWith("styles/")),
  );

  async function pack(directory: string): Promise<string> {
    const stdout = await run(
      ["npm", "pack", "--pack-destination", tarballsDir()],
      join(stage, directory),
    );
    const name = stdout.trim().split("\n").at(-1) ?? "";

    return join(tarballsDir(), name);
  }

  return {
    commentInventory: inventory,
    libraryHash,
    tarballs: {
      acmeStatus: await pack("acme-status"),
      react: await pack("react"),
      styles: await pack("styles"),
    },
  };
}
