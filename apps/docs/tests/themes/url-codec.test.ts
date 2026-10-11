import type {BuilderState} from "@/app/[lang]/themes/url-codec";

import {describe, expect, it} from "vitest";

import {DEFAULT_STATE, decodeBuilderState, encodeBuilderState} from "@/app/[lang]/themes/url-codec";

describe("encodeBuilderState", () => {
  it("omits defaults entirely", () => {
    expect(encodeBuilderState(DEFAULT_STATE)).toEqual({});
  });

  it("encodes every non-default field compactly", () => {
    const state: BuilderState = {
      accent: "#e50914",
      grayChroma: 0.005,
      radius: "small",
      formRadius: "small",
      darkAccent: "#ff0",
      scheme: "dark",
    };

    expect(encodeBuilderState(state)).toEqual({
      a: "#e50914",
      g: "0.005",
      r: "small",
      f: "small",
      da: "#ff0",
      s: "dark",
    });
  });
});

describe("decodeBuilderState", () => {
  it("returns defaults for an empty query", () => {
    expect(decodeBuilderState("")).toEqual(DEFAULT_STATE);
  });

  it("round-trips an encoded state exactly", () => {
    const state: BuilderState = {
      accent: "#e50914",
      grayChroma: 0.005,
      radius: "small",
      formRadius: "small",
      scheme: "dark",
    };
    const query = new URLSearchParams(encodeBuilderState(state)).toString();

    expect(decodeBuilderState(query)).toEqual(state);
  });

  it("keeps darkAccent optional on decode", () => {
    expect(decodeBuilderState("?a=%231db954&s=dark")).toEqual({
      ...DEFAULT_STATE,
      accent: "#1db954",
      scheme: "dark",
    });
  });

  it("falls back to defaults when any param is invalid", () => {
    expect(decodeBuilderState("?a=%23zz&g=abc&r=huge")).toEqual(DEFAULT_STATE);
  });

  it("rejects an accent the engine cannot parse instead of crashing the page", () => {
    expect(decodeBuilderState("?a=abcd&da=wxyz&s=dark")).toEqual(DEFAULT_STATE);
  });
});
