import {isHydrationError} from "../helpers/ssr.ts";

/*
 * Строки взяты из установленного react-dom 19.3, не из памяти:
 * node_modules/.../react-dom/cjs/react-dom-client.development.js, строки 5550 и 5749.
 *
 * Третья — та, из-за которой тест существует. React про неё говорит «This won't be patched up»:
 * серверный атрибут остаётся в живом DOM навсегда. В ней нет слова «Hydration» (только
 * «hydrated») и написано «didn't match», а не «did not match», поэтому первая версия
 * детектора её пропускала, и ssrSmoke сообщал об успехе.
 */

const HTML_MISMATCH =
  "Hydration failed because the server rendered HTML didn't match the client. As a result this tree will be regenerated on the client.";
const TEXT_MISMATCH = "Hydration failed because the server rendered text didn't match the client.";
const ATTRIBUTE_MISMATCH =
  "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up.";
const MINIFIED =
  "Minified React error #418; visit https://react.dev/errors/418 for the full message";

describe("isHydrationError", () => {
  it.each([
    ["HTML mismatch", HTML_MISMATCH],
    ["text mismatch", TEXT_MISMATCH],
    ["attribute-only mismatch", ATTRIBUTE_MISMATCH],
    ["minified production error", MINIFIED],
  ])("detects a %s", (_name, message) => {
    expect(isHydrationError(message)).toBe(true);
  });

  it.each([
    ["an unrelated warning", "Warning: Each child in a list should have a unique key prop."],
    ["an act warning", "An update to Button inside a test was not wrapped in act(...)"],
    ["empty output", ""],
  ])("ignores %s", (_name, message) => {
    expect(isHydrationError(message)).toBe(false);
  });
});
