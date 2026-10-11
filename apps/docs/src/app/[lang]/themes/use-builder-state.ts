"use client";

import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useCallback, useMemo} from "react";

import type {BuilderState} from "./url-codec";

import {decodeBuilderState, encodeBuilderState} from "./url-codec";

export function useBuilderState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(() => decodeBuilderState(searchParams.toString()), [searchParams]);

  /*
   * Every edit is a history push: the URL is the store, "Share" is "copy the URL", and
   * undo/redo rides the browser's back/forward buttons.
   */
  const set = useCallback(
    (patch: Partial<BuilderState>) => {
      const query = new URLSearchParams(encodeBuilderState({...state, ...patch})).toString();

      router.push(query ? `${pathname}?${query}` : pathname, {scroll: false});
    },
    [router, pathname, state],
  );

  const reset = useCallback(() => router.push(pathname, {scroll: false}), [router, pathname]);

  return {state, set, reset, isDefault: searchParams.size === 0};
}
