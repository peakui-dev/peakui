import type {DateValue} from "@internationalized/date";
import type {ComponentProps} from "react";

import {
  CalendarDate,
  CalendarDateTime,
  parseDate,
  parseZonedDateTime,
} from "@internationalized/date";
import {render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {DateField, DateFieldRoot} from "@/components/date-field/index.ts";
import {Description} from "@/components/description/index.ts";
import {FieldError} from "@/components/field-error/index.ts";
import {Label} from "@/components/label/index.ts";

function renderField(props: Partial<ComponentProps<typeof DateField>> = {}, locale = "en-US") {
  return render(
    <I18nProvider locale={locale}>
      <DateField data-testid="field" name="date" {...props}>
        <Label>Date</Label>
        <DateField.Group data-testid="group">
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
      </DateField>
    </I18nProvider>,
  );
}

function segmentOf(type: string) {
  return document.querySelector<HTMLElement>(`[data-type="${type}"]`);
}

describe("DateField", () => {
  describe("structure", () => {
    it("renders month, day and year as spinbuttons", () => {
      renderField({defaultValue: new CalendarDate(2026, 8, 15)});

      expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
      expect(screen.getByRole("spinbutton", {name: /month/i})).toHaveTextContent("8");
      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("15");
      expect(screen.getByRole("spinbutton", {name: /year/i})).toHaveTextContent("2026");
    });

    it("exposes the BEM block and data-slot on every part", () => {
      renderField();

      expect(screen.getByTestId("field")).toHaveClass("date-field");
      expect(screen.getByTestId("field")).toHaveAttribute("data-slot", "date-field");
      expect(screen.getByTestId("group")).toHaveAttribute("data-slot", "date-input-group");
      expect(document.querySelector('[data-slot="date-input-group-input"]')).not.toBeNull();
      expect(
        document.querySelectorAll('[data-slot="date-input-group-segment"][role="spinbutton"]'),
      ).toHaveLength(3);
    });

    it("behaves identically as DateField.Root and DateFieldRoot", () => {
      expect(DateField.Root).toBe(DateFieldRoot);
      expect(DateField).toBe(DateFieldRoot);
    });

    it("applies the full-width modifier on request", () => {
      renderField({fullWidth: true});

      expect(screen.getByTestId("field")).toHaveClass("date-field--full-width");
    });

    it("names every segment after the Label part", () => {
      renderField();

      expect(screen.getByRole("spinbutton", {name: /month/i})).toHaveAccessibleName(/Date/);
    });
  });

  describe("interaction", () => {
    it("steps a segment with the arrow keys and reports the new date", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({defaultValue: new CalendarDate(2026, 8, 15), onChange});

      screen.getByRole("spinbutton", {name: /day/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("16");
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.lastCall?.[0]?.toString()).toBe("2026-08-16");
    });

    it("accepts typed digits and moves focus to the next segment", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({onChange});

      screen.getByRole("spinbutton", {name: /month/i}).focus();
      await user.keyboard("03152026");

      expect(onChange).toHaveBeenCalled();
      expect(onChange.mock.lastCall?.[0]?.toString()).toBe("2026-03-15");
    });

    it("does not change a read-only value", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      renderField({defaultValue: new CalendarDate(2026, 8, 15), isReadOnly: true, onChange});

      screen.getByRole("spinbutton", {name: /day/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("works as a controlled field", async () => {
      const user = setupUser();
      const onChange = vi.fn();

      const {rerender} = render(
        <DateField aria-label="Date" value={parseDate("2026-08-15")} onChange={onChange}>
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>,
      );

      screen.getByRole("spinbutton", {name: /day/i}).focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange).toHaveBeenCalledOnce();
      // The value prop did not move, so the display does not either.
      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("15");

      rerender(
        <DateField aria-label="Date" value={parseDate("2026-08-20")} onChange={onChange}>
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>,
      );

      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("20");
    });
  });

  describe("states", () => {
    it("marks a required field with data-required", () => {
      renderField({isRequired: true});

      expect(screen.getByTestId("field")).toHaveAttribute("data-required", "true");
    });

    it("disables every segment", () => {
      renderField({defaultValue: new CalendarDate(2026, 8, 15), isDisabled: true});

      for (const segment of screen.getAllByRole("spinbutton")) {
        expect(segment).toHaveAttribute("aria-disabled", "true");
      }
      expect(screen.getByTestId("group")).toHaveAttribute("data-disabled");
    });

    it("shows a FieldError and marks the group invalid", () => {
      render(
        <DateField isInvalid name="date">
          <Label>Date</Label>
          <DateField.Group data-testid="group">
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
          <Description>Pick a date</Description>
          <FieldError>Date must be in the future</FieldError>
        </DateField>,
      );

      expect(screen.getByTestId("group")).toHaveAttribute("data-invalid");
      expect(screen.getByText("Date must be in the future")).toBeInTheDocument();
    });

    it("flags a value below minValue as invalid", () => {
      render(
        <DateField
          aria-label="Date"
          defaultValue={new CalendarDate(2020, 1, 1)}
          minValue={new CalendarDate(2026, 1, 1)}
          validationBehavior="aria"
        >
          <DateField.Group data-testid="group">
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>,
      );

      expect(screen.getByTestId("group")).toHaveAttribute("data-invalid");
    });

    it("submits the value through the hidden input", () => {
      renderField({defaultValue: new CalendarDate(2026, 8, 15)});

      expect(document.querySelector('input[name="date"]')).toHaveValue("2026-08-15");
    });
  });

  describe("variants", () => {
    it("applies the secondary modifier to the group", () => {
      render(
        <DateField aria-label="Date">
          <DateField.Group data-testid="group" variant="secondary">
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
          </DateField.Group>
        </DateField>,
      );

      expect(screen.getByTestId("group")).toHaveClass("date-input-group--secondary");
    });
  });

  describe("granularity", () => {
    it("adds hour, minute and second segments for a zoned date-time", () => {
      renderField({
        defaultValue: parseZonedDateTime("2026-02-03T08:45:12[America/Los_Angeles]"),
        granularity: "second",
      });

      for (const name of [/hour/i, /minute/i, /second/i]) {
        expect(screen.getByRole("spinbutton", {name})).toBeInTheDocument();
      }
    });

    it("keeps day granularity for a plain date", () => {
      renderField({defaultValue: new CalendarDate(2026, 8, 15)});

      expect(screen.queryByRole("spinbutton", {name: /hour/i})).toBeNull();
    });

    it("accepts a date-time without a zone", () => {
      renderField({defaultValue: new CalendarDateTime(2026, 8, 15, 9, 30), granularity: "minute"});

      expect(screen.getByRole("spinbutton", {name: /minute/i})).toHaveTextContent("30");
    });
  });

  describe("locales and calendars", () => {
    const value = new CalendarDate(2026, 8, 15);

    it("orders segments day first in German", () => {
      renderField({defaultValue: value}, "de-DE");

      const names = screen.getAllByRole("spinbutton").map((el) => el.getAttribute("aria-label"));

      expect(names[0]).toMatch(/day|tag/i);
    });

    it("orders segments year first in Japanese", () => {
      renderField({defaultValue: value}, "ja-JP");

      const first = screen.getAllByRole("spinbutton")[0];

      expect(first).toHaveTextContent("2026");
    });

    it("shows the era and the Japanese year under the Japanese calendar", () => {
      renderField({defaultValue: value}, "ja-JP-u-ca-japanese");

      // Locale-independent: the segment type is data, the accessible name is translated.
      expect(segmentOf("era")).not.toBeNull();
      expect(segmentOf("year")).toHaveTextContent("8");
    });

    it("converts to the Buddhist calendar year", () => {
      renderField({defaultValue: value}, "th-TH-u-ca-buddhist");

      expect(segmentOf("year")).toHaveTextContent("2569");
    });

    it("keeps the stored value in the ISO calendar whatever it displays", async () => {
      const user = setupUser();
      const onChange = vi.fn<(value: DateValue | null) => void>();

      renderField({defaultValue: value, onChange}, "th-TH-u-ca-buddhist");

      segmentOf("day")?.focus();
      await user.keyboard("{ArrowUp}");

      expect(onChange.mock.lastCall?.[0]?.calendar.identifier).toBe("gregory");
    });
  });
});
