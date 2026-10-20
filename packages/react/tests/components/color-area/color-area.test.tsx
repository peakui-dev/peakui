import type {ComponentProps} from "react";

import {render, screen} from "@peakui/testing/helpers";

import {ColorArea, ColorAreaRoot} from "@/components/color-area/index.ts";

function Area(props: Partial<ComponentProps<typeof ColorArea>> = {}) {
  return (
    <ColorArea
      aria-label="Colour area"
      colorSpace="hsb"
      defaultValue="hsb(210, 100%, 100%)"
      xChannel="saturation"
      yChannel="brightness"
      {...props}
    >
      <ColorArea.Thumb />
    </ColorArea>
  );
}

describe("ColorArea", () => {
  it("exposes the BEM block and data-slot on the root and the thumb", () => {
    const {container} = render(<Area />);

    expect(container.querySelector('[data-slot="color-area"]')).toHaveClass("color-area");
    expect(container.querySelector('[data-slot="color-area-thumb"]')).toHaveClass(
      "color-area__thumb",
    );
  });

  it("forwards the gradient and the thumb colour as custom properties", () => {
    const {container} = render(<Area />);

    const root = container.querySelector<HTMLElement>('[data-slot="color-area"]');
    const thumb = container.querySelector<HTMLElement>('[data-slot="color-area-thumb"]');

    expect(root?.style.getPropertyValue("--color-area-background")).not.toBe("");
    expect(thumb?.style.getPropertyValue("--color-area-thumb-color")).not.toBe("");
  });

  it("adds the dots modifier on request", () => {
    const {container} = render(<Area showDots />);

    expect(container.querySelector('[data-slot="color-area"]')).toHaveClass(
      "color-area--show-dots",
    );
  });

  it("exposes the thumb as a slider", () => {
    render(<Area />);

    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("merges a consumer className with the block", () => {
    const {container} = render(<Area className="custom" />);

    expect(container.querySelector('[data-slot="color-area"]')).toHaveClass("color-area", "custom");
  });

  it("behaves identically as ColorArea.Root and ColorAreaRoot", () => {
    expect(ColorArea.Root).toBe(ColorAreaRoot);
    expect(ColorArea).toBe(ColorAreaRoot);
  });
});
