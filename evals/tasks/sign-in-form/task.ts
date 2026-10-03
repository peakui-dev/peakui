import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources} from "../../src/scoring/ast.ts";
import {labelLinked} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const signInForm: TaskDefinition = {
  fixture: "vite-app",
  id: "sign-in-form",
  pitfalls: ["fields", "composition", "rac-props", "imports"],
  prompt:
    'Add a sign-in form to this app using PeakUI. Put it in src/components/SignInForm.tsx as a named export `SignInForm` and show it on the home screen in src/App.tsx. It needs an email field and a password field, both required, and the password must be at least 8 characters. Validation messages should appear under the field they belong to. Add a "Sign in" submit button.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const fields = [...document.querySelectorAll('[data-slot="textfield"]')];
      const types = [...document.querySelectorAll("input")]
        .map((input) => input.getAttribute("type"))
        .sort();

      return [
        check(
          "two-required-fields",
          "rac-props",
          fields.length === 2 &&
            fields.every((field) => field.getAttribute("data-required") === "true"),
          "exactly two text fields, both marked required on the field root",
        ),
        check(
          "label-linked",
          "fields",
          fields.length > 0 && fields.every(labelLinked),
          "every field's label is linked to its input",
        ),
        check(
          "input-types",
          "fields",
          types.join(",") === "email,password",
          "one email input and one password input",
        ),
        check(
          "submit-button",
          "rac-props",
          document.querySelector('form button[data-slot="button"][type="submit"]') !== null,
          "a PeakUI submit button inside the form",
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {}}],
      exportName: "SignInForm",
      module: "/src/components/SignInForm.tsx",
    },
  },
  staticChecks(context) {
    const sources = parsedSources(context);
    const nodes = sources.flatMap((source) => source.jsx);
    const errorsInFields = nodes.filter(
      (node) => node.tag === "FieldError" && node.ancestors.includes("TextField"),
    );
    const hasLengthRule =
      nodes.some(
        (node) =>
          ["TextField", "Input"].includes(node.tag) &&
          node.attributes.get("minLength")?.value === "8",
      ) ||
      nodes.some(
        (node) =>
          node.tag === "TextField" &&
          (node.attributes.has("validate") || node.attributes.has("isInvalid")),
      );
    const app = sources.find((source) => source.file.path === "src/App.tsx");

    return [
      check(
        "field-error-in-each-field",
        "fields",
        errorsInFields.length >= 2,
        "a FieldError inside each of the two text fields",
      ),
      check(
        "password-length-rule",
        "fields",
        hasLengthRule,
        "the 8-character rule is expressed on the password field",
      ),
      check(
        "form-is-mounted",
        "other",
        app?.jsx.some((node) => node.tag === "SignInForm") ?? false,
        "src/App.tsx renders SignInForm",
      ),
    ];
  },
  title: "Sign-in form with validation",
};
