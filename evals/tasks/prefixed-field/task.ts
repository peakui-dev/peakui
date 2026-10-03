import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, labelLinked, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const prefixedField: TaskDefinition = {
  fixture: "vite-app",
  id: "prefixed-field",
  pitfalls: ["fields", "composition"],
  prompt:
    'Add two PeakUI text fields to the form in src/components/ProfileForm.tsx: "Display name" and "Website". The website input should show a fixed https:// in front of what the user types. The form sits on a gray card, so both fields should use the secondary field style.',
  render: {
    check({documents}) {
      const fields = [...documents.get("default")!.querySelectorAll('[data-slot="textfield"]')];
      const byLabel = (text: string) =>
        fields.find((field) => {
          const label = field.querySelector('label[data-slot="label"]');

          return label !== null && textOf(label) === text;
        });
      const name = byLabel("Display name");
      const site = byLabel("Website");
      const group = site?.querySelector('[data-slot="input-group"]') ?? null;
      const prefix = group?.querySelector('[data-slot="input-group-prefix"]') ?? null;

      return [
        check(
          "two-labelled-fields",
          "fields",
          fields.length === 2 &&
            name !== undefined &&
            site !== undefined &&
            fields.every(labelLinked),
          'two text fields labelled "Display name" and "Website", each label linked to its control',
        ),
        check(
          "secondary-input",
          "fields",
          (name?.querySelector("input.input--secondary") ?? null) !== null,
          "the display-name input uses the secondary style",
        ),
        check(
          "secondary-group",
          "fields",
          group !== null && classTokens(group).includes("input-group--secondary"),
          "the website control is an input group in the secondary style",
        ),
        check(
          "prefix-part",
          "composition",
          prefix !== null &&
            textOf(prefix) === "https://" &&
            group?.querySelector('[data-slot="input-group-input"]') !== null,
          "the group has a prefix part reading https:// and an input part",
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {}}],
      exportName: "ProfileForm",
      module: "/src/components/ProfileForm.tsx",
    },
  },
  staticChecks: () => [],
  title: "Field with a prefix, secondary style",
};
