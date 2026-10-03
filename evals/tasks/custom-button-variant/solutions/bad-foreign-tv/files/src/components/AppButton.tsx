import type {ButtonProps} from "@peakui/react";
import type {VariantProps} from "tailwind-variants";

import {Button} from "@peakui/react";
import {tv} from "tailwind-variants";

const appButtonVariants = tv({
  defaultVariants: {radius: "full"},
  variants: {
    radius: {
      full: "rounded-full",
      sm: "rounded-sm",
    },
  },
});

export interface AppButtonProps
  extends Omit<ButtonProps, "className">, VariantProps<typeof appButtonVariants> {
  className?: string;
}

export function AppButton({className, radius, ...props}: AppButtonProps) {
  return <Button className={appButtonVariants({className, radius})} {...props} />;
}
