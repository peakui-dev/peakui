"use client";

import type {BuilderState} from "./url-codec";
import type {ContrastFix, RadiusId, TokenSet} from "@peakui/styles/generator";
import type {ReactNode} from "react";

import {Label, SegmentedControl, Slider} from "@peakui/react";
import {RADIUS_BASE} from "@peakui/styles/generator";

import {AccentControls} from "./accent-controls";
import {ContrastLedger} from "./contrast-ledger";
import {PresetPicker} from "./preset-picker";
import {matchGalleryPreset} from "./presets";

const RADIUS_OPTIONS: [RadiusId, string][] = [
  ["none", "None"],
  ["extra-small", "Extra small"],
  ["small", "Small"],
  ["medium", "Medium"],
  ["large", "Large"],
  ["extra-large", "Extra large"],
];

/*
 * Controls and surfaces consume the scale at 3x, so past large a surface only meets its 32px
 * clamp — the control stops there, as the reference's does. XL stays a valid codec value.
 */
const SURFACE_RADIUS_OPTIONS: [RadiusId, string][] = RADIUS_OPTIONS.filter(
  ([id]) => id !== "extra-large",
);

/** RAC Slider supports multi-thumb values; this slider has exactly one thumb. */
const single = (value: number | number[]): number => (Array.isArray(value) ? value[0]! : value);

/*
 * One axis of the theme. Groups are set apart by space alone: the caption is quiet, so the
 * controls — not the headings — are what the eye lands on.
 */
function Group({children, title}: {children: ReactNode; title: string}) {
  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="text-xs font-medium text-muted">{title}</h2>
      {children}
    </section>
  );
}

/** A radius scale whose segments draw the corner they set, at its real size. */
function RadiusScale({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  options: [RadiusId, string][];
  value: RadiusId;
  onChange: (value: RadiusId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-muted">{label}</span>
        <span>{options.find(([id]) => id === value)?.[1]}</span>
      </div>
      <SegmentedControl
        aria-label={`${label} radius`}
        className="w-full"
        selectedKey={value}
        size="sm"
        onSelectionChange={(key) => onChange(key as RadiusId)}
      >
        {options.map(([id, name]) => (
          <SegmentedControl.Item key={id} aria-label={name} className="px-0" id={id}>
            <span
              aria-hidden="true"
              className="size-3.5 border-s-[1.5px] border-t-[1.5px] border-current"
              style={{borderStartStartRadius: RADIUS_BASE[id]}}
            />
          </SegmentedControl.Item>
        ))}
      </SegmentedControl>
    </div>
  );
}

export function ControlsPanel({
  className,
  fixes,
  set,
  state,
  tokens,
}: {
  className?: string;
  fixes: ContrastFix[];
  state: BuilderState;
  set: (patch: Partial<BuilderState>) => void;
  /** The derived tokens of the scheme on screen — what the contrast ledger measures. */
  tokens: TokenSet;
}) {
  const {scheme, ...values} = state;
  const {formRadius, grayChroma, radius} = state;
  const activeName = matchGalleryPreset(values)?.name;

  return (
    <aside aria-label="Theme controls" className={`flex flex-col gap-7 p-5 ${className ?? ""}`}>
      <Group title="Presets">
        <PresetPicker
          activeName={activeName}
          scheme={scheme}
          onSelect={(preset) => set({...preset.values, darkAccent: preset.values.darkAccent})}
        />
      </Group>
      <Group title="Color">
        <AccentControls values={values} onChange={set}>
          <Slider
            maxValue={0.03}
            minValue={0}
            step={0.001}
            value={grayChroma}
            onChange={(g) => set({grayChroma: single(g)})}
          >
            <Label className="text-[13px] font-normal text-muted">Tint in the grays</Label>
            <Slider.Output className="text-[13px] font-normal" />
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </AccentControls>
      </Group>
      <Group title="Corners">
        <RadiusScale
          label="Surfaces"
          options={SURFACE_RADIUS_OPTIONS}
          value={radius}
          onChange={(next) => set({radius: next})}
        />
        <RadiusScale
          label="Fields"
          options={RADIUS_OPTIONS}
          value={formRadius}
          onChange={(next) => set({formRadius: next})}
        />
      </Group>
      <Group title="Contrast">
        <ContrastLedger fixes={fixes} tokens={tokens} />
      </Group>
    </aside>
  );
}
