"use client";

import {Separator} from "@peakui/react";

export function RenderFunction() {
  return (
    <div className="max-w-md">
      <div className="space-y-1">
        <h4 className="text-base font-medium">PeakUI Components</h4>
        <p className="text-sm text-muted">The design system core: primitives, tokens and charts.</p>
      </div>
      <Separator className="my-4" render={(props) => <div {...props} data-custom="foo" />} />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator
          orientation="vertical"
          render={(props) => <div {...props} data-custom="foo" />}
        />
        <div>Docs</div>
        <Separator
          orientation="vertical"
          render={(props) => <div {...props} data-custom="foo" />}
        />
        <div>Source</div>
      </div>
    </div>
  );
}
