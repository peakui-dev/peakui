import {describe, expect, it} from "vitest";

import {
  classTokens,
  countOf,
  labelLinked,
  parseHtml,
  textOf,
  withText,
} from "../src/scoring/dom.ts";

const HTML = `
<form>
  <div data-slot="textfield" data-required="true">
    <label data-slot="label" id="l1" for="i1">Email</label>
    <input data-slot="input" id="i1" type="email" class="input input--secondary">
  </div>
  <div data-slot="textfield">
    <label data-slot="label" for="nope">Broken</label>
    <input data-slot="input" id="i2">
  </div>
  <button data-slot="button" class="button button--md  button--danger">Delete   account</button>
  <button data-slot="button" class="button button button--lg">Plan: <!-- -->Team</button>
</form>`;

describe("dom helpers", () => {
  const document = parseHtml(HTML);
  const fields = [...document.querySelectorAll('[data-slot="textfield"]')];

  it("classTokens splits on any whitespace", () => {
    expect(classTokens(document.querySelector("button")!)).toEqual([
      "button",
      "button--md",
      "button--danger",
    ]);
  });

  it("textOf collapses whitespace and ignores comments", () => {
    expect(textOf(document.querySelectorAll("button")[0]!)).toBe("Delete account");
    expect(textOf(document.querySelectorAll("button")[1]!)).toBe("Plan: Team");
  });

  it("withText finds by exact collapsed text", () => {
    expect(withText(document, "button", "Delete account")?.className).toContain("button--danger");
    expect(withText(document, "button", "Delete")).toBeUndefined();
  });

  it("labelLinked checks the for/id pair inside the field", () => {
    expect(labelLinked(fields[0]!)).toBe(true);
    expect(labelLinked(fields[1]!)).toBe(false);
  });

  it("countOf counts duplicates", () => {
    expect(countOf(classTokens(document.querySelectorAll("button")[1]!), "button")).toBe(2);
  });
});
