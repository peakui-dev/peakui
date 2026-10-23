/*
 * The handbook's colour and motion pages name tokens by hand. The theme they name is generated
 * (`pnpm tokens:build`), so a rename lands in the CSS and leaves the page behind — a plate filled
 * from a token that no longer exists renders transparent and says nothing. These tests fail
 * instead.
 */
import {readFileSync, readdirSync} from "node:fs";

import {expect, it} from "vitest";

const HANDBOOK = "content/docs/en/react/getting-started/(handbook)";
const HANDBOOK_PAGES = readdirSync(HANDBOOK).filter((name) => name.endsWith(".mdx"));
const VARIABLES = "../../packages/styles/themes/default/variables.css";
const SHARED_THEME = "../../packages/styles/themes/shared/theme.css";

function declaredTokens(path: string): Set<string> {
  return new Set(captures(readFileSync(path, "utf8"), /^\s*(--[a-z0-9-]+):/gm));
}

/** First capture group of every match, with the undefined case dropped rather than asserted away. */
function captures(source: string, pattern: RegExp): string[] {
  return [...source.matchAll(pattern)].flatMap(([, group]) => (group ? [group] : []));
}

it("names only colour tokens the default theme declares", () => {
  const declared = declaredTokens(VARIABLES);
  const page = readFileSync(`${HANDBOOK}/colors.mdx`, "utf8");
  const named = captures(page, /(?:name|foreground): "([a-z0-9-]+)"/g).map((name) => `--${name}`);

  expect(named.length).toBeGreaterThan(30);
  expect(named.filter((token) => !declared.has(token))).toEqual([]);
});

it("fills no plate with a colour value", () => {
  const page = readFileSync(`${HANDBOOK}/colors.mdx`, "utf8");

  expect(page).not.toMatch(/oklch\([\d.]/);
  expect(page).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
});

it("gives every handbook page a title and a description", () => {
  for (const page of HANDBOOK_PAGES) {
    const source = readFileSync(`${HANDBOOK}/${page}`, "utf8");

    expect(source, page).toMatch(/^title: \S/m);
    expect(source, page).toMatch(/^description: \S/m);
  }
});

it("names only motion tokens the shared theme declares", () => {
  const declared = declaredTokens(SHARED_THEME);
  const page = readFileSync(`${HANDBOOK}/animation.mdx`, "utf8");
  const named = captures(page, /`(--(?:ease|animate)-[a-z-]+)`/g);

  expect(named.length).toBeGreaterThan(8);
  expect(named.filter((token) => !declared.has(token))).toEqual([]);
});

/*
 * Theming keeps a Colors heading, because a reader scanning its contents for colour should find
 * the way on. What it may not keep is a second table of the roles: that is the copy that drifts.
 */
it("tables the colour roles on one page only", () => {
  const theming = readFileSync(`${HANDBOOK}/theming.mdx`, "utf8");
  const roleRows = theming
    .split("\n")
    .filter(
      (line) => line.startsWith("|") && /--(accent|surface|muted|danger|overlay)\b/.test(line),
    );

  expect(roleRows).toEqual([]);
  expect(theming).toContain("(./colors)");
  expect(readFileSync(`${HANDBOOK}/colors.mdx`, "utf8")).toMatch(/^## Accent$/m);
});
