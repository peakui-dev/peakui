"use client";

import type {ContrastFix} from "@peakui/styles/generator";
import type {RadiusId} from "@peakui/styles/generator";
import type {BuilderState} from "./url-codec";

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
  state,
  set,
}: {
  fixes: ContrastFix[];
  state: BuilderState;
  set: (patch: Partial<BuilderState>) => void;
}) {
  const {scheme, ...values} = state;
  const {grayChroma, radius, formRadius} = state;

  return (
    <div aria-label="Theme controls" className="flex flex-wrap items-center gap-6 px-6 py-4">
      <AccentPopover onChange={set} values={values} />
      <div className="w-56">
        <Slider
          maxValue={0.03}
          minValue={0}
          onChange={(g) => set({grayChroma: single(g)})}
          step={0.001}
          value={grayChroma}
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
        onSelectionChange={(key) => set({radius: key as RadiusId})}
        selectedKey={radius}
        size="md"
      >
        {RADIUS_OPTIONS.map(([id, label]) => (
          <SegmentedControl.Item id={id} key={id}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <SegmentedControl
        aria-label="Form radius"
        onSelectionChange={(key) => set({formRadius: key as RadiusId})}
        selectedKey={formRadius}
        size="md"
      >
        {RADIUS_OPTIONS.map(([id, label]) => (
          <SegmentedControl.Item id={id} key={id}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <SegmentedControl
        aria-label="Scheme"
        onSelectionChange={(key) => set({scheme: key as BuilderState["scheme"]})}
        selectedKey={scheme}
        size="md"
      >
        {SCHEME_OPTIONS.map(([id, label]) => (
          <SegmentedControl.Item id={id} key={id}>
            {label}
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
      <ContrastChips fixes={fixes} />
    </div>
  );
}
