import type {ComponentProps} from "react";

import {
  AlertDialogBackdrop,
  AlertDialogBody,
  AlertDialogCloseTrigger,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogHeading,
  AlertDialogIcon,
  AlertDialogRoot,
  AlertDialogTrigger,
} from "./alert-dialog.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Root: AlertDialogRoot,
  Trigger: AlertDialogTrigger,
  Backdrop: AlertDialogBackdrop,
  Container: AlertDialogContainer,
  Dialog: AlertDialogDialog,
  Header: AlertDialogHeader,
  Icon: AlertDialogIcon,
  Heading: AlertDialogHeading,
  Body: AlertDialogBody,
  Footer: AlertDialogFooter,
  CloseTrigger: AlertDialogCloseTrigger,
});

export type AlertDialog = {
  Props: ComponentProps<typeof AlertDialogRoot>;
  RootProps: ComponentProps<typeof AlertDialogRoot>;
  TriggerProps: ComponentProps<typeof AlertDialogTrigger>;
  BackdropProps: ComponentProps<typeof AlertDialogBackdrop>;
  ContainerProps: ComponentProps<typeof AlertDialogContainer>;
  DialogProps: ComponentProps<typeof AlertDialogDialog>;
  HeaderProps: ComponentProps<typeof AlertDialogHeader>;
  IconProps: ComponentProps<typeof AlertDialogIcon>;
  HeadingProps: ComponentProps<typeof AlertDialogHeading>;
  BodyProps: ComponentProps<typeof AlertDialogBody>;
  FooterProps: ComponentProps<typeof AlertDialogFooter>;
  CloseTriggerProps: ComponentProps<typeof AlertDialogCloseTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogBackdrop,
  AlertDialogContainer,
  AlertDialogDialog,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogHeading,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogCloseTrigger,
};

export type {
  AlertDialogRootProps,
  AlertDialogRootProps as AlertDialogProps,
  AlertDialogTriggerProps,
  AlertDialogBackdropProps,
  AlertDialogContainerProps,
  AlertDialogDialogProps,
  AlertDialogHeaderProps,
  AlertDialogIconProps,
  AlertDialogHeadingProps,
  AlertDialogBodyProps,
  AlertDialogFooterProps,
  AlertDialogCloseTriggerProps,
  AlertDialogStatus,
} from "./alert-dialog.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {alertDialogVariants} from "@peakui/styles";

export type {AlertDialogVariants} from "@peakui/styles";
