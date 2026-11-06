"use client";

import type {ContextMenuAnchor} from "./use-context-menu-anchor.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {MenuRootProps} from "../menu/index.ts";
import type {SurfaceVariants} from "../surface/index.ts";
import type {JSX, ReactNode, RefObject} from "react";

import {contextMenuVariants} from "@peakui/styles";
import {mergeRefs} from "@react-aria/utils";
import React, {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Popover as PopoverPrimitive,
  SubmenuTrigger as SubmenuTriggerPrimitive,
} from "react-aria-components/Menu";
import {createPortal} from "react-dom";
import {useControlledState} from "react-stately/useControlledState";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {MenuRoot} from "../menu/index.ts";
import {SurfaceContext} from "../surface/index.ts";

import {useContextMenuAnchor} from "./use-context-menu-anchor.ts";

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Context
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuState {
  isOpen: boolean;
  setOpen(isOpen: boolean): void;
}

interface ContextMenuContextValue {
  slots?: ReturnType<typeof contextMenuVariants>;
  state: ContextMenuState;
  anchor: ContextMenuAnchor;
  isDisabled: boolean;
  /** Whether the Trigger's anchor element is mounted; the popover opens only then. */
  isAnchored: boolean;
  setAnchored(isAnchored: boolean): void;
  /** The popover element; lets the Trigger ignore events that bubble out of the open popover. */
  popoverRef: RefObject<HTMLElement | null>;
  /** How the menu was last opened; keyboard opens focus the first item. */
  openedBy: RefObject<"keyboard" | "pointer">;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext(part: string): ContextMenuContextValue {
  const context = use(ContextMenuContext);

  if (!context) {
    throw new Error(`${part} must be rendered inside <ContextMenu>.`);
  }

  return context;
}

const DEFAULT_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Root
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuRootProps {
  children?: ReactNode;
  /** Whether the menu is open (controlled). */
  isOpen?: boolean;
  /** Whether the menu is open on first render (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Disables opening the menu from the region. */
  isDisabled?: boolean;
}

const ContextMenuRoot = ({
  children,
  defaultOpen = false,
  isDisabled = false,
  isOpen: isOpenProp,
  onOpenChange,
}: ContextMenuRootProps) => {
  const slots = useMemo(() => contextMenuVariants(), []);
  const [isOpen, setOpen] = useControlledState(isOpenProp, defaultOpen, onOpenChange);
  const anchor = useContextMenuAnchor();
  const popoverRef = useRef<HTMLElement | null>(null);
  const openedBy = useRef<"keyboard" | "pointer">("pointer");

  const [isAnchored, setAnchored] = useState(false);

  // Disabling the region closes a menu that is already open.
  useEffect(() => {
    if (isDisabled && isOpen) {
      setOpen(false);
    }
  }, [isDisabled, isOpen, setOpen]);

  const state = useMemo(() => ({isOpen, setOpen}), [isOpen, setOpen]);
  const contextValue = useMemo(
    () => ({anchor, isAnchored, isDisabled, openedBy, popoverRef, setAnchored, slots, state}),
    [anchor, isAnchored, isDisabled, slots, state],
  );

  return <ContextMenuContext value={contextValue}>{children}</ContextMenuContext>;
};

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuTriggerProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const subscribeNever = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/*
 * The region. It carries no role and is not focusable: the menu opens from the pointer, a long
 * press or the keyboard on a focused descendant (wired in the following tasks). The anchor lives in
 * a portal on body, because a `position: fixed` child of a transformed ancestor would position
 * against that ancestor instead of the viewport.
 */
const ContextMenuTrigger = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ContextMenuTriggerProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ContextMenuTriggerProps<E>>) => {
  /*
   * One Trigger per root: every Trigger under a root shares `anchor.ref`, so a second one would
   * render a second anchor element that the popover cannot tell apart.
   */
  const {
    anchor,
    isDisabled,
    openedBy: openedByRef,
    popoverRef,
    setAnchored,
    slots,
    state,
  } = useContextMenuContext("ContextMenu.Trigger");
  const isClient = useSyncExternalStore(subscribeNever, getClientSnapshot, getServerSnapshot);
  const userOnContextMenu = (props as {onContextMenu?: (event: React.MouseEvent) => void})
    .onContextMenu;

  const onContextMenu = (event: React.MouseEvent) => {
    userOnContextMenu?.(event);

    if (isDisabled || event.defaultPrevented) {
      return;
    }

    const target = event.target as Element;

    // The browser menu stays where the consumer asks for it, e.g. text inputs.
    if (target.closest?.("[data-context-menu-native]")) {
      return;
    }

    // React portals bubble events from the open popover to this Trigger.
    if (popoverRef.current?.contains(target)) {
      return;
    }

    event.preventDefault();
    openedByRef.current = "pointer";
    anchor.setPoint(event.clientX, event.clientY);
    state.setOpen(true);
  };

  /*
   * The popover renders only while the anchor element is in the document: that covers a menu that
   * is open on the first render (the anchor portal mounts after hydration) and a Trigger that
   * unmounts while the menu is open.
   */
  useEffect(() => {
    if (!isClient) {
      return;
    }

    setAnchored(true);

    return () => setAnchored(false);
  }, [isClient, setAnchored]);

  return (
    <dom.div
      className={slots?.trigger({className})}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="context-menu-trigger"
      onContextMenu={onContextMenu}
    >
      {children}
      {isClient
        ? createPortal(
            <div
              ref={anchor.ref}
              inert
              aria-hidden="true"
              className={slots?.anchor()}
              data-slot="context-menu-anchor"
              style={anchor.point ? {left: anchor.point.x, top: anchor.point.y} : undefined}
            />,
            document.body,
          )
        : null}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Popover
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuPopoverProps extends Omit<
  React.ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children" | "isOpen" | "onOpenChange" | "triggerRef"
> {
  children: ReactNode;
}

const ContextMenuPopover = ({
  children,
  className,
  placement = "bottom start",
  ref,
  ...props
}: ContextMenuPopoverProps) => {
  const {anchor, isAnchored, popoverRef, slots, state} =
    useContextMenuContext("ContextMenu.Popover");
  const mergedRef = useMemo(() => mergeRefs(ref, popoverRef), [ref, popoverRef]);

  return (
    <SurfaceContext value={DEFAULT_SURFACE_CONTEXT}>
      <PopoverPrimitive
        offset={0}
        {...props}
        ref={mergedRef}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="context-menu-popover"
        isOpen={state.isOpen ? isAnchored : false}
        placement={placement}
        triggerRef={anchor.ref}
        onOpenChange={state.setOpen}
      >
        {children}
      </PopoverPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Menu
 * -----------------------------------------------------------------------------------------------*/
type ContextMenuMenuProps<T extends object> = MenuRootProps<T>;

/* The shared Menu root under this component's slot name; `data-slot` is overridable by design. */
function ContextMenuMenu<T extends object>({onClose, ...props}: ContextMenuMenuProps<T>) {
  const {state} = useContextMenuContext("ContextMenu.Menu");

  /* There is no MenuTrigger to close the popover after a selection, so the menu does it. */
  const handleClose = () => {
    onClose?.();
    state.setOpen(false);
  };

  return <MenuRoot {...props} data-slot="context-menu-menu" onClose={handleClose} />;
}

/* -------------------------------------------------------------------------------------------------
 * ContextMenu Submenu Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ContextMenuSubmenuTriggerProps extends React.ComponentPropsWithRef<
  typeof SubmenuTriggerPrimitive
> {}

const ContextMenuSubmenuTrigger = ({children, ...props}: ContextMenuSubmenuTriggerProps) => {
  return (
    <SubmenuTriggerPrimitive {...props} data-slot="context-menu-submenu-trigger">
      {children}
    </SubmenuTriggerPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ContextMenuMenu,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
};

export type {
  ContextMenuContextValue,
  ContextMenuMenuProps,
  ContextMenuPopoverProps,
  ContextMenuRootProps,
  ContextMenuState,
  ContextMenuSubmenuTriggerProps,
  ContextMenuTriggerProps,
};
