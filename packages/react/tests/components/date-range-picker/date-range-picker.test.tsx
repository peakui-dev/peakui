import type {DateValue} from "@internationalized/date";
import type {ComponentProps, ReactNode} from "react";
import type {RangeValue} from "react-aria-components/RangeCalendar";

import {CalendarDate} from "@internationalized/date";
import {act, cleanup, render, screen, setupUser, within} from "@peakui/testing/helpers";
import {createRef, useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {DateField} from "@/components/date-field/index.ts";
import {
  DateRangePicker,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
} from "@/components/date-range-picker/index.ts";
import {Description} from "@/components/description/index.ts";
import {FieldError} from "@/components/field-error/index.ts";
import {Label} from "@/components/label/index.ts";
import {RangeCalendar} from "@/components/range-calendar/index.ts";

/*
 * Overlay state updates run through the timers wrapper, as the select suite records.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

const Content = ({indicator}: {indicator?: ReactNode}) => (
  <>
    <Label>Dates</Label>
    <DateField.Group data-testid="group">
      <DateField.Input slot="start">
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateRangePicker.RangeSeparator data-testid="separator" />
      <DateField.Input slot="end">
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateField.Suffix>
        <DateRangePicker.Trigger data-testid="trigger">
          <DateRangePicker.TriggerIndicator data-testid="indicator">
            {indicator}
          </DateRangePicker.TriggerIndicator>
        </DateRangePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <DateRangePicker.Popover data-testid="popover">
      <RangeCalendar aria-label="Dates">
        <RangeCalendar.Header>
          <RangeCalendar.Heading />
          <RangeCalendar.NavButton slot="previous" />
          <RangeCalendar.NavButton slot="next" />
        </RangeCalendar.Header>
        <RangeCalendar.Grid>
          <RangeCalendar.GridHeader>
            {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
          </RangeCalendar.GridHeader>
          <RangeCalendar.GridBody>
            {(date) => <RangeCalendar.Cell date={date} />}
          </RangeCalendar.GridBody>
        </RangeCalendar.Grid>
      </RangeCalendar>
    </DateRangePicker.Popover>
  </>
);

function renderPicker(props: Partial<ComponentProps<typeof DateRangePicker>> = {}) {
  return render(
    <I18nProvider locale="en-US">
      <DateRangePicker
        data-testid="picker"
        endName="end"
        startName="start"
        {...(props as Record<string, unknown>)}
      >
        <Content />
      </DateRangePicker>
    </I18nProvider>,
  );
}

const range = (start: CalendarDate, end: CalendarDate): RangeValue<DateValue> => ({end, start});
const august = range(new CalendarDate(2026, 8, 15), new CalendarDate(2026, 8, 18));

const getTrigger = () => screen.getByRole("button", {name: /calendar/i});

describe("DateRangePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  describe("structure", () => {
    it("exposes the BEM block and data-slot on every part", () => {
      renderPicker();

      expect(screen.getByTestId("picker")).toHaveClass("date-range-picker");
      expect(screen.getByTestId("picker")).toHaveAttribute("data-slot", "date-range-picker");
      expect(screen.getByTestId("trigger")).toHaveClass("date-range-picker__trigger");
      expect(screen.getByTestId("trigger")).toHaveAttribute(
        "data-slot",
        "date-range-picker-trigger",
      );
      expect(screen.getByTestId("indicator")).toHaveClass("date-range-picker__trigger-indicator");
      expect(screen.getByTestId("indicator")).toHaveAttribute(
        "data-slot",
        "date-range-picker-trigger-indicator",
      );
      expect(screen.getByTestId("separator")).toHaveClass("date-range-picker__range-separator");
      expect(screen.getByTestId("separator")).toHaveAttribute(
        "data-slot",
        "date-range-picker-range-separator",
      );
    });

    it("ends the trigger slot in -picker-trigger, the hook the input group reads", () => {
      renderPicker();

      expect(screen.getByTestId("trigger").getAttribute("data-slot")).toMatch(/-picker-trigger$/);
    });

    it("merges a consumer className with the block", () => {
      renderPicker({className: "custom"});

      expect(screen.getByTestId("picker")).toHaveClass("date-range-picker", "custom");
    });

    it("renders two sets of segments and a named trigger button", () => {
      renderPicker({defaultValue: august});

      expect(screen.getAllByRole("spinbutton")).toHaveLength(6);
      expect(getTrigger()).toBeInTheDocument();
    });

    it("hides the indicator and the separator from assistive technology", () => {
      renderPicker();

      expect(screen.getByTestId("indicator")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("indicator").querySelector("svg")).toBeInTheDocument();
      expect(screen.getByTestId("separator")).toHaveAttribute("aria-hidden", "true");
    });

    it("renders a custom separator and indicator in place of the defaults", () => {
      render(
        <DateRangePicker>
          <DateField.Group>
            <DateRangePickerRangeSeparator data-testid="separator">
              to
            </DateRangePickerRangeSeparator>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator>
                <span data-testid="custom">v</span>
              </DateRangePicker.TriggerIndicator>
            </DateRangePicker.Trigger>
          </DateField.Group>
        </DateRangePicker>,
      );

      expect(screen.getByTestId("separator")).toHaveTextContent("to");
      expect(screen.getByTestId("custom")).toBeInTheDocument();
    });

    it("behaves identically as DateRangePicker.Root and DateRangePickerRoot", () => {
      render(
        <>
          <DateRangePicker.Root data-testid="namespaced">
            <Content />
          </DateRangePicker.Root>
          <DateRangePickerRoot data-testid="flat">
            <Content />
          </DateRangePickerRoot>
        </>,
      );

      for (const id of ["namespaced", "flat"]) {
        expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "date-range-picker");
      }
    });

    it("passes a ref to the trigger", () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <DateRangePicker>
          <DateField.Group>
            <DateRangePicker.Trigger ref={ref}>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Group>
        </DateRangePicker>,
      );

      expect(ref.current).toBe(getTrigger());
    });
  });

  describe("popover", () => {
    it("is closed until the trigger is pressed", () => {
      renderPicker();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("opens a dialog holding the range calendar and marks itself with data-slot", async () => {
      const user = setupUser();

      renderPicker({defaultValue: august});
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      expect(dialog).toBeInTheDocument();
      expect(screen.getByTestId("popover")).toHaveAttribute(
        "data-slot",
        "date-range-picker-popover",
      );
      expect(screen.getByTestId("popover")).toHaveClass("date-range-picker__popover");
      expect(within(dialog).getByRole("grid")).toBeInTheDocument();
      expect(screen.getByTestId("trigger")).toHaveAttribute("aria-expanded", "true");
    });

    it("anchors below the field by default", async () => {
      const user = setupUser();

      renderPicker();
      await user.click(getTrigger());
      runAllTimers();

      expect(screen.getByTestId("popover")).toHaveAttribute("data-placement", "bottom");
    });

    it("opens from the keyboard and closes on Escape", async () => {
      const user = setupUser();

      renderPicker();
      getTrigger().focus();
      await user.keyboard("{Enter}");
      runAllTimers();

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      runAllTimers();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("returns focus to the trigger after a keyboard dismissal", async () => {
      const user = setupUser();

      renderPicker();
      getTrigger().focus();
      await user.keyboard("{Enter}");
      runAllTimers();
      await user.keyboard("{Escape}");
      runAllTimers();
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(getTrigger()).toHaveFocus();
    });

    it("reports open changes through onOpenChange", async () => {
      const onOpenChange = vi.fn();
      const user = setupUser();

      renderPicker({onOpenChange});
      await user.click(getTrigger());
      runAllTimers();

      expect(onOpenChange).toHaveBeenLastCalledWith(true);

      await user.keyboard("{Escape}");
      runAllTimers();

      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    });
  });

  describe("selection", () => {
    it("selects a range from the calendar, fills both inputs and closes", async () => {
      const onChange = vi.fn();
      const user = setupUser();

      renderPicker({defaultValue: august, onChange});
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      await user.click(within(dialog).getByRole("button", {name: /August 20/}));
      await user.click(within(dialog).getByRole("button", {name: /August 25/}));
      runAllTimers();

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]![0].start.toString()).toBe("2026-08-20");
      expect(onChange.mock.calls[0]![0].end.toString()).toBe("2026-08-25");

      const days = screen.getAllByRole("spinbutton", {name: /day/i});

      expect(days[0]).toHaveTextContent("20");
      expect(days[1]).toHaveTextContent("25");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("follows a controlled value", async () => {
      function Controlled() {
        const [value, setValue] = useState<RangeValue<DateValue> | null>(august);

        return (
          <DateRangePicker value={value} onChange={setValue}>
            <Content />
            <button
              type="button"
              onClick={() =>
                setValue(range(new CalendarDate(2027, 1, 2), new CalendarDate(2027, 1, 9)))
              }
            >
              Jump
            </button>
          </DateRangePicker>
        );
      }

      const user = setupUser();

      render(<Controlled />);
      await user.click(screen.getByRole("button", {name: "Jump"}));

      const years = screen.getAllByRole("spinbutton", {name: /year/i});

      expect(years[0]).toHaveTextContent("2027");
      expect(years[1]).toHaveTextContent("2027");
      expect(screen.getAllByRole("spinbutton", {name: /day/i})[1]).toHaveTextContent("9");
    });

    it("writes both ends into the hidden form inputs", () => {
      const {container} = renderPicker({defaultValue: august});

      expect(container.querySelector<HTMLInputElement>('input[name="start"]')).toHaveValue(
        "2026-08-15",
      );
      expect(container.querySelector<HTMLInputElement>('input[name="end"]')).toHaveValue(
        "2026-08-18",
      );
    });

    it("disables the days before minValue inside the popover", async () => {
      const user = setupUser();

      renderPicker({
        defaultValue: august,
        minValue: new CalendarDate(2026, 8, 10),
      });
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      expect(within(dialog).getByRole("button", {name: /August 9/})).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(within(dialog).getByRole("button", {name: /August 11/})).not.toHaveAttribute(
        "aria-disabled",
      );
    });

    it("disables the days after maxValue inside the popover", async () => {
      const user = setupUser();

      renderPicker({
        defaultValue: august,
        maxValue: new CalendarDate(2026, 8, 20),
      });
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      expect(within(dialog).getByRole("button", {name: /August 21/})).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      expect(within(dialog).getByRole("button", {name: /August 19/})).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });

  describe("states", () => {
    it("does not open when disabled", async () => {
      const user = setupUser();

      renderPicker({isDisabled: true});
      await user.click(getTrigger());
      runAllTimers();

      expect(getTrigger()).toBeDisabled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not open when read-only", async () => {
      const user = setupUser();

      renderPicker({isReadOnly: true});
      await user.click(getTrigger());
      runAllTimers();

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("marks a required picker with data-required", () => {
      renderPicker({isRequired: true});

      expect(screen.getByTestId("picker")).toHaveAttribute("data-required", "true");
    });

    it("exposes invalid state and shows the field error", () => {
      render(
        <DateRangePicker isInvalid data-testid="picker">
          <Content />
          <Description>Pick dates</Description>
          <FieldError>Dates are not available</FieldError>
        </DateRangePicker>,
      );

      expect(screen.getByTestId("picker")).toHaveAttribute("data-invalid", "true");
      expect(screen.getByText("Dates are not available")).toBeInTheDocument();
    });
  });
});
