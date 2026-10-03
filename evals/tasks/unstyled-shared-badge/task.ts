import type {TaskDefinition} from "../../src/types.ts";

import {SOURCE_FILE} from "../../src/scoring/ast.ts";
import {atRuleParams, classRuleExists, cssFiles} from "../../src/scoring/css.ts";
import {check, cssUnavailable} from "../../src/scoring/findings.ts";

const BADGE_CLASSES = ["bg-emerald-100", "text-emerald-800", "bg-amber-100", "bg-slate-100"];

export const unstyledSharedBadge: TaskDefinition = {
  fixture: "vite-app",
  id: "unstyled-shared-badge",
  pitfalls: ["tailwind-scanning"],
  prompt:
    "The status badge next to the heading comes from our shared @acme/status package. In the production build it has no background or text color — it looks like plain text. Fix it without changing the badge package or copying its classes into our code.",
  render: {
    check({css}) {
      if (!css) return [cssUnavailable()];

      const missing = BADGE_CLASSES.filter((name) => !classRuleExists(css, name));

      return [
        check(
          "badge-classes-have-rules",
          "tailwind-scanning",
          missing.length === 0,
          missing.length === 0
            ? "the built CSS has rules for every badge tone"
            : `no CSS rule for: ${missing.join(", ")}`,
        ),
      ];
    },
  },
  staticChecks(context) {
    const params = cssFiles(context).flatMap(({root}) => atRuleParams(root, "source"));
    const copied = context.files.filter(
      (file) => SOURCE_FILE.test(file.path) && file.text.includes("bg-emerald-100"),
    );

    return [
      check(
        "source-directive",
        "tailwind-scanning",
        params.some((param) => param.includes("@acme") && !param.includes("inline(")),
        "a stylesheet points Tailwind at the @acme/status package",
      ),
      check(
        "classes-not-copied",
        "tailwind-scanning",
        copied.length === 0,
        "the badge's classes are not copied into the app",
        copied[0] ? {file: copied[0].path} : undefined,
      ),
    ];
  },
  title: "Unstyled component from a shared package",
};
