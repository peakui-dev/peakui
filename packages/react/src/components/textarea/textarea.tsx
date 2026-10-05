"use client";

import type {TextAreaVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {textAreaVariants} from "@peakui/styles";
import {use} from "react";
import {TextArea as TextAreaPrimitive} from "react-aria-components/TextArea";

import {FieldVariantContext} from "../../contexts/field-variant.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * TextArea Root
 * -----------------------------------------------------------------------------------------------*/
interface TextAreaRootProps
  extends ComponentPropsWithRef<typeof TextAreaPrimitive>, TextAreaVariants {}

const TextAreaRoot = ({className, fullWidth, variant, ...rest}: TextAreaRootProps) => {
  const fieldVariantContext = use(FieldVariantContext);
  const resolvedVariant = variant ?? fieldVariantContext?.variant;

  return (
    <TextAreaPrimitive
      className={composeTwRenderProps(
        className,
        textAreaVariants({fullWidth, variant: resolvedVariant}),
      )}
      {...rest}
      data-slot="textarea"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TextAreaRoot};

export type {TextAreaRootProps};
