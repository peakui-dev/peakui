import type {SheetSnapPoint} from "@/components/sheet/sheet.utils.ts";

import {describe, expect, it, vi} from "vitest";

import {
  animateSheetValue,
  nearestSheetSnap,
  normalizeSnapPoints,
  sheetDismissTarget,
  sheetReleaseEase,
} from "@/components/sheet/sheet.utils.ts";

describe("normalizeSnapPoints", () => {
  it("drops a trailing full-size point", () => {
    expect(normalizeSnapPoints([200, 400, 1])).toEqual([200, 400]);
    expect(normalizeSnapPoints(["50%", "100%"])).toEqual(["50%"]);
    expect(normalizeSnapPoints([300, "1"])).toEqual([300]);
  });

  it("returns undefined when nothing remains", () => {
    expect(normalizeSnapPoints([1])).toBeUndefined();
    expect(normalizeSnapPoints([])).toBeUndefined();
    expect(normalizeSnapPoints(undefined)).toBeUndefined();
  });

  it("drops non-finite numbers, negatives, blank strings and duplicates", () => {
    expect(normalizeSnapPoints([NaN, -10, "", "  ", 300, 300])).toEqual([300]);
    expect(normalizeSnapPoints([Infinity, -Infinity])).toBeUndefined();
  });

  it("keeps an unrecognised string as authored and does not throw", () => {
    expect(() => normalizeSnapPoints(["abc"])).not.toThrow();
    expect(normalizeSnapPoints(["abc"])).toEqual(["abc"]);
  });

  it("keeps the author order", () => {
    expect(normalizeSnapPoints([600, 200, 400])).toEqual([600, 200, 400]);
  });

  it("never throws for any mix of garbage", () => {
    const garbage = [
      NaN,
      Infinity,
      -1,
      0,
      "",
      " ",
      "abc",
      "1",
      "100%",
      null,
      undefined,
      {},
      [],
    ] as unknown as SheetSnapPoint[];

    expect(() => normalizeSnapPoints(garbage)).not.toThrow();
    for (let index = 0; index < garbage.length; index++) {
      expect(() => normalizeSnapPoints(garbage.slice(index))).not.toThrow();
    }
  });
});

describe("nearestSheetSnap", () => {
  const targets = [0, 300, 600];

  it("picks the nearest target when velocity is below the threshold", () => {
    expect(nearestSheetSnap(targets, 340, 0)).toBe(300);
    expect(nearestSheetSnap(targets, 460, 0.2)).toBe(600);
  });

  it("biases to the next lower target at high positive velocity", () => {
    expect(nearestSheetSnap(targets, 340, 0.5)).toBe(300);
  });

  it("biases to the next higher target at high negative velocity", () => {
    expect(nearestSheetSnap(targets, 340, -0.5)).toBe(600);
  });

  it("falls back to the nearest target when no target lies in the biased direction", () => {
    expect(nearestSheetSnap(targets, -10, 0.5)).toBe(0);
    expect(nearestSheetSnap(targets, 700, -0.5)).toBe(600);
  });

  it("returns null for no targets", () => {
    expect(nearestSheetSnap([], 1, 0)).toBeNull();
  });

  it("never returns NaN for non-finite inputs", () => {
    for (const current of [NaN, Infinity, -Infinity]) {
      for (const velocity of [NaN, Infinity, -Infinity, 0]) {
        const result = nearestSheetSnap(targets, current, velocity);

        expect(result === null || !Number.isNaN(result)).toBe(true);
      }
    }
  });
});

describe("sheetDismissTarget", () => {
  const base = {
    current: 400,
    elapsed: 1000,
    extent: 400,
    isDismissable: true,
    rest: 400,
    size: 400,
    swipeDirection: "bottom" as const,
    travel: 0,
    viewport: 800,
  };

  it("always returns rest when not dismissable", () => {
    expect(sheetDismissTarget({...base, isDismissable: false, travel: 380})).toBe(400);
  });

  it("closes at 30% of the visible size on a bottom sheet", () => {
    expect(sheetDismissTarget({...base, travel: 120})).toBe(0);
  });

  it("stays at rest below the distance threshold and velocity", () => {
    expect(sheetDismissTarget({...base, travel: 40})).toBe(400);
  });

  it("closes on a fast flick below the distance threshold", () => {
    expect(sheetDismissTarget({...base, elapsed: 50, travel: 40})).toBe(0);
  });

  it("returns rest when dragged against the dismiss direction", () => {
    expect(sheetDismissTarget({...base, travel: -200})).toBe(400);
  });

  it("closes toward the far edge for a top sheet", () => {
    expect(
      sheetDismissTarget({...base, current: 0, rest: 0, swipeDirection: "top", travel: -120}),
    ).toBe(400);
  });
});

describe("sheetReleaseEase", () => {
  it("is pinned at the endpoints", () => {
    expect(sheetReleaseEase(0)).toBe(0);
    expect(sheetReleaseEase(1)).toBe(1);
  });

  it("decelerates: the midpoint is ahead of linear", () => {
    const mid = sheetReleaseEase(0.5);

    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
  });

  it("is monotonic", () => {
    let previous = 0;

    for (let step = 1; step <= 20; step++) {
      const value = sheetReleaseEase(step / 20);

      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });
});

describe("animateSheetValue", () => {
  it("jumps to the target synchronously under reduced motion", () => {
    const calls: string[] = [];
    const update = vi.fn((value: number) => calls.push(`update:${value}`));
    const complete = vi.fn(() => calls.push("complete"));

    animateSheetValue(0, 10, update, complete, true);

    expect(update).toHaveBeenCalledWith(10);
    expect(calls).toEqual(["update:10", "complete"]);
  });

  it("returns a cancel function that stops an animation", () => {
    const frames: FrameRequestCallback[] = [];
    const raf = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);

      return frames.length;
    });
    const caf = vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
    const update = vi.fn();
    const complete = vi.fn();

    const cancel = animateSheetValue(0, 100, update, complete, false);

    cancel();
    frames[0]?.(performance.now() + 1000);

    expect(update).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    raf.mockRestore();
    caf.mockRestore();
  });
});
