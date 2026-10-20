"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {CalendarDayViewContext} from "../calendar/calendar.tsx";
import type {CalendarIdentifier, DateValue} from "@internationalized/date";
import type {RangeCalendarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {RangeCalendarProps as RACRangeCalendarProps} from "react-aria-components/RangeCalendar";

import {CalendarDate, DateFormatter, createCalendar} from "@internationalized/date";
import {rangeCalendarVariants} from "@peakui/styles";
import {createContext, use, useMemo, useRef} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {useLocale} from "react-aria-components/I18nProvider";
import {
  CalendarCell as CalendarCellPrimitive,
  CalendarGridBody as CalendarGridBodyPrimitive,
  CalendarGridHeader as CalendarGridHeaderPrimitive,
  CalendarGrid as CalendarGridPrimitive,
  CalendarHeaderCell as CalendarHeaderCellPrimitive,
  CalendarHeading as CalendarHeadingPrimitive,
  RangeCalendarContext as RACRangeCalendarContext,
  RangeCalendar as RangeCalendarPrimitive,
} from "react-aria-components/RangeCalendar";
import {useSlottedContext} from "react-aria-components/slots";
import {useControlledState} from "react-stately/useControlledState";
import {cx} from "tailwind-variants";

import {dataAttr} from "../../utils/assertion.ts";
import {getGregorianYearOffset} from "../../utils/calendar.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {CalendarDayViewGridBody, CalendarDayViewGridHeader} from "../calendar/calendar.tsx";
import {YearPickerContext} from "../calendar-year-picker/year-picker-context.ts";
import {IconChevronLeft, IconChevronRight} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Context
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarContext {
  dayView?: CalendarDayViewContext;
  slots?: ReturnType<typeof rangeCalendarVariants>;
}

const RangeCalendarContext = createContext<RangeCalendarContext>({});

interface RangeCalendarContextProviderProps {
  children: ReactNode;
  dayViewBase?: Pick<CalendarDayViewContext, "days" | "firstDayOfWeek">;
  slots: ReturnType<typeof rangeCalendarVariants>;
  timeZone: string;
  visibleRange: {end: DateValue; start: DateValue};
}

/*
 * Provides RangeCalendarContext from inside the RangeCalendar render prop, where hooks cannot be
 * called directly.
 */
const RangeCalendarContextProvider = ({
  children,
  dayViewBase,
  slots,
  timeZone,
  visibleRange,
}: RangeCalendarContextProviderProps) => {
  // React Aria rebuilds visibleRange on every render, but the start and end dates it holds are
  // stable, so keying off those keeps the value stable in day view too.
  const {end, start} = visibleRange;
  const dayView = useMemo(
    () => (dayViewBase ? {...dayViewBase, timeZone, visibleRange: {end, start}} : undefined),
    [dayViewBase, timeZone, end, start],
  );
  const value = useMemo<RangeCalendarContext>(() => ({dayView, slots}), [dayView, slots]);

  return <RangeCalendarContext value={value}>{children}</RangeCalendarContext>;
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Root
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarRootProps<T extends DateValue = DateValue>
  extends RACRangeCalendarProps<T>, RangeCalendarVariants {
  /** Whether the year picker is open (controlled). */
  isYearPickerOpen?: boolean;
  /** Called when the year picker opens or closes. */
  onYearPickerOpenChange?: (isYearPickerOpen: boolean) => void;
  /** Whether the year picker starts open (uncontrolled). */
  defaultYearPickerOpen?: boolean;
}

function RangeCalendarRoot<T extends DateValue = DateValue>({
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
}: RangeCalendarRootProps<T>) {
  const isWeekView = visibleDuration?.weeks != null;
  const isDayView = visibleDuration?.days != null;
  const visibleDays = visibleDuration?.days;
  const {locale} = useLocale();
  // A host (DateRangePicker) hands its bounds down through React Aria's context. The default
  // bounds below are explicit props, which would win over the host's, so they only fill what
  // neither the caller nor the host set.
  const host = useSlottedContext(RACRangeCalendarContext, rest.slot) as
    {maxValue?: T; minValue?: T} | null | undefined;
  const slots = useMemo(() => rangeCalendarVariants(), []);
  const calendarRef = useRef<HTMLDivElement>(null);
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
      calendarGridSlot: "range-calendar-grid" as const,
      calendarRef,
      isYearPickerOpen,
      setIsYearPickerOpen,
    }),
    [isYearPickerOpen, setIsYearPickerOpen],
  );

  return (
    <YearPickerContext value={yearPickerContext}>
      <RangeCalendarPrimitive
        ref={calendarRef}
        firstDayOfWeek={firstDayOfWeek}
        maxValue={maxValue}
        minValue={minValue}
        visibleDuration={visibleDuration}
        {...rest}
        data-slot="range-calendar"
        className={composeTwRenderProps(
          className,
          cx(
            slots.base(),
            isWeekView && "range-calendar--week-view",
            isDayView && "range-calendar--day-view",
          ),
        )}
      >
        {(values) => (
          <RangeCalendarContextProvider
            dayViewBase={dayViewBase}
            slots={slots}
            timeZone={values.state.timeZone}
            visibleRange={values.state.visibleRange}
          >
            {typeof children === "function" ? children(values) : children}
          </RangeCalendarContextProvider>
        )}
      </RangeCalendarPrimitive>
    </YearPickerContext>
  );
}

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Header
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarHeaderProps<
  E extends keyof JSX.IntrinsicElements = "header",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const RangeCalendarHeader = <E extends keyof JSX.IntrinsicElements = "header">({
  children,
  className,
  ...props
}: RangeCalendarHeaderProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof RangeCalendarHeaderProps<E>>) => {
  const {slots} = use(RangeCalendarContext);

  return (
    <dom.header
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.header, className)}
      data-slot="range-calendar-header"
    >
      {children}
    </dom.header>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Heading
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarHeadingProps extends ComponentPropsWithRef<
  typeof CalendarHeadingPrimitive
