import {Separator} from "@peakui/react";

export function Basic() {
  return (
    <div className="max-w-md">
      <div className="space-y-1">
        <h4 className="text-base font-medium">PeakUI Components</h4>
        <p className="text-sm text-muted">The design system core: primitives, tokens and charts.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  );
}
