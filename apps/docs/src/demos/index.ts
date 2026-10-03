import type {ComponentType} from "react";

export interface DemoItem {
  loader: () => Promise<ComponentType>;
  /** Source file path relative to `src/demos`, read from disk to show the code. */
  file: string;
}

/**
 * The demo registry. A key is what `<ComponentPreview name="...">` refers to; keys keep the order
 * of the documentation pages, which is why the sort-keys rules are off for this file.
 */
export const demos: Record<string, DemoItem> = {
  // button
  "button-basic": {
    loader: () => import("./button/basic").then((m) => m.Basic),
    file: "button/basic.tsx",
  },
  "button-variants": {
    loader: () => import("./button/variants").then((m) => m.Variants),
    file: "button/variants.tsx",
  },
  "button-sizes": {
    loader: () => import("./button/sizes").then((m) => m.Sizes),
    file: "button/sizes.tsx",
  },
  "button-with-icons": {
    loader: () => import("./button/with-icons").then((m) => m.WithIcons),
    file: "button/with-icons.tsx",
  },
  "button-icon-only": {
    loader: () => import("./button/icon-only").then((m) => m.IconOnly),
    file: "button/icon-only.tsx",
  },
  "button-loading": {
    loader: () => import("./button/loading").then((m) => m.Loading),
    file: "button/loading.tsx",
  },
  "button-loading-state": {
    loader: () => import("./button/loading-state").then((m) => m.LoadingState),
    file: "button/loading-state.tsx",
  },
  "button-pressed-state": {
    loader: () => import("./button/pressed-state").then((m) => m.PressedState),
    file: "button/pressed-state.tsx",
  },
  "button-disabled": {
    loader: () => import("./button/disabled").then((m) => m.Disabled),
    file: "button/disabled.tsx",
  },
  "button-full-width": {
    loader: () => import("./button/full-width").then((m) => m.FullWidth),
    file: "button/full-width.tsx",
  },
  "button-custom-variants": {
    loader: () => import("./button/custom-variants").then((m) => m.CustomVariants),
    file: "button/custom-variants.tsx",
  },
  // spinner
  "spinner-basic": {
    loader: () => import("./spinner/basic").then((m) => m.Basic),
    file: "spinner/basic.tsx",
  },
  "spinner-sizes": {
    loader: () => import("./spinner/sizes").then((m) => m.Sizes),
    file: "spinner/sizes.tsx",
  },
  "spinner-colors": {
    loader: () => import("./spinner/colors").then((m) => m.Colors),
    file: "spinner/colors.tsx",
  },
  "spinner-custom-label": {
    loader: () => import("./spinner/custom-label").then((m) => m.CustomLabel),
    file: "spinner/custom-label.tsx",
  },
  // input
  "input-basic": {
    loader: () => import("./input/basic").then((m) => m.Basic),
    file: "input/basic.tsx",
  },
  "input-variants": {
    loader: () => import("./input/variants").then((m) => m.Variants),
    file: "input/variants.tsx",
  },
  "input-types": {
    loader: () => import("./input/types").then((m) => m.Types),
    file: "input/types.tsx",
  },
  "input-disabled": {
    loader: () => import("./input/disabled").then((m) => m.Disabled),
    file: "input/disabled.tsx",
  },
  "input-full-width": {
    loader: () => import("./input/full-width").then((m) => m.FullWidth),
    file: "input/full-width.tsx",
  },
  "input-controlled": {
    loader: () => import("./input/controlled").then((m) => m.Controlled),
    file: "input/controlled.tsx",
  },
  // input-group
  "input-group-basic": {
    loader: () => import("./input-group/basic").then((m) => m.Basic),
    file: "input-group/basic.tsx",
  },
  "input-group-with-prefix": {
    loader: () => import("./input-group/with-prefix").then((m) => m.WithPrefix),
    file: "input-group/with-prefix.tsx",
  },
  "input-group-with-suffix": {
    loader: () => import("./input-group/with-suffix").then((m) => m.WithSuffix),
    file: "input-group/with-suffix.tsx",
  },
  "input-group-with-prefix-and-suffix": {
    loader: () => import("./input-group/with-prefix-and-suffix").then((m) => m.WithPrefixAndSuffix),
    file: "input-group/with-prefix-and-suffix.tsx",
  },
  "input-group-with-button": {
    loader: () => import("./input-group/with-button").then((m) => m.WithButton),
    file: "input-group/with-button.tsx",
  },
  "input-group-with-text-area": {
    loader: () => import("./input-group/with-text-area").then((m) => m.WithTextArea),
    file: "input-group/with-text-area.tsx",
  },
  "input-group-variants": {
    loader: () => import("./input-group/variants").then((m) => m.Variants),
    file: "input-group/variants.tsx",
  },
  "input-group-in-text-field": {
    loader: () => import("./input-group/in-text-field").then((m) => m.InTextField),
    file: "input-group/in-text-field.tsx",
  },
  // label
  "label-basic": {
    loader: () => import("./label/basic").then((m) => m.Basic),
    file: "label/basic.tsx",
  },
  "label-states": {
    loader: () => import("./label/states").then((m) => m.States),
    file: "label/states.tsx",
  },
  "label-in-text-field": {
    loader: () => import("./label/in-text-field").then((m) => m.InTextField),
    file: "label/in-text-field.tsx",
  },
  // description
  "description-basic": {
    loader: () => import("./description/basic").then((m) => m.Basic),
    file: "description/basic.tsx",
  },
  // field-error
  "field-error-basic": {
    loader: () => import("./field-error/basic").then((m) => m.Basic),
    file: "field-error/basic.tsx",
  },
  "field-error-validation": {
    loader: () => import("./field-error/validation").then((m) => m.Validation),
    file: "field-error/validation.tsx",
  },
  "field-error-render-function": {
    loader: () => import("./field-error/render-function").then((m) => m.RenderFunction),
    file: "field-error/render-function.tsx",
  },
  // fieldset
  "fieldset-basic": {
    loader: () => import("./fieldset/basic").then((m) => m.Basic),
    file: "fieldset/basic.tsx",
  },
  "fieldset-disabled": {
    loader: () => import("./fieldset/disabled").then((m) => m.Disabled),
    file: "fieldset/disabled.tsx",
  },
  "fieldset-render-prop": {
    loader: () => import("./fieldset/render-prop").then((m) => m.RenderProp),
    file: "fieldset/render-prop.tsx",
  },
  // text-field
  "text-field-basic": {
    loader: () => import("./text-field/basic").then((m) => m.Basic),
    file: "text-field/basic.tsx",
  },
  "text-field-with-description": {
    loader: () => import("./text-field/with-description").then((m) => m.WithDescription),
    file: "text-field/with-description.tsx",
  },
  "text-field-required": {
    loader: () => import("./text-field/required").then((m) => m.Required),
    file: "text-field/required.tsx",
  },
  "text-field-with-error": {
    loader: () => import("./text-field/with-error").then((m) => m.WithError),
    file: "text-field/with-error.tsx",
  },
  "text-field-validation": {
    loader: () => import("./text-field/validation").then((m) => m.Validation),
    file: "text-field/validation.tsx",
  },
  "text-field-form": {
    loader: () => import("./text-field/form").then((m) => m.Form),
    file: "text-field/form.tsx",
  },
  "text-field-controlled": {
    loader: () => import("./text-field/controlled").then((m) => m.Controlled),
    file: "text-field/controlled.tsx",
  },
  "text-field-disabled": {
    loader: () => import("./text-field/disabled").then((m) => m.Disabled),
    file: "text-field/disabled.tsx",
  },
  "text-field-variants": {
    loader: () => import("./text-field/variants").then((m) => m.Variants),
    file: "text-field/variants.tsx",
  },
  "text-field-full-width": {
    loader: () => import("./text-field/full-width").then((m) => m.FullWidth),
    file: "text-field/full-width.tsx",
  },
};

export function getDemo(name: string): DemoItem | undefined {
  return demos[name];
}

/** Number of components that have at least one demo. */
export function getComponentCount(): number {
  return new Set(Object.values(demos).map((demo) => demo.file.split("/")[0])).size;
}

/** Total number of registered demos. */
export function getExampleCount(): number {
  return Object.keys(demos).length;
}
