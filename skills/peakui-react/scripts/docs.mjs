#!/usr/bin/env node
/**
 * Reads PeakUI documentation from the documentation site.
 *
 *   node scripts/docs.mjs list                 every page: name and one-line description
 *   node scripts/docs.mjs modal dropdown       how to build with them: Usage and API Reference
 *   node scripts/docs.mjs modal --examples     the page's examples
 *   node scripts/docs.mjs modal --styling      class names, slots and CSS variables
 *   node scripts/docs.mjs modal --source       the component's source file, from the repository
 *   node scripts/docs.mjs modal --full         the whole page
 *
 * It only sends GET requests — to the documentation origin, and for --source to the repository's
 * raw file host — and writes nothing to disk.
 */
import {realpathSync} from "node:fs";
import {pathToFileURL} from "node:url";

import {
  DocsError,
  closestNames,
  fetchIndex,
  fetchText,
  installedVersion,
  pageUrl,
  resolveOrigin,
  resolvePage,
  sourceUrl,
  splitProjectFlag,
  versionLine,
} from "./lib.mjs";

const USAGE = `usage:
  node scripts/docs.mjs list [--json] [--project <dir>]
  node scripts/docs.mjs <name> [<name>…] [--examples | --styling | --source | --full] [--project <dir>]
`;

const LIBRARY = "@peakui/react";

/** What each mode prints of a component page. A whole page runs to 50 KB; no task needs all of it. */
const MODES = {
  "--examples": ["Examples"],
  "--styling": ["Customization", "Styling Reference"],
  default: ["Usage", "API Reference"],
};
const FLAGS = [
  "--json",
  "--full",
  "--source",
  ...Object.keys(MODES).filter((key) => key !== "default"),
];

const HINT =
  "[The rest of this page: --examples for worked examples, --styling for class names, slots and CSS variables, --full for everything. The component's source file: --source.]";

function fallback(installed) {
  if (installed === undefined) {
    return `${LIBRARY} is not installed in this project either, so there is nothing to read locally.
Install it — npm install @peakui/react @peakui/styles — or restore access to the documentation site.
`;
  }

  return `Without the documentation, read the installed package instead:
  types:        node_modules/@peakui/react/dist/
  class names:  node_modules/@peakui/styles/components/<name>.css
`;
}

function listText(index) {
  const section = (title, pages) => [
    "",
    title,
    ...pages.map((page) => `${page.name} — ${page.description}`),
  ];

  return [...section("Components", index.components), ...section("Guides", index.guides)].join(
    "\n",
  );
}

function unknownPage(index, name) {
  const closest = closestNames(index, name);
  const hint = closest.length > 0 ? ` Closest: ${closest.join(", ")}.` : "";

  return `Unknown page "${name}".${hint} Run "list" to see every page.\n`;
}

/**
 * The part of a page a mode asks for. A page that does not have the sections of a component page,
 * such as a guide, is returned whole: there is nothing to choose from.
 */
function select(markdown, wanted) {
  const closing = /\n?<\/page>\s*$/.exec(markdown)?.[0] ?? "";
  const body = closing ? markdown.slice(0, -closing.length) : markdown;
  const [header, ...sections] = body.split(/^(?=## )/m);
  const titled = sections.map((text) => ({text, title: text.slice(3, text.indexOf("\n")).trim()}));

  if (!titled.some((section) => MODES.default.includes(section.title))) return markdown;

  const chosen = titled.filter((section) => wanted.includes(section.title));
  const parts = [header, ...chosen.map((section) => section.text)].join("").trimEnd();
  const hint = wanted === MODES.default ? `\n\n${HINT}` : "";

  return `${parts}${hint}\n</page>\n`;
}

/** The sections the flags ask for; undefined means the whole page. */
function sectionsFor(flags) {
  if (flags.has("--full")) return undefined;

  const chosen = ["--examples", "--styling"]
    .filter((flag) => flags.has(flag))
    .flatMap((flag) => MODES[flag]);

  return chosen.length > 0 ? chosen : MODES.default;
}

async function printSource(page, io, installed) {
  const url = sourceUrl(page, io.env);

  if (!url) {
    io.stderr.write(`The page "${page.name}" has no source file: it is not a component.\n`);

    return false;
  }

  try {
    const source = await fetchText(url, {fetchImpl: io.fetchImpl});
    const against =
      installed === undefined
        ? `${LIBRARY} is not installed here`
        : `installed: ${LIBRARY} ${installed}`;

    io.stdout.write(
      `Source of ${page.name} from the main branch of the repository; it may be newer than the version in use (${against}).\n// ${page.links.source}\n\n${source}`,
    );

    return true;
  } catch (error) {
    if (!(error instanceof DocsError)) throw error;

    io.stderr.write(
      `The source of "${page.name}" could not be fetched: ${error.message} The repository may not be public; read the page instead.\n`,
    );

    return false;
  }
}

async function printPage(page, origin, wanted, io) {
  try {
    const markdown = await fetchText(pageUrl(origin, page), {fetchImpl: io.fetchImpl});

    io.stdout.write(`\n${wanted ? select(markdown, wanted) : markdown}`);

    return true;
  } catch (error) {
    if (!(error instanceof DocsError) || error.code !== "not-found") throw error;

    io.stderr.write(
      `The page "${page.name}" is listed but its markdown is missing: ${error.message}\n`,
    );

    return false;
  }
}

/** Runs the command and returns its exit code: 0 done, 1 wrong name or usage, 2 site unusable. */
export async function main(argv, io) {
  const {project, rest} = splitProjectFlag(argv, io.cwd);
  const flags = new Set(rest.filter((argument) => FLAGS.includes(argument)));
  const names = rest.filter((argument) => !FLAGS.includes(argument));
  const unknownFlag = names.find((name) => name.startsWith("--"));
  const installed = installedVersion(project, LIBRARY);

  if (names.length === 0 || unknownFlag || (names[0] === "list" && names.length > 1)) {
    io.stderr.write(unknownFlag ? `Unknown option ${unknownFlag}.\n${USAGE}` : USAGE);

    return 1;
  }

  try {
    const origin = resolveOrigin(io.env);
    const index = await fetchIndex(origin, {fetchImpl: io.fetchImpl});

    if (names[0] === "list" && flags.has("--json")) {
      io.stdout.write(`${JSON.stringify({...index, installed: installed ?? null}, null, 2)}\n`);

      return 0;
    }

    if (names[0] === "list") {
      io.stdout.write(`${versionLine(index.library.version, installed)}\n${listText(index)}\n`);

      return 0;
    }

    const sections = sectionsFor(flags);
    let failed = false;

    if (!flags.has("--source")) {
      io.stdout.write(`${versionLine(index.library.version, installed)}\n`);
    }

    for (const name of names) {
      const page = resolvePage(index, name);

      if (!page) {
        io.stderr.write(unknownPage(index, name));
        failed = true;
        continue;
      }

      const printed = flags.has("--source")
        ? await printSource(page, io, installed)
        : await printPage(page, origin, sections, io);

      failed ||= !printed;
    }

    return failed ? 1 : 0;
  } catch (error) {
    if (!(error instanceof DocsError)) throw error;

    io.stderr.write(`${error.message}\n\n${fallback(installed)}`);

    return 2;
  }
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
