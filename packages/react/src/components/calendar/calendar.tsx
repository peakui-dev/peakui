"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {CalendarIdentifier, DateValue} from "@internationalized/date";
import type {CalendarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactElement, ReactNode} from "react";
import type {
  CalendarSelectionMode,
  CalendarProps as RACCalendarProps,
} from "react-aria-components/Calendar";

import {CalendarDate, DateFormatter, createCalendar} from "@internationalized/date";
import {calendarVariants} from "@peakui/styles";
import {cloneElement, createContext, use, useMemo, useRef} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {
  CalendarCell as CalendarCellPrimitive,
  CalendarGridBody as CalendarGridBodyPrimitive,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarGrid as CalendarGridPrimitive,
  CalendarHeaderCell as CalendarHeaderCellPrimitive,
  CalendarHeading as CalendarHeadingPrimitive,
  Calendar as CalendarPrimitive,
  CalendarContext as RACCalendarContext,
} from "react-aria-components/Calendar";
import {useLocale} from "react-aria-components/I18nProvider";
import {useSlottedContext} from "react-aria-components/slots";
import {useControlledState} from "react-stately/useControlledState";
import {cx} from "tailwind-variants";

import {
  getDayViewGridRows,
  getDayViewWeekDayLabels,
  getGregorianYearOffset,
} from "../../utils/calendar.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {YearPickerContext} from "../calendar-year-picker/year-picker-context.ts";
import {IconChevronLeft, IconChevronRight} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * Calendar Context
 * -----------------------------------------------------------------------------------------------*/
type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

interface CalendarDayViewContext {
  days: number;
  firstDayOfWeek?: DayOfWeek;
  timeZone: string;
  visibleRange: {end: DateValue; start: DateValue};
  weekdayStyle?: "narrow" | "short" | "long";
}

interface CalendarContext {
  dayView?: CalendarDayViewContext;
  slots?: ReturnType<typeof calendarVariants>;
}

const CalendarContext = createContext<CalendarContext>({});

interface CalendarContextProviderProps {
  children: ReactNode;
  dayViewBase?: Pick<CalendarDayViewContext, "days" | "firstDayOfWeek">;
  slots: ReturnType<typeof calendarVariants>;
  timeZone: string;
  visibleRange: {end: DateValue; start: DateValue};
}

/*
 * Provides CalendarContext from inside the Calendar render prop, where hooks cannot be called
 * directly.
 */
const CalendarContextProvider = ({
  children,
  dayViewBase,
  slots,
  timeZone,
  visibleRange,
}: CalendarContextProviderProps) => {
  // React Aria rebuilds visibleRange on every render, but the start and end dates it holds are
  // stable, so keying off those keeps the value stable in day view too. Outside day view this
  // collapses to undefined, which is stable either way.
  const {end, start} = visibleRange;
  const dayView = useMemo(
    () => (dayViewBase ? {...dayViewBase, timeZone, visibleRange: {end, start}} : undefined),
    [dayViewBase, timeZone, end, start],
  );
  const value = useMemo<CalendarContext>(() => ({dayView, slots}), [dayView, slots]);

  return <CalendarContext value={value}>{children}</CalendarContext>;
};

/* -------------------------------------------------------------------------------------------------
 * Calendar Root
 * -----------------------------------------------------------------------------------------------*/
interface CalendarRootProps<
  T extends DateValue = DateValue,
  M extends CalendarSelectionMode = "single",
>
  extends RACCalendarProps<T, M>, CalendarVariants {
  /** Whether the year picker is open (controlled). */
  isYearPickerOpen?: boolean;
  /** Called when the year picker opens or closes. */
  onYearPickerOpenChange?: (isYearPickerOpen: boolean) => void;
  /** Whether the year picker starts open (uncontrolled). */
  defaultYearPickerOpen?: boolean;
}

