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
  const [showCode, setShowCode] = useState(false);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-16 shrink-0 items-center border-b border-separator">
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-x-4 px-6">
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
            <Button
              className="hidden lg:max-[1919px]:inline-flex"
              variant="secondary"
              onPress={() => setShowControls(true)}
            >
              Controls
            </Button>
            <Button isDisabled={isDefault} variant="ghost" onPress={reset}>
              Reset
            </Button>
            <Button
              variant="secondary"
              onPress={() => navigator.clipboard?.writeText(window.location.href)}
            >
              Share
            </Button>
            <Button variant="primary" onPress={() => setShowCode((open) => !open)}>
              Code
            </Button>
          </div>
        </div>
      </header>
      {/*
       * The specimen sheet is a framed canvas centered in the page: the theme it shows is
       * bounded by the frame, and the site's own chrome stays on the default theme around it.
       * The instrument card floats at the screen's right edge only when it fits beyond the
       * 1400px wrapper; between lg and that width it opens as a drawer, and below lg it
       * joins the column after the sheet.
       */}
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1400px]">
          <ThemePreview css={previewCss} scheme={scheme}>
            <PreviewGallery />
          </ThemePreview>
          <div className="px-6 pb-6 lg:hidden">
            <ControlsPanel fixes={derived.fixes} set={set} state={state} />
          </div>
        </div>
      </main>
      <div className="fixed bottom-4 right-4 top-20 z-40 hidden w-64 min-[1920px]:block">
        <ControlsPanel fixes={derived.fixes} set={set} state={state} variant="card" />
      </div>
      {!!showControls && (
        <aside
          aria-label="Theme controls"
          className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col gap-4 overflow-y-auto border-l border-separator bg-surface p-6 shadow-overlay"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Theme controls</h2>
            <Button
              isIconOnly
              aria-label="Close controls"
              variant="ghost"
              onPress={() => setShowControls(false)}
            >
              ✕
            </Button>
          </div>
          <ControlsPanel fixes={derived.fixes} set={set} state={state} variant="plain" />
        </aside>
      )}
      {!!showCode && (
        <CodePanel
          derived={derived}
          semanticOverrides={matched?.semanticOverrides}
          values={values}
          onClose={() => setShowCode(false)}
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
