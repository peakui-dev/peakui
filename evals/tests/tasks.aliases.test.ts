import type {StaticContext} from "../src/types.ts";

import {describe, expect, it} from "vitest";

import {profileSettings} from "../tasks/profile-settings/task.ts";
import {teamMembers} from "../tasks/team-members/task.ts";

function contextOf(files: Record<string, string>): StaticContext {
  const list = Object.entries(files).map(([path, text]) => ({path, text}));

  return {
    changes: {added: list.map((file) => file.path), deleted: [], modified: []},
    file: (path) => list.find((file) => file.path === path),
    files: list,
  };
}

function passes(findings: Array<{rule: string; pass: boolean}>, rule: string): boolean {
  return findings.find((finding) => finding.rule === rule)!.pass;
}

// A compound root may be written `Tooltip`, `Tooltip.Root` or `TooltipRoot`; a rule about what a
// root contains must not depend on which spelling the agent chose. Found in the baseline run.
describe("rules that look at ancestors accept every spelling of a root", () => {
  it.each(["Tooltip", "Tooltip.Root", "TooltipRoot"])("tooltip.wraps-trigger with %s", (root) => {
    const source = `import {Button, Dropdown, Tooltip, TooltipRoot} from "@peakui/react";

export const Row = () => (
  <${root}>
    <Dropdown.Trigger>
      <Button isIconOnly aria-label="More">…</Button>
    </Dropdown.Trigger>
    <Tooltip.Content>Member actions</Tooltip.Content>
  </${root}>
);
`;

    expect(
      passes(teamMembers.staticChecks(contextOf({"src/Row.tsx": source})), "tooltip.wraps-trigger"),
    ).toBe(true);
  });

  it.each(["TextField", "TextField.Root", "TextFieldRoot"])(
    "form.error-in-each-required-field with %s",
    (root) => {
      const field = `<${root} isRequired><Label>x</Label><Input /><FieldError /></${root}>`;
      const source = `import {FieldError, Input, Label, TextField, TextFieldRoot} from "@peakui/react";

export const Fields = () => (<>${field}${field}</>);
`;

      expect(
        passes(
          profileSettings.staticChecks(contextOf({"src/Fields.tsx": source})),
          "form.error-in-each-required-field",
        ),
      ).toBe(true);
    },
  );
});
