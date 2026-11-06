"use client";

import type {ContextMenuAnchor} from "./use-context-menu-anchor.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {MenuRootProps} from "../menu/index.ts";
import type {SurfaceVariants} from "../surface/index.ts";
import type {JSX, ReactNode, Ref, RefObject} from "react";

import {contextMenuVariants} from "@peakui/styles";
import {mergeRefs} from "@react-aria/utils";
import React, {
  createContext,
  use,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {useLongPress} from "react-aria/useLongPress";
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
  /** How the menu was last opened; keyboard opens focus the first item. Resets to "pointer" on close. */
  openedBy: ContextMenuOpenedBy;
  setOpenedBy(openedBy: ContextMenuOpenedBy): void;
}

type ContextMenuOpenedBy = "keyboard" | "pointer";

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
  const [openedBy, setOpenedBy] = useState<ContextMenuOpenedBy>("pointer");

  const [isAnchored, setAnchored] = useState(false);

  // Disabling the region closes a menu that is already open.
  useEffect(() => {
    if (isDisabled && isOpen) {
      setOpen(false);
    }
  }, [isDisabled, isOpen, setOpen]);

  const state = useMemo(() => ({isOpen, setOpen}), [isOpen, setOpen]);
  const contextValue = useMemo(
    () => ({
      anchor,
      isAnchored,
      isDisabled,
      openedBy,
      popoverRef,
      setAnchored,
      setOpenedBy,
      slots,
      state,
    }),
    [anchor, isAnchored, isDisabled, openedBy, slots, state],
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

/** Past this distance (px) a touch is a pan, not a hold. */
const TOUCH_MOVE_TOLERANCE = 10;
/** How long after the finger lifts the ghost-activation guard stays armed. */
const GHOST_WINDOW_MS = 400;

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
  const {anchor, isAnchored, isDisabled, popoverRef, setAnchored, setOpenedBy, slots, state} =
    useContextMenuContext("ContextMenu.Trigger");
  const triggerRef = useRef<HTMLElement | null>(null);
  const userRef = (props as unknown as {ref?: Ref<HTMLElement>}).ref;
  const mergedTriggerRef = useMemo(() => mergeRefs(userRef, triggerRef), [userRef]);
  const isClient = useSyncExternalStore(subscribeNever, getClientSnapshot, getServerSnapshot);
  const userOnContextMenu = (props as {onContextMenu?: (event: React.MouseEvent) => void})
    .onContextMenu;

  const userOnKeyDown = (props as {onKeyDown?: (event: React.KeyboardEvent) => void}).onKeyDown;
  /* Whether the current open already placed the anchor itself (pointer or keyboard). */
  const hasOwnAnchor = useRef(false);

  /* Counts finished long presses; the layout effect that opens the menu runs once per increment. */
  const [longPresses, setLongPresses] = useState(0);
  /* Where the current touch began (client coordinates); null when no touch is being tracked. */
  const touchStart = useRef<{x: number; y: number} | null>(null);
  /* Removes the post-long-press guard; null when the guard is not armed. */
  const releaseGuard = useRef<(() => void) | null>(null);

  const disarmGuard = () => {
    releaseGuard.current?.();
    releaseGuard.current = null;
  };

  /*
   * After a long press the menu appears under the finger. Releasing it must not activate whatever
   * item landed there, and the browser's own `contextmenu` that follows on iOS/Android must not
   * reopen or re-anchor the menu. The guard swallows the release-side events aimed at the popover
   * (document capture runs before React's listeners) and is dropped shortly after the finger lifts.
   */
  const armGuard = () => {
    disarmGuard();

    const blocked = ["pointerup", "mouseup", "mousedown", "click", "touchend"] as const;
    const swallow = (event: Event) => {
      if (event.target instanceof Node && popoverRef.current?.contains(event.target)) {
        event.stopImmediatePropagation();

        if (event.type === "click") {
          event.preventDefault();
        }
      }
    };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onRelease = () => {
      clearTimeout(timer);
      timer = setTimeout(disarmGuard, GHOST_WINDOW_MS);
    };

    /* Registered first: the swallowing listener below stops the same event for later listeners. */
    document.addEventListener("pointerup", onRelease, true);
    document.addEventListener("pointercancel", onRelease, true);

    for (const type of blocked) {
      document.addEventListener(type, swallow, true);
    }

    releaseGuard.current = () => {
      clearTimeout(timer);

      for (const type of blocked) {
        document.removeEventListener(type, swallow, true);
      }

      document.removeEventListener("pointerup", onRelease, true);
      document.removeEventListener("pointercancel", onRelease, true);
    };
  };

  /* Touch only: a held mouse button must never open the menu. */
  const {longPressProps} = useLongPress({
    isDisabled,
    pointerType: "touch",
    /*
     * The press event's own x/y are relative to the target, so the open reads the client point
     * recorded on pointerdown instead. It happens in the layout effect below, which keeps this
     * callback (handed to a hook) free of ref access.
     */
    onLongPress() {
      setLongPresses((count) => count + 1);
    },
  });

  useEffect(() => disarmGuard, []);

  const isGuardedTarget = (target: EventTarget) =>
    (target instanceof Element && target.closest("[data-context-menu-native]") !== null) ||
    isInsidePopover(target);

  /*
   * Only the pointer half of the long press is wired. `usePress` also owns keyboard and mouse
   * handlers that would preventDefault Enter/Space inside a descendant and stop mousedown
   * propagation; none of that belongs on a region.
   */
  type PointerHandler = (event: React.PointerEvent<HTMLElement>) => void;

  const userOnPointerDown = (props as {onPointerDown?: PointerHandler}).onPointerDown;
  const userOnPointerMove = (props as {onPointerMove?: PointerHandler}).onPointerMove;
  const userOnPointerUp = (props as {onPointerUp?: PointerHandler}).onPointerUp;
  const userOnPointerEnter = (props as {onPointerEnter?: PointerHandler}).onPointerEnter;
  const userOnPointerLeave = (props as {onPointerLeave?: PointerHandler}).onPointerLeave;
  const userOnClick = (props as {onClick?: (event: React.MouseEvent<HTMLElement>) => void}).onClick;
  const userOnDragStart = (props as {onDragStart?: (event: React.DragEvent<HTMLElement>) => void})
    .onDragStart;

  const onClick = (event: React.MouseEvent<HTMLElement>) => {
    userOnClick?.(event);
    /* The press hook stops click propagation; a region must not swallow its descendants' clicks. */
    longPressProps.onClick?.(
      new Proxy(event, {
        get(target, key) {
          if (key === "stopPropagation") {
            return () => {};
          }

          const value: unknown = Reflect.get(target, key);

          return typeof value === "function" ? value.bind(target) : value;
        },
      }),
    );
  };

  const onDragStart = (event: React.DragEvent<HTMLElement>) => {
    userOnDragStart?.(event);
    longPressProps.onDragStart?.(event);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    userOnPointerDown?.(event);

    if (event.pointerType !== "touch") {
      /* A mouse or pen press ends any leftover guard, so a right-click right after still opens. */
      disarmGuard();

      return;
    }

    if (isDisabled || isGuardedTarget(event.target)) {
      return;
    }

    touchStart.current = {x: event.clientX, y: event.clientY};
    longPressProps.onPointerDown?.(event);
  };

  const onPointerEnter = (event: React.PointerEvent<HTMLElement>) => {
    userOnPointerEnter?.(event);
    longPressProps.onPointerEnter?.(event);
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    userOnPointerLeave?.(event);
    longPressProps.onPointerLeave?.(event);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    userOnPointerMove?.(event);

    const start = touchStart.current;

    if (
      event.pointerType !== "touch" ||
      !start ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) <= TOUCH_MOVE_TOLERANCE
    ) {
      return;
    }

    /* The press hook only cancels when the finger leaves the region; a drag is a pan, not a hold. */
    touchStart.current = null;
    event.currentTarget.dispatchEvent(
      new PointerEvent("pointercancel", {bubbles: true, pointerId: event.pointerId}),
    );
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    userOnPointerUp?.(event);
    longPressProps.onPointerUp?.(event);
  };

  /*
   * React portals bubble events from the open popover to this Trigger when the Popover is nested
   * inside it (a supported layout).
   */
  const isInsidePopover = (target: EventTarget) =>
    target instanceof Node && popoverRef.current?.contains(target) === true;

  const onContextMenu = (event: React.MouseEvent) => {
    userOnContextMenu?.(event);

    if (isDisabled || event.defaultPrevented) {
      return;
    }

    const target = event.target;

    // The browser menu stays where the consumer asks for it, e.g. text inputs.
    if (target instanceof Element && target.closest("[data-context-menu-native]")) {
      return;
    }

    if (isInsidePopover(target)) {
      return;
    }

    /* The browser's own contextmenu after a long press: keep it away, and do not re-anchor. */
    if (releaseGuard.current) {
      event.preventDefault();

      return;
    }

    event.preventDefault();
    setOpenedBy("pointer");
    hasOwnAnchor.current = true;
    anchor.setPoint(event.clientX, event.clientY);
    state.setOpen(true);
  };

  /*
   * Shift+F10 and the ContextMenu key reach the Trigger from any focused descendant. Unlike the
   * pointer path, `[data-context-menu-native]` does not opt out here: the keyboard has no other
   * way to reach the menu, and an input inside the region still opens it.
   */
  const onKeyDown = (event: React.KeyboardEvent) => {
    userOnKeyDown?.(event);

    if (isDisabled || event.defaultPrevented) {
      return;
    }

    /*
     * Ctrl, Alt and Meta chords belong to the browser, the OS or the consumer, for both keys.
     * Shift+ContextMenu still matches: it is the same request as the bare key. Held keys and IME
     * composition never open the menu.
     */
    const hasChord = event.ctrlKey || event.altKey || event.metaKey;
    const isMenuKey = event.key === "ContextMenu" || (event.shiftKey && event.key === "F10");

    if (
      hasChord ||
      !isMenuKey ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      isInsidePopover(event.target)
    ) {
      return;
    }

    event.preventDefault();
    setOpenedBy("keyboard");
    hasOwnAnchor.current = true;

    if (event.target instanceof Element) {
      anchor.setFromElement(event.target, triggerRef.current ?? undefined);
    }

    state.setOpen(true);
  };

  /*
   * The popover renders only while the anchor element is in the document: that covers a menu that
   * is open on the first render (the anchor portal mounts after hydration) and a Trigger that
   * unmounts while the menu is open. A controlled `isOpen` stays true after the Trigger unmounts:
   * the parent owns that state.
   */
  useEffect(() => {
    if (!isClient) {
      return;
    }

    setAnchored(true);

    return () => setAnchored(false);
  }, [isClient, setAnchored]);

  /*
   * A menu that opens without a pointer (`defaultOpen`, a controlled `isOpen`) has no point yet;
   * it anchors at the bottom-start corner of the Trigger instead of the end of the body flow.
   */
  const {setFromElement} = anchor;

  /*
   * No dependency list on purpose: a handler's open request that a controlled parent rejects
   * changes no open state but still re-renders (the anchor point is state), and this effect then
   * drops the handler's flags so they cannot leak into a later pointer-less open.
   */
  useLayoutEffect(() => {
    if (!state.isOpen) {
      /* The next open starts clean; the point itself stays put so an exit animation does not jump. */
      hasOwnAnchor.current = false;
      setOpenedBy("pointer");

      return;
    }

    if (isAnchored && !hasOwnAnchor.current && triggerRef.current) {
      setFromElement(triggerRef.current);
      hasOwnAnchor.current = true;
    }
  });

  /*
   * Opens the menu for a finished long press. It must stay below the effect above: that one clears
   * `hasOwnAnchor` while the menu is closed, in the same commit, and would undo this one's flag.
   */
  useLayoutEffect(() => {
    const point = touchStart.current;

    if (longPresses === 0 || !point) {
      return;
    }

    touchStart.current = null;
    armGuard();
    setOpenedBy("pointer");
    hasOwnAnchor.current = true;
    anchor.setPoint(point.x, point.y);
    state.setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per long press
  }, [longPresses]);

  return (
    <dom.div
      className={slots?.trigger({className})}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      ref={mergedTriggerRef}
      data-slot="context-menu-trigger"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDragStart={onDragStart}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
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
  const {anchor, isAnchored, isDisabled, popoverRef, slots, state} =
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
        isOpen={state.isOpen && isAnchored && !isDisabled}
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
  const {openedBy, state} = useContextMenuContext("ContextMenu.Menu");

  /* There is no MenuTrigger to close the popover after a selection, so the menu does it. */
  const handleClose = () => {
    onClose?.();
    state.setOpen(false);
  };

  /*
   * A keyboard open lands on the first item, a pointer open on the menu container. RAC reads
   * `autoFocus` on mount only, so a Shift+F10 while a pointer-opened menu stays open re-anchors it
   * and leaves focus where it is.
   */
  const autoFocus = openedBy === "keyboard" ? "first" : true;

  return (
    <MenuRoot
      autoFocus={autoFocus}
      {...props}
      data-slot="context-menu-menu"
      onClose={handleClose}
    />
  );
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
