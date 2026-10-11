import {existsSync, readFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";

/** The public PeakUI documentation site. PEAKUI_DOCS_URL overrides it for mirrors and previews. */
export const DEFAULT_ORIGIN = "https://peakui.dev";

/** The version of this skill; the same string as `metadata.version` in SKILL.md. */
export const SKILL_VERSION = "0.9.0";

/** The newest shape of the documentation index these scripts understand. */
export const SUPPORTED_SCHEMA = 1;

/** Pages are static and cached, so 15 seconds only has to allow for a slow connection. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** One retry: a transient network failure usually clears on the second attempt. */
export const RETRIES = 1;

const ORIGIN_VARIABLE = "PEAKUI_DOCS_URL";
const LIBRARY = "@peakui/react";

/**
 * A failure these scripts can explain. `code` is "unreachable" (network, timeout, server error,
 * foreign redirect), "contract" (the site answered something this skill does not understand) or
 * "not-found" (the site has no such page).
 */
export class DocsError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DocsError";
    this.code = code;
  }
}

/** The documentation origin as a URL that always ends with a slash. */
export function resolveOrigin(env) {
  const configured = env[ORIGIN_VARIABLE];
  let origin;

  try {
    origin = new URL(configured || DEFAULT_ORIGIN);
  } catch {
    origin = undefined;
  }

  if (!origin || !["http:", "https:"].includes(origin.protocol)) {
    throw new DocsError(
      "contract",
      `${ORIGIN_VARIABLE} must be an absolute http or https URL. Received: ${JSON.stringify(configured)}.`,
    );
  }

  if (!origin.pathname.endsWith("/")) origin.pathname += "/";
  origin.search = "";
  origin.hash = "";

  return origin;
}

async function request(url, fetchImpl, timeoutMs) {
  let response;

  try {
    response = await fetchImpl(url, {
      headers: {"User-Agent": `peakui-react-skill/${SKILL_VERSION}`},
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const reason = error?.name === "TimeoutError" ? `no answer in ${timeoutMs} ms` : error.message;

    return {retry: true, why: `${url.href}: ${reason}`};
  }

  // The body is always read or discarded, so the connection is released either way.
  const body = await response.text().catch(() => "");

  if (response.status >= 300 && response.status < 400) {
    return {redirect: response.headers.get("location") ?? ""};
  }

  if (response.status === 404) {
    throw new DocsError("not-found", `${url.href} does not exist on the documentation site.`);
  }

  if (!response.ok) {
    return {retry: true, why: `${url.href} answered ${response.status}`};
  }

  return {body};
}

/** GETs `url` as text. Follows one redirect inside the same origin and no other. */
export async function fetchText(url, options = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  let target = url;
  let redirected = false;
  let why = "";

  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    const result = await request(target, fetchImpl, timeoutMs);

    if (result.body !== undefined) return result.body;

    if (result.redirect !== undefined) {
      const next = new URL(result.redirect, target);

      if (next.origin !== target.origin || redirected) {
        throw new DocsError(
          "unreachable",
          `${target.href} answered with a redirect to ${next.href}, which these scripts do not follow.`,
        );
      }

      target = next;
      redirected = true;
      attempt -= 1;
      continue;
    }

    why = result.why;
  }

  throw new DocsError("unreachable", `The documentation site could not be reached (${why}).`);
}

function isEntryList(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item?.name === "string" && typeof item?.markdownUrl === "string")
  );
}

/** The documentation index: the library it describes and every component and guide page. */
export async function fetchIndex(origin, options) {
  const url = new URL("api/components", origin);
  const text = await fetchText(url, options);
  let index;

  try {
    index = JSON.parse(text);
  } catch {
    throw new DocsError(
      "contract",
      `${url.href} did not answer with the documentation index. Check ${ORIGIN_VARIABLE} and any proxy in between.`,
    );
  }

  if (typeof index?.schemaVersion !== "number") {
    throw new DocsError("contract", `${url.href} answered JSON that is not a documentation index.`);
  }

  if (index.schemaVersion > SUPPORTED_SCHEMA) {
    throw new DocsError(
      "contract",
      `The documentation index is schemaVersion ${index.schemaVersion}, newer than this skill understands (${SUPPORTED_SCHEMA}). Update the skill.`,
    );
  }

  if (!isEntryList(index.components) || !isEntryList(index.guides)) {
    throw new DocsError("contract", `${url.href} answered an index with no page lists.`);
  }

  return {
    components: index.components,
    guides: index.guides,
    library: {name: index.library?.name ?? LIBRARY, version: index.library?.version ?? "unknown"},
  };
}

