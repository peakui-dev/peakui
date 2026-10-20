import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * One multi-slot recipe for the whole range calendar. Each part takes its class from the root's
 * context instead of calling the recipe again. BEM names and nothing else: the Tailwind lives in
 * components/range-calendar.css.
 */
export const rangeCalendarVariants = tv({
  defaultVariants: {},
  slots: {
    /** Root range calendar container */
    base: "range-calendar",
    /** Day cell (td); carries the range track */
    cell: "range-calendar__cell",
    /** Inner button-shaped span of a cell; carries the day and the range caps */
    cellButton: "range-calendar__cell-button",
    /** Small dot at the bottom of a cell */
    cellIndicator: "range-calendar__cell-indicator",
    /** Month grid (table) */
    grid: "range-calendar__grid",
    /** Grid body (tbody) */
    gridBody: "range-calendar__grid-body",
    /** Grid header (thead) */
    gridHeader: "range-calendar__grid-header",
    /** Grid row (tr), for custom row styling */
    gridRow: "range-calendar__grid-row",
    /** Header holding the heading and the navigation */
    header: "range-calendar__header",
    /** Weekday name cell (th) */
    headerCell: "range-calendar__header-cell",
    /** Month and year heading */
    heading: "range-calendar__heading",
    /** Previous and next navigation button */
    navButton: "range-calendar__nav-button",
    /** Navigation button icon */
    navButtonIcon: "range-calendar__nav-button-icon",
  },
  variants: {},
});

export type RangeCalendarVariants = VariantProps<typeof rangeCalendarVariants>;
