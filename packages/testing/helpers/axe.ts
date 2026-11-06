import axe from "axe-core";

export interface AxeOptions {
  rules?: Record<string, {enabled: boolean}>;
}

/*
 * Contrast needs real layout and computed styles, which jsdom does not have: it stays in Playwright.
 * `region` asks for landmarks around the whole page, which a lone component never has.
 */
const DEFAULT_RULES: Record<string, {enabled: boolean}> = {
  "color-contrast": {enabled: false},
  region: {enabled: false},
};

export async function expectNoAxeViolations(
  container: Element,
  options: AxeOptions = {},
): Promise<void> {
  const results = await axe.run(container, {rules: {...DEFAULT_RULES, ...options.rules}});

  if (results.violations.length === 0) return;

  const lines = results.violations.map(
    (violation) => `- ${violation.id}: ${violation.help}\n    ${violation.nodes[0]?.html ?? ""}`,
  );

  throw new Error(`Found ${results.violations.length} axe violation(s):\n${lines.join("\n")}`);
}
