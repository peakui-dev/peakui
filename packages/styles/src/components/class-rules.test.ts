import {existsSync, readFileSync, readdirSync} from "node:fs";

import {describe, expect, it} from "vitest";

/*
 * Gate: a class name a component's variants emit must have a selector in the component's CSS.
 * components/index.test.ts only proves the CSS file exists, and the scaffold writes a placeholder
 * file, so a component whose stylesheet was never ported passes it while every class it renders
 * does nothing. Found in review of the Typography branch, where that is exactly what shipped.
 *
 * Only classes that start with the component's own name are checked: those are its BEM block,
 * elements and modifiers. A class that names another block or a utility is the consumer's.
 *
 * Scope: the components of wave 3.1. Older components carry marker classes that are emitted for
 * the consumer to target and deliberately have no rule (checkbox-group--primary, kbd--default,
 * list-box--danger and others), so widening this to every component needs an allowlist of those
 * first; the list below grows as components are brought under the gate.
 */
const GATED = ["badge", "meter", "progress-circle", "typography"];
const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, "");

const componentDirs = readdirSync("src/components", {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => GATED.includes(name))
  .filter((name) => existsSync(`src/components/${name}/${name}.styles.ts`))
  .sort();

const classesOf = (name: string): string[] => {
  const source = stripComments(readFileSync(`src/components/${name}/${name}.styles.ts`, "utf8"));
  const literals = [...source.matchAll(/"([^"\n]+)"/g)].flatMap((match) => match[1].split(/\s+/));

  return [...new Set(literals.filter((literal) => literal.startsWith(name)))].sort();
};

const hasRule = (css: string, className: string): boolean =>
  new RegExp(String.raw`\.${className}(?![\w-])`).test(css);

describe("class rules", () => {
  it("is not vacuous", () => {
    expect(componentDirs.length).toBeGreaterThan(0);
    expect(classesOf(componentDirs[0] ?? "").length).toBeGreaterThan(0);
  });

  it.each(componentDirs)("%s has a rule for every class its variants emit", (name) => {
    const css = stripComments(readFileSync(`components/${name}.css`, "utf8"));
    const missing = classesOf(name).filter((className) => !hasRule(css, className));

    expect(missing).toEqual([]);
  });
});
