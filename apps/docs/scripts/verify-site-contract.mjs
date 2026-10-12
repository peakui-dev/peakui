/*
 * Contract smoke for the docs site. Re-checks the client-facing promises of
 * docs/ecosystem/docs-site-contract.md (in peakui-company) against any host — localhost or
 * https://peakui.dev. Run by hand and, blocking, by the Docs deploy workflow after every
 * deploy. The check matrix and the assertions are pure so they can be unit-tested; only
 * main() talks HTTP.
 */

export const NOINDEX = "noindex, nofollow";
export const MACHINE_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

export function buildChecks(page) {
  const unprefixed = page.replace(/^\/en/, "");

  return [
    {accept: "text/html", contentType: "text/html", name: "root serves HTML", path: "/", status: 200},
    {accept: "text/markdown", contentType: "text/markdown", name: "root negotiates markdown", path: "/", status: 200, vary: true},
    {accept: "text/html", contentType: "text/html", name: "page serves HTML", path: page, status: 200},
    {accept: "text/markdown", contentType: "text/markdown", name: "page negotiates markdown", path: page, status: 200, vary: true},
    {contentType: "text/markdown", name: "page .md", path: `${page}.md`, status: 200},
    {contentType: "text/markdown", name: "page .mdx alias", path: `${page}.mdx`, status: 200},
    {contentType: "text/markdown", name: "unprefixed .md serves directly", path: `${unprefixed}.md`, redirect: "manual", status: 200},
    {contentType: "text/markdown", emptyBody: true, method: "HEAD", name: "HEAD .md matches GET", path: `${page}.md`, status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms.txt", noindex: true, path: "/llms.txt", status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms-components.txt", noindex: true, path: "/llms-components.txt", status: 200},
    {contentType: "text/plain", charset: "utf-8", machineCache: true, name: "machine route /llms-patterns.txt", noindex: true, path: "/llms-patterns.txt", status: 200},
    {contentType: "application/json", json: true, name: "/api/components", path: "/api/components", status: 200},
    {location: "/en/nope", name: "unprefixed route redirects to /en", path: "/nope", redirect: "manual", status: 307},
    {contentType: "text/html", name: "prefixed 404 is HTML", path: "/en/nope", status: 404},
    {accept: "text/markdown", bodyIncludes: "# Not Found", contentType: "text/markdown", machineCache: true, name: "markdown 404 body", path: "/nope", status: 404, vary: true},
    {emptyBody: true, name: "unknown .md is an empty 404", noContentType: true, noindex: true, path: `${page}-nope.md`, status: 404},
    {location: `/en${unprefixed}-nope`, name: "unknown /docs path redirects 308", path: `${unprefixed}-nope`, redirect: "manual", status: 308},
  ];
}

export function evaluate(check, res) {
  const problems = [];

  if (res.status !== check.status) {
    problems.push(`status is ${res.status}, expected ${check.status}`);
  }

  if (check.contentType && !(res.contentType ?? "").startsWith(check.contentType)) {
    problems.push(`content type is ${res.contentType}, expected ${check.contentType}*`);
  }

  if (check.charset && !(res.contentType ?? "").includes(`charset=${check.charset}`)) {
    problems.push(`content type is missing charset=${check.charset}`);
  }

  if (check.location && res.location !== check.location) {
    problems.push(`Location is ${res.location}, expected ${check.location}`);
  }

  if (check.noindex && res.header("x-robots-tag") !== NOINDEX) {
    problems.push(`X-Robots-Tag is ${res.header("x-robots-tag")}, expected ${NOINDEX}`);
  }

  if (check.machineCache && res.header("cache-control") !== MACHINE_CACHE) {
    problems.push(`Cache-Control is ${res.header("cache-control")}, expected ${MACHINE_CACHE}`);
  }

  if (check.vary && !(res.header("vary") ?? "").includes("Accept")) {
    problems.push("Vary does not include Accept");
  }

  if (check.bodyIncludes && !res.body.includes(check.bodyIncludes)) {
    problems.push(`body does not include ${JSON.stringify(check.bodyIncludes)}`);
  }

  if (check.emptyBody && res.body !== "") {
    problems.push("body is not empty");
  }

  if (check.noContentType && res.contentType !== null) {
    problems.push("Content-Type is present");
  }

  if (check.json) {
    try {
      JSON.parse(res.body);
    } catch {
      problems.push("body is not valid JSON");
    }
  }

  return problems;
}

async function runCheck(base, check) {
  const response = await fetch(`${base}${check.path}`, {
    headers: check.accept ? {Accept: check.accept} : undefined,
    method: check.method ?? "GET",
    redirect: check.redirect === "manual" ? "manual" : "follow",
  });

  return evaluate(check, {
    body: check.method === "HEAD" ? "" : await response.text(),
    contentType: response.headers.get("content-type"),
    header: (name) => response.headers.get(name),
    location: response.headers.get("location"),
    status: response.status,
  });
}

async function main() {
  const [base, page = "/en/docs/react/components/button"] = process.argv.slice(2);

  if (!base) {
    console.error("usage: verify-site-contract.mjs <baseUrl> [page]");

    process.exit(2);
  }

  let failed = 0;

  for (const check of buildChecks(page)) {
    const problems = await runCheck(base.replace(/\/$/, ""), check);

    if (problems.length === 0) {
      console.log(`ok    ${check.name}`);
    } else {
      failed += 1;
      console.error(`FAIL  ${check.name} (${check.path})`);
      console.error(`      ${problems.join("; ")}`);
    }
  }

  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith("verify-site-contract.mjs")) {
  await main();
}
