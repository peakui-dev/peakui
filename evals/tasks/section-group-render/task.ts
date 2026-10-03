import type {TaskDefinition} from "../../src/types.ts";

import {classTokens, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const sectionGroupRender: TaskDefinition = {
  fixture: "vite-app",
  id: "section-group-render",
  pitfalls: ["composition"],
  prompt:
    'In src/components/AddressForm.tsx the group that holds the address fields is rendered as a div. Our landmark navigation needs it to be a <section> element with the accessible name "Address". Change the element itself — don\'t add another wrapper around it.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const section = document.querySelector('section[data-slot="fieldset-group"]');
      const labelledBy = section?.getAttribute("aria-labelledby") ?? null;
      const labelElement = labelledBy === null ? null : document.getElementById(labelledBy);
      const named =
        section?.getAttribute("aria-label") === "Address" ||
        (labelElement !== null && textOf(labelElement) === "Address");

      return [
        check(
          "group-is-section",
          "composition",
          section !== null && classTokens(section).includes("fieldset__group"),
          "the group part itself is a section element",
        ),
        check(
          "section-is-named",
          "composition",
          named,
          'the section has the accessible name "Address"',
        ),
        check(
          "no-div-group",
          "composition",
          document.querySelector('div[data-slot="fieldset-group"]') === null,
          "no div group remains",
        ),
        check(
          "fields-inside",
          "composition",
          section !== null && section.querySelectorAll('[data-slot="textfield"]').length === 2,
          "both fields are inside the section",
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {}}],
      exportName: "AddressForm",
      module: "/src/components/AddressForm.tsx",
    },
  },
  staticChecks: () => [],
  title: "Change a part's element",
};
