import type {ProjectFile} from "./types.ts";

import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {
  constants,
  cpSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  rmSync,
} from "node:fs";
import {join} from "node:path";

function isIgnored(name: string, ignore: readonly string[]): boolean {
  return ignore.some((entry) =>
    entry.startsWith("*") ? name.endsWith(entry.slice(1)) : name === entry,
  );
}

export function walkFiles(dir: string, ignore: readonly string[] = []): string[] {
  const found: string[] = [];

  function visit(relative: string) {
    const entries = readdirSync(join(dir, relative), {withFileTypes: true});

    for (const entry of entries) {
      if (isIgnored(entry.name, ignore)) continue;

      const path = relative ? `${relative}/${entry.name}` : entry.name;

      // `entry` comes from lstat semantics: a link to a directory is not a directory here, and is
      // recorded as an entry instead of being walked into.
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() || entry.isSymbolicLink()) found.push(path);
    }
  }

  visit("");

  return found.sort();
}

/**
 * The bytes that stand for an entry: the content of a regular file, or the target string of a
 * symlink. A link is never followed, so a dangling link, a link to a directory and a link to a file
 * outside the directory are all safe to read.
 */
export function readEntry(dir: string, path: string): Buffer {
  const full = join(dir, path);

  return lstatSync(full).isSymbolicLink()
    ? Buffer.from(readlinkSync(full), "utf8")
    : readFileSync(full);
}

export function readFiles(dir: string, paths: string[]): ProjectFile[] {
  return paths.map((path) => ({path, text: readEntry(dir, path).toString("utf8")}));
}

export function hashFiles(files: ProjectFile[]): string {
  const hash = createHash("sha256");

  for (const file of [...files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    hash.update(`${file.path}\0${file.text}\0`);
  }

  return hash.digest("hex");
}

/**
 * Copies `from` to a path that does not exist yet, as a copy-on-write clone where the platform
 * supports it (`cp -c` on macOS, `cp --reflink=auto` on Linux) and as a plain copy otherwise.
 * Symlinks inside the tree stay symlinks; nothing is ever linked back to `from`. A failed attempt
 * leaves nothing behind at `to`.
 */
export function cloneDir(from: string, to: string): void {
  const flags =
    process.platform === "darwin"
      ? ["-cR"]
      : process.platform === "linux"
        ? ["-R", "--reflink=auto"]
        : [];

  if (flags.length > 0) {
    const result = spawnSync("cp", [...flags, from, to], {stdio: "ignore"});

    if (result.status === 0) return;
    rmSync(to, {force: true, recursive: true});
  }

  mkdirSync(to, {recursive: true});
  copyDir(from, to);
}

export function copyDir(from: string, to: string): void {
  cpSync(from, to, {mode: constants.COPYFILE_FICLONE, recursive: true, verbatimSymlinks: true});
}

export interface RedactRoots {
  workspace?: string;
  evalsHome: string;
  home: string;
}

export function redact(text: string, roots: RedactRoots): string {
  const replacements: [string, string][] = [];

  function add(root: string | undefined, label: string) {
    if (!root) return;
    replacements.push([root, label]);
    try {
      const real = realpathSync(root);

      if (real !== root) replacements.push([real, label]);
    } catch {
      // The directory may not exist any more; the literal form is still replaced.
    }
  }

  add(roots.workspace, "<workspace>");
  add(roots.evalsHome, "<evals-home>");
  add(roots.home, "~");

  // Longest root first, so a workspace inside the harness home is replaced as a workspace.
  replacements.sort((a, b) => b[0].length - a[0].length);

  let out = text;

  for (const [root, label] of replacements) out = out.split(root).join(label);

  return out;
}
