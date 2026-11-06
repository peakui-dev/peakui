import type {ComponentProps} from "react";

import {
  SheetBackdrop,
  SheetBody,
  SheetClose,
  SheetCloseTrigger,
  SheetContent,
  SheetDialog,
  SheetFooter,
  SheetHandle,
  SheetHeader,
  SheetHeading,
  SheetNestedRoot,
  SheetRoot,
  SheetTrigger,
} from "./sheet.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Sheet = Object.assign(SheetRoot, {
  Root: SheetRoot,
  NestedRoot: SheetNestedRoot,
  Trigger: SheetTrigger,
  Backdrop: SheetBackdrop,
  Content: SheetContent,
  Dialog: SheetDialog,
  Header: SheetHeader,
  Heading: SheetHeading,
  Body: SheetBody,
  Footer: SheetFooter,
  Handle: SheetHandle,
  Close: SheetClose,
  CloseTrigger: SheetCloseTrigger,
});

export type Sheet = {
  Props: ComponentProps<typeof SheetRoot>;
  RootProps: ComponentProps<typeof SheetRoot>;
  NestedRootProps: ComponentProps<typeof SheetNestedRoot>;
  TriggerProps: ComponentProps<typeof SheetTrigger>;
  BackdropProps: ComponentProps<typeof SheetBackdrop>;
  ContentProps: ComponentProps<typeof SheetContent>;
  DialogProps: ComponentProps<typeof SheetDialog>;
  HeaderProps: ComponentProps<typeof SheetHeader>;
  HeadingProps: ComponentProps<typeof SheetHeading>;
  BodyProps: ComponentProps<typeof SheetBody>;
  FooterProps: ComponentProps<typeof SheetFooter>;
  HandleProps: ComponentProps<typeof SheetHandle>;
  CloseProps: ComponentProps<typeof SheetClose>;
  CloseTriggerProps: ComponentProps<typeof SheetCloseTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  SheetRoot,
  SheetNestedRoot,
  SheetTrigger,
  SheetBackdrop,
  SheetContent,
  SheetDialog,
  SheetHeader,
  SheetHeading,
  SheetBody,
  SheetFooter,
  SheetHandle,
  SheetClose,
  SheetCloseTrigger,
};

export type {
  SheetRootProps,
  SheetRootProps as SheetProps,
  SheetTriggerProps,
  SheetBackdropProps,
  SheetContentProps,
  SheetDialogProps,
  SheetHeaderProps,
  SheetHeadingProps,
  SheetBodyProps,
  SheetFooterProps,
  SheetHandleProps,
  SheetCloseProps,
  SheetCloseTriggerProps,
} from "./sheet.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {sheetVariants} from "@peakui/styles";

export type {SheetVariants} from "@peakui/styles";
