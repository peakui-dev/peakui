// @vitest-environment jsdom
import type {Root} from "react-dom/client";

import {deriveTheme} from "@peakui/styles/generator";
import {act} from "react";
import {createRoot} from "react-dom/client";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {ControlsPanel} from "@/app/[lang]/themes/controls";
import {DEFAULT_VALUES, toPreset} from "@/app/[lang]/themes/presets";
import {DEFAULT_STATE} from "@/app/[lang]/themes/url-codec";

(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("ControlsPanel", () => {
  let host: HTMLDivElement;
  let root: Root;

  // A segment draws its corner instead of spelling a name, so the step is read from its label.
  const steps = (label: string): string[] =>
    [...host.querySelectorAll(`[aria-label="${label}"] [data-slot="segmented-control-item"]`)].map(
      (item) => item.getAttribute("aria-label") ?? "",
    );

  beforeAll(async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    await act(async () => {
      root.render(
        <ControlsPanel
          fixes={[]}
          set={() => {}}
          state={DEFAULT_STATE}
          tokens={deriveTheme(toPreset(DEFAULT_VALUES)).light}
        />,
      );
    });
  });

  afterAll(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  // Controls and surfaces take 3x of the base: past large a surface only meets its 32px clamp.
  it("stops the surface radius at large", () => {
    expect(steps("Surfaces radius")).toEqual(["None", "Extra small", "Small", "Medium", "Large"]);
  });

  it("offers the field radius every step", () => {
    expect(steps("Fields radius")).toEqual([
      "None",
      "Extra small",
      "Small",
      "Medium",
      "Large",
      "Extra large",
    ]);
  });
});
