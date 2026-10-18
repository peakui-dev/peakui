/** Component groups, matching the route groups under `content/docs/en/react/components`. */
export const COMPONENT_GROUPS = [
  {
    category: "Buttons",
    components: [
      "(buttons)/button",
      "(buttons)/button-group",
      "(buttons)/close-button",
      "(buttons)/segmented-control",
      "(buttons)/toggle-button",
      "(buttons)/toggle-button-group",
    ],
  },
  {
    category: "Collections",
    components: ["(collections)/dropdown", "(collections)/list-box", "(collections)/tag-group"],
  },
  {
    category: "Pickers",
    components: ["(pickers)/select"],
  },
  {
    category: "Colors",
    components: ["(colors)/color-picker", "(colors)/color-swatch"],
  },
  {
    category: "Controls",
    components: ["(controls)/slider"],
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
      "(feedback)/meter",
      "(feedback)/progress-bar",
      "(feedback)/skeleton",
      "(feedback)/spinner",
    ],
  },
  {
    category: "Forms",
    components: [
      "(forms)/checkbox",
      "(forms)/checkbox-group",
      "(forms)/description",
      "(forms)/error-message",
      "(forms)/field-error",
      "(forms)/fieldset",
      "(forms)/form",
      "(forms)/input",
      "(forms)/input-group",
      "(forms)/input-otp",
      "(forms)/label",
      "(forms)/number-field",
      "(forms)/radio-group",
      "(forms)/search-field",
      "(forms)/switch",
      "(forms)/text-field",
      "(forms)/textarea",
    ],
  },
  {
    category: "Layout",
    components: ["(layout)/card", "(layout)/separator", "(layout)/surface"],
  },
  {
    category: "Media",
    components: ["(media)/avatar", "(media)/avatar-group"],
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
    components: [
      "(overlays)/modal",
      "(overlays)/popover",
      "(overlays)/toast",
      "(overlays)/tooltip",
    ],
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
