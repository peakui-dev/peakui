import type {ButtonProps, VariantProps} from "@peakui/react";

import {Button, buttonVariants, tv} from "@peakui/react";

// `tv` is imported from @peakui/react so that `extend` uses the instance the library was built with.
const myButtonVariants = tv({
  base: "font-semibold shadow-md",
  defaultVariants: {
    radius: "full",
  },
  extend: buttonVariants,
  variants: {
    radius: {
      full: "rounded-full",
      sm: "rounded-sm",
    },
  },
});

type MyButtonVariants = VariantProps<typeof myButtonVariants>;

interface MyButtonProps extends Omit<ButtonProps, "className">, MyButtonVariants {
  className?: string;
}

function MyButton({className, radius, size, variant, ...props}: MyButtonProps) {
  return (
    <Button
      className={myButtonVariants({className, radius, size, variant})}
      size={size}
      variant={variant}
      {...props}
    />
  );
}

export function CustomVariants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <MyButton>Rounded</MyButton>
      <MyButton radius="sm" variant="secondary">
        Squared
      </MyButton>
    </div>
  );
}
