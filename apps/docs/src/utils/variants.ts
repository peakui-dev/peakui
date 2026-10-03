import {buttonVariants, tv} from "@peakui/react";

/**
 * Button look for the docs chrome's own links. `tv` comes from `@peakui/react` on purpose:
 * `extend` needs the instance the library's variants were built with.
 */
export const docsButtonVariants = tv({
  defaultVariants: {
    size: "sm",
    variant: "tertiary",
  },
  extend: buttonVariants,
  variants: {
    variant: {
      tertiary: "relative gap-2 dark:bg-default/70",
    },
  },
});
