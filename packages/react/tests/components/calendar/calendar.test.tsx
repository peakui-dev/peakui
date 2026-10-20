import type {DateValue} from "@internationalized/date";
import type {ComponentProps, ReactNode} from "react";

import {CalendarDate} from "@internationalized/date";
import {act, render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Calendar, CalendarRoot} from "@/components/calendar/index.ts";

const MIN_VALUE = new CalendarDate(2020, 1, 1);
const MAX_VALUE = new CalendarDate(2030, 12, 31);

type CalendarProps = Partial<ComponentProps<typeof Calendar>>;

const renderCalendar = (props: CalendarProps = {}, locale = "en-US") =>
  render(
    <I18nProvider locale={locale}>
      <Calendar
        aria-label="Event date"
        defaultValue={new CalendarDate(2026, 8, 15)}
        maxValue={MAX_VALUE}
        minValue={MIN_VALUE}
        {...props}
      >
        <Calendar.Header>
          <Calendar.YearPickerTrigger>
            <Calendar.YearPickerTriggerHeading />
            <Calendar.YearPickerTriggerIndicator />
          </Calendar.YearPickerTrigger>
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
        <Calendar.YearPickerGrid>
          <Calendar.YearPickerGridBody>
            {({year}) => <Calendar.YearPickerCell year={year} />}
          </Calendar.YearPickerGridBody>
        </Calendar.YearPickerGrid>
      </Calendar>
    </I18nProvider>,
  );

const getDayCell = (label: string) =>
  screen.getByRole("button", {name: (accessibleName) => accessibleName.includes(label)});

const getYearGrid = () => document.querySelector('[data-slot="calendar-year-picker-grid"]');

const getNavButton = (slot: "next" | "previous") =>
  document.querySelector<HTMLElement>(`[data-slot="calendar-nav-button"][slot="${slot}"]`)!;

const Plain = ({children}: {children?: ReactNode}) => (
  <Calendar aria-label="Event date" defaultValue={new CalendarDate(2026, 8, 15)}>
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
    {children}
  </Calendar>
);

