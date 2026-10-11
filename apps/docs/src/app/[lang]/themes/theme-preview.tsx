"use client";

import type {Scheme} from "@peakui/styles/generator";
import type {ReactNode} from "react";

export const PREVIEW_ID = "tb-preview";

/*
 * The scoped emission anchors every selector on #tb-preview, so the builder theme reaches the
 * preview and nothing else; the site's own default-light/dark classes on <html> keep styling
 * the page chrome.
 */
export function ThemePreview({
  children,
  css,
  scheme,
}: {
  children: ReactNode;
  css: string;
  scheme: Scheme;
}) {
  return (
    <div
      className="flex-1 overflow-y-auto bg-background text-foreground"
      data-theme={`builder-${scheme}`}
      id={PREVIEW_ID}
    >
      <style dangerouslySetInnerHTML={{__html: css}} />
      {children}
    </div>
  );
}
