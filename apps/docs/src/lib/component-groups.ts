/** Component groups, matching the route groups under `content/docs/en/react/components`. */
export const COMPONENT_GROUPS = [
  {
    category: "Buttons",
    components: [
      "(buttons)/button",
      "(buttons)/button-group",
      "(buttons)/close-button",
      "(buttons)/toggle-button",
      "(buttons)/toggle-button-group",
    ],
  },
  {
    category: "Data Display",
    components: ["(data-display)/chip"],
  },
  {
    category: "Feedback",
    components: [
      "(feedback)/alert",
      "(feedback)/empty-state",
      "(feedback)/skeleton",
      "(feedback)/spinner",
    ],
  },
  {
    category: "Forms",
    components: [
      "(forms)/description",
      "(forms)/field-error",
      "(forms)/fieldset",
      "(forms)/input",
      "(forms)/input-group",
      "(forms)/label",
      "(forms)/text-field",
    ],
  },
  {
    category: "Layout",
    components: ["(layout)/card", "(layout)/separator", "(layout)/surface"],
  },
  {
    category: "Navigation",
    components: [
      "(navigation)/breadcrumbs",
      "(navigation)/disclosure",
      "(navigation)/disclosure-group",
      "(navigation)/link",
      "(navigation)/tabs",
    ],
  },
  {
    category: "Overlays",
    components: ["(overlays)/popover", "(overlays)/tooltip"],
  },
  {
    category: "Typography",
    components: ["(typography)/kbd"],
  },
  {
    category: "Utilities",
    components: ["(utilities)/scroll-shadow"],
  },
] as const;