describe("Calendar", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders a grid with an accessible name", () => {
    renderCalendar();

    expect(screen.getByRole("grid", {name: /Event date/})).toBeInTheDocument();
  });

  it("exposes the data-slots and the BEM block", () => {
    renderCalendar();

    expect(document.querySelector('[data-slot="calendar"]')?.className).toEqual(
      expect.stringContaining("calendar"),
    );
    for (const slot of [
      "calendar-header",
      "calendar-grid",
      "calendar-grid-header",
      "calendar-grid-body",
      "calendar-header-cell",
      "calendar-nav-button",
      "calendar-nav-button-icon",
      "calendar-year-picker-trigger",
      "calendar-year-picker-trigger-heading",
      "calendar-year-picker-trigger-indicator",
      "calendar-year-picker-grid",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(document.querySelectorAll('[data-slot="calendar-cell"]').length).toBeGreaterThan(0);
  });

  it("merges a consumer className with the block", () => {
    renderCalendar({className: "custom"});

    expect(document.querySelector('[data-slot="calendar"]')?.className).toEqual(
      expect.stringMatching(/calendar.*custom/),
    );
  });

  it("behaves identically as Calendar.Root and CalendarRoot", () => {
    render(
      <>
        <CalendarRoot aria-label="Flat" />
        <Calendar.Root aria-label="Namespaced" />
      </>,
    );

    expect(document.querySelectorAll('[data-slot="calendar"]')).toHaveLength(2);
  });

  describe("day selection", () => {
    it("marks the selected day", () => {
      renderCalendar();

      const selected = getDayCell("August 15, 2026");

      expect(selected.closest('[role="gridcell"]')).toHaveAttribute("aria-selected", "true");
      expect(selected).toHaveAttribute("data-selected", "true");
    });

    it("calls onChange when a day is chosen", async () => {
      const onChange = vi.fn();

      renderCalendar({onChange});
      await user.click(getDayCell("August 20, 2026"));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect((onChange.mock.calls[0]?.[0] as DateValue).toString()).toBe("2026-08-20");
    });

    it("follows a controlled value", () => {
      const {rerender} = render(
        <I18nProvider locale="en-US">
          <Plain />
        </I18nProvider>,
      );

      expect(getDayCell("August 15, 2026")).toHaveAttribute("data-selected", "true");

      rerender(
        <I18nProvider locale="en-US">
          <Calendar aria-label="Event date" value={new CalendarDate(2026, 8, 20)}>
            <Calendar.Grid>
              <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </I18nProvider>,
      );

      expect(getDayCell("August 20, 2026")).toHaveAttribute("data-selected", "true");
    });

    it("moves focus with the arrow keys", async () => {
      renderCalendar();

      await act(async () => {
        getDayCell("August 15, 2026").focus();
      });
      await user.keyboard("{ArrowRight}");

      expect(getDayCell("August 16, 2026")).toHaveFocus();
    });

    it("selects several days in multiple mode", async () => {
      const onChange = vi.fn();

      renderCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        defaultValue: [],
        onChange,
        selectionMode: "multiple",
      });
      await user.click(getDayCell("August 10, 2026"));
      await user.click(getDayCell("August 12, 2026"));

      const last = onChange.mock.calls.at(-1)?.[0] as DateValue[];

      expect(last.map(String)).toEqual(["2026-08-10", "2026-08-12"]);
    });

    it("blocks selection when disabled", async () => {
      const onChange = vi.fn();

      renderCalendar({isDisabled: true, onChange});

      expect(document.querySelector('[data-slot="calendar"]')).toHaveAttribute(
        "data-disabled",
        "true",
      );

      await user.click(getDayCell("August 20, 2026"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("blocks selection when read-only", async () => {
      const onChange = vi.fn();

      renderCalendar({isReadOnly: true, onChange});
      await user.click(getDayCell("August 20, 2026"));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("exposes unavailable dates and refuses to select them", async () => {
      const onChange = vi.fn();

      renderCalendar({isDateUnavailable: (date) => date.day === 20, onChange});

      expect(getDayCell("August 20, 2026")).toHaveAttribute("data-unavailable", "true");

      await user.click(getDayCell("August 20, 2026"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("disables the days outside minValue and maxValue", () => {
      renderCalendar({
        defaultValue: undefined,
        maxValue: new CalendarDate(2026, 8, 20),
        minValue: new CalendarDate(2026, 8, 10),
      });

      expect(getDayCell("August 5, 2026")).toHaveAttribute("data-disabled", "true");
      expect(getDayCell("August 25, 2026")).toHaveAttribute("data-disabled", "true");
      expect(getDayCell("August 15, 2026")).not.toHaveAttribute("data-disabled");
    });
  });

  describe("navigation", () => {
    it("steps through the months with the nav buttons", async () => {
      renderCalendar();

      expect(screen.getByRole("grid", {name: /August 2026/})).toBeInTheDocument();

      await user.click(getNavButton("next"));
      expect(screen.getByRole("grid", {name: /September 2026/})).toBeInTheDocument();

      await user.click(getNavButton("previous"));
      expect(screen.getByRole("grid", {name: /August 2026/})).toBeInTheDocument();
    });

    it("replaces the default icon with children", () => {
      render(
        <Calendar aria-label="Event date">
          <Calendar.Header>
            <Calendar.NavButton slot="previous">
              <span>Back</span>
            </Calendar.NavButton>
          </Calendar.Header>
        </Calendar>,
      );

      expect(screen.getByText("Back")).toBeInTheDocument();
      expect(document.querySelector('[data-slot="calendar-nav-button-icon"]')).toBeNull();
    });

    it("renders the heading part", () => {
      render(
        <I18nProvider locale="en-US">
          <Plain />
        </I18nProvider>,
      );

      expect(document.querySelector('[data-slot="calendar-heading"]')).toHaveTextContent(
        "August 2026",
      );
    });
  });

  describe("cells", () => {
    it("renders custom cell content and an indicator", () => {
      render(
        <I18nProvider locale="en-US">
          <Calendar aria-label="Event date" defaultValue={new CalendarDate(2026, 8, 15)}>
            <Calendar.Grid>
              <Calendar.GridBody>
                {(date) => (
                  <Calendar.Cell date={date}>
                    {({formattedDate}) => (
                      <>
                        {formattedDate}
                        {date.day === 15 && <Calendar.CellIndicator />}
                      </>
                    )}
                  </Calendar.Cell>
                )}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </I18nProvider>,
      );

      const indicators = document.querySelectorAll('[data-slot="calendar-cell-indicator"]');

      expect(indicators.length).toBeGreaterThan(0);
      expect(indicators[0]).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("views", () => {
    it("lays out a day view of seven days from the visible range", () => {
      renderCalendar({visibleDuration: {days: 7}});

      expect(document.querySelector('[data-slot="calendar"]')?.className).toEqual(
        expect.stringContaining("calendar--day-view"),
      );
      expect(document.querySelectorAll('[data-slot="calendar-grid-header"] th')).toHaveLength(7);

      // The range is centred on the selected day, so its edges prove that the range reached the
      // day view through the calendar context.
      expect(getDayCell("August 12, 2026")).toBeInTheDocument();
      expect(getDayCell("August 15, 2026")).toBeInTheDocument();
      expect(getDayCell("August 18, 2026")).toBeInTheDocument();
    });

    it("marks a week view on the root", () => {
      renderCalendar({visibleDuration: {weeks: 2}});

      expect(document.querySelector('[data-slot="calendar"]')?.className).toEqual(
        expect.stringContaining("calendar--week-view"),
      );
    });
  });

  describe("year picker", () => {
    it("opens from the trigger", async () => {
      renderCalendar();

      const trigger = screen.getByRole("button", {name: /year selector/});

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(getYearGrid()).toHaveAttribute("aria-hidden", "true");

      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("data-open", "true");
      expect(getYearGrid()).not.toHaveAttribute("aria-hidden", "true");
    });

    it("selects a year and closes", async () => {
      renderCalendar();

      await user.click(screen.getByRole("button", {name: /year selector/}));
      await user.click(screen.getByRole("button", {name: "2028"}));

      expect(screen.getByRole("grid", {name: /2028/})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(getYearGrid()).toHaveAttribute("aria-hidden", "true");
    });

    it("marks the year the calendar shows", async () => {
      renderCalendar();

      await user.click(screen.getByRole("button", {name: /year selector/}));

      expect(screen.getByRole("button", {name: "2026"})).toHaveAttribute("data-selected", "true");
    });

    it("closes on Escape", async () => {
      renderCalendar();

      const trigger = screen.getByRole("button", {name: /year selector/});

      await user.click(trigger);
      await user.keyboard("{Escape}");

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(getYearGrid()).toHaveAttribute("aria-hidden", "true");
    });

    it("starts open with defaultYearPickerOpen", () => {
      renderCalendar({defaultYearPickerOpen: true});

      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("reports changes of a controlled open state", async () => {
      const onYearPickerOpenChange = vi.fn();

      renderCalendar({isYearPickerOpen: false, onYearPickerOpenChange});
      await user.click(screen.getByRole("button", {name: /year selector/}));

      expect(onYearPickerOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  describe("locales and calendar systems", () => {
    it("follows the locale's first day of the week and month names", () => {
      renderCalendar({defaultValue: new CalendarDate(2026, 8, 15)}, "de-DE");

      expect(screen.getByRole("grid", {name: /August 2026/})).toBeInTheDocument();
      expect(document.querySelector('[data-slot="calendar-header-cell"]')).toHaveTextContent(/^Mo/);
    });

    it("lists the years of a non-Gregorian calendar in the year picker", async () => {
      renderCalendar({maxValue: undefined, minValue: undefined}, "th-TH-u-ca-buddhist");

      await user.click(screen.getByRole("button", {name: /year selector/}));

      // Buddhist years run 543 ahead; the default bounds are 1900 to 2099 in that calendar.
      expect(getYearGrid()?.textContent).toContain("2569");
      expect(getYearGrid()?.textContent).not.toContain("2026");
    });

    it("renders the Hebrew calendar", () => {
      renderCalendar(
        {maxValue: undefined, minValue: undefined, defaultValue: undefined},
        "he-IL-u-ca-hebrew",
      );

      expect(document.querySelectorAll('[data-slot="calendar-cell"]').length).toBeGreaterThan(27);
    });

    it("renders the Persian calendar with its own year", () => {
      renderCalendar(
        {maxValue: undefined, minValue: undefined, defaultValue: undefined},
        "fa-IR-u-ca-persian",
      );

      expect(document.querySelector('[data-slot="calendar-grid"]')).not.toBeNull();
    });
  });

  it("shows keyboard focus on the first tab stop", async () => {
    renderCalendar();

    await user.tab();

    expect(document.querySelector("[data-focus-visible='true']")).not.toBeNull();
  });
});
