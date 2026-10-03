import type {TaskDefinition} from "../../src/types.ts";

import {parsedSources, peakuiElements} from "../../src/scoring/ast.ts";
import {textOf, withText} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

export const serverPageAction: TaskDefinition = {
  fixture: "next-app",
  id: "server-page-action",
  pitfalls: ["peers-rsc", "rac-props"],
  prompt:
    'On the home page (app/page.tsx), under the plan line, add a PeakUI button labelled "Copy invite link" that copies https://acme.example/invite/team to the clipboard when pressed. The page must keep loading the plan on the server the way it does now.',
  render: {
    check({documents}) {
      const document = documents.get("html")!;

      return [
        check(
          "button-rendered",
          "peers-rsc",
          withText(document, 'button[data-slot="button"]', "Copy invite link") !== undefined,
          'the prerendered page has a PeakUI button labelled "Copy invite link"',
        ),
        check(
          "server-data-rendered",
          "peers-rsc",
          /Plan:.*Team/.test(textOf(document.body)),
          "the plan loaded on the server is still on the page",
        ),
      ];
    },
    html: {path: ".next/server/app/index.html"},
  },
  staticChecks(context) {
    const sources = parsedSources(context);
    const page = sources.find((source) => source.file.path === "app/page.tsx");
    const offenders = sources.filter(
      (source) =>
        source.jsx.some((node) => node.attributes.has("onPress")) &&
        !source.directives.includes("use client"),
    );

    return [
      check(
        "page-stays-server",
        "peers-rsc",
        page !== undefined && !page.directives.includes("use client"),
        "app/page.tsx is still a server component",
        {file: "app/page.tsx"},
      ),
      check(
        "handler-in-client-file",
        "peers-rsc",
        offenders.length === 0,
        "every file that passes a press handler is a client file",
        offenders[0] ? {file: offenders[0].file.path} : undefined,
      ),
      check(
        "press-handler",
        "rac-props",
        peakuiElements(context, "Button").some((node) => node.attributes.has("onPress")),
        "the PeakUI Button handles presses with its press event",
      ),
    ];
  },
  title: "Interactive button on a server-rendered page",
};