function CalendarRoot<T extends DateValue = DateValue, M extends CalendarSelectionMode = "single">({
  children,
  className,
  defaultYearPickerOpen = false,
  firstDayOfWeek,
  isYearPickerOpen: isYearPickerOpenProp,
  maxValue: maxValueProp,
  minValue: minValueProp,
  onYearPickerOpenChange,
  visibleDuration,
  ...rest
}: CalendarRootProps<T, M>) {
  const isWeekView = visibleDuration?.weeks != null;
  const isDayView = visibleDuration?.days != null;
  const visibleDays = visibleDuration?.days;
  const {locale} = useLocale();
  const slots = useMemo(() => calendarVariants(), []);
  const calendarRef = useRef<HTMLDivElement>(null);
  // A host (DatePicker) hands its bounds down through React Aria's context. The default bounds
  // below are explicit props, which would win over the host's, so they only fill what neither
  // the caller nor the host set.
  const host = useSlottedContext(RACCalendarContext, rest.slot) as
    {maxValue?: T; minValue?: T} | null | undefined;
  const [isYearPickerOpen, setIsYearPickerOpen] = useControlledState(
    isYearPickerOpenProp,
    defaultYearPickerOpen,
    onYearPickerOpenChange,
  );
  const calendar = useMemo(() => {
    const identifier = new DateFormatter(locale).resolvedOptions().calendar as CalendarIdentifier;

    return createCalendar(identifier);
  }, [locale]);
  const gregorianYearOffset = useMemo(
    () => getGregorianYearOffset(calendar.identifier),
    [calendar.identifier],
  );
  // React Aria memoizes the calendar state against minValue and maxValue identity, so these
  // bounds must be stable across renders. Without a bound the year picker would have no range.
  const hostMinValue = host?.minValue;
  const hostMaxValue = host?.maxValue;
  const minValue = useMemo(
    () =>
      minValueProp ??
      hostMinValue ??
      (new CalendarDate(calendar, 1900 + gregorianYearOffset, 1, 1) as unknown as T),
    [minValueProp, hostMinValue, calendar, gregorianYearOffset],
  );
  const maxValue = useMemo(
    () =>
      maxValueProp ??
      hostMaxValue ??
      (new CalendarDate(calendar, 2099 + gregorianYearOffset, 12, 31) as unknown as T),
    [maxValueProp, hostMaxValue, calendar, gregorianYearOffset],
  );
  const dayViewBase = useMemo(
    () => (isDayView && visibleDays != null ? {days: visibleDays, firstDayOfWeek} : undefined),
    [isDayView, visibleDays, firstDayOfWeek],
  );
  const yearPickerContext = useMemo(
    () => ({
      calendarGridSlot: "calendar-grid" as const,
      calendarRef,
      isYearPickerOpen,
      setIsYearPickerOpen,
    }),
    [isYearPickerOpen, setIsYearPickerOpen],
  );

  return (
    <YearPickerContext value={yearPickerContext}>
      <CalendarPrimitive
        ref={calendarRef}
        firstDayOfWeek={firstDayOfWeek}
        maxValue={maxValue}
        minValue={minValue}
        visibleDuration={visibleDuration}
        {...rest}
        data-slot="calendar"
        className={composeTwRenderProps(
          className,
          cx(slots.base(), isWeekView && "calendar--week-view", isDayView && "calendar--day-view"),
        )}
      >
        {(values) => (
          <CalendarContextProvider
            dayViewBase={dayViewBase}
            slots={slots}
            timeZone={values.state.timeZone}
            visibleRange={values.state.visibleRange}
          >
            {typeof children === "function" ? children(values) : children}
          </CalendarContextProvider>
        )}
      </CalendarPrimitive>
    </YearPickerContext>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Calendar Header
 * -----------------------------------------------------------------------------------------------*/
interface CalendarHeaderProps<
  E extends keyof JSX.IntrinsicElements = "header",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const CalendarHeader = <E extends keyof JSX.IntrinsicElements = "header">({
  children,
  className,
  ...props
}: CalendarHeaderProps<E> & Omit<JSX.IntrinsicElements[E], keyof CalendarHeaderProps<E>>) => {
  const {slots} = use(CalendarContext);

  return (
    <dom.header
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.header, className)}
      data-slot="calendar-header"
    >
      {children}
    </dom.header>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar Heading
 * -----------------------------------------------------------------------------------------------*/
interface CalendarHeadingProps extends ComponentPropsWithRef<typeof CalendarHeadingPrimitive> {}

const CalendarHeading = ({className, ...props}: CalendarHeadingProps) => {
  const {slots} = use(CalendarContext);

  return (
    <CalendarHeadingPrimitive
      {...props}
      className={composeSlotClassName(slots?.heading, className)}
      data-slot="calendar-heading"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar NavButton
 * -----------------------------------------------------------------------------------------------*/
interface CalendarNavButtonProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  slot?: "previous" | "next";
}

const CalendarNavButton = ({children, className, slot, ...props}: CalendarNavButtonProps) => {
  const {slots} = use(CalendarContext);
  const Icon = slot === "previous" ? IconChevronLeft : IconChevronRight;

  return (
    <ButtonPrimitive
      slot={slot}
      {...props}
      className={composeTwRenderProps(className, slots?.navButton())}
      data-slot="calendar-nav-button"
    >
      {children || <Icon className={slots?.navButtonIcon()} data-slot="calendar-nav-button-icon" />}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar Grid
 * -----------------------------------------------------------------------------------------------*/
interface CalendarGridProps extends ComponentPropsWithRef<typeof CalendarGridPrimitive> {}

const CalendarGrid = ({
  children,
  className,
  weekdayStyle = "short",
  ...props
}: CalendarGridProps) => {
  const calendarContext = use(CalendarContext);
  const {dayView, slots} = calendarContext;
  // The grid tells the day view's header which weekday style to format with.
  const contextValue = useMemo(
    () => ({...calendarContext, dayView: dayView ? {...dayView, weekdayStyle} : undefined}),
    [calendarContext, dayView, weekdayStyle],
  );

  return (
    <CalendarContext value={contextValue}>
      <CalendarGridPrimitive
        weekdayStyle={weekdayStyle}
        {...props}
        className={composeSlotClassName(slots?.grid, className)}
        data-slot="calendar-grid"
      >
        {children}
      </CalendarGridPrimitive>
    </CalendarContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Day view
 *
 * RAC lays a visibleDuration given in days out as a month grid. From seven days up, the header and
 * body are rebuilt as week-aligned rows of the visible range; below seven days the primitives
 * render as they are.
 * -----------------------------------------------------------------------------------------------*/
interface CalendarDayViewGridHeaderProps {
  children: (day: string) => ReactElement;
  className?: string;
  context: CalendarDayViewContext;
  /** `data-slot` of the rendered thead. RangeCalendar passes its own. */
  dataSlot?: string;
}

const CalendarDayViewGridHeader = ({
  children,
  className,
  context,
  dataSlot = "calendar-grid-header",
}: CalendarDayViewGridHeaderProps) => {
  const {locale} = useLocale();
  const {firstDayOfWeek, timeZone, visibleRange, weekdayStyle = "short"} = context;
  const weekDays = useMemo(
    () =>
      getDayViewWeekDayLabels(visibleRange.start, locale, firstDayOfWeek, weekdayStyle, timeZone),
    [firstDayOfWeek, locale, timeZone, visibleRange.start, weekdayStyle],
  );

  return (
    <dom.thead aria-hidden className={className} data-slot={dataSlot}>
      <tr>{weekDays.map((day, index) => cloneElement(children(day), {key: index}))}</tr>
    </dom.thead>
  );
};

interface CalendarDayViewGridBodyProps {
  children: (date: CalendarDate) => ReactElement;
  className?: string;
  context: CalendarDayViewContext;
  /** `data-slot` of the rendered tbody. RangeCalendar passes its own. */
  dataSlot?: string;
}

const CalendarDayViewGridBody = ({
  children,
  className,
  context,
  dataSlot = "calendar-grid-body",
}: CalendarDayViewGridBodyProps) => {
  const {locale} = useLocale();
  const {firstDayOfWeek, visibleRange} = context;
  const rows = useMemo(
    () => getDayViewGridRows(visibleRange.start, visibleRange.end, locale, firstDayOfWeek),
    [firstDayOfWeek, locale, visibleRange.end, visibleRange.start],
  );

  return (
    <dom.tbody className={className} data-slot={dataSlot}>
      {rows.map((row, weekIndex) => (
        <tr key={weekIndex}>
          {row.map((date, dayIndex) =>
            date ? (
              cloneElement(children(date as CalendarDate), {key: dayIndex})
            ) : (
              <td key={dayIndex} />
            ),
          )}
        </tr>
      ))}
    </dom.tbody>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar GridHeader
 * -----------------------------------------------------------------------------------------------*/
interface CalendarGridHeaderProps extends ComponentPropsWithRef<
  typeof CalendarGridHeaderPrimitive
> {}

const CalendarGridHeader = ({children, className, ...props}: CalendarGridHeaderProps) => {
  const {dayView, slots} = use(CalendarContext);

  if (dayView && dayView.days >= 7 && typeof children === "function") {
    return (
      <CalendarDayViewGridHeader
        className={composeSlotClassName(slots?.gridHeader, className)}
        context={dayView}
      >
        {children}
      </CalendarDayViewGridHeader>
    );
  }

  return (
    <CalendarGridHeaderPrimitive
      {...props}
      className={composeSlotClassName(slots?.gridHeader, className)}
      data-slot="calendar-grid-header"
    >
      {children}
    </CalendarGridHeaderPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar GridBody
 * -----------------------------------------------------------------------------------------------*/
interface CalendarGridBodyProps extends ComponentPropsWithRef<typeof CalendarGridBodyPrimitive> {}

const CalendarGridBody = ({children, className, ...props}: CalendarGridBodyProps) => {
  const {dayView, slots} = use(CalendarContext);

  if (dayView && dayView.days >= 7 && typeof children === "function") {
    return (
      <CalendarDayViewGridBody
        className={composeSlotClassName(slots?.gridBody, className)}
        context={dayView}
      >
        {children}
      </CalendarDayViewGridBody>
    );
  }

  return (
    <CalendarGridBodyPrimitive
      {...props}
      className={composeSlotClassName(slots?.gridBody, className)}
      data-slot="calendar-grid-body"
    >
      {children}
    </CalendarGridBodyPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar HeaderCell
 * -----------------------------------------------------------------------------------------------*/
interface CalendarHeaderCellProps extends ComponentPropsWithRef<
  typeof CalendarHeaderCellPrimitive
> {}

const CalendarHeaderCell = ({className, ...props}: CalendarHeaderCellProps) => {
  const {slots} = use(CalendarContext);

  return (
    <CalendarHeaderCellPrimitive
      {...props}
      className={composeSlotClassName(slots?.headerCell, className)}
      data-slot="calendar-header-cell"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar Cell
 * -----------------------------------------------------------------------------------------------*/
interface CalendarCellProps extends ComponentPropsWithRef<typeof CalendarCellPrimitive> {}

const CalendarCell = ({children, className, ...props}: CalendarCellProps) => {
  const {slots} = use(CalendarContext);

  return (
    <CalendarCellPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.cell())}
      data-slot="calendar-cell"
    >
      {(values) =>
        typeof children === "function" ? children(values) : children || values.formattedDate
      }
    </CalendarCellPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Calendar CellIndicator
 * -----------------------------------------------------------------------------------------------*/
interface CalendarCellIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const CalendarCellIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  className,
  ...props
}: CalendarCellIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof CalendarCellIndicatorProps<E>>) => {
  const {slots} = use(CalendarContext);

  return (
    <dom.span
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      aria-hidden="true"
      className={composeSlotClassName(slots?.cellIndicator, className)}
      data-slot="calendar-cell-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  CalendarCell,
  CalendarCellIndicator,
  CalendarDayViewGridBody,
  CalendarDayViewGridHeader,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
};

export type {
  CalendarDayViewContext,
  CalendarCellIndicatorProps,
  CalendarCellProps,
  CalendarGridBodyProps,
  CalendarGridHeaderProps,
  CalendarGridProps,
  CalendarHeaderCellProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNavButtonProps,
  CalendarRootProps,
};
