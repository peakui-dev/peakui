"use client";

import type {Scheme} from "@peakui/styles/generator";
import type {ReactNode} from "react";

export const PREVIEW_ID = "tb-preview";

/*
 * The scoped emission anchors every selector on #tb-preview, so the builder theme reaches the
 * canvas and nothing else; the site's own default-light/dark classes on <html> keep styling
 * the page chrome. The frame — border, radius, shadow, all theme tokens — is what makes the
 * theme read as a bounded specimen sheet rather than the page's own look.
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
      className="m-6 w-auto rounded-xl border border-separator bg-background text-foreground shadow-overlay"
      data-theme={`builder-${scheme}`}
      id={PREVIEW_ID}
    >
      <style dangerouslySetInnerHTML={{__html: css}} />
      {children}
    </div>
  );
}
