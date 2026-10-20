import type {ComponentProps} from "react";

import {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationNextIcon,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationRoot,
  PaginationSummary,
} from "./pagination.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Pagination = Object.assign(PaginationRoot, {
  Root: PaginationRoot,
  Summary: PaginationSummary,
  Content: PaginationContent,
  Item: PaginationItem,
  Link: PaginationLink,
  Previous: PaginationPrevious,
  PreviousIcon: PaginationPreviousIcon,
  Next: PaginationNext,
  NextIcon: PaginationNextIcon,
  Ellipsis: PaginationEllipsis,
});

export type Pagination = {
  Props: ComponentProps<typeof PaginationRoot>;
  RootProps: ComponentProps<typeof PaginationRoot>;
  SummaryProps: ComponentProps<typeof PaginationSummary>;
  ContentProps: ComponentProps<typeof PaginationContent>;
  ItemProps: ComponentProps<typeof PaginationItem>;
  LinkProps: ComponentProps<typeof PaginationLink>;
  PreviousProps: ComponentProps<typeof PaginationPrevious>;
  PreviousIconProps: ComponentProps<typeof PaginationPreviousIcon>;
  NextProps: ComponentProps<typeof PaginationNext>;
  NextIconProps: ComponentProps<typeof PaginationNextIcon>;
  EllipsisProps: ComponentProps<typeof PaginationEllipsis>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  PaginationRoot,
  PaginationSummary,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationPreviousIcon,
  PaginationNext,
  PaginationNextIcon,
  PaginationEllipsis,
};

export type {
  PaginationRootProps,
  PaginationRootProps as PaginationProps,
  PaginationSummaryProps,
  PaginationContentProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationPreviousProps,
  PaginationPreviousIconProps,
  PaginationNextProps,
  PaginationNextIconProps,
  PaginationEllipsisProps,
} from "./pagination.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {paginationVariants} from "@peakui/styles";

export type {PaginationVariants} from "@peakui/styles";
