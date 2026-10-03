import {JSDOM} from "jsdom";

export function parseHtml(html: string): Document {
  return new JSDOM(html).window.document;
}

export function classTokens(element: Element): string[] {
  return (element.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

export function textOf(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function withText(
  scope: Document | Element,
  selector: string,
  text: string,
): Element | undefined {
  return [...scope.querySelectorAll(selector)].find((element) => textOf(element) === text);
}

/** The field has a label whose `for` equals the `id` of an input or textarea inside the field. */
export function labelLinked(field: Element): boolean {
  const controls = new Set(
    [...field.querySelectorAll("input, textarea")].map((control) => control.id).filter(Boolean),
  );

  return [...field.querySelectorAll('label[data-slot="label"]')].some((label) => {
    const target = label.getAttribute("for");

    return target !== null && controls.has(target);
  });
}

export function countOf(tokens: string[], token: string): number {
  return tokens.filter((candidate) => candidate === token).length;
}
