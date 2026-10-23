/*
 * The handbook's colour and motion pages name tokens by hand. The theme they name is generated
 * (`pnpm tokens:build`), so a rename lands in the CSS and leaves the page behind — a plate filled
 * from a token that no longer exists renders transparent and says nothing. These tests fail
 * instead.
 */
import {readFileSync} from "node:fs";
import {expect, it} from "vitest";

const HANDBOOK = "content/docs/en/react/getting-started/(handbook)";
const VARIABLES = "../../packages/styles/themes/default/variables.css";
const SHARED_THEME = "../../packages/styles/themes/shared/theme.css";

function declaredTokens(path: string): Set<string> {
  return new Set(
    [...readFileSync(path, "utf8").matchAll(/^\s*(--[a-z0-9-]+):/gm)].map(([, name]) => name),
  );
}

it("names only colour tokens the default theme declares", () => {
  const declared = declaredTokens(VARIABLES);
  const page = readFileSync(`${HANDBOOK}/colors.mdx`, "utf8");
  const named = [...page.matchAll(/(?:name|foreground): "([a-z0-9-]+)"/g)].map(
    ([, name]) => `--${name}`,
  );

  expect(named.length).toBeGreaterThan(30);
  expect(named.filter((token) => !declared.has(token))).toEqual([]);
});

it("fills no plate with a colour value", () => {
  const page = readFileSync(`${HANDBOOK}/colors.mdx`, "utf8");

  expect(page).not.toMatch(/oklch\([\d.]/);
  expect(page).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
});

/*
 * Theming keeps a Colors heading, because a reader scanning its contents for colour should find
 * the way on. What it may not keep is a second table of the roles: that is the copy that drifts.
 */
it("tables the colour roles on one page only", () => {
  const theming = readFileSync(`${HANDBOOK}/theming.mdx`, "utf8");
  const roleRows = theming
    .split("\n")
    .filter((line) => line.startsWith("|") && /--(accent|surface|muted|danger|overlay)\b/.test(line));

  expect(roleRows).toEqual([]);
  expect(theming).toContain("(./colors)");
  expect(readFileSync(`${HANDBOOK}/colors.mdx`, "utf8")).toMatch(/^## Accent$/m);
});
