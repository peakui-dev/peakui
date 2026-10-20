import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/pagination.css. */
export const paginationVariants = tv({
  slots: {
    base: "pagination",
    summary: "pagination__summary",
    content: "pagination__content",
    item: "pagination__item",
    link: "pagination__link",
    linkNav: "pagination__link pagination__link--nav",
    ellipsis: "pagination__ellipsis",
  },
  variants: {
    size: {
      sm: {base: "pagination--sm"},
      md: {base: "pagination--md"},
      lg: {base: "pagination--lg"},
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type PaginationVariants = VariantProps<typeof paginationVariants>;
