"use client";

import {Button, Label, ListBox, Select, Spinner} from "@peakui/react";
import React from "react";

interface Pokemon {
  name: string;
}

/*
 * A minimal cursor-paginated hook stands in for the async list utility the reference's demo
 * uses, which is not one of peakui's dependencies.
 */
function usePokemonList() {
  const [items, setItems] = React.useState<Pokemon[]>([]);
  const [loadingState, setLoadingState] = React.useState<"idle" | "loading" | "loadingMore">(
    "idle",
  );
  const cursorRef = React.useRef<string | null>("https://pokeapi.co/api/v2/pokemon");
  const inFlightRef = React.useRef(false);

  const load = React.useCallback(async (mode: "loading" | "loadingMore") => {
    if (inFlightRef.current) return;

    const cursor = cursorRef.current;

    if (!cursor) return;

    inFlightRef.current = true;
    setLoadingState(mode);

    try {
      const res = await fetch(cursor);
      const json: {next?: string; results?: Pokemon[]} = await res.json();

      setItems((previous) => [...previous, ...(json.results ?? [])]);
      cursorRef.current = json.next ?? null;
    } catch {
      // Aborted or offline: keep whatever has loaded.
    } finally {
      inFlightRef.current = false;
      setLoadingState("idle");
    }
  }, []);

  React.useEffect(() => {
    void load("loading");
  }, [load]);

  return {items, loadingState, loadMore: () => void load("loadingMore")};
}

export function AsynchronousLoading() {
  const list = usePokemonList();

  return (
    <Select className="w-[256px]" placeholder="Select a Pokemon">
      <Label>Pick a Pokemon</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {list.items.map((item) => (
            <ListBox.Item key={item.name} id={item.name} textValue={item.name}>
              {item.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
        <div className="flex items-center justify-center gap-2 border-t border-border p-2">
          {list.loadingState === "idle" ? (
            <Button size="sm" variant="ghost" onPress={list.loadMore}>
              Load more
            </Button>
          ) : (
            <>
              <Spinner size="sm" />
              <span className="text-sm text-muted">Loading...</span>
            </>
          )}
        </div>
      </Select.Popover>
    </Select>
  );
}