/** `TextField` and ` ButtonGroup ` become `text-field` and `button-group`. */
export function normalizeName(name) {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function pagesOf(index) {
  return [...index.components, ...index.guides];
}

/** The page called `name`; a component wins over a guide. */
export function resolvePage(index, name) {
  const wanted = normalizeName(name);

  return pagesOf(index).find((page) => page.name === wanted);
}

function distance(a, b) {
  let row = Array.from({length: b.length + 1}, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const next = [i];

    for (let j = 1; j <= b.length; j += 1) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }

    row = next;
  }

  return row[b.length];
}

/** `button-group` is compared as `button` and as `button-group`, so a family is suggested whole. */
function distanceToName(wanted, name) {
  const segments = name.split("-");
  const prefixes = segments.map((_, index) => segments.slice(0, index + 1).join("-"));

  return Math.min(...prefixes.map((prefix) => distance(wanted, prefix)));
}

/** Page names a mistyped `name` most likely meant, nearest first. */
export function closestNames(index, name, limit = 3) {
  const wanted = normalizeName(name);
  // A third of the length, between one and three edits: enough for a typo, not for another word.
  const tolerance = Math.min(3, Math.max(1, Math.floor(wanted.length / 3)));

  return pagesOf(index)
    .map((page) => ({name: page.name, score: distanceToName(wanted, page.name)}))
    .filter((candidate) => candidate.score <= tolerance)
    .sort((a, b) => a.score - b.score || (a.name < b.name ? -1 : 1))
    .slice(0, limit)
    .map((candidate) => candidate.name);
}

/**
 * Where to fetch a page. Only the path of `markdownUrl` is used: the origin inside it is the one
 * the site was built for, which may not be the one these scripts were pointed at.
 */
export function pageUrl(origin, entry) {
  return new URL(new URL(entry.markdownUrl).pathname.replace(/^\/+/, ""), origin);
}

/** Splits `--project <dir>` out of the arguments; without it the project is `cwd`. */
export function splitProjectFlag(argv, cwd) {
  const rest = [];
  let project = cwd;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--project" && argv[index + 1] !== undefined) {
      project = resolve(cwd, argv[index + 1]);
      index += 1;
    } else if (argument.startsWith("--project=")) {
      project = resolve(cwd, argument.slice("--project=".length));
    } else {
      rest.push(argument);
    }
  }

  return {project, rest};
}

/** The manifest of `packageName` as installed for `project`, searched upward like Node does. */
export function installedManifest(project, packageName) {
  let current = resolve(project);

  for (;;) {
    const manifest = join(current, "node_modules", packageName, "package.json");

    if (existsSync(manifest)) {
      try {
        return JSON.parse(readFileSync(manifest, "utf8"));
      } catch {
        return undefined;
      }
    }

    const parent = dirname(current);

    if (parent === current) return undefined;
    current = parent;
  }
}

/** The installed version of `packageName`, or undefined when it is not installed. */
export function installedVersion(project, packageName) {
  const version = installedManifest(project, packageName)?.version;

  return typeof version === "string" ? version : undefined;
}

/** The first line of every documentation output: which version it describes, which is installed. */
export function versionLine(docsVersion, installed) {
  const described = `Documentation for ${LIBRARY} ${docsVersion}`;

  if (installed === undefined) return `${described}. ${LIBRARY} is not installed in this project.`;
  if (installed === docsVersion) return `${described} (installed: ${installed}).`;

  return `${described}; installed: ${installed}. The documentation describes another version: check prop names against the types in node_modules/${LIBRARY} before relying on them.`;
}
