/** Component groups, matching the route groups under `content/docs/en/react/components`. */
export const COMPONENT_GROUPS = [
  {
    category: "Buttons",
    components: ["(buttons)/button", "(buttons)/close-button"],
  },
  {
    category: "Data Display",
    components: ["(data-display)/chip"],
  },
  {
    category: "Feedback",
    components: ["(feedback)/skeleton", "(feedback)/spinner"],
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
    components: ["(layout)/separator", "(layout)/surface"],
  },
  {
    category: "Navigation",
    components: ["(navigation)/link"],
  },
  {
    category: "Overlays",
    components: ["(overlays)/tooltip"],
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
