import type {ComponentProps} from "react";

import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";
import {ColorSlider, ColorThumb, SliderTrack, parseColor} from "react-aria-components";

import {ColorPicker, ColorPickerRoot} from "@/components/color-picker/index.ts";
import {ColorSwatch} from "@/components/color-swatch/index.ts";

/* Overlay state updates run through the timers wrapper, as the dropdown suite records. */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * The composed ColorSlider is a test device, not a dependency: this order ships no editor part
 * (ColorArea, ColorSlider and ColorField are wave 3.5), and the device proves the state plumbing
 * RAC provides end to end — the picker is a container, its value flows through RAC's state.
 * RAC's ColorSlider renders only a provider div, so the device composes the track and thumb the
 * way RAC's own ColorSlider example (and the reference's stories) do — the thumb carries the
 * slider role.
 */
function Picker(props: ComponentProps<typeof ColorPicker> = {}) {
  return (
    <ColorPicker defaultValue={parseColor("#ff5733")} {...props}>
      <ColorPicker.Trigger aria-label="Accent colour">
        <ColorSwatch aria-label="Current colour" data-testid="swatch" />
      </ColorPicker.Trigger>
      <ColorPicker.Popover>
        {/*
         * Green, not the reference's red: #ff5733 has red already at its 255 maximum, so an
         * ArrowRight step clamps to the same value and react-stately never reports it. Green
         * (87/255) has room to step, which is what the test needs.
         */}
        <ColorSlider channel="green">
          <SliderTrack>
            <ColorThumb />
          </SliderTrack>
        </ColorSlider>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

describe("ColorPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  it("renders its trigger and opens the popover on press", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<Picker />);

    await user.click(screen.getByRole("button", {name: "Accent colour"}));
    runAllTimers();

    expect(screen.getByRole("dialog")).toBeVisible();
  });

  it("seeds the state from defaultValue for composed children", () => {
    render(<Picker />);

    expect(screen.getByTestId("swatch").style.getPropertyValue("--color-swatch-current")).toBe(
      "rgba(255, 87, 51, 1)",
    );
  });

  it("follows a controlled value on rerender", () => {
    const {rerender} = render(<Picker value={parseColor("#ff5733")} />);

    rerender(<Picker value={parseColor("#00ff00")} />);

    expect(screen.getByTestId("swatch").style.getPropertyValue("--color-swatch-current")).toBe(
      "rgba(0, 255, 0, 1)",
    );
  });

  it("reports edits to onChange from a composed editor", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});
    const onChange = vi.fn();

    render(<Picker onChange={onChange} />);

    await user.click(screen.getByRole("button", {name: "Accent colour"}));
    runAllTimers();

    const slider = screen.getByRole("slider");

    slider.focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalled();
  });

  it("behaves identically as ColorPicker.Root and ColorPickerRoot", () => {
    render(
      <>
        <ColorPicker.Root defaultValue={parseColor("#ff5733")}>
          <ColorPicker.Trigger aria-label="First" />
        </ColorPicker.Root>
        <ColorPickerRoot defaultValue={parseColor("#ff5733")}>
          <ColorPicker.Trigger aria-label="Second" />
        </ColorPickerRoot>
      </>,
    );

    expect(document.querySelectorAll('[data-slot="color-picker"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="color-picker-trigger"]')).toHaveLength(2);
  });
});
