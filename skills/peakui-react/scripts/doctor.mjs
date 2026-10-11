#!/usr/bin/env node
/**
 * Describes the project PeakUI is being used in and reports setup mistakes that neither the
 * type-checker nor, often, the build will mention.
 *
 *   node scripts/doctor.mjs [--project <dir>]
 *
 * It reads files only: no network request, nothing written. Exit code 0 means no problem was
 * found, 1 means at least one was, 2 means the directory is not a project.
 */
import {existsSync, readFileSync, readdirSync, realpathSync} from "node:fs";
import {join, relative, sep} from "node:path";
import {pathToFileURL} from "node:url";

import {installedDirectory, installedManifest, installedVersion, splitProjectFlag} from "./lib.mjs";

const REACT = "@peakui/react";
const STYLES = "@peakui/styles";

/** The oldest major versions PeakUI works with. */
const FLOORS = {react: 19, tailwindcss: 4};

/** Dependencies, build output and version control: nothing a project's own setup lives in. */
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", "build", "out"]);

const SCRIPT_FILE = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const CSS_IMPORT = /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)/g;
const STYLE_IMPORT_IN_SCRIPT =
  /^\s*import\s+["']@peakui\/styles(?:\/css)?["']|(?:require|import)\(\s*["']@peakui\/styles\/css["']\s*\)/;

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}

function walk(root, directory = root, found = []) {
  const entries = readdirSync(directory, {withFileTypes: true}).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  );

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name) && !entry.name.startsWith(".")) {
        walk(root, path, found);
      }
    } else if (entry.isFile() && (entry.name.endsWith(".css") || SCRIPT_FILE.test(entry.name))) {
      found.push(relative(root, path).split(sep).join("/"));
    }
  }

  return found;
}

/** Blanks out comments while keeping every line break, so line numbers stay true. */
function withoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
}

function cssImports(css) {
  const text = withoutComments(css);

  return [...text.matchAll(CSS_IMPORT)].map((match) => ({
    line: text.slice(0, match.index).split("\n").length,
    specifier: match[1],
  }));
}

function isPeakuiStylesheet(specifier) {
  return specifier === STYLES || specifier === `${STYLES}/css`;
}

function major(version) {
  return Number.parseInt(version, 10);
}

function frameworkOf(manifest) {
  const dependencies = {...manifest.dependencies, ...manifest.devDependencies};

  if ("next" in dependencies) return "next";
  if ("vite" in dependencies) return "vite";

  return "unknown";
}

function packageFindings(project) {
  const findings = [];
  // A peer to the directories of the packages that ask for it.
  const peers = new Map();

  for (const name of [REACT, STYLES]) {
    const directory = installedDirectory(project, name);
    const manifest = installedManifest(project, name);

    if (!directory || !manifest) {
      findings.push({
        fix: `Install it: npm install ${name}`,
        id: "missing-package",
        what: `${name} is not installed.`,
      });
      continue;
    }

    for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
      peers.set(peer, [...(peers.get(peer) ?? []), directory]);
    }
  }

  for (const [peer, askedFrom] of [...peers].sort(([a], [b]) => (a < b ? -1 : 1))) {
    // Resolved as the package itself would resolve it, then as the project would.
    const found = [...askedFrom, project].some((from) => installedManifest(from, peer));

    if (!found) {
      findings.push({
        fix: `Install it: npm install ${peer}`,
        id: "missing-peer",
        what: `${peer}, which PeakUI needs beside it, is not installed.`,
      });
    }
  }

  for (const [name, floor] of Object.entries(FLOORS)) {
    const version = installedVersion(project, name);

    if (version !== undefined && major(version) < floor) {
      findings.push({
        fix: `Upgrade it: npm install ${name}@latest`,
        id: "version-too-old",
        what: `${name} ${version} is installed; PeakUI needs ${name} ${floor} or later.`,
      });
    }
  }

  return findings;
}

