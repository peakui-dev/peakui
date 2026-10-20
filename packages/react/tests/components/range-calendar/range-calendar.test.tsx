import type {DateValue} from "@internationalized/date";
import type {ComponentProps} from "react";

import {CalendarDate} from "@internationalized/date";
import {act, render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {RangeCalendar, RangeCalendarRoot} from "@/components/range-calendar/index.ts";

const MIN_VALUE = new CalendarDate(2020, 1, 1);
const MAX_VALUE = new CalendarDate(2030, 12, 31);

type RangeCalendarProps = Partial<ComponentProps<typeof RangeCalendar>>;

const renderRangeCalendar = (props: RangeCalendarProps = {}, locale = "en-US") =>
  render(
    <I18nProvider locale={locale}>
      <RangeCalendar aria-label="Trip dates" maxValue={MAX_VALUE} minValue={MIN_VALUE} {...props}>
        <RangeCalendar.Header>
          <RangeCalendar.YearPickerTrigger>
            <RangeCalendar.YearPickerTriggerHeading />
            <RangeCalendar.YearPickerTriggerIndicator />
          </RangeCalendar.YearPickerTrigger>
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
        <RangeCalendar.YearPickerGrid>
          <RangeCalendar.YearPickerGridBody>
            {({year}) => <RangeCalendar.YearPickerCell year={year} />}
          </RangeCalendar.YearPickerGridBody>
        </RangeCalendar.YearPickerGrid>
      </RangeCalendar>
    </I18nProvider>,
  );

// The two ends of a range are named after the whole range ("Selected Range: A to B, A selected"),
// so a day is matched by the date that closes its name, without the trailing state.
const getDayCell = (label: string) =>
  screen.getByRole("button", {
    name: (accessibleName) => accessibleName.replace(/ selected$/, "").endsWith(label),
  });

const getYearGrid = () => document.querySelector('[data-slot="calendar-year-picker-grid"]');

const getNavButton = (slot: "next" | "previous") =>
  document.querySelector<HTMLElement>(`[data-slot="range-calendar-nav-button"][slot="${slot}"]`)!;

const august = (start: number, end: number) => ({
  end: new CalendarDate(2026, 8, end),
  start: new CalendarDate(2026, 8, start),
});

describe("RangeCalendar", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("renders a grid with an accessible name", () => {
    renderRangeCalendar({defaultValue: august(10, 15)});

    expect(screen.getByRole("grid", {name: /Trip dates/})).toBeInTheDocument();
  });

  it("exposes the data-slots and the BEM block", () => {
    renderRangeCalendar({defaultValue: august(10, 15)});

    expect(document.querySelector('[data-slot="range-calendar"]')?.className).toEqual(
      expect.stringContaining("range-calendar"),
    );
    for (const slot of [
      "range-calendar-header",
      "range-calendar-grid",
      "range-calendar-grid-header",
      "range-calendar-grid-body",
      "range-calendar-header-cell",
      "range-calendar-nav-button",
      "range-calendar-nav-button-icon",
      "range-calendar-cell-button",
      "calendar-year-picker-trigger",
      "calendar-year-picker-grid",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
    expect(document.querySelectorAll('[data-slot="range-calendar-cell"]').length).toBeGreaterThan(
      0,
    );
  });

  it("merges a consumer className with the block", () => {
    renderRangeCalendar({className: "custom"});

    expect(document.querySelector('[data-slot="range-calendar"]')?.className).toEqual(
      expect.stringMatching(/range-calendar.*custom/),
    );
  });

  it("behaves identically as RangeCalendar.Root and RangeCalendarRoot", () => {
    render(
      <>
        <RangeCalendarRoot aria-label="Flat" />
        <RangeCalendar.Root aria-label="Namespaced" />
      </>,
    );

    expect(document.querySelectorAll('[data-slot="range-calendar"]')).toHaveLength(2);
  });

  describe("range selection", () => {
    it("marks the cells of the range and its two ends", () => {
      renderRangeCalendar({defaultValue: august(10, 14)});

      const cell = (label: string) =>
        getDayCell(label).closest('[data-slot="range-calendar-cell"]');

      for (const day of [10, 11, 12, 13, 14]) {
        expect(cell(`August ${day}, 2026`)).toHaveAttribute("data-selected", "true");
      }
      expect(cell("August 15, 2026")).not.toHaveAttribute("data-selected");
      expect(cell("August 10, 2026")).toHaveAttribute("data-selection-start", "true");
      expect(cell("August 14, 2026")).toHaveAttribute("data-selection-end", "true");
      expect(cell("August 12, 2026")).not.toHaveAttribute("data-selection-start");
    });

    it("flags only the ends as selected on the inner button", () => {
      renderRangeCalendar({defaultValue: august(10, 14)});

      const inner = (label: string) =>
        getDayCell(label).querySelector('[data-slot="range-calendar-cell-button"]');

      expect(inner("August 10, 2026")).toHaveAttribute("data-selected", "true");
      expect(inner("August 14, 2026")).toHaveAttribute("data-selected", "true");
      expect(inner("August 12, 2026")).not.toHaveAttribute("data-selected");
    });

    it("calls onChange with the range after two clicks", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        onChange,
      });
      await user.click(getDayCell("August 10, 2026"));
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getDayCell("August 14, 2026"));

      expect(onChange).toHaveBeenCalledTimes(1);

      const range = onChange.mock.calls[0]?.[0] as {end: DateValue; start: DateValue};

      expect(range.start.toString()).toBe("2026-08-10");
      expect(range.end.toString()).toBe("2026-08-14");
    });

    it("orders the ends when the second click comes first in time", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 14),
        onChange,
      });
      await user.click(getDayCell("August 14, 2026"));
      await user.click(getDayCell("August 10, 2026"));

      const range = onChange.mock.calls[0]?.[0] as {end: DateValue; start: DateValue};

      expect(range.start.toString()).toBe("2026-08-10");
      expect(range.end.toString()).toBe("2026-08-14");
    });

    it("follows a controlled value", () => {
      const {rerender} = render(
        <I18nProvider locale="en-US">
          <RangeCalendar aria-label="Trip dates" value={august(10, 12)}>
            <RangeCalendar.Grid>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </I18nProvider>,
      );

      expect(getDayCell("August 11, 2026").closest("td")).toHaveAttribute("aria-selected", "true");

      rerender(
        <I18nProvider locale="en-US">
          <RangeCalendar aria-label="Trip dates" value={august(20, 22)}>
            <RangeCalendar.Grid>
              <RangeCalendar.GridBody>
                {(date) => <RangeCalendar.Cell date={date} />}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </I18nProvider>,
      );

      expect(getDayCell("August 21, 2026").closest("td")).toHaveAttribute("aria-selected", "true");
      expect(getDayCell("August 11, 2026").closest("td")).not.toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("moves focus with the arrow keys", async () => {
      renderRangeCalendar({defaultValue: august(10, 15)});

      await act(async () => {
        getDayCell("August 10, 2026").focus();
      });
      await user.keyboard("{ArrowRight}");

      expect(getDayCell("August 11, 2026")).toHaveFocus();
    });

    it("blocks selection when disabled", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        isDisabled: true,
        onChange,
      });

      expect(document.querySelector('[data-slot="range-calendar"]')).toHaveAttribute(
        "data-disabled",
        "true",
      );

      await user.click(getDayCell("August 10, 2026"));
      await user.click(getDayCell("August 14, 2026"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("blocks selection when read-only", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        isReadOnly: true,
        onChange,
      });
      await user.click(getDayCell("August 10, 2026"));
      await user.click(getDayCell("August 14, 2026"));

      expect(onChange).not.toHaveBeenCalled();
    });

    it("exposes unavailable dates and refuses a range across one", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        isDateUnavailable: (date) => date.day === 12,
        onChange,
      });

      expect(getDayCell("August 12, 2026")).toHaveAttribute("data-unavailable", "true");

      await user.click(getDayCell("August 10, 2026"));
      await user.click(getDayCell("August 14, 2026"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("allows a range across an unavailable date with allowsNonContiguousRanges", async () => {
      const onChange = vi.fn();

      renderRangeCalendar({
        allowsNonContiguousRanges: true,
        defaultFocusedValue: new CalendarDate(2026, 8, 10),
        isDateUnavailable: (date) => date.day === 12,
        onChange,
      });
      await user.click(getDayCell("August 10, 2026"));
      await user.click(getDayCell("August 14, 2026"));

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("disables the days outside minValue and maxValue", () => {
      renderRangeCalendar({
        maxValue: new CalendarDate(2026, 8, 20),
        minValue: new CalendarDate(2026, 8, 10),
        defaultFocusedValue: new CalendarDate(2026, 8, 15),
      });

      expect(getDayCell("August 5, 2026")).toHaveAttribute("data-disabled", "true");
      expect(getDayCell("August 25, 2026")).toHaveAttribute("data-disabled", "true");
      expect(getDayCell("August 15, 2026")).not.toHaveAttribute("data-disabled");
    });
  });

  describe("navigation", () => {
    it("steps through the months with the nav buttons", async () => {
      renderRangeCalendar({defaultValue: august(10, 15)});

      expect(screen.getByRole("grid", {name: /August 2026/})).toBeInTheDocument();

      await user.click(getNavButton("next"));
      expect(screen.getByRole("grid", {name: /September 2026/})).toBeInTheDocument();

      await user.click(getNavButton("previous"));
      expect(screen.getByRole("grid", {name: /August 2026/})).toBeInTheDocument();
    });

    it("replaces the default icon with children", () => {
      render(
        <RangeCalendar aria-label="Trip dates">
          <RangeCalendar.Header>
            <RangeCalendar.NavButton slot="previous">
              <span>Back</span>
            </RangeCalendar.NavButton>
          </RangeCalendar.Header>
        </RangeCalendar>,
      );

      expect(screen.getByText("Back")).toBeInTheDocument();
      expect(document.querySelector('[data-slot="range-calendar-nav-button-icon"]')).toBeNull();
    });

    it("renders the heading part", () => {
      render(
        <I18nProvider locale="en-US">
          <RangeCalendar aria-label="Trip dates" defaultValue={august(10, 15)}>
            <RangeCalendar.Heading />
          </RangeCalendar>
        </I18nProvider>,
      );

      expect(document.querySelector('[data-slot="range-calendar-heading"]')).toHaveTextContent(
        "August 2026",
      );
    });
  });

  describe("cells", () => {
    it("renders custom cell content and an indicator", () => {
      render(
        <I18nProvider locale="en-US">
          <RangeCalendar aria-label="Trip dates" defaultValue={august(10, 15)}>
            <RangeCalendar.Grid>
              <RangeCalendar.GridBody>
                {(date) => (
                  <RangeCalendar.Cell date={date}>
                    {({formattedDate}) => (
                      <>
                        {formattedDate}
                        {date.day === 15 && <RangeCalendar.CellIndicator />}
                      </>
                    )}
                  </RangeCalendar.Cell>
                )}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </I18nProvider>,
      );

      const indicators = document.querySelectorAll('[data-slot="range-calendar-cell-indicator"]');

      expect(indicators.length).toBeGreaterThan(0);
      expect(indicators[0]).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("views", () => {
    it("lays out a day view of seven days from the visible range", () => {
      renderRangeCalendar({
        defaultFocusedValue: new CalendarDate(2026, 8, 15),
        visibleDuration: {days: 7},
      });

      expect(document.querySelector('[data-slot="range-calendar"]')?.className).toEqual(
        expect.stringContaining("range-calendar--day-view"),
      );
      expect(document.querySelectorAll('[data-slot="range-calendar-grid-header"] th')).toHaveLength(
        7,
      );
      expect(document.querySelector('[data-slot="calendar-grid-header"]')).toBeNull();
      expect(document.querySelector('[data-slot="range-calendar-grid-body"]')).not.toBeNull();
      expect(getDayCell("August 15, 2026")).toBeInTheDocument();
    });

    it("marks a week view on the root", () => {
      renderRangeCalendar({visibleDuration: {weeks: 2}});

      expect(document.querySelector('[data-slot="range-calendar"]')?.className).toEqual(
        expect.stringContaining("range-calendar--week-view"),
      );
    });
  });

  describe("year picker", () => {
    it("opens from the trigger over the range calendar's grid", async () => {
      renderRangeCalendar({defaultValue: august(10, 15)});

      const trigger = screen.getByRole("button", {name: /year selector/});

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(getYearGrid()).toHaveAttribute("aria-hidden", "true");

      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(getYearGrid()).not.toHaveAttribute("aria-hidden", "true");
    });

    it("selects a year and closes", async () => {
      renderRangeCalendar({defaultValue: august(10, 15)});

      await user.click(screen.getByRole("button", {name: /year selector/}));
      await user.click(screen.getByRole("button", {name: "2028"}));

      expect(screen.getByRole("grid", {name: /2028/})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("starts open with defaultYearPickerOpen", () => {
      renderRangeCalendar({defaultYearPickerOpen: true});

      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("reports changes and follows isYearPickerOpen", async () => {
      const onYearPickerOpenChange = vi.fn();

      renderRangeCalendar({isYearPickerOpen: false, onYearPickerOpenChange});
      await user.click(screen.getByRole("button", {name: /year selector/}));

      expect(onYearPickerOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByRole("button", {name: /year selector/})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  describe("international calendars", () => {
    it("shows the Persian calendar for a Persian locale", () => {
      renderRangeCalendar(
        {defaultFocusedValue: new CalendarDate(2026, 8, 15)},
        "fa-IR-u-ca-persian",
      );

      expect(screen.getByRole("grid")).toHaveAccessibleName(/۱۴۰۵/);
    });
  });
});
