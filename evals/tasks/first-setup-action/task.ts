import type {Finding, TaskDefinition} from "../../src/types.ts";

import {classTokens, withText} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";
import {firstTimeSetup} from "../first-time-setup/task.ts";
import {serverPageAction} from "../server-page-action/task.ts";

/** Prefixes each rule with the part of the task it belongs to, leaving `dropped` rules out. */
function forPart(part: string, findings: Finding[], dropped: string[] = []): Finding[] {
  return findings
    .filter((finding) => !dropped.includes(finding.rule))
    .map((finding) => ({...finding, rule: `${part}.${finding.rule}`}));
}

/**
 * A composite task: the setup of `first-time-setup` and the server/client boundary of
 * `server-page-action` in one run. It reuses both tasks' checks, so the three cannot drift apart;
 * only the "Get started" button of the first task is replaced by this task's own button.
 */
export const firstSetupAction: TaskDefinition = {
  fixture: "next-app",
  id: "first-setup-action",
  pitfalls: ["css-order", "no-provider", "peers-rsc", "rac-props", "variants"],
  prompt:
    '@peakui/react and @peakui/styles are already installed in this app, but nothing is wired up yet. Finish the PeakUI setup. Then, on the home page (app/page.tsx), under the plan line, add a primary button labelled "Copy invite link" that copies https://acme.example/invite/team to the clipboard when pressed. The page must keep loading the plan on the server the way it does now.',
  render: {
    check(context) {
      const button = withText(
        context.documents.get("html")!,
        'button[data-slot="button"]',
        "Copy invite link",
      );

      return [
        ...forPart("setup", firstTimeSetup.render!.check(context), ["primary-button"]),
        ...forPart("action", serverPageAction.render!.check(context)),
        check(
          "action.primary-variant",
          "variants",
          button !== undefined && classTokens(button).includes("button--primary"),
          'the "Copy invite link" button is a primary PeakUI button',
        ),
      ];
    },
    html: serverPageAction.render!.html!,
  },
  staticChecks(context) {
    return [
      ...forPart("setup", firstTimeSetup.staticChecks(context)),
      ...forPart("action", serverPageAction.staticChecks(context)),
    ];
  },
  title: "First setup and an interactive button on a server page",
};
