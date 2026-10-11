"use client";

import {Suspense, useState} from "react";
import Link from "next/link";

import {Button} from "@peakui/react";

import {CodePanel} from "./code-panel";
import {ControlsPanel} from "./controls";
import {matchGallery} from "./presets";
import {ThemePreview} from "./theme-preview";
import {useBuilderState} from "./use-builder-state";
import {useBuilderTheme} from "./use-builder-theme";

function Builder() {
  const {state, set, reset, isDefault} = useBuilderState();
  const {derived, previewCss, scheme} = useBuilderTheme(state);
  const {scheme: _scheme, ...values} = state;
  const presetName = matchGallery(values);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-4 border-b border-separator px-6 py-4">
        <Link className="text-sm font-medium text-foreground" href="/en">
          PeakUI
        </Link>
        <h1 className="text-sm font-medium text-muted">Theme Builder</h1>
        <p aria-live="polite" className="text-sm text-muted">
          {presetName}
        </p>
        <div className="ms-auto flex items-center gap-2">
          <Button isDisabled={isDefault} onPress={reset} variant="ghost">
            Reset
          </Button>
          <Button
            onPress={() => navigator.clipboard?.writeText(window.location.href)}
            variant="secondary"
          >
            Share
          </Button>
          <Button onPress={() => setShowPanel((open) => !open)} variant="secondary">
            Code
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 flex-1 flex-col">
          <ThemePreview css={previewCss} scheme={scheme}>
            <div className="p-6" />
          </ThemePreview>
          <ControlsPanel fixes={derived.fixes} set={set} state={state} />
        </main>
        {showPanel && (
          <CodePanel derived={derived} onClose={() => setShowPanel(false)} values={values} />
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
