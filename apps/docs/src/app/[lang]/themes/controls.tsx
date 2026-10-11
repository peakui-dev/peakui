"use client";

import type {BuilderState} from "./url-codec";
import type {ContrastFix, RadiusId} from "@peakui/styles/generator";
import type {ReactNode} from "react";

import {Label, SegmentedControl, Separator, Slider} from "@peakui/react";

import {AccentPopover} from "./accent-popover";
import {ContrastChips} from "./contrast-chips";
import {PresetPicker} from "./preset-picker";
import {matchGalleryPreset} from "./presets";

const RADIUS_OPTIONS: [RadiusId, string][] = [
  ["none", "None"],
  ["extra-small", "XS"],
  ["small", "S"],
  ["medium", "M"],
  ["large", "L"],
  ["extra-large", "XL"],
];

/*
 * Surfaces consume the scale at 1.5x, where the XS step is imperceptible on a card — the
 * control offers the reference's five steps instead. XS stays a valid codec value for presets.
 */
const SURFACE_RADIUS_OPTIONS: [RadiusId, string][] = RADIUS_OPTIONS.filter(
  ([id]) => id !== "extra-small",
);

/** RAC Slider supports multi-thumb values; this slider has exactly one thumb. */
const single = (value: number | number[]): number => (Array.isArray(value) ? value[0]! : value);

/** A labelled group of the panel: the micro-caption names the axis the group controls. */
function Group({children, label}: {children: ReactNode; label: string}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export function ControlsPanel({
  fixes,
  set,
  state,
  variant = "card",
}: {
  fixes: ContrastFix[];
  state: BuilderState;
  set: (patch: Partial<BuilderState>) => void;
  /** "card" wraps the groups in floating-card chrome; "plain" is for a drawer that has its own. */
  variant?: "card" | "plain";
}) {
  const {scheme: _scheme, ...values} = state;
  const {formRadius, grayChroma, radius} = state;
  const activeName = matchGalleryPreset(values)?.name ?? "Custom";

  const body = (
    <>
      <Group label="Presets">
        <PresetPicker activeName={activeName} onSelect={(preset) => set(preset.values)} />
      </Group>
      <Group label="Accent">
        <AccentPopover values={values} onChange={set} />
      </Group>
      <Separator />
      <Group label="Neutral tint">
        <Slider
          maxValue={0.03}
          minValue={0}
          step={0.001}
          value={grayChroma}
          onChange={(g) => set({grayChroma: single(g)})}
        >
          <Label>Neutral tint</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <p className="text-[11px] leading-snug text-muted">
          Accent hue in neutrals — 0 is pure gray.
        </p>
      </Group>
      <Separator />
      <Group label="Surface radius">
        <SegmentedControl
          aria-label="Radius"
          selectedKey={radius}
          size="sm"
          onSelectionChange={(key) => set({radius: key as RadiusId})}
        >
          {SURFACE_RADIUS_OPTIONS.map(([id, label]) => (
            <SegmentedControl.Item key={id} id={id}>
              {label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </Group>
      <Group label="Field radius">
        <SegmentedControl
          aria-label="Form radius"
          selectedKey={formRadius}
          size="sm"
          onSelectionChange={(key) => set({formRadius: key as RadiusId})}
        >
          {RADIUS_OPTIONS.map(([id, label]) => (
            <SegmentedControl.Item key={id} id={id}>
              {label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </Group>
      <Separator />
      <ContrastChips fixes={fixes} />
    </>
  );

  /*
   * The floating instrument card pinned to the screen's right edge (and the same card joined
   * to the page column below lg) carries its own chrome; a drawer provides its own.
   */
  if (variant === "plain") {
    return <div className="flex flex-col gap-6">{body}</div>;
  }

  return (
    <div
      aria-label="Theme controls"
      className="flex flex-col gap-6 rounded-xl border border-separator bg-surface p-6 shadow-overlay"
    >
      {body}
    </div>
  );
}
