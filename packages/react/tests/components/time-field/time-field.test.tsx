import type {ComponentProps} from "react";

import {Time} from "@internationalized/date";
import {render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Description} from "@/components/description/index.ts";
import {FieldError} from "@/components/field-error/index.ts";
import {Label} from "@/components/label/index.ts";
import {TimeField, TimeFieldRoot} from "@/components/time-field/index.ts";

function renderField(props: Partial<ComponentProps<typeof TimeField>> = {}, locale = "en-US") {
  return render(
    <I18nProvider locale={locale}>
      <TimeField data-testid="field" name="time" {...props}>
        <Label>Time</Label>
        <TimeField.Group data-testid="group">
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
    </I18nProvider>,
  );
}

describe("TimeField", () => {
  describe("structure", () => {
    it("renders hour, minute and day period as spinbuttons", () => {
      renderField({defaultValue: new Time(9, 30)});

      expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
      expect(screen.getByRole("spinbutton", {name: /hour/i})).toHaveTextContent("9");
      expect(screen.getByRole("spinbutton", {name: /minute/i})).toHaveTextContent("30");
    });

    it("exposes the BEM block and data-slot on every part", () => {
      renderField();

      expect(screen.getByTestId("field")).toHaveClass("time-field");
      expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "time-field");
      expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "date-input-group");
      expect(document.querySelector('[data-slot="date-input-group-input"]')).not.toBeNull();
    });

    it("behaves identically as TimeField.Root and TimeFieldRoot", () => {
      expect(TimeField.Root).toBe(TimeFieldRoot);
      expect(TimeField).toBe(TimeFieldRoot);
    });

    it("applies the full-width modifier on request", () => {
      renderField({fullWidth: true});

      expect(screen.getByTestId("field")).toHaveClass("time-field--full-width");
    });

    it("merges a consumer className with the block", () => {
      renderField({className: "custom"});

      expect(screen.getByTestId("field")).toHaveClass("time-field", "custom");
    });

    it("names every segment after the Label part", () => {
      renderField();

      expect(screen.getByRole("spinbutton", {name: /hour/i})).toHaveAccessibleName(/Time/);
    });
  });

  describe("interaction", () => {
    it("steps a segment with the arrow keys and reports the new time", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({defaultValue: new Time(9, 30), onChange});

      screen.getByRole("spinbutton", {name: /minute/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(screen.getByRole("spinbutton", {name: /minute/i})).toHaveTextContent("31");
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.lastCall?.[0]?.toString()).toBe("09:31:00");
    });

    it("accepts typed digits and moves focus to the next segment", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({onChange});

      screen.getByRole("spinbutton", {name: /hour/i}).focus();
      await user.keyboard("0345PM");

      expect(onChange.mock.lastCall?.[0]?.toString()).toBe("15:45:00");
    });

    it("does not change a read-only value", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({defaultValue: new Time(9, 30), isReadOnly: true, onChange});

      screen.getByRole("spinbutton", {name: /minute/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("works as a controlled field", async () => {
      const user = setupUser();
      const onChange = vi.fn();
      const ui = (value: Time) => (
        <TimeField aria-label="Time" value={value} onChange={onChange}>
          <TimeField.Group>
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
        </TimeField>
      );
      const {rerender} = render(ui(new Time(9, 30)));

      screen.getByRole("spinbutton", {name: /minute/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange).toHaveBeenCalledOnce();
      // The value prop did not move, so the display does not either.
      expect(screen.getByRole("spinbutton", {name: /minute/i})).toHaveTextContent("30");

      rerender(ui(new Time(9, 45)));

      expect(screen.getByRole("spinbutton", {name: /minute/i})).toHaveTextContent("45");
    });
  });

  describe("states", () => {
    it("marks a required field with data-required", () => {
      renderField({isRequired: true});

      expect(screen.getByTestId("field")).toHaveAttribute("data-required", "true");
    });

    it("disables every segment", () => {
      renderField({defaultValue: new Time(9, 30), isDisabled: true});

      for (const segment of screen.getAllByRole("spinbutton")) {
        expect(segment).toHaveAttribute("aria-disabled", "true");
      }
      expect(screen.getByTestId("group")).toHaveAttribute("data-disabled");
    });

    it("shows a FieldError and marks the group invalid", () => {
      render(
        <TimeField isInvalid name="time">
          <Label>Time</Label>
          <TimeField.Group data-testid="group">
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
          <Description>Pick a time</Description>
          <FieldError>Time must be within opening hours</FieldError>
        </TimeField>,
      );

      expect(screen.getByTestId("group")).toHaveAttribute("data-invalid");
      expect(screen.getByText("Time must be within opening hours")).toBeInTheDocument();
    });

    it("flags a value below minValue as invalid", () => {
      render(
        <TimeField
          aria-label="Time"
          defaultValue={new Time(8)}
          minValue={new Time(9)}
          validationBehavior="aria"
        >
          <TimeField.Group data-testid="group">
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
        </TimeField>,
      );

      expect(screen.getByTestId("group")).toHaveAttribute("data-invalid");
    });

    it("submits the value through the hidden input", () => {
      renderField({defaultValue: new Time(9, 30)});

      expect(document.querySelector('input[name="time"]')).toHaveValue("09:30:00");
    });
  });

  describe("variants", () => {
    it("applies the secondary modifier to the group", () => {
      render(
        <TimeField aria-label="Time">
          <TimeField.Group data-testid="group" variant="secondary">
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
        </TimeField>,
      );

      expect(screen.getByTestId("group")).toHaveClass("date-input-group--secondary");
    });
  });

  describe("granularity and hour cycle", () => {
    it("adds a second segment on request", () => {
      renderField({defaultValue: new Time(8, 45, 12), granularity: "second"});

      expect(screen.getByRole("spinbutton", {name: /second/i})).toHaveTextContent("12");
    });

    it("hides the day period on a 24-hour clock", () => {
      renderField({defaultValue: new Time(15, 30), hourCycle: 24});

      expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
      expect(screen.getByRole("spinbutton", {name: /hour/i})).toHaveTextContent("15");
    });

    it("follows the locale clock", () => {
      renderField({defaultValue: new Time(15, 30)}, "de-DE");

      expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    });
  });
});
