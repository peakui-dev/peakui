/** Component groups, matching the route groups under `content/docs/en/react/components`. */
export const COMPONENT_GROUPS = [
  {
    category: "Buttons",
    components: ["(buttons)/button"],
  },
  {
    category: "Feedback",
    components: ["(feedback)/spinner"],
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
] as const;
