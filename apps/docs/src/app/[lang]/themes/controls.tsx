"use client";

import type {BuilderState} from "./url-codec";
import type {ContrastFix, RadiusId} from "@peakui/styles/generator";
import type {ReactNode} from "react";

import {Label, SegmentedControl, Slider} from "@peakui/react";

import {AccentPopover} from "./accent-popover";
import {ContrastChips} from "./contrast-chips";

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

/** A labelled group of the toolbar: the micro-caption names the axis the group controls. */
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
}: {
  fixes: ContrastFix[];
  state: BuilderState;
  set: (patch: Partial<BuilderState>) => void;
}) {
  const {...values} = state;
  const {formRadius, grayChroma, radius} = state;

  return (
    <div
      aria-label="Theme controls"
      className="flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-separator px-6 py-4"
    >
      <Group label="Accent">
        <AccentPopover values={values} onChange={set} />
      </Group>
      <Group label="Neutral tint">
        <div className="w-56">
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
          <p className="mt-1 text-[11px] leading-snug text-muted">
            Accent hue in neutrals — 0 is pure gray.
          </p>
        </div>
      </Group>
      <Group label="Surface radius">
        <SegmentedControl
          aria-label="Radius"
          selectedKey={radius}
          size="md"
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
          size="md"
          onSelectionChange={(key) => set({formRadius: key as RadiusId})}
        >
          {RADIUS_OPTIONS.map(([id, label]) => (
            <SegmentedControl.Item key={id} id={id}>
              {label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </Group>
      <div className="ms-auto self-center">
        <ContrastChips fixes={fixes} />
      </div>
    </div>
  );
}
