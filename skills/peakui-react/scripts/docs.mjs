#!/usr/bin/env node
/**
 * Reads PeakUI documentation from the documentation site.
 *
 *   node scripts/docs.mjs list                  every page: name and one-line description
 *   node scripts/docs.mjs button text-field     those pages, as markdown
 *
 * It only sends GET requests to the documentation origin and writes nothing to disk.
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
  splitProjectFlag,
  versionLine,
} from "./lib.mjs";

const USAGE = `usage:
  node scripts/docs.mjs list [--json] [--project <dir>]
  node scripts/docs.mjs <name> [<name>…] [--project <dir>]
`;

const FALLBACK = `Without the documentation, read the installed package instead:
  types:        node_modules/@peakui/react/dist/
  class names:  node_modules/@peakui/styles/components/<name>.css
`;

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

async function printPages(names, index, origin, io) {
  let failed = false;

  for (const name of names) {
    const page = resolvePage(index, name);

    if (!page) {
      io.stderr.write(unknownPage(index, name));
      failed = true;
      continue;
    }

    try {
      const markdown = await fetchText(pageUrl(origin, page), {fetchImpl: io.fetchImpl});

      io.stdout.write(`\n${markdown}`);
    } catch (error) {
      if (!(error instanceof DocsError) || error.code !== "not-found") throw error;

      io.stderr.write(
        `The page "${page.name}" is listed but its markdown is missing: ${error.message}\n`,
      );
      failed = true;
    }
  }

  return failed;
}

/** Runs the command and returns its exit code: 0 done, 1 wrong name or usage, 2 site unusable. */
export async function main(argv, io) {
  const {project, rest} = splitProjectFlag(argv, io.cwd);
  const json = rest.includes("--json");
  const names = rest.filter((argument) => argument !== "--json");

  if (names.length === 0 || (names[0] === "list" && names.length > 1)) {
    io.stderr.write(USAGE);

    return 1;
  }

  try {
    const origin = resolveOrigin(io.env);
    const index = await fetchIndex(origin, {fetchImpl: io.fetchImpl});
    const installed = installedVersion(project, index.library.name);

    if (names[0] === "list" && json) {
      io.stdout.write(`${JSON.stringify({...index, installed: installed ?? null}, null, 2)}\n`);

      return 0;
    }

    io.stdout.write(`${versionLine(index.library.version, installed)}\n`);

    if (names[0] === "list") {
      io.stdout.write(`${listText(index)}\n`);

      return 0;
    }

    return (await printPages(names, index, origin, io)) ? 1 : 0;
  } catch (error) {
    if (!(error instanceof DocsError)) throw error;

    io.stderr.write(`${error.message}\n\n${FALLBACK}`);

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
