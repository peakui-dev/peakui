import {Magnifier} from "@gravity-ui/icons";
import {EmptyState} from "@peakui/react";

export function WithIcon() {
  return (
    <EmptyState className="flex max-w-sm flex-col items-center gap-1 py-8 text-center">
      <Magnifier height={24} width={24} />
      <p className="text-sm font-medium text-foreground">Nothing found</p>
      <p>Try a different query or reset the filters</p>
    </EmptyState>
  );
}
