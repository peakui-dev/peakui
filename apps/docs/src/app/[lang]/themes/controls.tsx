"use client";

import type {BuilderState} from "./url-codec";
import type {ContrastFix, RadiusId} from "@peakui/styles/generator";
import type {ReactNode} from "react";

import {Label, SegmentedControl, Separator, Slider} from "@peakui/react";

import {AccentPopover} from "./accent-popover";
import {ContrastChips} from "./contrast-chips";
import {GALLERY, matchGalleryPreset} from "./presets";

const RADIUS_OPTIONS: [RadiusId, string][] = [
  ["none", "None"],
  ["extra-small", "XS"],
  ["small", "S"],
  ["medium", "M"],
  ["large", "L"],
  ["extra-large", "XL"],
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
  /** "card" floats on the themed page; "plain" sits inside a drawer that has its own surface. */
  variant?: "card" | "plain";
}) {
  const {scheme: _scheme, ...values} = state;
  const {formRadius, grayChroma, radius} = state;
  const activeName = matchGalleryPreset(values)?.name ?? "Custom";

  const body = (
    <>
      <Group label="Presets">
        <div className="grid grid-cols-2 gap-1.5">
          {GALLERY.map((preset) => (
            <button
              key={preset.name}
              aria-pressed={preset.name === activeName}
              type="button"
              className={
                preset.name === activeName
                  ? "flex items-center gap-2 rounded-field bg-default px-2.5 py-1.5 text-xs text-foreground"
                  : "flex items-center gap-2 rounded-field bg-background px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
              }
              onClick={() => set({...preset.values, darkAccent: preset.values.darkAccent})}
            >
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{background: preset.values.accent}}
              />
              {preset.name}
            </button>
          ))}
        </div>
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

  if (variant === "plain") {
    return <div className="flex flex-col gap-6">{body}</div>;
  }

  return (
    <aside
      aria-label="Theme controls"
      className="flex h-full flex-col gap-6 overflow-y-auto rounded-xl bg-surface p-6"
    >
      {body}
    </aside>
  );
}
