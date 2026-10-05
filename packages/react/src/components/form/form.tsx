"use client";

import type {FormVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {formVariants} from "@peakui/styles";
import {Form as FormPrimitive} from "react-aria-components/Form";

/* -------------------------------------------------------------------------------------------------
 * Form Root — a thin styled composition over React Aria's Form.
 * -----------------------------------------------------------------------------------------------*/
interface FormRootProps extends ComponentPropsWithRef<typeof FormPrimitive>, FormVariants {}

const FormRoot = ({children, className, ...props}: FormRootProps) => {
  return (
    <FormPrimitive className={formVariants({className})} {...props} data-slot="form">
      {children}
    </FormPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {FormRoot};

export type {FormRootProps};
