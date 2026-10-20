import type {DateValue} from "@internationalized/date";
import type {ComponentProps} from "react";

import {CalendarDate} from "@internationalized/date";
import {act, cleanup, render, screen, setupUser, within} from "@peakui/testing/helpers";
import {createRef, useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Calendar} from "@/components/calendar/index.ts";
import {DateField} from "@/components/date-field/index.ts";
import {DatePicker, DatePickerRoot} from "@/components/date-picker/index.ts";
import {Description} from "@/components/description/index.ts";
import {FieldError} from "@/components/field-error/index.ts";
import {Label} from "@/components/label/index.ts";

/*
 * Overlay state updates run through the timers wrapper, as the select suite records.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

const Content = ({indicator}: {indicator?: React.ReactNode}) => (
  <>
    <Label>Date</Label>
    <DateField.Group data-testid="group">
      <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      <DateField.Suffix>
        <DatePicker.Trigger data-testid="trigger">
          <DatePicker.TriggerIndicator data-testid="indicator">
            {indicator}
          </DatePicker.TriggerIndicator>
        </DatePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <DatePicker.Popover data-testid="popover">
      <Calendar aria-label="Date">
        <Calendar.Header>
          <Calendar.Heading />
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </DatePicker.Popover>
  </>
);

function renderPicker(props: Partial<ComponentProps<typeof DatePicker>> = {}) {
  return render(
    <I18nProvider locale="en-US">
      <DatePicker data-testid="picker" name="date" {...props}>
        <Content />
      </DatePicker>
    </I18nProvider>,
  );
}

const getTrigger = () => screen.getByRole("button", {name: /calendar/i});

describe("DatePicker", () => {
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

      expect(screen.getByTestId("picker")).toHaveClass("date-picker");
      expect(screen.getByTestId("picker")).toHaveAttribute("data-slot", "date-picker");
      expect(screen.getByTestId("trigger")).toHaveClass("date-picker__trigger");
      expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "date-picker-trigger");
      expect(screen.getByTestId("indicator")).toHaveClass("date-picker__trigger-indicator");
      expect(screen.getByTestId("indicator")).toHaveAttribute(
        "data-slot",
        "date-picker-trigger-indicator",
      );
    });

    it("merges a consumer className with the block", () => {
      renderPicker({className: "custom"});

      expect(screen.getByTestId("picker")).toHaveClass("date-picker", "custom");
    });

    it("renders the field segments and a named trigger button", () => {
      renderPicker({defaultValue: new CalendarDate(2026, 8, 15)});

      expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
      expect(getTrigger()).toBeInTheDocument();
    });

    it("hides the indicator from assistive technology and renders the default icon", () => {
      renderPicker();

      expect(screen.getByTestId("indicator")).toHaveAttribute("aria-hidden", "true");
      expect(screen.getByTestId("indicator").querySelector("svg")).toBeInTheDocument();
    });

    it("renders a custom indicator in place of the default icon", () => {
      render(
        <DatePicker name="date">
          <Content indicator={<span data-testid="custom">v</span>} />
        </DatePicker>,
      );

      expect(screen.getByTestId("custom")).toBeInTheDocument();
    });

    it("behaves identically as DatePicker.Root and DatePickerRoot", () => {
      render(
        <>
          <DatePicker.Root data-testid="namespaced" name="a">
            <Content />
          </DatePicker.Root>
          <DatePickerRoot data-testid="flat" name="b">
            <Content />
          </DatePickerRoot>
        </>,
      );

      for (const id of ["namespaced", "flat"]) {
        expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "date-picker");
      }
    });

    it("passes a ref to the trigger", () => {
      const ref = createRef<HTMLButtonElement>();

      render(
        <DatePicker name="date">
          <DateField.Group>
            <DateField.Input>
              {(segment) => <DateField.Segment segment={segment} />}
            </DateField.Input>
            <DatePicker.Trigger ref={ref}>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Group>
        </DatePicker>,
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

    it("opens a dialog holding the calendar and marks itself with data-slot", async () => {
      const user = setupUser();

      renderPicker({defaultValue: new CalendarDate(2026, 8, 15)});
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      expect(dialog).toBeInTheDocument();
      expect(screen.getByTestId("popover")).toHaveAttribute("data-slot", "date-picker-popover");
      expect(screen.getByTestId("popover")).toHaveClass("date-picker__popover");
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
    it("selects a date from the calendar, fills the field and closes", async () => {
      const onChange = vi.fn();
      const user = setupUser();

      renderPicker({defaultValue: new CalendarDate(2026, 8, 15), onChange});
      await user.click(getTrigger());
      runAllTimers();
      await user.click(within(screen.getByRole("dialog")).getByRole("button", {name: /August 20/}));
      runAllTimers();

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange.mock.calls[0]![0].toString()).toBe("2026-08-20");
      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("20");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("follows a controlled value", async () => {
      function Controlled() {
        const [value, setValue] = useState<DateValue | null>(new CalendarDate(2026, 8, 15));

        return (
          <DatePicker name="date" value={value} onChange={setValue}>
            <Content />
            <button type="button" onClick={() => setValue(new CalendarDate(2027, 1, 2))}>
              Jump
            </button>
          </DatePicker>
        );
      }

      const user = setupUser();

      render(<Controlled />);
      await user.click(screen.getByRole("button", {name: "Jump"}));

      expect(screen.getByRole("spinbutton", {name: /year/i})).toHaveTextContent("2027");
      expect(screen.getByRole("spinbutton", {name: /day/i})).toHaveTextContent("2");
    });

    it("writes the value into the hidden form input", () => {
      const {container} = renderPicker({defaultValue: new CalendarDate(2026, 8, 15)});

      expect(container.querySelector<HTMLInputElement>('input[name="date"]')).toHaveValue(
        "2026-08-15",
      );
    });

    it("applies minValue to the dates the calendar offers", async () => {
      const user = setupUser();

      renderPicker({
        defaultValue: new CalendarDate(2026, 8, 15),
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
  });

  describe("year picker", () => {
    it("opens the year picker of a calendar inside the popover and selects a year", async () => {
      const user = setupUser();

      render(
        <I18nProvider locale="en-US">
          <DatePicker defaultValue={new CalendarDate(2026, 8, 15)} name="date">
            <DateField.Group>
              <DateField.Input>
                {(segment) => <DateField.Segment segment={segment} />}
              </DateField.Input>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar aria-label="Date">
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator />
                  </Calendar.YearPickerTrigger>
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {({year}) => <Calendar.YearPickerCell year={year} />}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
        </I18nProvider>,
      );
      await user.click(getTrigger());
      runAllTimers();

      const dialog = screen.getByRole("dialog");

      await user.click(within(dialog).getByRole("button", {name: /August 2026/}));
      runAllTimers();
      await user.click(within(dialog).getByRole("button", {name: "2030"}));
      runAllTimers();

      // The grid now shows days of 2030: each cell's label ends with the year.
      expect(within(dialog).getAllByRole("button", {name: /, 2030$/}).length).toBeGreaterThan(0);
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
        <DatePicker isInvalid data-testid="picker" name="date">
          <Content />
          <Description>Pick a date</Description>
          <FieldError>Date is not available</FieldError>
        </DatePicker>,
      );

      expect(screen.getByTestId("picker")).toHaveAttribute("data-invalid", "true");
      expect(screen.getByText("Date is not available")).toBeInTheDocument();
    });
  });
});
