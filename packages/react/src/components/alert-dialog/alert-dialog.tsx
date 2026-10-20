"use client";

import type {UseOverlayStateProps, UseOverlayStateReturn} from "../../hooks/use-overlay-state.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {AlertDialogVariants, SurfaceVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {Button as ButtonPrimitive} from "react-aria-components/Button";
import type {DialogProps as DialogPrimitiveProps} from "react-aria-components/Dialog";

import {alertDialogVariants} from "@peakui/styles";
import {mergeProps} from "@react-aria/utils";
import {createContext, use, useMemo} from "react";
import {
  DialogTrigger as AlertDialogTriggerPrimitive,
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
} from "react-aria-components/Dialog";
import {
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components/Modal";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {CloseButton} from "../close-button/index.ts";
import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

const DEFAULT_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};

type AlertDialogPlacement = "auto" | "top" | "center" | "bottom";

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Context
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogContext = {
  slots?: ReturnType<typeof alertDialogVariants>;
  placement?: AlertDialogPlacement;
};

const AlertDialogContext = createContext<AlertDialogContext>({});

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Root
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogRootProps extends ComponentPropsWithRef<typeof AlertDialogTriggerPrimitive> {
  state?: UseOverlayStateReturn;
}

const AlertDialogRoot = ({children, state, ...props}: AlertDialogRootProps) => {
  const modalContext = useMemo<AlertDialogContext>(
    () => ({slots: alertDialogVariants(), placement: undefined}),
    [],
  );

  const controlledProps = useMemo<UseOverlayStateProps>(
    () => (state ? {isOpen: state.isOpen, onOpenChange: state.setOpen} : {}),
    [state],
  );

  return (
    <AlertDialogContext value={modalContext}>
      <AlertDialogTriggerPrimitive
        {...mergeProps(props, controlledProps)}
        data-slot="alert-dialog-root"
      >
        {children}
      </AlertDialogTriggerPrimitive>
    </AlertDialogContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Trigger
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogTriggerProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AlertDialogTrigger = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: AlertDialogTriggerProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AlertDialogTriggerProps<E>>) => {
  const {slots} = use(AlertDialogContext);

  return (
    <PressablePrimitive>
      <dom.div
        className={composeSlotClassName(slots?.trigger, className)}
        role="button"
        /*
         * The permitted `any`: the element type is a parameter the spread has already erased, and
         * no expressible annotation exists for it. references/typescript.md.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        data-slot="alert-dialog-trigger"
      >
        {children}
      </dom.div>
    </PressablePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogBackdropProps extends ComponentPropsWithRef<typeof ModalOverlayPrimitive> {
  variant?: AlertDialogVariants["variant"];
  /**
   * Whether to close the modal when the user interacts outside it.
   * @default true
   */
  isDismissable?: boolean;
}

const AlertDialogBackdrop = ({
  children,
  className,
  isDismissable = false,
  isKeyboardDismissDisabled = true,
  onClick,
  variant,
  ...props
}: AlertDialogBackdropProps) => {
  const {slots: contextSlots} = use(AlertDialogContext);

  const updatedSlots = useMemo(() => alertDialogVariants({variant}), [variant]);

  const updatedAlertDialogContext = useMemo<AlertDialogContext>(
    () => ({slots: {...contextSlots, ...updatedSlots}}),
    [contextSlots, updatedSlots],
  );

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
      data-slot="alert-dialog-backdrop"
    >
      {(renderProps) => (
        <AlertDialogContext value={updatedAlertDialogContext}>
          {typeof children === "function" ? children(renderProps) : children}{" "}
        </AlertDialogContext>
      )}
    </ModalOverlayPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Container
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogContainerProps extends Omit<
  ComponentPropsWithRef<typeof ModalPrimitive>,
  Exclude<keyof AlertDialogBackdropProps, "children" | "className">
> {
  placement?: AlertDialogPlacement;
  size?: AlertDialogVariants["size"];
}

const AlertDialogContainer = ({
  children,
  className,
  placement = "auto",
  size,
  ...props
}: AlertDialogContainerProps) => {
  const {slots: contextSlots} = use(AlertDialogContext);

  const updatedSlots = useMemo(() => alertDialogVariants({size}), [size]);

  const updatedAlertDialogContext = useMemo<AlertDialogContext>(
    () => ({placement, slots: {...contextSlots, ...updatedSlots}}),
    [contextSlots, placement, updatedSlots],
  );

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.container())}
      data-placement={placement}
      {...props}
      data-slot="alert-dialog-container"
    >
      {(renderProps) => (
        <AlertDialogContext value={updatedAlertDialogContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </AlertDialogContext>
      )}
    </ModalPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Dialog
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogDialogProps extends DialogPrimitiveProps {}

const AlertDialogDialog = ({children, className, ...props}: AlertDialogDialogProps) => {
  const {placement, slots} = use(AlertDialogContext);

  return (
    <SurfaceContext value={DEFAULT_SURFACE_CONTEXT}>
      <DialogPrimitive
        className={composeSlotClassName(slots?.dialog, className)}
        data-placement={placement}
        role="alertdialog"
        {...props}
        data-slot="alert-dialog-dialog"
      >
        {children}
      </DialogPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Header
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogHeaderProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AlertDialogHeader = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: AlertDialogHeaderProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AlertDialogHeaderProps<E>>) => {
  const {slots} = use(AlertDialogContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.header, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="alert-dialog-header"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Body
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogBodyProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AlertDialogBody = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: AlertDialogBodyProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AlertDialogBodyProps<E>>) => {
  const {slots} = use(AlertDialogContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.body, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="alert-dialog-body"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Footer
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogFooterProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AlertDialogFooter = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: AlertDialogFooterProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AlertDialogFooterProps<E>>) => {
  const {slots} = use(AlertDialogContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.footer, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="alert-dialog-footer"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Heading
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogHeadingProps extends ComponentPropsWithRef<typeof HeadingPrimitive> {}

const AlertDialogHeading = ({children, className, ...props}: AlertDialogHeadingProps) => {
  const {slots} = use(AlertDialogContext);

  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      slot="title"
      {...props}
      data-slot="alert-dialog-heading"
    >
      {children}
    </HeadingPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Icon
 * -----------------------------------------------------------------------------------------------*/
type AlertDialogStatus = NonNullable<AlertDialogVariants["status"]>;

interface AlertDialogIconProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
  /**
   * The semantic status: sets the tint and the default icon.
   * @default "danger"
   */
  status?: AlertDialogStatus;
}

const DEFAULT_ICONS: Record<AlertDialogStatus, typeof DangerIcon> = {
  accent: InfoIcon,
  danger: DangerIcon,
  default: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
};

const AlertDialogIcon = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  status = "danger",
  ...props
}: AlertDialogIconProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AlertDialogIconProps<E>>) => {
  const slots = useMemo(() => alertDialogVariants({status}), [status]);
  const DefaultIcon = DEFAULT_ICONS[status];

  return (
    <dom.div
      className={slots.icon({className})}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="alert-dialog-icon"
    >
      {children ?? <DefaultIcon data-slot="alert-dialog-default-icon" />}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Close Trigger
 * -----------------------------------------------------------------------------------------------*/
interface AlertDialogCloseTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  className?: string;
  children?: ReactNode;
}

const AlertDialogCloseTrigger = ({className, ...rest}: AlertDialogCloseTriggerProps) => {
  const {slots} = use(AlertDialogContext);

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      slot="close"
      {...rest}
      data-slot="alert-dialog-close-trigger"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
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
};
