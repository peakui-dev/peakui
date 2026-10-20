"use client";

import type {UseOverlayStateProps, UseOverlayStateReturn} from "../../hooks/use-overlay-state.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {DrawerVariants, SurfaceVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode, PointerEvent as ReactPointerEvent} from "react";
import type {Button as ButtonPrimitive} from "react-aria-components/Button";
import type {DialogProps as DialogPrimitiveProps} from "react-aria-components/Dialog";

import {drawerVariants} from "@peakui/styles";
import {mergeProps} from "@react-aria/utils";
import {createContext, use, useCallback, useMemo, useRef} from "react";
import {Button as ButtonPrimitiveComponent} from "react-aria-components/Button";
import {
  Dialog as DialogPrimitive,
  DialogTrigger as DrawerTriggerPrimitive,
  Heading as HeadingPrimitive,
  OverlayTriggerStateContext,
} from "react-aria-components/Dialog";
import {
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
} from "react-aria-components/Modal";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {CloseButton} from "../close-button/index.ts";
import {SurfaceContext} from "../surface/index.ts";

const DEFAULT_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};

type DrawerPlacement = "top" | "bottom" | "left" | "right";

/* -------------------------------------------------------------------------------------------------
 * Drawer Drag
 * Tracks pointer events for drag-to-dismiss with an inline transform. RAC has no drag-to-dismiss
 * primitive, so this is the one piece of behaviour the component owns. A drag starts only from the
 * handle, header or footer: the body is excluded so it keeps scrolling.
 * -----------------------------------------------------------------------------------------------*/

const DRAG_THRESHOLD = 8; // px before the drag activates
const DISMISS_FRACTION = 0.3; // dismiss once dragged past 30% of the panel
const VELOCITY_THRESHOLD = 0.5; // px/ms: a fast flick dismisses regardless of distance

/** A nested drawer's events bubble through its parent; only the owning dialog may start a drag. */
function isDragTargetOwnedBy(target: HTMLElement, dialog: HTMLElement) {
  return target.closest('[data-slot="drawer-dialog"]') === dialog;
}

/** A drawer can only be dragged toward the edge it came from. */
function clampToDismissDirection(placement: DrawerPlacement | undefined, delta: number) {
  switch (placement) {
    case "top":
    case "left":
      return Math.min(0, delta);
    default:
      return Math.max(0, delta);
  }
}

function useDrawerDrag(placement: DrawerPlacement | undefined, isDismissable: boolean) {
  const overlayState = use(OverlayTriggerStateContext);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isActive = useRef(false);
  const startPos = useRef(0);
  const currentOffset = useRef(0);
  const velocity = useRef(0);
  const lastTime = useRef(0);
  const lastDelta = useRef(0);

  const isVertical = placement === "top" || placement === "bottom";

  const getPos = useCallback(
    (e: ReactPointerEvent) => (isVertical ? e.clientY : e.clientX),
    [isVertical],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDismissable || e.button !== 0) return;

      const target = e.target as HTMLElement;

      if (!isDragTargetOwnedBy(target, e.currentTarget as HTMLElement)) return;

      // Interactive elements and the scrollable body keep their own gestures.
      if (
        target.closest(
          "input, textarea, button, [role='button'], select, a, [data-slot='drawer-body']",
        )
      ) {
        return;
      }

      isDragging.current = true;
      isActive.current = false;
      startPos.current = getPos(e);
      lastDelta.current = 0;
      lastTime.current = Date.now();
      currentOffset.current = 0;
      velocity.current = 0;
    },
    [getPos, isDismissable],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging.current || !dialogRef.current) return;

      const pos = getPos(e);
      const rawDelta = pos - startPos.current;
      const delta = clampToDismissDirection(placement, rawDelta);

      if (!isActive.current) {
        if (Math.abs(rawDelta) < DRAG_THRESHOLD) return;
        isActive.current = true;
        dialogRef.current.style.transition = "none";
        dialogRef.current.setPointerCapture(e.pointerId);
      }

      currentOffset.current = delta;

      const now = Date.now();
      const dt = now - lastTime.current;

      if (dt > 0) {
        velocity.current = (delta - lastDelta.current) / dt;
        lastTime.current = now;
        lastDelta.current = delta;
      }

      dialogRef.current.style.transform = `translate${isVertical ? "Y" : "X"}(${delta}px)`;
    },
    [getPos, placement, isVertical],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const el = dialogRef.current;

      if (!el || !isActive.current) {
        isActive.current = false;

        return;
      }
      isActive.current = false;

      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released.
      }

      const dimension = isVertical ? el.offsetHeight : el.offsetWidth;
      const shouldDismiss =
        Math.abs(currentOffset.current) > dimension * DISMISS_FRACTION ||
        Math.abs(velocity.current) > VELOCITY_THRESHOLD;

      if (shouldDismiss && overlayState) {
        // The inline transform stays: it compounds with the exit animation, so the panel keeps
        // sliding from where it was dragged to.
        overlayState.close();
      } else {
        el.style.transition = "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)";
        el.style.transform = "";
        el.addEventListener(
          "transitionend",
          () => {
            el.style.transition = "";
          },
          {once: true},
        );
      }

      currentOffset.current = 0;
      velocity.current = 0;
    },
    [isVertical, overlayState],
  );

  return {
    dialogRef,
    // Always the same three handlers: move and up are inert until onPointerDown (which checks
    // isDismissable) has started a drag.
    dragHandlers: {onPointerDown, onPointerMove, onPointerUp},
  };
}

