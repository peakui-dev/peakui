import type {CheckboxVariants} from "../checkbox/index.ts";

import {createContext} from "react";

/*
 * The variant context shared by CheckboxGroup and Checkbox. It lives in its own module because
 * both component files consume it: re-exporting it from checkbox-group.tsx would trip
 * react-refresh/only-export-components (a non-generic root plus a context export in one file),
 * and the reference's public surface — the context exported from the package — stays identical.
 */
interface CheckboxGroupContextValue {
  variant?: CheckboxVariants["variant"];
}

const CheckboxGroupContext = createContext<CheckboxGroupContextValue>({});

export {CheckboxGroupContext};
export type {CheckboxGroupContextValue};
