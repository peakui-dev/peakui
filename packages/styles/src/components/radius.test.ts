import {readFileSync} from "node:fs";

import {describe, expect, it} from "vitest";

import {defaultPreset} from "../../presets/index.ts";
import {RADIUS_BASE} from "../generator/preset.ts";

/*
 * Content gate, in the shape of button.pending.test.ts: the package runs in node and cannot
 * compute a style.
 *
 * `--radius` is two things at once: the theme's roundness knob and the unit of the Tailwind
 * radius scale, where `rounded-lg` is 1x. The default stays on the medium step, so `rounded-lg`
 * is 8px for every utility a consumer writes, and a component reaches its look through a
 * multiple of that unit. Raising the base instead rescales every `rounded-*` in the system,
 * including the ones nobody remapped: a 16px checkbox at `rounded-md` becomes a circle.
 */

const css = (name: string): string => readFileSync(`components/${name}.css`, "utf8");

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe("radius scale", () => {
  it("keeps the default theme on the medium step, so rounded-lg is 8px", () => {
    expect(RADIUS_BASE[defaultPreset.radius]).toBe("0.5rem");
  });

  it("ships that base in the generated default theme", () => {
    expect(readFileSync("themes/default/variables.css", "utf8")).toMatch(/\s--radius: 0\.5rem;/);
  });

  // 3x of the 8px unit is 24px: a capsule on every control up to 48px tall.
  it.each([
    ["button", "--button-radius: var(--radius-3xl);", 1],
    ["toggle-button", "--toggle-button-radius: var(--radius-3xl);", 1],
    ["segmented-control", "--segmented-control-radius: var(--radius-3xl);", 1],
    ["segmented-control", "--segmented-control-indicator-radius: var(--radius-3xl);", 1],
    ["button-group", "rounded-3xl", 2],
    ["toggle-button-group", "rounded-3xl", 3],
    ["tabs", "rounded-3xl", 2],
    ["tabs", "border-radius: calc(var(--radius) * 2.5);", 1],
    ["modal", "rounded-3xl", 1],
  ])("%s rounds its controls with %s", (file, declaration, times) => {
    expect(count(css(file), declaration)).toBe(times);
  });

  it.each([
    ["chip", "rounded-2xl"],
    ["tag", "rounded-2xl"],
    ["list-box-item", "rounded-2xl"],
    ["menu-item", "rounded-2xl"],
    ["close-button", "rounded-xl"],
    ["link", "rounded-xl"],
  ])("%s rounds its small parts with %s", (file, utility) => {
    expect(count(css(file), utility)).toBe(1);
  });

  // 24px on the default step; the clamp stops a large step from turning a surface into a bubble.
  it.each(["alert", "card", "dropdown", "modal", "popover", "toast"])(
    "%s takes the surface radius, clamped at 32px",
    (file) => {
      expect(count(css(file), "border-radius: min(32px, var(--radius-3xl));")).toBe(1);
    },
  );
});
