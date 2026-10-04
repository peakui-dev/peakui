"use client";

import type {ReactElement, ReactNode} from "react";

import React, {Children, createContext, isValidElement, use} from "react";

/** Dev-only registry for duplicate slot name warnings. */
let registry: Set<string> | undefined;

const __DEV__ = typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production";

/**
 * Create a CollectionBuilder-safe slot for optional chrome around a RAC collection
 * target (e.g. TabList, ListBox).
 *
 * The injector emits no host DOM: chrome props are provided via Context and a
 * string-keyed `cloneElement` channel (React strips Symbol keys from element props).
 * The target should apply chrome through the RAC `render` prop — not by wrapping
 * the collection child in a host node.
 */
export const createCollectionSlot = <T extends object>(name: string) => {
  if (__DEV__) {
    registry ??= new Set<string>();

    if (registry.has(name)) {
      // eslint-disable-next-line no-console -- dev-only warning; surfaced at creation, not per render
      console.warn(
        `Duplicate collection slot "${name}". Use a unique, namespaced name (e.g. "tabs.listContainer", "menu.popover").`,
      );
    }

    registry.add(name);
  }

  // String key required — React drops Symbol keys from element props / cloneElement.
  const key = `$$peakui.collection.${name}`;
  const SlotContext = createContext<T | undefined>(undefined);

  const inject = (children: ReactNode, value: T): ReactNode => {
    return Children.map(children, (child) => {
      if (!isValidElement(child)) {
        return child;
      }

      return React.cloneElement(child as ReactElement<Record<string, unknown>>, {
        [key]: value,
      });
    });
  };

  const consume = <P extends object>(props: P): [injected: T | undefined, rest: P] => {
    const {[key]: injected, ...rest} = props as P & Record<string, T | undefined>;

    return [injected, rest as P];
  };

  const useSlot = <P extends object>(props: P): [injected: T | undefined, rest: P] => {
    const [fromProps, rest] = consume(props);
    const fromContext = use(SlotContext);

    return [fromProps ?? fromContext, rest];
  };

  const Injector = ({children, ...value}: {children?: ReactNode} & T) => {
    return <SlotContext value={value as T}>{inject(children, value as T)}</SlotContext>;
  };

  Injector.displayName = `PeakUI.CollectionSlot(${name})`;

  return {
    key,
    inject,
    consume,
    useSlot,
    Injector,
    Context: SlotContext,
  } as const;
};

export type CollectionSlot<T extends object> = ReturnType<typeof createCollectionSlot<T>>;
