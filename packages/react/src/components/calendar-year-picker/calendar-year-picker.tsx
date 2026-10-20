"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {CalendarYearPickerVariants} from "@peakui/styles";
import type {
  ComponentPropsWithRef,
  JSX,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import type {CalendarHeadingProps, CalendarYearPickerProps} from "react-aria/useCalendar";

import {calendarYearPickerVariants} from "@peakui/styles";
import {
  Fragment,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {useCalendarHeading, useCalendarYearPicker} from "react-aria/useCalendar";
import {Button as ButtonPrimitive} from "react-aria-components/Button";

import {getYearRange} from "../../utils/calendar.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconChevronRight} from "../icons.tsx";

import {useCalendarOrRangeState} from "./use-calendar-state.ts";
import {useYearPicker} from "./year-picker-context.ts";

/*
 * The year picker is an internal part shared by Calendar and RangeCalendar: it reads the host's
 * state from RAC's calendar contexts and its open state from YearPickerContext. It has no Root of
 * its own and renders nothing outside a host.
 */

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker Trigger
 *
 * Replaces the host's Heading: a button showing "Month Year" that toggles the picker.
 * -----------------------------------------------------------------------------------------------*/
interface CalendarYearPickerTriggerRenderProps {
  isOpen: boolean;
  monthYear: string;
  toggle: () => void;
}

interface CalendarYearPickerTriggerProps
  extends
    Omit<ComponentPropsWithRef<typeof ButtonPrimitive>, "children">,
    CalendarYearPickerVariants {
  children: ReactNode | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
}

interface CalendarYearPickerTriggerHeadingProps<E extends keyof JSX.IntrinsicElements = "span">
  extends
    DOMRenderProps<E, undefined>,
    CalendarYearPickerVariants,
    Pick<CalendarHeadingProps, "offset" | "format"> {
  children?: ReactNode | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
  className?: string;
}

interface CalendarYearPickerTriggerIndicatorProps<E extends keyof JSX.IntrinsicElements = "span">
  extends DOMRenderProps<E, undefined>, CalendarYearPickerVariants {
  children?: ReactNode | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
  className?: string;
}

interface CalendarYearPickerTriggerContextValue extends CalendarYearPickerTriggerRenderProps {
  slots: ReturnType<typeof calendarYearPickerVariants>;
}

const CalendarYearPickerTriggerContext =
  createContext<CalendarYearPickerTriggerContextValue | null>(null);

function useCalendarYearPickerTriggerContext(): CalendarYearPickerTriggerContextValue {
  const context = use(CalendarYearPickerTriggerContext);

  if (!context) {
    throw new Error(
      "CalendarYearPicker trigger parts must be used within <CalendarYearPicker.Trigger>.",
    );
  }

  return context;
}

const CalendarYearPickerTrigger = ({
  children,
  className,
  onKeyDown,
  onPress,
  ...props
}: CalendarYearPickerTriggerProps) => {
  const {isYearPickerOpen, setIsYearPickerOpen} = useYearPicker();
  const state = useCalendarOrRangeState();
  const monthYear = useCalendarHeading({}, state);
  const slots = useMemo(() => calendarYearPickerVariants(), []);

  const toggle = useCallback(() => {
    setIsYearPickerOpen(!isYearPickerOpen);
  }, [isYearPickerOpen, setIsYearPickerOpen]);

  const values = useMemo<CalendarYearPickerTriggerRenderProps>(
    () => ({isOpen: isYearPickerOpen, monthYear, toggle}),
    [isYearPickerOpen, monthYear, toggle],
  );
  const contextValue = useMemo(() => ({...values, slots}), [slots, values]);

  return (
    <CalendarYearPickerTriggerContext value={contextValue}>
      <ButtonPrimitive
        aria-expanded={isYearPickerOpen}
        // An English default; a consumer-supplied aria-label arrives in `props` and wins.
        aria-label={`${monthYear}, year selector`}
        className={composeTwRenderProps(className, slots.trigger())}
        data-open={isYearPickerOpen || undefined}
        slot={null}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (event.defaultPrevented) {
            return;
          }

          if (event.key === "Escape" && isYearPickerOpen) {
            event.preventDefault();
            setIsYearPickerOpen(false);
          }
        }}
        onPress={(event) => {
          onPress?.(event);
          toggle();
        }}
        {...props}
        data-slot="calendar-year-picker-trigger"
      >
        {typeof children === "function" ? children(values) : children}
      </ButtonPrimitive>
    </CalendarYearPickerTriggerContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker TriggerHeading
 * -----------------------------------------------------------------------------------------------*/
const CalendarYearPickerTriggerHeading = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  format,
  offset,
  ...props
}: CalendarYearPickerTriggerHeadingProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof CalendarYearPickerTriggerHeadingProps<E>>) => {
  const {slots, ...values} = useCalendarYearPickerTriggerContext();
  const state = useCalendarOrRangeState();
  const heading = useCalendarHeading({format, offset}, state);

  return (
    <dom.span
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots.triggerHeading, className)}
      data-slot="calendar-year-picker-trigger-heading"
    >
      {typeof children === "function" ? children(values) : children || heading}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker TriggerIndicator
 * -----------------------------------------------------------------------------------------------*/
const CalendarYearPickerTriggerIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: CalendarYearPickerTriggerIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof CalendarYearPickerTriggerIndicatorProps<E>>) => {
  const {slots, ...values} = useCalendarYearPickerTriggerContext();

  return (
    <dom.span
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      aria-hidden="true"
      className={composeSlotClassName(slots.triggerIndicator, className)}
      data-slot="calendar-year-picker-trigger-indicator"
    >
      {typeof children === "function"
        ? children(values)
        : children || <IconChevronRight height="1em" width="1em" />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker Grid
 *
 * A 3-column listbox of year buttons laid over the host's day grid. Closed, it is transparent and
 * out of the tab order; open, it carries data-open and takes focus on the selected year.
 * -----------------------------------------------------------------------------------------------*/
interface CalendarYearPickerCellRenderProps {
  formattedYear: string;
  isCurrentYear: boolean;
  isOpen: boolean;
  isSelected: boolean;
  selectYear: () => void;
  year: number;
}

interface CalendarYearPickerGridProps<E extends keyof JSX.IntrinsicElements = "div">
  extends
    DOMRenderProps<E, undefined>,
    CalendarYearPickerVariants,
    Pick<CalendarYearPickerProps, "format" | "visibleYears"> {
  children?: ReactNode;
  className?: string;
}

interface CalendarYearPickerGridBodyProps {
  children?: (values: CalendarYearPickerCellRenderProps) => ReactNode;
}

interface CalendarYearPickerCellProps
  extends
    Omit<ComponentPropsWithRef<typeof ButtonPrimitive>, "children">,
    CalendarYearPickerVariants {
  children?: ReactNode | ((values: CalendarYearPickerCellRenderProps) => ReactNode);
  year: number;
}

interface CalendarYearPickerGridContextValue {
  activeYear: number;
  currentYear: number;
  focusedYear: number;
  getFormattedYear: (year: number) => string;
  isYearPickerOpen: boolean;
  selectYear: (year: number) => void;
  setActiveYear: (year: number) => void;
  slots: ReturnType<typeof calendarYearPickerVariants>;
  years: number[];
}

const CalendarYearPickerGridContext = createContext<CalendarYearPickerGridContextValue | null>(
  null,
);

function useCalendarYearPickerGridContext(): CalendarYearPickerGridContextValue {
  const context = use(CalendarYearPickerGridContext);

  if (!context) {
    throw new Error("CalendarYearPicker cells must be used within <CalendarYearPicker.Grid>.");
  }

  return context;
}

const CalendarYearPickerGrid = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  format,
  onKeyDown,
  visibleYears: visibleYearsProp,
  ...props
}: CalendarYearPickerGridProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof CalendarYearPickerGridProps<E>>) => {
  const {calendarGridSlot, calendarRef, isYearPickerOpen, setIsYearPickerOpen} = useYearPicker();
  const state = useCalendarOrRangeState();
  const gridRef = useRef<HTMLDivElement>(null);
  const slots = useMemo(() => calendarYearPickerVariants(), []);

  const visibleYears = useMemo(() => {
    if (visibleYearsProp != null) {
      return visibleYearsProp;
    }

    if (!state.minValue || !state.maxValue) {
      return 20;
    }

    return getYearRange(state.minValue, state.maxValue).length;
  }, [state.maxValue, state.minValue, visibleYearsProp]);

  const {
    "aria-label": yearGridAriaLabel,
    items,
    onChange,
    value: focusedItemId,
  } = useCalendarYearPicker({format, visibleYears}, state);

  /*
   * useCalendarYearPicker returns a new `items` array on every render, so the memos and effects
   * below key off a derived string instead; keyed on `items` they would re-run every render and
   * steal focus back to the selected year.
   */
  const itemsKey = items.map((item) => `${item.id}:${item.date.year}`).join("|");

  /*
   * `item.formatted` depends on the locale, the time zone and `format`, none of which `itemsKey`
   * encodes. Anything serving `formatted` needs its own key, or it keeps rendering the previous
   * format. It stays apart from `itemsKey` so a locale change cannot disturb the focus effects.
   */
  const labelsKey = items.map((item) => item.formatted).join("|");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const years = useMemo(() => items.map((item) => item.date.year), [itemsKey]);
  const itemByYear = useMemo(
    () => new Map(items.map((item) => [item.date.year, item])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemsKey, labelsKey],
  );
  const focusedYear = items[focusedItemId as number]?.date.year ?? state.focusedDate.year;

  const getFormattedYear = useCallback(
    (year: number) => itemByYear.get(year)?.formatted ?? String(year),
    [itemByYear],
  );

  const [activeYear, setActiveYear] = useState(focusedYear);
  const wasYearPickerOpenRef = useRef(false);

  // Lay the year grid over the day grid's box.
  useEffect(() => {
    const yearGrid = gridRef.current;

    if (!yearGrid) return;

    const calendarGrid = calendarRef.current?.querySelector<HTMLElement>(
      `[data-slot='${calendarGridSlot}']`,
    );

    if (calendarGrid) {
      yearGrid.style.top = `${calendarGrid.offsetTop}px`;
      yearGrid.style.height = `${calendarGrid.offsetHeight}px`;
    }
  }, [calendarGridSlot, calendarRef, state.focusedDate]);

  const focusYearCell = useCallback((year: number) => {
    gridRef.current?.querySelector<HTMLElement>(`[data-year='${year}']`)?.focus();
  }, []);

  // Anchor keyboard focus to the selected year when the picker opens, not on every render while
  // it is open.
  useEffect(() => {
    const justOpened = isYearPickerOpen && !wasYearPickerOpenRef.current;

    wasYearPickerOpenRef.current = isYearPickerOpen;

    if (!justOpened) return;

    const [firstYear] = years;

    if (firstYear == null) return;

    const nextActiveYear = years.includes(focusedYear) ? focusedYear : firstYear;

    setActiveYear(nextActiveYear);

    const rafId = requestAnimationFrame(() => {
      focusYearCell(nextActiveYear);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [focusYearCell, focusedYear, isYearPickerOpen, itemsKey, years]);

  // The active year must stay one of the visible years.
  useEffect(() => {
    if (!isYearPickerOpen) return;

    const [firstYear] = years;

    if (firstYear != null && !years.includes(activeYear)) {
      setActiveYear(firstYear);
    }
  }, [activeYear, isYearPickerOpen, itemsKey, years]);

  const selectYear = useCallback(
    (year: number) => {
      const item = itemByYear.get(year);

      if (item == null) {
        return;
      }

      setIsYearPickerOpen(false);
      onChange(item.id);
    },
    [itemByYear, onChange, setIsYearPickerOpen],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    (onKeyDown as ((event: ReactKeyboardEvent<HTMLDivElement>) => void) | undefined)?.(event);

    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "Escape" && isYearPickerOpen) {
      event.preventDefault();
      setIsYearPickerOpen(false);

      return;
    }

    if (!isYearPickerOpen || years.length === 0) {
      return;
    }

    const currentIndex = years.indexOf(activeYear);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex = currentIndex;

    // Three columns: left and right step by one year, up and down by a row. In a right-to-left
    // locale the grid is mirrored, so left and right trade places.
    const isRtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const backward = isRtl ? "ArrowRight" : "ArrowLeft";

    switch (event.key) {
      case forward:
        nextIndex = Math.min(currentIndex + 1, years.length - 1);
        break;
      case backward:
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case "ArrowDown":
        nextIndex = Math.min(currentIndex + 3, years.length - 1);
        break;
      case "ArrowUp":
        nextIndex = Math.max(currentIndex - 3, 0);
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = years.length - 1;
        break;
      default:
        return;
    }

    const nextYear = years[nextIndex];

    if (nextIndex !== currentIndex && nextYear != null) {
      event.preventDefault();
      setActiveYear(nextYear);
      focusYearCell(nextYear);
    }
  };

  // Read per render, not memoized, so it stays right across midnight on Dec 31. A number, so the
  // context memo below still compares it by value.
  const currentYear = new Date().getFullYear();

  const contextValue = useMemo(
    () => ({
      activeYear,
      currentYear,
      focusedYear,
      getFormattedYear,
      isYearPickerOpen,
      selectYear,
      setActiveYear,
      slots,
      years,
    }),
    [
      activeYear,
      currentYear,
      focusedYear,
      getFormattedYear,
      isYearPickerOpen,
      selectYear,
      slots,
      years,
    ],
  );

  return (
    <CalendarYearPickerGridContext value={contextValue}>
      <dom.div
        ref={gridRef}
        aria-hidden={!isYearPickerOpen}
        aria-label={yearGridAriaLabel}
        className={composeSlotClassName(slots.yearGrid, className)}
        data-open={isYearPickerOpen || undefined}
        role="listbox"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        data-slot="calendar-year-picker-grid"
      >
        {children}
      </dom.div>
    </CalendarYearPickerGridContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker GridBody
 * -----------------------------------------------------------------------------------------------*/
const CalendarYearPickerGridBody = ({children}: CalendarYearPickerGridBodyProps) => {
  const {currentYear, focusedYear, getFormattedYear, isYearPickerOpen, selectYear, years} =
    useCalendarYearPickerGridContext();

  return (
    <>
      {years.map((year) => (
        <Fragment key={year}>
          {typeof children === "function" ? (
            children({
              formattedYear: getFormattedYear(year),
              isCurrentYear: year === currentYear,
              isOpen: isYearPickerOpen,
              isSelected: year === focusedYear,
              selectYear: () => selectYear(year),
              year,
            })
          ) : (
            <CalendarYearPickerCell year={year} />
          )}
        </Fragment>
      ))}
    </>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CalendarYearPicker Cell
 * -----------------------------------------------------------------------------------------------*/
const CalendarYearPickerCell = ({
  children,
  className,
  excludeFromTabOrder,
  onFocus,
  onPress,
  year,
  ...props
}: CalendarYearPickerCellProps) => {
  const {
    activeYear,
    currentYear,
    focusedYear,
    getFormattedYear,
    isYearPickerOpen,
    selectYear,
    setActiveYear,
    slots,
  } = useCalendarYearPickerGridContext();
  const isSelected = year === focusedYear;
  const formattedYear = getFormattedYear(year);
  const values: CalendarYearPickerCellRenderProps = {
    formattedYear,
    isCurrentYear: year === currentYear,
    isOpen: isYearPickerOpen,
    isSelected,
    selectYear: () => selectYear(year),
    year,
  };

  return (
    <ButtonPrimitive
      aria-label={formattedYear}
      aria-selected={isSelected}
      className={composeTwRenderProps(className, slots.yearCell())}
      data-selected={isSelected || undefined}
      data-year={year}
      // Roving tabindex: only the active year of an open picker is a tab stop.
      excludeFromTabOrder={excludeFromTabOrder ?? !(isYearPickerOpen && year === activeYear)}
      slot={null}
      onFocus={(event) => {
        onFocus?.(event);
        setActiveYear(year);
      }}
      onPress={(event) => {
        onPress?.(event);
        selectYear(year);
      }}
      {...props}
      data-slot="calendar-year-picker-year-cell"
    >
      {typeof children === "function" ? children(values) : children || formattedYear}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
};

export type {
  CalendarYearPickerCellProps,
  CalendarYearPickerCellRenderProps,
  CalendarYearPickerGridBodyProps,
  CalendarYearPickerGridProps,
  CalendarYearPickerTriggerHeadingProps,
  CalendarYearPickerTriggerIndicatorProps,
  CalendarYearPickerTriggerProps,
  CalendarYearPickerTriggerRenderProps,
};
