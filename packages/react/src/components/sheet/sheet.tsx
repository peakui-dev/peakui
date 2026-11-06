"use client";

import type {SheetSnapPoint} from "./sheet.utils.ts";
import type {EdgePlacement} from "../../utils/overlay.ts";
import type {SheetVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactElement, ReactNode} from "react";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {sheetVariants} from "@peakui/styles";
import {mergeProps} from "@react-aria/utils";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {Heading as HeadingPrimitive} from "react-aria-components/Dialog";
import {
  SheetBackdrop as SheetBackdropPrimitive,
  SheetContent as SheetContentPrimitive,
  SheetOverlay as SheetOverlayPrimitive,
  Sheet as SheetPrimitive,
  SheetTrigger as SheetTriggerPrimitive,
} from "react-aria-components/Sheet";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {DIALOG_SURFACE_CONTEXT} from "../../utils/overlay.ts";
import {CloseButton} from "../close-button/index.ts";
import {SurfaceContext} from "../surface/index.ts";

import {SheetContext, SheetSwipeDirectionContext, useSheetContext} from "./context.ts";
import {normalizeSnapPoints} from "./sheet.utils.ts";

/*
 * The names the primitive's inline styles run. The keyframes are in @peakui/styles
 * (components/sheet.css); the primitive writes the animation onto the backdrop and onto a parent
 * sheet's content, so the class names never carry them.
 */
const STACK_ANIMATION = "peakui-sheet-scale-back";
const BACKDROP_ANIMATION = "peakui-sheet-backdrop";

/* -------------------------------------------------------------------------------------------------
 * Sheet Root
 * -----------------------------------------------------------------------------------------------*/
interface SheetRootProps {
  children?: ReactNode;
  /** Controlled open state. */
  isOpen?: boolean;
  /**
   * Initial open state when uncontrolled.
   * @default false
   */
  defaultOpen?: boolean;
  /** Called with the next open state when the user opens or closes the sheet. */
  onOpenChange?: (open: boolean) => void;
  /** Called when closing is requested. */
  onClose?: () => void;
  /** Called with the open state after the enter or exit animation has finished. */
  onAnimationEnd?: (open: boolean) => void;
  /**
   * Whether an outside press, a swipe or Escape can close the sheet.
   * @default true
   */
  isDismissable?: boolean;
  /**
   * The screen edge the sheet slides in from.
   * @default "bottom"
   */
  placement?: EdgePlacement;
  /**
   * Resting positions short of full size. Numbers are pixels and strings any CSS length. The sheet
   * opens at the first one; full size is always implicit, so a trailing `1` is ignored.
   */
  snapPoints?: SheetSnapPoint[];
  /**
   * Float the sheet away from the viewport edge.
   * @default false
   */
  isDetached?: boolean;
}

/** The root's props plus the flag only `Sheet.NestedRoot` may set. Not part of the public type. */
interface InternalSheetRootProps extends SheetRootProps {
  isNested?: boolean;
}

/**
 * Whether a `Sheet.Trigger` is among the children, looking through fragments and nested arrays but
 * not through components: a component's output is not visible to the root.
 */
function hasSheetTrigger(children: ReactNode): boolean {
  return Children.toArray(children).some(
    (child) =>
      isValidElement<{children?: ReactNode}>(child) &&
      (child.type === SheetTrigger ||
        (child.type === Fragment && hasSheetTrigger(child.props.children))),
  );
}

const SheetRoot = (props: SheetRootProps) => <SheetRootBase {...props} />;

