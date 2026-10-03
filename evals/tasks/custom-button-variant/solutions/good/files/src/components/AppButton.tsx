import type {ButtonProps, VariantProps} from "@peakui/react";

import {Button, tv} from "@peakui/react";

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
