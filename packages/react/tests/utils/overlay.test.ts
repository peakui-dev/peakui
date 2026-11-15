import type {EdgePlacement} from "@/utils/overlay.ts";

import {DIALOG_SURFACE_CONTEXT} from "@/utils/overlay.ts";

describe("overlay shared constants", () => {
  it("gives dialog-like surfaces the default variant", () => {
    expect(DIALOG_SURFACE_CONTEXT).toEqual({variant: "default"});
  });

  it("accepts every screen edge as an EdgePlacement", () => {
    const edges = ["top", "bottom", "left", "right"] satisfies readonly EdgePlacement[];

    expect(edges).toHaveLength(4);
  });
});
