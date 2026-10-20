import type {ComponentProps} from "react";

import {CalendarDate} from "@internationalized/date";
import {render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Calendar} from "@/components/calendar/index.ts";
import {
  CalendarYearPicker,
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerTrigger,
} from "@/components/calendar-year-picker/index.ts";

const renderPicker = (
  props: Partial<ComponentProps<typeof Calendar>> = {},
  gridProps: Partial<ComponentProps<typeof CalendarYearPicker.Grid>> = {},
  locale = "en-US",
) =>
  render(
    <I18nProvider locale={locale}>
      <Calendar
        aria-label="Event date"
        defaultValue={new CalendarDate(2026, 8, 15)}
        maxValue={new CalendarDate(2030, 12, 31)}
        minValue={new CalendarDate(2020, 1, 1)}
        {...props}
      >
        <Calendar.Header>
          <CalendarYearPicker.Trigger>
            <CalendarYearPicker.TriggerHeading />
            <CalendarYearPicker.TriggerIndicator />
          </CalendarYearPicker.Trigger>
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
        <CalendarYearPicker.Grid {...gridProps}>
          <CalendarYearPicker.GridBody />
        </CalendarYearPicker.Grid>
      </Calendar>
    </I18nProvider>,
  );

const getTrigger = () => screen.getByRole("button", {name: /year selector/});
const getGrid = () =>
  document.querySelector<HTMLElement>('[data-slot="calendar-year-picker-grid"]')!;
const getYearCells = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="calendar-year-picker-year-cell"]'),
  );

