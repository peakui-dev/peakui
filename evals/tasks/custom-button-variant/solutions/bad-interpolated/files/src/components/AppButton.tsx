import type {ButtonProps} from "@peakui/react";

import {Button} from "@peakui/react";

export interface AppButtonProps extends Omit<ButtonProps, "className"> {
  radius?: "full" | "sm";
}

export function AppButton({radius = "full", ...props}: AppButtonProps) {
  return <Button className={`rounded-${radius}`} {...props} />;
}
