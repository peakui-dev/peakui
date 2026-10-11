"use client";

import type {BuilderValues} from "./presets";

import {formatOklch, parseOklch} from "@peakui/styles/generator";

import {Button, Input, Label, Popover, Slider, TextField} from "@peakui/react";

const SWATCHES = [
  "oklch(0.555 0.215 262)",
  "#1db954",
  "#e50914",
  "oklch(0.68 0.14 165)",
  "oklch(0.62 0.17 300)",
  "#18181b",
  "#f59e0b",
  "#0ea5e9",
];

const FALLBACK_ACCENT = {l: 0.555, c: 0.215, h: 262, a: 1};

/** RAC Slider supports multi-thumb values; these sliders have exactly one thumb. */
const single = (value: number | number[]): number => (Array.isArray(value) ? value[0]! : value);

const commitHex = (raw: string, onChange: (patch: Partial<BuilderValues>) => void): void => {
  const parsed = parseOklch(raw.trim());

  if (parsed) onChange({accent: formatOklch(parsed)});
};

export function AccentPopover({
  values,
  onChange,
}: {
  values: BuilderValues;
  onChange: (patch: Partial<BuilderValues>) => void;
}) {
  const oklch = parseOklch(values.accent) ?? FALLBACK_ACCENT;
  const commit = (next: {l: number; c: number; h: number}) =>
    onChange({accent: formatOklch({l: next.l, c: next.c, h: next.h, a: 1})});

  // Near-black / near-white accents cannot invert on their own — that is what darkAccent is for.
  const needsDarkAccent = oklch.l < 0.25 || oklch.l > 0.85;

  return (
    <Popover>
      <Button aria-label="Accent color" variant="secondary">
        <span
          aria-hidden="true"
          className="inline-block size-4 rounded-field"
          style={{background: values.accent}}
        />
        Accent
      </Button>
      <Popover.Content>
        <Popover.Dialog className="flex w-80 flex-col gap-5">
          <Slider
            maxValue={360}
            minValue={0}
            onChange={(h) => commit({l: oklch.l, c: oklch.c, h: single(h)})}
            step={1}
            value={oklch.h}
          >
            <Label>Hue</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          <Slider
            maxValue={0.4}
            minValue={0}
            onChange={(c) => commit({l: oklch.l, c: single(c), h: oklch.h})}
            step={0.005}
            value={oklch.c}
          >
            <Label>Chroma</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          <Slider
            maxValue={1}
            minValue={0}
            onChange={(l) => commit({l: single(l), c: oklch.c, h: oklch.h})}
            step={0.005}
            value={oklch.l}
          >
            <Label>Lightness</Label>
            <Slider.Output />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
          <TextField className="w-full">
            <Label>Hex</Label>
            <Input
              onBlur={(event) => commitHex(event.currentTarget.value, onChange)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitHex(event.currentTarget.value, onChange);
              }}
              placeholder="#1db954"
              type="text"
            />
          </TextField>
          <div className="flex flex-wrap gap-2">
            {SWATCHES.map((swatch) => (
              <button
                aria-label={`Accent ${swatch}`}
                className="size-6 rounded-field border border-border"
                key={swatch}
                onClick={() => onChange({accent: swatch})}
                style={{background: swatch}}
                type="button"
              />
            ))}
          </div>
          <TextField
            className="w-full"
            defaultValue={values.darkAccent ?? ""}
            key={values.darkAccent ?? "unset"}
          >
            <Label>Accent for the dark scheme (optional)</Label>
            <Input
              onBlur={(event) => onChange({darkAccent: event.currentTarget.value.trim() || undefined})}
              onKeyDown={(event) => {
                if (event.key === "Enter")
                  onChange({darkAccent: event.currentTarget.value.trim() || undefined});
              }}
              placeholder="#e4e4e7"
              type="text"
            />
          </TextField>
          {needsDarkAccent && (
            <p className="text-xs text-muted">
              This accent cannot invert on its own — set a separate accent for the dark scheme.
            </p>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
