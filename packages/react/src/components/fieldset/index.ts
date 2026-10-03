import type {ComponentProps} from "react";

import {FieldsetActions, FieldsetGroup, FieldsetLegend, FieldsetRoot} from "./fieldset.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Fieldset = Object.assign(FieldsetRoot, {
  Root: FieldsetRoot,
  Legend: FieldsetLegend,
  Group: FieldsetGroup,
  Actions: FieldsetActions,
});

export type Fieldset = {
  Props: ComponentProps<typeof FieldsetRoot>;
  RootProps: ComponentProps<typeof FieldsetRoot>;
  LegendProps: ComponentProps<typeof FieldsetLegend>;
  GroupProps: ComponentProps<typeof FieldsetGroup>;
  ActionsProps: ComponentProps<typeof FieldsetActions>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {FieldsetActions, FieldsetGroup, FieldsetLegend, FieldsetRoot};

export type {
  FieldsetRootProps,
  FieldsetRootProps as FieldsetProps,
  FieldsetPartProps,
} from "./fieldset.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {fieldsetVariants} from "@peakui/styles";

export type {FieldsetVariants} from "@peakui/styles";
