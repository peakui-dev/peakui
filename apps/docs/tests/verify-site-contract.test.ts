import {expect, test} from "vitest";

import {MACHINE_CACHE, NOINDEX, buildChecks, evaluate} from "../scripts/verify-site-contract.mjs";

function response(overrides: Partial<Parameters<typeof evaluate>[1]> = {}) {
  return {
    body: "# Button",
    contentType: "text/markdown; charset=utf-8",
    header: (name: string) =>
      ({vary: "Accept", "x-robots-tag": NOINDEX, "cache-control": MACHINE_CACHE})[
        name.toLowerCase()
      ] ?? null,
    location: null,
    status: 200,
    ...overrides,
  };
}

test("buildChecks covers every contract surface", () => {
  const checks = buildChecks("/en/docs/react/components/button");
  const names = checks.map((check) => check.name);

  expect(checks).toHaveLength(17);
  expect(names).toContain("root serves HTML");
  expect(names).toContain("root negotiates markdown");
  expect(names).toContain("page .mdx alias");
  expect(names).toContain("unprefixed .md serves directly");
  expect(names).toContain("HEAD .md matches GET");
  expect(names).toContain("machine route /llms-patterns.txt");
  expect(names).toContain("/api/components");
  expect(names).toContain("unprefixed route redirects to /en");
  expect(names).toContain("markdown 404 body");
  expect(names).toContain("unknown .md is an empty 404");
  expect(names).toContain("unknown /docs path redirects 308");
});

test("evaluate returns no problems for a compliant response", () => {
  const check = buildChecks("/en/docs/react/components/button").find(
    (candidate) => candidate.name === "page negotiates markdown",
  )!;

  expect(evaluate(check, response())).toEqual([]);
});

test("evaluate flags wrong status, content type and missing headers", () => {
  const check = {
    accept: "text/markdown",
    contentType: "text/markdown",
    machineCache: true,
    name: "any",
    noindex: true,
    path: "/x",
    status: 200,
    vary: true,
  };

  const problems = evaluate(check, {
    body: "",
    contentType: "text/html",
    header: () => null,
    location: null,
    status: 404,
  });

  expect(problems.join("\n")).toMatch(/status/);
  expect(problems.join("\n")).toMatch(/content type/);
  expect(problems.join("\n")).toMatch(/X-Robots-Tag/);
  expect(problems.join("\n")).toMatch(/Cache-Control/);
  expect(problems.join("\n")).toMatch(/Vary/);
});

test("evaluate flags a non-empty body where the contract demands an empty one", () => {
  const check = {
    emptyBody: true,
    name: "empty",
    noContentType: true,
    path: "/nope.md",
    status: 404,
  };

  expect(
    evaluate(check, {...response(), body: "x", contentType: "text/plain", status: 404}),
  ).toEqual(["body is not empty", "Content-Type is present"]);
});

test("evaluate flags a redirect that went to the wrong place and bad JSON", () => {
  const redirect = evaluate(
    {location: "/en/nope", name: "r", path: "/nope", redirect: "manual", status: 307},
    {...response(), location: "/somewhere-else", status: 307},
  );
  const json = evaluate(
    {json: true, name: "j", path: "/api/components", status: 200},
    {...response(), body: "not json", contentType: "application/json"},
  );

  expect(redirect).toEqual(["Location is /somewhere-else, expected /en/nope"]);
  expect(json.join("\n")).toMatch(/valid JSON/);
});
