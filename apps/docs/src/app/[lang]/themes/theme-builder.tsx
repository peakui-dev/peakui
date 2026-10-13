"use client";

import type {BuilderState} from "./url-codec";

import {Sliders} from "@gravity-ui/icons";
import {Button, CloseButton, SegmentedControl} from "@peakui/react";
import Link from "next/link";
import {Suspense, useEffect, useState} from "react";

import {CodePanel} from "./code-panel";
import {ControlsPanel} from "./controls";
import {matchGalleryPreset} from "./presets";
import {PreviewGallery} from "./preview/gallery";
import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder() {
  const {isDefault, reset, set, state} = useBuilderState();
  const {scheme: _scheme, ...values} = state;
  // A preset's semanticOverrides reattach through the value match — preset click and shared
  // link alike — so the page and the export agree on what those values mean.
  const matched = matchGalleryPreset(values);
  const {derived, scheme, themeCss} = useBuilderTheme(state, matched?.semanticOverrides);
  const tokens = derived[scheme];
  const [showCode, setShowCode] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!showCode && !showControls) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCode(false);
        setShowControls(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [showCode, showControls]);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), 2000);

    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyLink = () => {
    void navigator.clipboard?.writeText(window.location.href).then(() => setCopied(true));
  };

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-separator px-4 sm:px-6">
        <Link className="text-sm font-semibold tracking-tight text-foreground" href="/en">
          PeakUI
        </Link>
        <span aria-hidden="true" className="text-sm text-muted max-sm:hidden">
          /
        </span>
        <h1 className="text-sm font-medium text-muted max-sm:sr-only">Theme builder</h1>
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
          <Button className="max-sm:hidden" isDisabled={isDefault} variant="ghost" onPress={reset}>
            Reset
          </Button>
          <Button className="max-sm:hidden" variant="secondary" onPress={copyLink}>
            <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
          </Button>
          <Button variant="primary" onPress={() => setShowCode((open) => !open)}>
            Export
          </Button>
        </div>
      </header>
      {/*
       * The whole page is the preview: the generated theme rides :root via <html>, so the
       * header and the inspector follow it as much as the specimen does. From lg up the
       * inspector stays beside the specimen as a card, always in reach; below lg it is a sheet over
       * the lower part of the screen, so the specimen stays visible while a control moves.
       */}
      <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin max-lg:pb-20">
        <div className="flex">
          {/* The columns of the specimen follow this box, not the viewport. */}
          <div className="@container min-w-0 flex-1">
            <ThemePreview css={themeCss} scheme={scheme}>
              <PreviewGallery
                accent={tokens["accent"] ?? state.accent}
                name={matched?.name ?? "Custom"}
              />
            </ThemePreview>
          </div>
          {/*
           * The inspector rides inside the page's scroller, pinned under the header, so the
           * scrollbar belongs to the page's edge and not to the gap beside the card. Its box
           * is the viewport minus the header (h-14).
           */}
          <div className="sticky top-0 flex h-[calc(100dvh-3.5rem)] shrink-0 self-start py-3 pe-3 max-lg:hidden">
            <ControlsPanel
              className="max-h-full w-[320px] self-start overflow-y-auto rounded-2xl bg-surface shadow-surface scrollbar-thin"
              fixes={derived.fixes}
              set={set}
              state={state}
              tokens={tokens}
            />
          </div>
        </div>
      </main>
      {showControls ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[62dvh] flex-col rounded-t-3xl border-t border-separator bg-surface shadow-overlay lg:hidden">
          <div className="flex shrink-0 items-center justify-between border-b border-separator py-3 ps-5 pe-3">
            <div className="flex items-center gap-2">
              <Button isDisabled={isDefault} size="sm" variant="ghost" onPress={reset}>
                Reset
              </Button>
              <Button size="sm" variant="secondary" onPress={copyLink}>
                <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
              </Button>
            </div>
            <CloseButton aria-label="Close controls" onPress={() => setShowControls(false)} />
          </div>
          <ControlsPanel
            className="min-h-0 overflow-y-auto"
            fixes={derived.fixes}
            set={set}
            state={state}
            tokens={tokens}
          />
        </div>
      ) : (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center lg:hidden">
          <Button
            className="pointer-events-auto shadow-overlay"
            variant="primary"
            onPress={() => setShowControls(true)}
          >
            <Sliders />
            Customize
          </Button>
        </div>
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

export function ThemeBuilder() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
