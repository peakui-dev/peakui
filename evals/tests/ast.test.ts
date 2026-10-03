import {describe, expect, it} from "vitest";

import {isPeakui, parseSource, peakuiElements} from "../src/scoring/ast.ts";

const SOURCE = `"use client";

import {Button, Fieldset as Set, TextField} from "@peakui/react";
import {useState} from "react";

export function A({saving}: {saving: boolean}) {
  return (
    <Set.Group render={(props) => <section {...props} />}>
      <TextField isRequired minLength={8} type="password">
        <Button isPending={saving} onPress={() => {}}>
          {({isPressed}) => (isPressed ? "a" : "b")}
        </Button>
      </TextField>
      <button disabled>plain</button>
    </Set.Group>
  );
}
`;

describe("parseSource", () => {
  const parsed = parseSource({path: "src/A.tsx", text: SOURCE});
  const byTag = (tag: string) => parsed.jsx.find((node) => node.tag === tag)!;

  it("reads directives and imports", () => {
    expect(parsed.directives).toEqual(["use client"]);
    expect([...parsed.peakui].sort()).toEqual(["Button", "Set", "TextField"]);
    expect(parsed.imports.find((entry) => entry.local === "Set")).toMatchObject({
      imported: "Fieldset",
      module: "@peakui/react",
    });
  });

  it("reads tags, roots, lines and ancestors", () => {
    expect(byTag("Set.Group")).toMatchObject({line: 8, root: "Set"});
    expect(byTag("Button").ancestors).toEqual(["TextField", "Set.Group"]);
    expect(byTag("Button").excerpt).toBe("<Button isPending={saving} onPress={() => {}}>");
  });

  it("reads attribute values", () => {
    expect(byTag("TextField").attributes.get("type")?.value).toBe("password");
    expect(byTag("TextField").attributes.get("minLength")?.value).toBe("8");
    expect(byTag("TextField").attributes.get("isRequired")?.value).toBe(true);
    expect(byTag("Button").attributes.get("isPending")?.value).toBe("saving");
    expect(byTag("Button").attributes.get("onPress")?.isFunction).toBe(true);
    expect(byTag("Set.Group").attributes.get("render")?.isFunction).toBe(true);
  });

  it("detects a function child", () => {
    expect(byTag("Button").hasFunctionChild).toBe(true);
    expect(byTag("TextField").hasFunctionChild).toBe(false);
  });

  it("tells PeakUI elements from plain ones", () => {
    expect(isPeakui(parsed, byTag("Set.Group"))).toBe(true);
    expect(isPeakui(parsed, byTag("button"))).toBe(false);
  });

  it("does not throw on a file that does not parse", () => {
    expect(() =>
      parseSource({path: "src/B.tsx", text: "export function B() { return <div><Button"}),
    ).not.toThrow();
  });

  it("peakuiElements skips same-named elements that are not from PeakUI", () => {
    const local = {
      path: "src/C.tsx",
      text: `const Button = () => null;\nexport const c = <Button onPress={() => {}} />;`,
    };
    const files = [{path: "src/A.tsx", text: SOURCE}, local];
    const found = peakuiElements(
      {changes: {added: [], deleted: [], modified: []}, file: () => undefined, files},
      "Button",
    );

    expect(found).toHaveLength(1);
    expect(found[0]!.attributes.has("isPending")).toBe(true);
  });
});
