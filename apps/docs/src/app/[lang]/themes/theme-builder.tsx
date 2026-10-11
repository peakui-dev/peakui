"use client";

import {Suspense} from "react";
import Link from "next/link";

import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder() {
  const {state} = useBuilderState();
  const {derived, previewCss, scheme} = useBuilderTheme(state);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-4 border-b border-separator px-6 py-4">
        <Link className="text-sm font-medium text-foreground" href="/en">
          PeakUI
        </Link>
        <h1 className="text-sm font-medium text-muted">Theme Builder</h1>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">
        <ThemePreview css={previewCss} scheme={scheme}>
          <div className="p-6" />
        </ThemePreview>
      </main>
    </div>
  );
}

export function ThemeBuilder() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
