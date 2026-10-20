import {render, screen, setupUser} from "@peakui/testing/helpers";

import {ColorSlider, ColorSliderRoot} from "@/components/color-slider/index.ts";
import {Label} from "@/components/label/index.ts";

function HueSlider(props: {className?: string} = {}) {
  return (
    <ColorSlider channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)" {...props}>
      <Label>Hue</Label>
      <ColorSlider.Output data-testid="output" />
      <ColorSlider.Track data-testid="track">
        <ColorSlider.Thumb data-testid="thumb" />
      </ColorSlider.Track>
    </ColorSlider>
  );
}

describe("ColorSlider", () => {
  it("exposes the BEM block and data-slot on every part", () => {
    const {container} = render(<HueSlider />);

    expect(container.querySelector('[data-slot="color-slider"]')).toHaveClass("color-slider");
    expect(screen.getByTestId("output")).toHaveClass("color-slider__output");
    expect(screen.getByTestId("output")).toHaveAttribute("data-slot", "color-slider-output");
    expect(screen.getByTestId("track")).toHaveClass("color-slider__track");
    expect(screen.getByTestId("track")).toHaveAttribute("data-slot", "color-slider-track");
    expect(screen.getByTestId("thumb")).toHaveClass("color-slider__thumb");
    expect(screen.getByTestId("thumb")).toHaveAttribute("data-slot", "color-slider-thumb");
  });

  it("names the slider by its label and shows the value in the output", () => {
    render(<HueSlider />);

    expect(screen.getByRole("slider", {name: /hue/i})).toBeInTheDocument();
    expect(screen.getByTestId("output")).toHaveTextContent("210");
  });

  it("changes the output when the thumb moves", async () => {
    const user = setupUser();

    render(<HueSlider />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByTestId("output")).toHaveTextContent("211");
  });

  it("hands the track the gradient and the edge colours", () => {
    render(<HueSlider />);

    const track = screen.getByTestId("track");

    expect(track.style.background).not.toBe("");
    expect(track.style.getPropertyValue("--track-start-color")).not.toBe("");
    expect(track.style.getPropertyValue("--track-end-color")).not.toBe("");
  });

  it("renders a custom output", () => {
    render(
      <ColorSlider channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)">
        <ColorSlider.Output>custom</ColorSlider.Output>
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>,
    );

    expect(screen.getByText("custom")).toHaveAttribute("data-slot", "color-slider-output");
  });

  it("merges a consumer className with the block", () => {
    const {container} = render(<HueSlider className="custom" />);

    expect(container.querySelector('[data-slot="color-slider"]')).toHaveClass(
      "color-slider",
      "custom",
    );
  });

  it("behaves identically as ColorSlider.Root and ColorSliderRoot", () => {
    expect(ColorSlider.Root).toBe(ColorSliderRoot);
    expect(ColorSlider).toBe(ColorSliderRoot);
  });
});
