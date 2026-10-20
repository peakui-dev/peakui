import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * One multi-slot recipe for the whole calendar. Each part takes its class from the root's context
 * instead of calling the recipe again, so the parts cannot drift apart. BEM names and nothing
 * else: the Tailwind lives in components/calendar.css.
 */
export const calendarVariants = tv({
  defaultVariants: {},
  slots: {
    /** Root calendar container */
    base: "calendar",
    /** Day cell (td) */
    cell: "calendar__cell",
    /** Small dot at the bottom of a cell */
    cellIndicator: "calendar__cell-indicator",
    /** Month grid (table) */
    grid: "calendar__grid",
    /** Grid body (tbody) */
    gridBody: "calendar__grid-body",
    /** Grid header (thead) */
    gridHeader: "calendar__grid-header",
    /** Grid row (tr), for custom row styling */
    gridRow: "calendar__grid-row",
    /** Header holding the heading and the navigation */
    header: "calendar__header",
    /** Weekday name cell (th) */
    headerCell: "calendar__header-cell",
    /** Month and year heading */
    heading: "calendar__heading",
    /** Previous and next navigation button */
    navButton: "calendar__nav-button",
    /** Navigation button icon */
    navButtonIcon: "calendar__nav-button-icon",
  },
  variants: {},
});

export type CalendarVariants = VariantProps<typeof calendarVariants>;
