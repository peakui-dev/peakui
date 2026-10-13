"use client";

import type {BuilderValues} from "./presets";
import type {ReactNode} from "react";

import {Button, Disclosure, Input, InputGroup, Label, Slider, TextField} from "@peakui/react";
import {formatOklch, parseOklch} from "@peakui/styles/generator";

const FALLBACK_ACCENT = {l: 0.555, c: 0.215, h: 262, a: 1};

/** RAC Slider supports multi-thumb values; these sliders have exactly one thumb. */
const single = (value: number | number[]): number => (Array.isArray(value) ? value[0]! : value);

/** Half the thumb: the track reserves it as a border on each side, and the thumb's centre travels between. */
const TRACK_INSET = "0.75rem";

/*
 * A track painted with the range its thumb travels. The stops are oklch() strings the browser
 * resolves — no colour math here — spread between the insets so each sits under the thumb's centre.
 */
const track = (stops: string[]): string => {
  const last = stops.length - 1;
  const at = (index: number): string =>
    `calc(${TRACK_INSET} + (100% - 2 * ${TRACK_INSET}) * ${index / last})`;

  return `linear-gradient(to right, ${stops.map((stop, index) => `${stop} ${at(index)}`).join(", ")})`;
};

const steps = (count: number): number[] => Array.from({length: count}, (_, i) => i / (count - 1));

/** A stop in the engine's own rounded notation, so the server and the browser serialise it alike. */
const stop = (l: number, c: number, h: number): string => formatOklch({l, c, h, a: 1});

/** The gradient replaces the fill, so the borders the fill would colour stay clear. */
const TRACK_CLASS = "border-s-transparent! border-e-transparent! bg-origin-border";
const LABEL_CLASS = "text-[13px] font-normal text-muted";
const OUTPUT_CLASS = "text-[13px] font-normal";

/*
 * The accent, in the order people reach for it: the value itself and its hue stay in view;
 * chroma, lightness and the dark-scheme accent wait behind one disclosure. `children` are the
 * everyday controls of the same group, placed ahead of that disclosure.
 */
export function AccentControls({
  children,
  onChange,
  values,
}: {
  children?: ReactNode;
  values: BuilderValues;
  onChange: (patch: Partial<BuilderValues>) => void;
}) {
  const oklch = parseOklch(values.accent) ?? FALLBACK_ACCENT;
  const {c, h, l} = oklch;
  const commit = (next: {l: number; c: number; h: number}) =>
    onChange({accent: formatOklch({l: next.l, c: next.c, h: next.h, a: 1})});

  const commitText = (raw: string): void => {
    // The field shows the stored value, so leaving it untouched must not rewrite a preset's hex.
    if (raw.trim() === values.accent) return;

    const parsed = parseOklch(raw.trim());

    if (parsed) onChange({accent: formatOklch(parsed)});
  };

  const commitDark = (raw: string): void => {
    const next = raw.trim() || undefined;

    if (next !== values.darkAccent) onChange({darkAccent: next});
  };

  // Near-black / near-white accents cannot invert on their own — that is what darkAccent is for.
  const needsDarkAccent = l < 0.25 || l > 0.85;

  return (
    <div className="flex flex-col gap-4">
      <TextField
        key={values.accent}
        fullWidth
        aria-label="Accent color, hex or oklch()"
        defaultValue={values.accent}
        variant="secondary"
      >
        <InputGroup fullWidth>
          <InputGroup.Prefix>
            <span
              aria-hidden="true"
              className="block size-4 rounded-full border border-separator"
              style={{background: values.accent}}
            />
          </InputGroup.Prefix>
          <InputGroup.Input
            className="font-mono text-xs"
            placeholder="#1db954"
            onBlur={(event) => commitText(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitText(event.currentTarget.value);
            }}
          />
        </InputGroup>
      </TextField>
      <Slider
        maxValue={360}
        minValue={0}
        step={1}
        value={h}
        formatOptions={{
          maximumFractionDigits: 0,
          style: "unit",
          unit: "degree",
          unitDisplay: "narrow",
        }}
        onChange={(next) => commit({l, c, h: single(next)})}
      >
        <Label className={LABEL_CLASS}>Hue</Label>
        <Slider.Output className={OUTPUT_CLASS} />
        <Slider.Track
          className={TRACK_CLASS}
          style={{backgroundImage: track(steps(13).map((t) => stop(0.72, 0.15, t * 360)))}}
        >
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      {children}
      {/* Opens on its own when a dark-scheme accent is set, so a shared link shows what it carries. */}
      <Disclosure defaultExpanded={values.darkAccent !== undefined}>
        <Disclosure.Heading>
          <Button className="-mx-2 font-normal text-muted" size="sm" slot="trigger" variant="ghost">
            Chroma, lightness, dark scheme
            <Disclosure.Indicator />
          </Button>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body className="flex flex-col gap-4 pt-3">
            <Slider
              maxValue={0.4}
              minValue={0}
              step={0.005}
              value={c}
              onChange={(next) => commit({l, c: single(next), h})}
            >
              <Label className={LABEL_CLASS}>Chroma</Label>
              <Slider.Output className={OUTPUT_CLASS} />
              <Slider.Track
                className={TRACK_CLASS}
                style={{backgroundImage: track(steps(5).map((t) => stop(l, t * 0.4, h)))}}
              >
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <Slider
              maxValue={1}
              minValue={0}
              step={0.005}
              value={l}
              onChange={(next) => commit({l: single(next), c, h})}
            >
              <Label className={LABEL_CLASS}>Lightness</Label>
              <Slider.Output className={OUTPUT_CLASS} />
              <Slider.Track
                className={TRACK_CLASS}
                style={{backgroundImage: track(steps(9).map((t) => stop(t, c, h)))}}
              >
                <Slider.Thumb />
              </Slider.Track>
            </Slider>
            <TextField
              key={values.darkAccent ?? "unset"}
              fullWidth
              defaultValue={values.darkAccent ?? ""}
              variant="secondary"
            >
              <Label className={LABEL_CLASS}>Accent in the dark scheme</Label>
              <Input
                className="font-mono text-xs"
                placeholder="Same as light"
                type="text"
                onBlur={(event) => commitDark(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitDark(event.currentTarget.value);
                }}
              />
            </TextField>
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
      {!!needsDarkAccent && values.darkAccent === undefined && (
        <p className="text-xs leading-snug text-muted">
          This accent is too close to black or white to carry both schemes. Give the dark scheme its
          own.
        </p>
      )}
    </div>
  );
}
