import type {ComponentProps} from "react";

import {ToastQueue, toast} from "./toast-queue.ts";
import {
  ToastActionButton,
  ToastCloseButton,
  ToastContent,
  ToastDescription,
  ToastIndicator,
  ToastProvider,
  Toast as ToastRoot,
  ToastTitle,
} from "./toast.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Toast = Object.assign(ToastRoot, {
  Provider: ToastProvider,
  Content: ToastContent,
  Indicator: ToastIndicator,
  Title: ToastTitle,
  Description: ToastDescription,
  ActionButton: ToastActionButton,
  CloseButton: ToastCloseButton,
  Queue: ToastQueue,
  toast,
});

export type Toast = {
  Props: ComponentProps<typeof ToastRoot>;
  ProviderProps: ComponentProps<typeof ToastProvider>;
  ContentProps: ComponentProps<typeof ToastContent>;
  IndicatorProps: ComponentProps<typeof ToastIndicator>;
  TitleProps: ComponentProps<typeof ToastTitle>;
  DescriptionProps: ComponentProps<typeof ToastDescription>;
  ActionProps: ComponentProps<typeof ToastActionButton>;
  CloseButtonProps: ComponentProps<typeof ToastCloseButton>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  ToastProvider,
  ToastContent,
  ToastIndicator,
  ToastTitle,
  ToastDescription,
  ToastActionButton,
  ToastCloseButton,
};

export type {
  ToastCloseButtonProps,
  ToastProviderProps,
  ToastContentProps,
  ToastDescriptionProps,
  ToastIndicatorProps,
  ToastProps,
  ToastTitleProps,
} from "./toast.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {toastVariants} from "@peakui/styles";

export type {ToastVariants} from "@peakui/styles";

/* -------------------------------------------------------------------------------------------------
 * Utilities
 * -----------------------------------------------------------------------------------------------*/
export {ToastQueue, toast, toastQueue} from "./toast-queue.ts";

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------------------------*/
export {
  DEFAULT_EXIT_DURATION,
  DEFAULT_GAP,
  DEFAULT_HOTKEY,
  DEFAULT_MAX_VISIBLE_TOAST,
  DEFAULT_TOAST_TIMEOUT,
} from "./constants.ts";

export type {
  ToastOptions,
  ToastContentValue,
  ToastPromiseOptions,
  ToastQueueOptions,
} from "./toast-queue.ts";
