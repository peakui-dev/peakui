"use client";

import type {GalleryPreset} from "./presets";
import type {Scheme} from "@peakui/styles/generator";
import type {CSSProperties} from "react";

import {Check} from "@gravity-ui/icons";
import {deriveTheme} from "@peakui/styles/generator";

import {GALLERY, toPreset} from "./presets";

/*
 * Every preset, run through the engine once: an orb is painted from the accent its preset
 * really ships in the scheme on screen, and its check mark in the text the engine puts on it.
 */
const PREVIEWS = GALLERY.map((preset) => ({
  derived: deriveTheme(toPreset(preset.values, preset.semanticOverrides)),
  preset,
}));

/*
 * A sphere shaded from its own colour. The highlight and the shadow are mixed by the browser
 * from the one accent — no colour math here.
 */
const orb = (color: string | undefined): CSSProperties => ({
  background: `linear-gradient(135deg, color-mix(in oklab, ${color} 68%, white), ${color} 55%, color-mix(in oklab, ${color} 78%, black))`,
});

/*
 * The presets as a grid of named orbs, four to a row, set straight into the panel: one click
 * tries a preset, and the page behind is the preview. The chosen orb carries a check mark
 * instead of a ring, and its name takes the foreground.
 */
export function PresetPicker({
  activeName,
  className = "-mx-2 -my-1 grid grid-cols-4",
  onSelect,
  scheme,
}: {
  /** The preset the current values match; a custom theme matches none. */
  activeName: string | undefined;
  /** The grid itself; the default is the inspector's four columns. */
  className?: string;
  scheme: Scheme;
  onSelect: (preset: GalleryPreset) => void;
}) {
  return (
    <div className={className}>
      {PREVIEWS.map(({derived, preset}) => {
        const tokens = derived[scheme];
        const isSelected = preset.name === activeName;

        return (
          <button
            key={preset.name}
            aria-pressed={isSelected}
            type="button"
            className={`flex flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-xs outline-none hover:bg-default-soft focus-visible:status-focused ${
              isSelected ? "font-medium text-foreground" : "text-muted hover:text-foreground"
            }`}
            onClick={() => onSelect(preset)}
          >
            <span
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-full"
              style={{...orb(tokens["accent"]), color: tokens["accent-foreground"]}}
            >
              {!!isSelected && <Check className="size-[1.125rem]" />}
            </span>
            {preset.name}
          </button>
        );
      })}
    </div>
  );
}