/* -------------------------------------------------------------------------------------------------
 * Drawer Context
 * -----------------------------------------------------------------------------------------------*/
type DrawerContext = {
  slots?: ReturnType<typeof drawerVariants>;
  placement?: DrawerPlacement;
  isDismissable?: boolean;
};

const DrawerContext = createContext<DrawerContext>({});

/* -------------------------------------------------------------------------------------------------
 * Drawer Root
 * -----------------------------------------------------------------------------------------------*/
interface DrawerRootProps extends ComponentPropsWithRef<typeof DrawerTriggerPrimitive> {
  state?: UseOverlayStateReturn;
}

const DrawerRoot = ({children, state, ...props}: DrawerRootProps) => {
  const drawerContext = useMemo<DrawerContext>(
    () => ({slots: drawerVariants(), placement: undefined, isDismissable: true}),
    [],
  );

  const controlledProps = useMemo<UseOverlayStateProps>(
    () => (state ? {isOpen: state.isOpen, onOpenChange: state.setOpen} : {}),
    [state],
  );

  return (
    <DrawerContext value={drawerContext}>
      <DrawerTriggerPrimitive {...mergeProps(props, controlledProps)} data-slot="drawer-root">
        {children}
      </DrawerTriggerPrimitive>
    </DrawerContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Trigger
 * -----------------------------------------------------------------------------------------------*/
interface DrawerTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DrawerTrigger = ({children, className, ...props}: DrawerTriggerProps) => {
  const {slots} = use(DrawerContext);

  return (
    <ButtonPrimitiveComponent
      className={composeTwRenderProps(className, slots?.trigger())}
      {...props}
      data-slot="drawer-trigger"
    >
      {children}
    </ButtonPrimitiveComponent>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Backdrop
 * -----------------------------------------------------------------------------------------------*/
interface DrawerBackdropProps extends ComponentPropsWithRef<typeof ModalOverlayPrimitive> {
  variant?: DrawerVariants["variant"];
  /**
   * Whether to close the drawer when the user interacts outside it.
   * @default true
   */
  isDismissable?: boolean;
}

const DrawerBackdrop = ({
  children,
  className,
  isDismissable = true,
  variant,
  ...props
}: DrawerBackdropProps) => {
  const {slots: contextSlots} = use(DrawerContext);

  const updatedSlots = useMemo(() => drawerVariants({variant}), [variant]);

  const updatedDrawerContext = useMemo<DrawerContext>(
    () => ({slots: {...contextSlots, ...updatedSlots}, isDismissable}),
    [contextSlots, updatedSlots, isDismissable],
  );

  return (
    <ModalOverlayPrimitive
      className={composeTwRenderProps(className, updatedSlots?.backdrop())}
      isDismissable={isDismissable}
      {...props}
      data-slot="drawer-backdrop"
    >
      {(renderProps) => (
        <DrawerContext value={updatedDrawerContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </DrawerContext>
      )}
    </ModalOverlayPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Content
 * -----------------------------------------------------------------------------------------------*/
interface DrawerContentProps extends Omit<
  ComponentPropsWithRef<typeof ModalPrimitive>,
  Exclude<keyof DrawerBackdropProps, "children" | "className">
> {
  placement?: DrawerPlacement;
}

const DrawerContent = ({
  children,
  className,
  placement = "bottom",
  ...props
}: DrawerContentProps) => {
  const {isDismissable, slots: contextSlots} = use(DrawerContext);

  const updatedSlots = useMemo(() => drawerVariants({placement}), [placement]);

  const updatedDrawerContext = useMemo<DrawerContext>(
    () => ({placement, isDismissable, slots: {...contextSlots, ...updatedSlots}}),
    [contextSlots, placement, isDismissable, updatedSlots],
  );

  return (
    <ModalPrimitive
      className={composeTwRenderProps(className, updatedSlots?.content())}
      data-placement={placement}
      {...props}
      data-slot="drawer-content"
    >
      {(renderProps) => (
        <DrawerContext value={updatedDrawerContext}>
          {typeof children === "function" ? children(renderProps) : children}
        </DrawerContext>
      )}
    </ModalPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Dialog
 * -----------------------------------------------------------------------------------------------*/
interface DrawerDialogProps extends DialogPrimitiveProps {}

const DrawerDialog = ({children, className, ...props}: DrawerDialogProps) => {
  const {isDismissable = true, placement, slots} = use(DrawerContext);
  const {dialogRef, dragHandlers} = useDrawerDrag(placement, isDismissable);

  return (
    <SurfaceContext value={DEFAULT_SURFACE_CONTEXT}>
      <DialogPrimitive
        ref={dialogRef}
        className={composeSlotClassName(slots?.dialog, className)}
        data-dismissable={isDismissable ? "true" : undefined}
        data-placement={placement}
        {...mergeProps(dragHandlers, props)}
        data-slot="drawer-dialog"
      >
        {children}
      </DialogPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Header
 * -----------------------------------------------------------------------------------------------*/
interface DrawerHeaderProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DrawerHeader = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DrawerHeaderProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof DrawerHeaderProps<E>>) => {
  const {slots} = use(DrawerContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.header, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="drawer-header"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Body
 * -----------------------------------------------------------------------------------------------*/
interface DrawerBodyProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DrawerBody = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DrawerBodyProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof DrawerBodyProps<E>>) => {
  const {slots} = use(DrawerContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.body, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="drawer-body"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Footer
 * -----------------------------------------------------------------------------------------------*/
interface DrawerFooterProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DrawerFooter = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DrawerFooterProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof DrawerFooterProps<E>>) => {
  const {slots} = use(DrawerContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.footer, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="drawer-footer"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Heading
 * -----------------------------------------------------------------------------------------------*/
interface DrawerHeadingProps extends ComponentPropsWithRef<typeof HeadingPrimitive> {}

const DrawerHeading = ({children, className, ...props}: DrawerHeadingProps) => {
  const {slots} = use(DrawerContext);

  return (
    <HeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      slot="title"
      {...props}
      data-slot="drawer-heading"
    >
      {children}
    </HeadingPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Handle
 * -----------------------------------------------------------------------------------------------*/
interface DrawerHandleProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DrawerHandle = <E extends keyof React.JSX.IntrinsicElements = "div">({
  className,
  ...props
}: DrawerHandleProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof DrawerHandleProps<E>>) => {
  const {slots} = use(DrawerContext);

  return (
    <dom.div
      aria-hidden="true"
      className={composeSlotClassName(slots?.handle, className)}
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="drawer-handle"
    >
      <div data-slot="drawer-handle-bar" />
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Drawer Close Trigger
 * -----------------------------------------------------------------------------------------------*/
interface DrawerCloseTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {
  className?: string;
  children?: ReactNode;
}

const DrawerCloseTrigger = ({className, ...rest}: DrawerCloseTriggerProps) => {
  const {slots} = use(DrawerContext);

  return (
    <CloseButton
      className={composeTwRenderProps(className, slots?.closeTrigger())}
      slot="close"
      {...rest}
      data-slot="drawer-close-trigger"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DrawerRoot,
  DrawerTrigger,
  DrawerBackdrop,
  DrawerContent,
  DrawerDialog,
  DrawerHeader,
  DrawerHeading,
  DrawerBody,
  DrawerFooter,
  DrawerHandle,
  DrawerCloseTrigger,
};

export type {
  DrawerRootProps,
  DrawerTriggerProps,
  DrawerBackdropProps,
  DrawerContentProps,
  DrawerDialogProps,
  DrawerHeaderProps,
  DrawerHeadingProps,
  DrawerBodyProps,
  DrawerFooterProps,
  DrawerHandleProps,
  DrawerCloseTriggerProps,
};
