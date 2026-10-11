"use client";

import type {BuilderState} from "./url-codec";
import type {ContrastFix, RadiusId} from "@peakui/styles/generator";

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

const SCHEME_OPTIONS: [BuilderState["scheme"], string][] = [
  ["light", "Light"],
  ["dark", "Dark"],
];

/** RAC Slider supports multi-thumb values; this slider has exactly one thumb. */
const single = (value: number | number[]): number => (Array.isArray(value) ? value[0]! : value);

export function ControlsPanel({
  fixes,
  set,
  state,
}: {
  fixes: ContrastFix[];
  state: BuilderState;
  set: (patch: Partial<BuilderState>) => void;
}) {
  const {scheme, ...values} = state;
  const {formRadius, grayChroma, radius} = state;

  return (
    <div aria-label="Theme controls" className="flex flex-wrap items-center gap-6 px-6 py-4">
      <AccentPopover values={values} onChange={set} />
      <div className="w-56">
        <Slider
          maxValue={0.03}
          minValue={0}
          step={0.001}
          value={grayChroma}
          onChange={(g) => set({grayChroma: single(g)})}
        >
          <Label>Neutral saturation</Label>
          <Slider.Output />
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
      <SegmentedControl
        aria-label="Radius"
        selectedKey={radius}
        size="md"
        onSelectionChange={(key) => set({radius: key as RadiusId})}
      >
        {RADIUS_OPTIONS.map(([id, label]) => (
          <SegmentedControl.Item key={id} id={id}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
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
      <SegmentedControl
        aria-label="Scheme"
        selectedKey={scheme}
        size="md"
        onSelectionChange={(key) => set({scheme: key as BuilderState["scheme"]})}
      >
        {SCHEME_OPTIONS.map(([id, label]) => (
          <SegmentedControl.Item key={id} id={id}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <ContrastChips fixes={fixes} />
    </div>
  );
}