describe("CalendarYearPicker", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("exposes the namespace parts and the flat names as the same components", () => {
    expect(CalendarYearPicker.Trigger).toBe(CalendarYearPickerTrigger);
    expect(CalendarYearPicker.Grid).toBe(CalendarYearPickerGrid);
    expect(CalendarYearPicker.Cell).toBe(CalendarYearPickerCell);
    expect(Calendar.YearPickerTrigger).toBe(CalendarYearPickerTrigger);
  });

  it("exposes the BEM classes and data-slots of every part", async () => {
    renderPicker();

    expect(getTrigger().className).toEqual(
      expect.stringContaining("calendar-year-picker__trigger"),
    );
    expect(getGrid().className).toEqual(expect.stringContaining("calendar-year-picker__year-grid"));
    expect(getGrid()).toHaveAttribute("role", "listbox");
    expect(
      document.querySelector('[data-slot="calendar-year-picker-trigger-heading"]')?.className,
    ).toEqual(expect.stringContaining("calendar-year-picker__trigger-heading"));
    expect(
      document.querySelector('[data-slot="calendar-year-picker-trigger-indicator"]'),
    ).toHaveAttribute("aria-hidden", "true");
    expect(getYearCells()[0]?.className).toEqual(
      expect.stringContaining("calendar-year-picker__year-cell"),
    );
  });

  it("lists every year between the bounds, formatted for the locale", () => {
    renderPicker();

    expect(getYearCells().map((cell) => cell.textContent)).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
      "2027",
      "2028",
      "2029",
      "2030",
    ]);
  });

  it("formats the years in the locale's numerals", () => {
    renderPicker({}, {}, "ar-EG");

    expect(getYearCells()[0]?.textContent).toBe("٢٠٢٠");
  });

  it("keeps the closed grid out of the tab order and hidden from assistive technology", () => {
    renderPicker();

    expect(getGrid()).toHaveAttribute("aria-hidden", "true");
    expect(getGrid()).not.toHaveAttribute("data-open");
    expect(getYearCells().every((cell) => cell.getAttribute("tabindex") === "-1")).toBe(true);
  });

  it("toggles on the trigger and reports the state", async () => {
    renderPicker();

    await user.click(getTrigger());

    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(getGrid()).toHaveAttribute("data-open", "true");

    await user.click(getTrigger());

    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("names the trigger after the month and year, and lets a consumer label override it", () => {
    renderPicker();
    expect(getTrigger()).toHaveAccessibleName("August 2026, year selector");
  });

  it("takes a consumer aria-label over the default", () => {
    render(
      <I18nProvider locale="en-US">
        <Calendar aria-label="Event date">
          <CalendarYearPicker.Trigger aria-label="Choisir l'année">
            <CalendarYearPicker.TriggerHeading />
          </CalendarYearPicker.Trigger>
        </Calendar>
      </I18nProvider>,
    );

    expect(screen.getByRole("button", {name: "Choisir l'année"})).toBeInTheDocument();
  });

  it("makes only the active year a tab stop when open and focuses the selected year", async () => {
    renderPicker();
    await user.click(getTrigger());

    await vi.waitFor(() => expect(screen.getByRole("button", {name: "2026"})).toHaveFocus());

    const tabStops = getYearCells().filter((cell) => cell.getAttribute("tabindex") === "0");

    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toHaveTextContent("2026");
  });

  describe("keyboard", () => {
    const openAtSelectedYear = async () => {
      await user.click(getTrigger());
      await vi.waitFor(() => expect(screen.getByRole("button", {name: "2026"})).toHaveFocus());
    };

    it("moves by one year with the horizontal arrows and by a row with the vertical ones", async () => {
      renderPicker();
      await openAtSelectedYear();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("button", {name: "2027"})).toHaveFocus();

      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("button", {name: "2030"})).toHaveFocus();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", {name: "2029"})).toHaveFocus();

      await user.keyboard("{ArrowUp}");
      expect(screen.getByRole("button", {name: "2026"})).toHaveFocus();
    });

    it("jumps to the first and last year with Home and End", async () => {
      renderPicker();
      await openAtSelectedYear();

      await user.keyboard("{End}");
      expect(screen.getByRole("button", {name: "2030"})).toHaveFocus();

      await user.keyboard("{Home}");
      expect(screen.getByRole("button", {name: "2020"})).toHaveFocus();
    });

    it("stops at the ends of the list", async () => {
      renderPicker();
      await openAtSelectedYear();

      await user.keyboard("{End}{ArrowRight}{ArrowDown}");
      expect(screen.getByRole("button", {name: "2030"})).toHaveFocus();
    });

    it("mirrors the horizontal arrows in a right-to-left grid", async () => {
      renderPicker({}, {style: {direction: "rtl"}});
      await openAtSelectedYear();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByRole("button", {name: "2027"})).toHaveFocus();
    });

    it("closes on Escape from a year", async () => {
      renderPicker();
      await openAtSelectedYear();

      await user.keyboard("{Escape}");
      expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("selects the focused year with Enter", async () => {
      renderPicker();
      await openAtSelectedYear();

      await user.keyboard("{ArrowRight}{Enter}");

      expect(screen.getByRole("grid", {name: /2027/})).toBeInTheDocument();
      expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("custom cells", () => {
    it("hands the cell render props to GridBody children and to a cell's children", async () => {
      render(
        <I18nProvider locale="en-US">
          <Calendar
            defaultYearPickerOpen
            aria-label="Event date"
            defaultValue={new CalendarDate(2026, 8, 15)}
            maxValue={new CalendarDate(2028, 12, 31)}
            minValue={new CalendarDate(2025, 1, 1)}
          >
            <CalendarYearPicker.Trigger>
              <CalendarYearPicker.TriggerHeading />
            </CalendarYearPicker.Trigger>
            <CalendarYearPicker.Grid>
              <CalendarYearPicker.GridBody>
                {({formattedYear, isSelected, year}) => (
                  <CalendarYearPicker.Cell year={year}>
                    {isSelected ? `[${formattedYear}]` : formattedYear}
                  </CalendarYearPicker.Cell>
                )}
              </CalendarYearPicker.GridBody>
            </CalendarYearPicker.Grid>
          </Calendar>
        </I18nProvider>,
      );

      expect(getYearCells().map((cell) => cell.textContent)).toEqual([
        "2025",
        "[2026]",
        "2027",
        "2028",
      ]);
    });

    it("passes the trigger state to a function child", async () => {
      render(
        <I18nProvider locale="en-US">
          <Calendar aria-label="Event date" defaultValue={new CalendarDate(2026, 8, 15)}>
            <CalendarYearPicker.Trigger>
              {({isOpen, monthYear}) => `${monthYear} ${isOpen ? "open" : "shut"}`}
            </CalendarYearPicker.Trigger>
          </Calendar>
        </I18nProvider>,
      );

      expect(getTrigger()).toHaveTextContent("August 2026 shut");

      await user.click(getTrigger());
      expect(getTrigger()).toHaveTextContent("August 2026 open");
    });
  });

  it("throws outside a Calendar", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(
        <CalendarYearPicker.Trigger>
          <CalendarYearPicker.TriggerHeading />
        </CalendarYearPicker.Trigger>,
      ),
    ).toThrow(/within a <Calendar> or <RangeCalendar>/);

    error.mockRestore();
  });
});