function stylesheetFindings(project, files, context) {
  const findings = [];
  let tailwindOnly;

  for (const path of files.filter((file) => file.endsWith(".css"))) {
    const imports = cssImports(readFileSync(join(project, path), "utf8"));
    const peakui = imports.find((entry) => isPeakuiStylesheet(entry.specifier));
    const tailwind = imports.find((entry) => entry.specifier === "tailwindcss");

    if (!peakui) {
      if (tailwind) tailwindOnly ??= path;
      continue;
    }

    context.cssEntry ??= path;

    if (tailwind && tailwind.line > peakui.line) {
      findings.push({
        fix: `Move @import "tailwindcss"; above @import "${peakui.specifier}";. In the other order Tailwind's reset overrides the component styles, and nothing reports it.`,
        id: "css-import-order",
        what: "The PeakUI stylesheet is imported before Tailwind CSS.",
        where: `${path}:${peakui.line}`,
      });
    }
  }

  if (context.cssEntry === undefined && installedManifest(project, STYLES)) {
    findings.push({
      fix: `In the app's CSS entry file add @import "${STYLES}/css"; on the line after @import "tailwindcss";`,
      id: "styles-not-imported",
      what: "No CSS file imports the PeakUI stylesheet, so components render unstyled.",
      ...(tailwindOnly === undefined ? {} : {where: tailwindOnly}),
    });
  }

  return findings;
}

function scriptFindings(project, files) {
  const findings = [];

  for (const path of files.filter((file) => SCRIPT_FILE.test(file))) {
    const lines = readFileSync(join(project, path), "utf8").split("\n");
    const index = lines.findIndex((line) => STYLE_IMPORT_IN_SCRIPT.test(line));

    if (index !== -1) {
      findings.push({
        fix: `Remove this import and import the stylesheet from the CSS entry file instead, after @import "tailwindcss";`,
        id: "styles-imported-from-script",
        what: "The PeakUI stylesheet is imported from a script; it must go through Tailwind CSS in a CSS file.",
        where: `${path}:${index + 1}`,
      });
    }
  }

  return findings;
}

/** The project's context and every setup problem found in it. */
export function inspect(project) {
  const manifest = readJson(join(project, "package.json"));

  if (!existsSync(join(project, "package.json")) || !manifest) {
    return {
      context: {framework: "unknown"},
      findings: [
        {
          fix: "Run this from the root of the app, or pass --project <dir>.",
          id: "not-a-project",
          what: `${project} has no readable package.json.`,
        },
      ],
    };
  }

  const context = {
    cssEntry: undefined,
    framework: frameworkOf(manifest),
    peakuiReact: installedVersion(project, REACT),
    peakuiStyles: installedVersion(project, STYLES),
    react: installedVersion(project, "react"),
    tailwind: installedVersion(project, "tailwindcss"),
  };
  const files = walk(project);
  const findings = [
    ...packageFindings(project),
    ...stylesheetFindings(project, files, context),
    ...scriptFindings(project, files),
  ];

  return {context, findings};
}

function report({context, findings}) {
  const rows = [
    [REACT, context.peakuiReact ?? "not installed"],
    [STYLES, context.peakuiStyles ?? "not installed"],
    ["react", context.react ?? "not installed"],
    ["tailwindcss", context.tailwind ?? "not installed"],
    ["framework", context.framework],
    ["CSS entry", context.cssEntry ?? "none found"],
  ];
  const lines = [
    "PeakUI project check",
    ...rows.map(([label, value]) => `  ${label.padEnd(16)}${value}`),
    "",
  ];

  if (findings.length === 0) return [...lines, "No problems found.", ""].join("\n");

  lines.push(findings.length === 1 ? "1 problem found." : `${findings.length} problems found.`);

  for (const finding of findings) {
    lines.push(
      "",
      `what:  ${finding.what}`,
      `where: ${finding.where ?? "the project"}`,
      `fix:   ${finding.fix}`,
    );
  }

  return [...lines, ""].join("\n");
}

/** Runs the check and returns its exit code. */
export async function main(argv, io) {
  const {project} = splitProjectFlag(argv, io.cwd);
  const result = inspect(project);

  if (result.findings.some((finding) => finding.id === "not-a-project")) {
    io.stderr.write(`${result.findings[0].what} ${result.findings[0].fix}\n`);

    return 2;
  }

  io.stdout.write(report(result));

  return result.findings.length > 0 ? 1 : 0;
}

function isRunDirectly() {
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isRunDirectly()) {
  process.exitCode = await main(process.argv.slice(2), {
    cwd: process.cwd(),
    env: process.env,
    stderr: process.stderr,
    stdout: process.stdout,
  });
}
