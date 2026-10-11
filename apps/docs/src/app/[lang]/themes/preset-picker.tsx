"use client";

import type {GalleryPreset} from "./presets";

import {Button, Popover} from "@peakui/react";
import {useContext} from "react";
import {OverlayTriggerStateContext} from "react-aria-components";

import {GALLERY} from "./presets";

function PresetButton({
  activeName,
  onSelect,
  preset,
}: {
  activeName: string;
  onSelect: (preset: GalleryPreset) => void;
  preset: GalleryPreset;
}) {
  // Provided to the popover's subtree; lives here so selection closes the picker.
  const popoverState = useContext(OverlayTriggerStateContext);

  return (
    <button
      key={preset.name}
      aria-current={preset.name === activeName || undefined}
      className="flex items-center gap-3 rounded-field px-3 py-2 text-sm text-foreground hover:bg-surface"
      type="button"
      onClick={() => {
        onSelect(preset);
        popoverState?.close();
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block size-4 rounded-field border border-border"
        style={{background: preset.values.accent}}
      />
      {preset.name}
    </button>
  );
}

export function PresetPicker({
  activeName,
  onSelect,
}: {
  activeName: string;
  onSelect: (preset: GalleryPreset) => void;
}) {
  return (
    <Popover>
      <Button aria-label="Preset themes" variant="secondary">
        {activeName}
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex w-56 flex-col gap-1">
          {GALLERY.map((preset) => (
            <PresetButton
              key={preset.name}
              activeName={activeName}
              preset={preset}
              onSelect={onSelect}
            />
          ))}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