> {}

const RangeCalendarHeading = ({className, ...props}: RangeCalendarHeadingProps) => {
  const {slots} = use(RangeCalendarContext);

  return (
    <CalendarHeadingPrimitive
      {...props}
      className={composeSlotClassName(slots?.heading, className)}
      data-slot="range-calendar-heading"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar NavButton
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarNavButtonProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  slot?: "previous" | "next";
}

const RangeCalendarNavButton = ({
  children,
  className,
  slot,
  ...props
}: RangeCalendarNavButtonProps) => {
  const {slots} = use(RangeCalendarContext);
  const Icon = slot === "previous" ? IconChevronLeft : IconChevronRight;

  return (
    <ButtonPrimitive
      slot={slot}
      {...props}
      className={composeTwRenderProps(className, slots?.navButton())}
      data-slot="range-calendar-nav-button"
    >
      {children || (
        <Icon className={slots?.navButtonIcon()} data-slot="range-calendar-nav-button-icon" />
      )}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Grid
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarGridProps extends ComponentPropsWithRef<typeof CalendarGridPrimitive> {}

const RangeCalendarGrid = ({
  children,
  className,
  weekdayStyle = "short",
  ...props
}: RangeCalendarGridProps) => {
  const rangeCalendarContext = use(RangeCalendarContext);
  const {dayView, slots} = rangeCalendarContext;
  // The grid tells the day view's header which weekday style to format with.
  const contextValue = useMemo(
    () => ({
      ...rangeCalendarContext,
      dayView: dayView ? {...dayView, weekdayStyle} : undefined,
    }),
    [dayView, rangeCalendarContext, weekdayStyle],
  );

  return (
    <RangeCalendarContext value={contextValue}>
      <CalendarGridPrimitive
        weekdayStyle={weekdayStyle}
        {...props}
        className={composeSlotClassName(slots?.grid, className)}
        data-slot="range-calendar-grid"
      >
        {children}
      </CalendarGridPrimitive>
    </RangeCalendarContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar GridHeader
 *
 * From seven visible days up, the header and body are rebuilt as week-aligned rows. The rebuild
 * is shared with Calendar.
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarGridHeaderProps extends ComponentPropsWithRef<
  typeof CalendarGridHeaderPrimitive
> {}

const RangeCalendarGridHeader = ({children, className, ...props}: RangeCalendarGridHeaderProps) => {
  const {dayView, slots} = use(RangeCalendarContext);

  if (dayView && dayView.days >= 7 && typeof children === "function") {
    return (
      <CalendarDayViewGridHeader
        className={composeSlotClassName(slots?.gridHeader, className)}
        context={dayView}
        dataSlot="range-calendar-grid-header"
      >
        {children}
      </CalendarDayViewGridHeader>
    );
  }

  return (
    <CalendarGridHeaderPrimitive
      {...props}
      className={composeSlotClassName(slots?.gridHeader, className)}
      data-slot="range-calendar-grid-header"
    >
      {children}
    </CalendarGridHeaderPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar GridBody
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarGridBodyProps extends ComponentPropsWithRef<
  typeof CalendarGridBodyPrimitive
> {}

const RangeCalendarGridBody = ({children, className, ...props}: RangeCalendarGridBodyProps) => {
  const {dayView, slots} = use(RangeCalendarContext);

  if (dayView && dayView.days >= 7 && typeof children === "function") {
    return (
      <CalendarDayViewGridBody
        className={composeSlotClassName(slots?.gridBody, className)}
        context={dayView}
        dataSlot="range-calendar-grid-body"
      >
        {children}
      </CalendarDayViewGridBody>
    );
  }

  return (
    <CalendarGridBodyPrimitive
      {...props}
      className={composeSlotClassName(slots?.gridBody, className)}
      data-slot="range-calendar-grid-body"
    >
      {children}
    </CalendarGridBodyPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar HeaderCell
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarHeaderCellProps extends ComponentPropsWithRef<
  typeof CalendarHeaderCellPrimitive
> {}

const RangeCalendarHeaderCell = ({className, ...props}: RangeCalendarHeaderCellProps) => {
  const {slots} = use(RangeCalendarContext);

  return (
    <CalendarHeaderCellPrimitive
      {...props}
      className={composeSlotClassName(slots?.headerCell, className)}
      data-slot="range-calendar-header-cell"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar Cell
 *
 * The cell carries the range track; the inner button-shaped span carries the day and the caps,
 * so the track can run edge to edge while the caps stay round.
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarCellProps extends ComponentPropsWithRef<typeof CalendarCellPrimitive> {}

const RangeCalendarCell = ({children, className, ...props}: RangeCalendarCellProps) => {
  const {slots} = use(RangeCalendarContext);

  return (
    <CalendarCellPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.cell())}
      data-slot="range-calendar-cell"
    >
      {(values) => {
        const {formattedDate, isDisabled, isHovered, isPressed, isSelectionEnd, isSelectionStart} =
          values;
        const content =
          typeof children === "function" ? children(values) : children || formattedDate;

        return (
          <span
            className={slots?.cellButton()}
            data-disabled={dataAttr(isDisabled)}
            data-hovered={dataAttr(isHovered)}
            data-pressed={dataAttr(isPressed)}
            data-selected={dataAttr(isSelectionStart || isSelectionEnd)}
            data-slot="range-calendar-cell-button"
          >
            {content}
          </span>
        );
      }}
    </CalendarCellPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * RangeCalendar CellIndicator
 * -----------------------------------------------------------------------------------------------*/
interface RangeCalendarCellIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const RangeCalendarCellIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  className,
  ...props
}: RangeCalendarCellIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof RangeCalendarCellIndicatorProps<E>>) => {
  const {slots} = use(RangeCalendarContext);

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
      data-slot="range-calendar-cell-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendarRoot,
};

export type {
  RangeCalendarCellIndicatorProps,
  RangeCalendarCellProps,
  RangeCalendarGridBodyProps,
  RangeCalendarGridHeaderProps,
  RangeCalendarGridProps,
  RangeCalendarHeaderCellProps,
  RangeCalendarHeaderProps,
  RangeCalendarHeadingProps,
  RangeCalendarNavButtonProps,
  RangeCalendarRootProps,
};
