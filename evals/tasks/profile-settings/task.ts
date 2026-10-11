import type {TaskDefinition} from "../../src/types.ts";

import {insideRoot, parsedSources, peakuiElements} from "../../src/scoring/ast.ts";
import {classTokens, labelLinked, textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const PROFILE = {
  bio: "Designs the dashboard.",
  displayName: "Ada Lovelace",
  email: "ada@acme.example",
  newsletter: true,
  plan: "pro",
};
const FORM_BUTTON = 'form button[data-slot="button"]';
const SPINNER = '[data-slot="spinner"]';

/**
 * A composite task: one screen that needs a card, three kinds of field, a switch, a single-choice
 * group, a pending submit button and a link styled as a button. Every rule id starts with the part
 * it belongs to, so a failed run still says which part broke.
 */
export const profileSettings: TaskDefinition = {
  fixture: "vite-app",
  id: "profile-settings",
  pitfalls: ["fields", "composition", "rac-props", "variants", "styling"],
  prompt:
    'Build the profile settings screen in src/pages/ProfileSettings.tsx as a named export `ProfileSettings` using PeakUI, and show it from src/App.tsx. Its props are typed in src/types.ts. Put everything in a card titled "Profile". The form needs a required display name, a required email that must be a valid email address, an optional multi-line bio, a switch labelled "Email me product news", and a single choice of plan between Free, Pro and Team. Each validation message must appear under its own field. At the bottom add a "Save changes" submit button that shows a loading indicator and cannot be submitted again while `saving` is true, and next to it a "Cancel" link to /account that looks like a secondary button.',
  render: {
    check({documents}) {
      const idle = documents.get("idle")!;
      const saving = documents.get("saving")!;
      const fields = [...idle.querySelectorAll('[data-slot="textfield"]')];
      const title = idle.querySelector('[data-slot="card"] [data-slot="card-title"]');
      const switches = [...idle.querySelectorAll('form [data-slot="switch"]')];
      const groups = [...idle.querySelectorAll('form [data-slot="radio-group"]')];
      const cancel = [...idle.querySelectorAll('a[href="/account"]')];
      const cancelTokens = cancel.length === 1 ? classTokens(cancel[0]!) : [];
      // Found by its label, not by type="submit": a pending button stops being a submit button.
      const saveButton = (document: Document) =>
        [...document.querySelectorAll(FORM_BUTTON)].find((button) =>
          textOf(button).includes("Save changes"),
        );
      const pendingButton = saveButton(saving);
      const idleButton = saveButton(idle);

      return [
        check(
          "card.title",
          "composition",
          title !== null && textOf(title) === "Profile",
          'a PeakUI card whose title part reads "Profile"',
        ),
        check(
          "form.required-fields",
          "rac-props",
          fields.filter((field) => field.getAttribute("data-required") === "true").length === 2,
          "exactly two text fields are marked required on the field root",
        ),
        check(
          "form.labels-linked",
          "fields",
          fields.length > 0 && fields.every(labelLinked),
          "every text field's label is linked to its control",
        ),
        check(
          "form.email-type",
          "fields",
          idle.querySelectorAll('form input[type="email"]').length === 1,
          "one email input",
        ),
        check(
          "form.bio-multiline",
          "fields",
          idle.querySelectorAll("form textarea").length === 1,
          "one multi-line control for the bio",
        ),
        check(
          "form.switch",
          "composition",
          switches.length === 1 && textOf(switches[0]!).includes("Email me product news"),
          'one PeakUI switch labelled "Email me product news"',
        ),
        check(
          "form.plan-choice",
          "composition",
          groups.length === 1 && groups[0]!.querySelectorAll('input[type="radio"]').length === 3,
          "one PeakUI radio group with three options",
        ),
        check(
          "submit.pending",
          "rac-props",
          pendingButton?.getAttribute("data-pending") === "true" &&
            pendingButton.querySelector(SPINNER) !== null &&
            idleButton !== undefined &&
            idleButton.getAttribute("type") === "submit" &&
            !idleButton.hasAttribute("data-pending") &&
            idleButton.querySelector(SPINNER) === null,
          '"Save changes" is pending with a spinner while saving, and a plain submit button when idle',
        ),
        check(
          "cancel.real-link",
          "styling",
          cancel.length === 1 &&
            textOf(cancel[0]!) === "Cancel" &&
            cancelTokens.includes("button") &&
            cancelTokens.includes("button--secondary"),
          'one link to /account labelled "Cancel" that carries the secondary button classes',
        ),
      ];
    },
    ssr: {
      cases: [
        {name: "idle", props: {onSave: "__fn__", profile: PROFILE, saving: false}},
        {name: "saving", props: {onSave: "__fn__", profile: PROFILE, saving: true}},
      ],
      exportName: "ProfileSettings",
      module: "/src/pages/ProfileSettings.tsx",
    },
  },
  staticChecks(context) {
    const errorsInFields = peakuiElements(context, "FieldError").filter((node) =>
      insideRoot(node, "TextField"),
    );
    const app = parsedSources(context).find((source) => source.file.path === "src/App.tsx");

    return [
      check(
        "form.error-in-each-required-field",
        "fields",
        errorsInFields.length >= 2,
        "a FieldError inside each of the two required text fields",
      ),
      check(
        "page-is-mounted",
        "other",
        app?.jsx.some((node) => node.tag === "ProfileSettings") ?? false,
        "src/App.tsx renders ProfileSettings",
      ),
    ];
  },
  title: "Profile settings page",
};
