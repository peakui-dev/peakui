"use client";

import {Button} from "@peakui/react";
import Link from "next/link";
import {Suspense, useState} from "react";

import {CodePanel} from "./code-panel";
import {ControlsPanel} from "./controls";
import {PresetPicker} from "./preset-picker";
import {matchGalleryPreset} from "./presets";
import {PreviewGallery} from "./preview/gallery";
import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder() {
  const {isDefault, reset, set, state} = useBuilderState();
  const {scheme: _scheme, ...values} = state;
  // A preset's semanticOverrides reattach through the value match — preset click and shared
  // link alike — so the preview and the export agree on what those values mean.
  const matched = matchGalleryPreset(values);
  const {derived, previewCss, scheme} = useBuilderTheme(state, matched?.semanticOverrides);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-separator px-6 py-4">
        <Link className="text-sm font-medium text-foreground" href="/en">
          PeakUI
        </Link>
        <h1 className="text-sm font-medium text-muted">Theme Builder</h1>
        <p aria-live="polite" className="text-sm text-muted">
          {matched?.name ?? "Custom"}
        </p>
        <div className="ms-auto flex items-center gap-2">
          <PresetPicker
            activeName={matched?.name ?? "Custom"}
            onSelect={(preset) => set(preset.values)}
          />
          <Button isDisabled={isDefault} variant="ghost" onPress={reset}>
            Reset
          </Button>
          <Button
            variant="secondary"
            onPress={() => navigator.clipboard?.writeText(window.location.href)}
          >
            Share
          </Button>
          <Button variant="secondary" onPress={() => setShowPanel((open) => !open)}>
            Code
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 flex-1 flex-col">
          <ThemePreview css={previewCss} scheme={scheme}>
            <PreviewGallery />
          </ThemePreview>
          <ControlsPanel fixes={derived.fixes} set={set} state={state} />
        </main>
        {!!showPanel && (
          <CodePanel
            derived={derived}
            semanticOverrides={matched?.semanticOverrides}
            values={values}
            onClose={() => setShowPanel(false)}
          />
        )}
      </div>
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
