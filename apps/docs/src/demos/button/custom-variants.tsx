import type {ButtonProps, VariantProps} from "@peakui/react";

import {Button, tv} from "@peakui/react";

// `tv` is imported from @peakui/react so that it is the instance the library's variants use.
// The wrapper adds only its own variants: `Button` still owns `size` and `variant`, so each
// modifier reaches the element once. No `shadow-*` utility here: the focus ring is a box-shadow,
// and a shadow utility replaces it.
const myButtonVariants = tv({
  base: "font-semibold tracking-wide",
  defaultVariants: {
    radius: "full",
  },
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

function MyButton({className, radius, ...props}: MyButtonProps) {
  return <Button className={myButtonVariants({className, radius})} {...props} />;
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
