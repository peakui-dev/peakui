import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/breadcrumbs.css. */
export const breadcrumbsVariants = tv({
  slots: {
    base: "breadcrumbs",
    item: "breadcrumbs__item",
    link: "breadcrumbs__link",
    separator: "breadcrumbs__separator",
  },
});

export type BreadcrumbsVariants = VariantProps<typeof breadcrumbsVariants>;
