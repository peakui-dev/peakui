import type {ProjectFile} from "../types.ts";

import {randomBytes} from "node:crypto";
import {mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {createRequire} from "node:module";
import {join} from "node:path";

import postcss from "postcss";
import ts from "typescript";

import {runCommand} from "../exec.ts";
import {copyDir, hashFiles, readFiles, walkFiles} from "../files.ts";
import {npmEnvironment} from "../npm.ts";
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
      .replace(/\n\s*\*(?!\/)/g, "\n")
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

/** Where the hash looks. Every field has a default; tests point them at small fixtures. */
export interface HashInputs {
  reactDir: string;
  stylesDir: string;
  acmeDir: string;
  /** The file that holds the staging rules; its text is part of the hash. */
  rulesFile: string;
  /** Versions of the tools that produce the build output. */
  tools: Record<string, string>;
}

/** Tools whose version changes what the build emits. */
const BUILD_TOOLS = ["tsdown", "rolldown", "rolldown-plugin-dts", "typescript"];
const NOT_AN_INPUT = [
  "node_modules",
  "dist",
  "*.test.ts",
  "*.test.tsx",
  "*.stories.ts",
  "*.stories.tsx",
];
/** The parts of each package that the build reads or the staging copies. */
const REACT_INPUTS = ["src", "package.json", "tsdown.config.ts", "tsconfig.json"];
const STYLES_INPUTS = [
  "src",
  "package.json",
  "tsconfig.json",
  "index.css",
  "base",
  "components",
  "themes",
  "utilities",
  "variants",
];

function toolVersions(): Record<string, string> {
  const versions: Record<string, string> = {};
  let resolveFrom: NodeJS.Require;

  try {
    // pnpm keeps a package's own dependencies beside its real location, not beside the link.
    resolveFrom = createRequire(
      join(realpathSync(join(PACKAGE_DIR, "node_modules/tsdown")), "package.json"),
    );
  } catch {
    resolveFrom = createRequire(join(PACKAGE_DIR, "package.json"));
  }

  for (const name of BUILD_TOOLS) {
    try {
      const manifest = JSON.parse(
        readFileSync(resolveFrom.resolve(`${name}/package.json`), "utf8"),
      );

      versions[name] = String(manifest.version);
    } catch {
      versions[name] = "unresolved";
    }
  }

  return versions;
}

function defaultHashInputs(): HashInputs {
  return {
    acmeDir: join(PACKAGE_DIR, "fixtures/packages/acme-status"),
    reactDir: join(REPO_DIR, "packages/react"),
    rulesFile: import.meta.filename,
    stylesDir: join(REPO_DIR, "packages/styles"),
    tools: toolVersions(),
  };
}

function inputFiles(prefix: string, dir: string, entries: string[]): ProjectFile[] {
  const files: ProjectFile[] = [];

  for (const entry of entries) {
    let paths: string[];

    try {
      paths = walkFiles(join(dir, entry), NOT_AN_INPUT).map((path) => `${entry}/${path}`);
    } catch {
      // A file, not a directory (or absent): read it by its own name.
      paths = [entry];
    }

    try {
      for (const file of readFiles(dir, paths)) {
        files.push({path: `${prefix}/${file.path}`, text: file.text});
      }
    } catch {
      // Absent: nothing to hash, and an addition changes the hash.
    }
  }

  return files;
}

/**
 * A SHA-256 over what the build is made FROM: the source files of both packages that feed it, the
 * Acme package, the staging rules (this file) and the versions of the build tools. Never over the
 * emitted `dist`: the declaration emit reorders members from one run to the next, so the same
 * library would carry several hashes.
 */
export function libraryInputHash(inputs: HashInputs = defaultHashInputs()): string {
  const files: ProjectFile[] = [
    ...inputFiles("react", inputs.reactDir, REACT_INPUTS),
    ...inputFiles("styles", inputs.stylesDir, STYLES_INPUTS),
    ...inputFiles("acme-status", inputs.acmeDir, ["."]),
    {path: "rules/stage", text: readFileSync(inputs.rulesFile, "utf8")},
    ...Object.entries(inputs.tools).map(([name, version]) => ({
      path: `tool/${name}`,
      text: version,
    })),
  ];

  return hashFiles(files);
}

async function run(
  argv: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
  timeoutMs = 600_000,
): Promise<string> {
  const result = await runCommand(argv, {cwd, env, timeoutMs});

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
  // One directory per pack, so packs that run at the same time never clear each other's files.
  const stage = join(evalsHome(), `stage-${process.pid}-${randomBytes(4).toString("hex")}`);
  const libraryHash = libraryInputHash();
  const reactSource = join(REPO_DIR, "packages/react");
  const stylesSource = join(REPO_DIR, "packages/styles");
  const tsdown = join(PACKAGE_DIR, "node_modules/.bin/tsdown");

  mkdirSync(join(stage, "react"), {recursive: true});
  mkdirSync(join(stage, "styles"), {recursive: true});
  mkdirSync(tarballsDir(), {recursive: true});

  try {
    return await buildAndPack({libraryHash, reactSource, stage, stylesSource, tsdown});
  } finally {
    rmSync(stage, {force: true, recursive: true});
  }
}

interface BuildPlan {
  libraryHash: string;
  reactSource: string;
  stage: string;
  stylesSource: string;
  tsdown: string;
}

async function buildAndPack(plan: BuildPlan): Promise<PackResult> {
  const {libraryHash, reactSource, stage, stylesSource, tsdown} = plan;

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

  const inventory = commentInventory(
    files.filter((file) => file.path.startsWith("react/") || file.path.startsWith("styles/")),
  );

  async function pack(directory: string): Promise<string> {
    // Into the stage first and then renamed into place: a pack that runs at the same time never
    // sees a half-written tarball, and identical inputs give identical files.
    const scratch = join(stage, "tarballs");

    mkdirSync(scratch, {recursive: true});

    const stdout = await run(
      ["npm", "pack", "--pack-destination", scratch],
      join(stage, directory),
      npmEnvironment(),
    );
    const name = stdout.trim().split("\n").at(-1) ?? "";

    renameSync(join(scratch, name), join(tarballsDir(), name));

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
