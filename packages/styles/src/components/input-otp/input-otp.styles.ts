import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * Многослотовый рецепт: корень-контейнер, группа, слот и его значение, каретка и сепаратор.
 * Слот `input` — скрытый <input> самой библиотеки OTP-ввода; контейнеру он отдаёт `containerClassName`.
 */
export const inputOtpVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "input-otp",
    caret: "input-otp__caret",
    group: "input-otp__group",
    input: "input-otp__input",
    separator: "input-otp__separator",
    slot: "input-otp__slot",
    slotValue: "input-otp__slot-value",
  },
  variants: {
    variant: {
      primary: {
        base: "input-otp--primary",
      },
      secondary: {
        base: "input-otp--secondary",
      },
    },
  },
});

export type InputOtpVariants = VariantProps<typeof inputOtpVariants>;
