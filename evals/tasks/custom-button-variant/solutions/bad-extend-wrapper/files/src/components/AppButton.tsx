import type {ButtonProps} from "@peakui/react";

import {Button, buttonVariants, tv} from "@peakui/react";

const appButtonVariants = tv({
  extend: buttonVariants,
  variants: {radius: {full: "rounded-full", sm: "rounded-sm"}},
});

export interface AppButtonProps extends Omit<ButtonProps, "className"> {
  radius?: "full" | "sm";
}

export function AppButton({radius = "full", size, variant, ...props}: AppButtonProps) {
  return (
    <Button
      className={appButtonVariants({radius, size, variant})}
      size={size}
      variant={variant}
      {...props}
    />
  );
}
