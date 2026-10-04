"use client";

import type {UseOverlayStateProps, UseOverlayStateReturn} from "../../hooks/use-overlay-state.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ModalVariants, SurfaceVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {Button as ButtonPrimitive} from "react-aria-components/Button";
import type {DialogProps as DialogPrimitiveProps} from "react-aria-components/Dialog";

import {modalVariants} from "@peakui/styles";
import {mergeProps} from "@react-aria/utils";
import {createContext, use, useMemo} from "react";
import {
  Dialog as DialogPrimitive,
  Heading as HeadingPrimitive,
  DialogTrigger as ModalTriggerPrimitive,
} from "react-aria-components/Dialog";
import {
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  Pressable as PressablePrimitive,
} from "react-aria-components/Modal";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {CloseButton} from "../close-button/index.ts";
import {SurfaceContext} from "../surface/index.ts";

const DEFAULT_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};

type ModalPlacement = "auto" | "top" | "center" | "bottom";

/* -------------------------------------------------------------------------------------------------
 * Modal Context
 * -----------------------------------------------------------------------------------------------*/
type ModalContext = {
  slots?: ReturnType<typeof modalVariants>;
  placement?: ModalPlacement;
};

const ModalContext = createContext<ModalContext>({});

/* -------------------------------------------------------------------------------------------------
 * Modal Root
 * -----------------------------------------------------------------------------------------------*/
interface ModalRootProps extends ComponentPropsWithRef<typeof ModalTriggerPrimitive> {
  state?: UseOverlayStateReturn;
}

const ModalRoot = ({children, state, ...props}: ModalRootProps) => {
  const modalContext = useMemo<ModalContext>(
    () => ({slots: modalVariants(), placement: undefined}),
    [],
  );

  const controlledProps = useMemo<UseOverlayStateProps>(
    () => (state ? {isOpen: state.isOpen, onOpenChange: state.setOpen} : {}),
    [state],
  );

  return (
    <ModalContext value={modalContext}>
      <ModalTriggerPrimitive {...mergeProps(props, controlledProps)} data-slot="modal-root">
        {children}
      </ModalTriggerPrimitive>
    </ModalContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ModalTriggerProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ModalTrigger = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ModalTriggerProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof ModalTriggerProps<E>>) => {
  const {slots} = use(ModalContext);

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
        data-slot="modal-trigger"
      >
        {children}
      </dom.div>
    </PressablePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface ModalBackdropProps extends ComponentPropsWithRef<typeof ModalOverlayPrimitive> {
  variant?: ModalVariants["variant"];
  /**
   * Whether to close the modal when the user interacts outside it.
   * @default true
   */
  isDismissable?: boolean;
}

const ModalBackdrop = ({
  children,
  className,
  isDismissable = true,
  onClick,
  variant,
  ...props
}: ModalBackdropProps) => {
  const {slots: contextSlots} = use(ModalContext);

  const updatedSlots = useMemo(() => modalVariants({variant}), [variant]);

  const updatedModalContext = useMemo<ModalContext>(
    () => ({slots: {...contextSlots, ...updatedSlots}}),
    [contextSlots, updatedSlots],
  );

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      isDismissable={isDismissable}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      {...props}
      data-slot="modal-backdrop"
    >
      {(renderProps) => (
        <ModalContext value={updatedModalContext}>
          {typeof children === "function" ? children(renderProps) : children}{" "}
        </ModalContext>
      )}
    </ModalOverlayPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Container
 * -----------------------------------------------------------------------------------------------*/
interface ModalContainerProps extends Omit<
  ComponentPropsWithRef<typeof ModalPrimitive>,
  Exclude<keyof ModalBackdropProps, "children" | "className">
> {
  placement?: ModalPlacement;
  scroll?: ModalVariants["scroll"];
  size?: ModalVariants["size"];
}

const ModalContainer = ({
  children,
  className,
  placement = "auto",
  scroll,
  size,
  ...props
}: ModalContainerProps) => {
  const {slots: contextSlots} = use(ModalContext);

  const updatedSlots = useMemo(() => modalVariants({scroll, size}), [scroll, size]);

  const updatedModalContext = useMemo<ModalContext>(
    () => ({placement, slots: {...contextSlots, ...updatedSlots}}),
    [contextSlots, placement, updatedSlots],
  );

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.container())}
      data-placement={placement}
      {...props}
      data-slot="modal-container"
    >
      {(renderProps) => (
        <ModalContext value={updatedModalContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </ModalContext>
      )}
    </ModalPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Dialog
 * -----------------------------------------------------------------------------------------------*/
interface ModalDialogProps extends DialogPrimitiveProps {}

const ModalDialog = ({children, className, ...props}: ModalDialogProps) => {
  const {placement, slots} = use(ModalContext);

  return (
    <SurfaceContext value={DEFAULT_SURFACE_CONTEXT}>
      <DialogPrimitive
        className={composeSlotClassName(slots?.dialog, className)}
        data-placement={placement}
        {...props}
        data-slot="modal-dialog"
      >
        {children}
      </DialogPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Header
 * -----------------------------------------------------------------------------------------------*/
interface ModalHeaderProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ModalHeader = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ModalHeaderProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof ModalHeaderProps<E>>) => {
  const {slots} = use(ModalContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.header, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="modal-header"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Body
 * -----------------------------------------------------------------------------------------------*/
interface ModalBodyProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ModalBody = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ModalBodyProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof ModalBodyProps<E>>) => {
  const {slots} = use(ModalContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.body, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="modal-body"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Footer
 * -----------------------------------------------------------------------------------------------*/
interface ModalFooterProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ModalFooter = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ModalFooterProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof ModalFooterProps<E>>) => {
  const {slots} = use(ModalContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.footer, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="modal-footer"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Heading
 * -----------------------------------------------------------------------------------------------*/
interface ModalHeadingProps extends ComponentPropsWithRef<typeof HeadingPrimitive> {}

const ModalHeading = ({children, className, ...props}: ModalHeadingProps) => {
  const {slots} = use(ModalContext);

  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      slot="title"
      {...props}
      data-slot="modal-heading"
    >
      {children}
    </HeadingPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * AlertDialog Icon
 * -----------------------------------------------------------------------------------------------*/
interface ModalIconProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ModalIcon = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ModalIconProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof ModalIconProps<E>>) => {
  const {slots} = use(ModalContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.icon, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="modal-icon"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Modal Close Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ModalCloseTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  className?: string;
  children?: ReactNode;
}

const ModalCloseTrigger = ({className, ...rest}: ModalCloseTriggerProps) => {
  const {slots} = use(ModalContext);

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      slot="close"
      {...rest}
      data-slot="modal-close-trigger"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ModalRoot,
  ModalTrigger,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalIcon,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalCloseTrigger,
};

export type {
  ModalRootProps,
  ModalTriggerProps,
  ModalBackdropProps,
  ModalContainerProps,
  ModalDialogProps,
  ModalHeaderProps,
  ModalIconProps,
  ModalHeadingProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalCloseTriggerProps,
};