const SheetRootBase = ({
  children,
  defaultOpen = false,
  isDetached = false,
  isDismissable = true,
  isNested = false,
  isOpen: isOpenProp,
  onAnimationEnd,
  onClose,
  onOpenChange,
  placement = "bottom",
  snapPoints: snapPointsProp,
}: InternalSheetRootProps) => {
  const snapPoints = useMemo(() => normalizeSnapPoints(snapPointsProp), [snapPointsProp]);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = isOpenProp ?? uncontrolledOpen;
  const isTriggerControlled = useMemo(() => hasSheetTrigger(children), [children]);

  /* A controlled sheet only reports: the owner decides whether the state changes. */
  const setIsOpen = useCallback(
    (open: boolean) => {
      // Only keeps the uncontrolled state from going stale if a consumer switches from controlled
      // to uncontrolled; controlled behaviour is proven by the Escape and open tests.
      if (isOpenProp === undefined) setUncontrolledOpen(open);
      onOpenChange?.(open);
      if (!open) onClose?.();
    },
    [isOpenProp, onClose, onOpenChange],
  );

  const context = useMemo(
    () => ({
      closeSheet: () => setIsOpen(false),
      isDetached,
      isDismissable,
      isNested,
      isOpen,
      isTriggerControlled,
      onAnimationEnd,
      placement,
      setIsOpen,
      snapPoints,
    }),
    [
      isDetached,
      isDismissable,
      isNested,
      isOpen,
      isTriggerControlled,
      onAnimationEnd,
      placement,
      setIsOpen,
      snapPoints,
    ],
  );

  const content = <SheetContext value={context}>{children}</SheetContext>;

  if (!isTriggerControlled) return content;

  /* The primitive's trigger hands its press handling to the child and shares the open state. */
  return (
    <SheetTriggerPrimitive isOpen={isOpen} onOpenChange={setIsOpen}>
      {content}
    </SheetTriggerPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet NestedRoot
 * -----------------------------------------------------------------------------------------------*/
const SheetNestedRoot = (props: SheetRootProps) => {
  const parent = use(SheetContext);

  if (!parent) {
    throw new Error("Sheet.NestedRoot must be placed in another Sheet");
  }

  return <SheetRootBase {...props} isNested />;
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Trigger
 * The root recognises this part by identity and wraps the sheet in the primitive's trigger; the
 * trigger renders its child as is, and the child receives the press handling through context.
 * -----------------------------------------------------------------------------------------------*/
interface SheetTriggerProps {
  /** The pressable element that opens the sheet. */
  children: ReactElement;
}

const SheetTrigger = ({children}: SheetTriggerProps) => {
  const context = use(SheetContext);
  const isUndetected = !!context && !context.isTriggerControlled;

  // The root could not see this trigger, so the child has no press handling and does nothing.
  useEffect(() => {
    // StrictMode runs effects twice in development, so the warning may log twice per mount there.
    if (
      isUndetected &&
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production"
    ) {
      // eslint-disable-next-line no-console -- dev-only warning, emitted once per undetected trigger
      console.error(
        "Sheet.Trigger must be a direct child of Sheet or sit inside fragments there; a trigger " +
          "rendered by a wrapper component is not detected and will not open the sheet. Move it " +
          "into the Sheet's children, or control the sheet with isOpen and onOpenChange.",
      );
    }
  }, [isUndetected]);

  return children;
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Close
 * -----------------------------------------------------------------------------------------------*/
interface SheetCloseProps {
  /** Any pressable element: it closes the sheet when pressed, after its own handler runs. */
  children: ReactElement<{onPress?: (event: unknown) => void}>;
}

const SheetClose = ({children}: SheetCloseProps) => {
  const {closeSheet} = useSheetContext();

  return cloneElement(children, mergeProps(children.props, {onPress: closeSheet}));
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Backdrop
 * Renders the primitive's overlay (the viewport-sized scroller host) and its dimming layer.
 * -----------------------------------------------------------------------------------------------*/
interface SheetBackdropProps extends Omit<
  ComponentPropsWithRef<typeof SheetOverlayPrimitive>,
  | "children"
  | "defaultOpen"
  | "isOpen"
  | "onOpenChange"
  | "position"
  | "preventDismissal"
  | "snapPoints"
  | "swipeDirection"
> {
  children?: ReactNode | ((renderProps: SheetRenderProps) => ReactNode);
  /**
   * The dimming layer behind the sheet.
   * @default "opaque"
   */
  variant?: SheetVariants["backdrop"];
}

const SheetBackdrop = ({children, className, variant = "opaque", ...rest}: SheetBackdropProps) => {
  const {isDismissable, isOpen, isTriggerControlled, placement, setIsOpen, snapPoints} =
    useSheetContext();
  const slots = useMemo(() => sheetVariants({backdrop: variant, placement}), [placement, variant]);

  /* The dimming layer fades out by the first snap point's worth of travel, not the whole drag. */
  const fadeRange = snapPoints?.length ? {start: snapPoints.length - 1} : undefined;

  return (
    <SheetOverlayPrimitive
      // A Sheet.Trigger above shares its state through context; without one, pass it directly.
      {...(isTriggerControlled ? {} : {isOpen, onOpenChange: setIsOpen})}
      {...rest}
      className={composeTwRenderProps(className, slots.overlay())}
      data-slot="sheet-overlay"
      position={placement}
      preventDismissal={!isDismissable}
      snapPoints={snapPoints}
    >
      {(renderProps) => (
        <SheetSwipeDirectionContext value={renderProps.swipeDirection}>
          <SheetBackdropPrimitive
            className={slots.backdrop()}
            data-slot="sheet-backdrop"
            swipeAnimation={BACKDROP_ANIMATION}
            swipeAnimationRange={fadeRange}
          />
          {typeof children === "function" ? children(renderProps) : children}
        </SheetSwipeDirectionContext>
      )}
    </SheetOverlayPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Content
 * The scroll-snap panel host. It sizes the panel and, on a stacked parent, scales it back.
 * -----------------------------------------------------------------------------------------------*/
interface SheetContentProps extends ComponentPropsWithRef<typeof SheetPrimitive> {}

const SheetContent = ({children, className, ...rest}: SheetContentProps) => {
  const {isDetached, placement, snapPoints} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <SheetPrimitive
      {...rest}
      className={composeTwRenderProps(className, slots.content())}
      data-detached={isDetached ? "" : undefined}
      data-placement={placement}
      data-slot="sheet-content"
      data-snap-points={snapPoints?.length ? "" : undefined}
      overscrollPadding={!isDetached}
      stackAnimation={STACK_ANIMATION}
    >
      {children}
    </SheetPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Dialog
 * -----------------------------------------------------------------------------------------------*/
interface SheetDialogProps extends ComponentPropsWithRef<typeof SheetContentPrimitive> {}

const SheetDialog = ({children, className, ...rest}: SheetDialogProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <SurfaceContext value={DIALOG_SURFACE_CONTEXT}>
      <SheetContentPrimitive
        {...rest}
        className={composeSlotClassName(slots.dialog, className)}
        data-placement={placement}
        data-slot="sheet-dialog"
      >
        {children}
      </SheetContentPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Header
 * -----------------------------------------------------------------------------------------------*/
interface SheetHeaderProps extends ComponentPropsWithRef<"div"> {}

const SheetHeader = ({children, className, ...rest}: SheetHeaderProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <div
      {...rest}
      className={composeSlotClassName(slots.header, className)}
      data-slot="sheet-header"
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Heading
 * -----------------------------------------------------------------------------------------------*/
interface SheetHeadingProps extends ComponentPropsWithRef<typeof HeadingPrimitive> {}

const SheetHeading = ({children, className, slot, ...rest}: SheetHeadingProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <HeadingPrimitive
      {...rest}
      className={composeSlotClassName(slots.heading, className)}
      data-slot="sheet-heading"
      slot={slot ?? "title"}
    >
      {children}
    </HeadingPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Body
 * -----------------------------------------------------------------------------------------------*/
interface SheetBodyProps extends ComponentPropsWithRef<"div"> {}

const SheetBody = ({children, className, ...rest}: SheetBodyProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <div {...rest} className={composeSlotClassName(slots.body, className)} data-slot="sheet-body">
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Footer
 * -----------------------------------------------------------------------------------------------*/
interface SheetFooterProps extends ComponentPropsWithRef<"div"> {}

const SheetFooter = ({children, className, ...rest}: SheetFooterProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <div
      {...rest}
      className={composeSlotClassName(slots.footer, className)}
      data-slot="sheet-footer"
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet Handle
 * Placeholder: Task 6 makes it a keyboard-operable slider and Task 7 adds the drag.
 * -----------------------------------------------------------------------------------------------*/
interface SheetHandleProps extends ComponentPropsWithRef<"div"> {}

const SheetHandle = ({children, className, ...rest}: SheetHandleProps) => {
  const {placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <div
      aria-hidden="true"
      {...rest}
      className={composeSlotClassName(slots.handle, className)}
      data-slot="sheet-handle"
    >
      {children ?? <span className={slots.handleBar()} data-slot="sheet-handle-bar" />}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Sheet CloseTrigger
 * -----------------------------------------------------------------------------------------------*/
interface SheetCloseTriggerProps extends ComponentPropsWithRef<typeof CloseButton> {}

const SheetCloseTrigger = ({className, onPress, ...rest}: SheetCloseTriggerProps) => {
  const {closeSheet, placement} = useSheetContext();
  const slots = useMemo(() => sheetVariants({placement}), [placement]);

  return (
    <CloseButton
      {...rest}
      className={composeTwRenderProps(className, slots.closeTrigger())}
      data-slot="sheet-close-trigger"
      onPress={(event) => {
        onPress?.(event);
        closeSheet();
      }}
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  SheetRoot,
  SheetNestedRoot,
  SheetTrigger,
  SheetClose,
  SheetBackdrop,
  SheetContent,
  SheetDialog,
  SheetHeader,
  SheetHeading,
  SheetBody,
  SheetFooter,
  SheetHandle,
  SheetCloseTrigger,
};

export type {
  SheetRootProps,
  SheetTriggerProps,
  SheetCloseProps,
  SheetBackdropProps,
  SheetContentProps,
  SheetDialogProps,
  SheetHeaderProps,
  SheetHeadingProps,
  SheetBodyProps,
  SheetFooterProps,
  SheetHandleProps,
  SheetCloseTriggerProps,
};
