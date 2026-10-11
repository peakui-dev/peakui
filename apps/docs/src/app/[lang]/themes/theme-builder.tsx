"use client";

import type {BuilderState} from "./url-codec";

import {Button, SegmentedControl} from "@peakui/react";
import Link from "next/link";
import {Suspense, useState} from "react";

import {CodePanel} from "./code-panel";
import {ControlsPanel} from "./controls";
import {matchGalleryPreset} from "./presets";
import {PreviewGallery} from "./preview/gallery";
import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder({themeDerivations}: {themeDerivations?: string}) {
  const {isDefault, reset, set, state} = useBuilderState();
  const {scheme: _scheme, ...values} = state;
  // A preset's semanticOverrides reattach through the value match — preset click and shared
  // link alike — so the preview and the export agree on what those values mean.
  const matched = matchGalleryPreset(values);
  const {derived, previewCss, scheme} = useBuilderTheme(
    state,
    matched?.semanticOverrides,
    themeDerivations,
  );
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center border-b border-separator">
        <div className="flex w-full items-center gap-x-4 px-6 lg:mx-auto lg:max-w-[1400px]">
          <Link className="text-sm font-semibold tracking-tight text-foreground" href="/en">
            PeakUI
          </Link>
          <h1 className="text-sm font-medium text-muted">Theme Builder</h1>
          <p
            aria-live="polite"
            className="flex items-center gap-2 rounded-field border border-separator px-2.5 py-1 text-xs text-muted"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{background: state.accent}}
            />
            {matched?.name ?? "Custom"}
          </p>
          <div className="ms-auto flex items-center gap-2">
            <SegmentedControl
              aria-label="Scheme"
              selectedKey={state.scheme}
              size="sm"
              onSelectionChange={(key) => set({scheme: key as BuilderState["scheme"]})}
            >
              <SegmentedControl.Item id="light">Light</SegmentedControl.Item>
              <SegmentedControl.Item id="dark">Dark</SegmentedControl.Item>
            </SegmentedControl>
            <Button isDisabled={isDefault} variant="ghost" onPress={reset}>
              Reset
            </Button>
            <Button
              variant="secondary"
              onPress={() => navigator.clipboard?.writeText(window.location.href)}
            >
              Share
            </Button>
            <Button variant="primary" onPress={() => setShowPanel((open) => !open)}>
              Code
            </Button>
          </div>
        </div>
      </header>
      {/*
       * The sheet scrolls as one column inside the 1400px wrapper; the instrument card hangs
       * off the screen's right edge (fixed, lg+), and the reserved padding keeps the sheet's
       * right column from sliding under it. Below lg the card joins the column.
       */}
      <main className="min-h-0 flex-1 overflow-y-auto lg:pr-[344px]">
        <div className="mx-auto w-full max-w-[1400px]">
          <ThemePreview css={previewCss} scheme={scheme}>
            <PreviewGallery />
          </ThemePreview>
          <div className="px-6 pb-6 lg:hidden">
            <ControlsPanel fixes={derived.fixes} set={set} state={state} />
          </div>
        </div>
      </main>
      <div className="fixed bottom-6 right-6 top-20 z-40 hidden w-80 lg:block">
        <ControlsPanel rail fixes={derived.fixes} set={set} state={state} />
      </div>
      {!!showPanel && (
        <CodePanel
          derived={derived}
          semanticOverrides={matched?.semanticOverrides}
          values={values}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}

export function ThemeBuilder({themeDerivations}: {themeDerivations?: string}) {
  return (
    <Suspense fallback={null}>
      <Builder themeDerivations={themeDerivations} />
    </Suspense>
  );
}
