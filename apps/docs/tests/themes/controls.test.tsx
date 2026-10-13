// @vitest-environment jsdom
import type {Root} from "react-dom/client";

import {act} from "react";
import {createRoot} from "react-dom/client";
import {afterAll, beforeAll, describe, expect, it} from "vitest";

import {ControlsPanel} from "@/app/[lang]/themes/controls";
import {DEFAULT_STATE} from "@/app/[lang]/themes/url-codec";

(globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;

describe("ControlsPanel", () => {
  let host: HTMLDivElement;
  let root: Root;

  const steps = (label: string): string[] =>
    [...host.querySelectorAll(`[aria-label="${label}"] [data-slot="segmented-control-item"]`)].map(
      (item) => item.textContent ?? "",
    );

  beforeAll(async () => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);

    await act(async () => {
      root.render(<ControlsPanel fixes={[]} set={() => {}} state={DEFAULT_STATE} />);
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
    expect(steps("Radius")).toEqual(["None", "XS", "S", "M", "L"]);
  });

  it("offers the field radius every step", () => {
    expect(steps("Form radius")).toEqual(["None", "XS", "S", "M", "L", "XL"]);
  });
});
