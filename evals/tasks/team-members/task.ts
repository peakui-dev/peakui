import type {ParsedSource} from "../../src/scoring/ast.ts";
import type {StaticContext, TaskDefinition} from "../../src/types.ts";

import {insideRoot, parsedSources, peakuiElements} from "../../src/scoring/ast.ts";
import {textOf} from "../../src/scoring/dom.ts";
import {check} from "../../src/scoring/findings.ts";

const MEMBERS = [
  {id: "m1", name: "Ada Lovelace", role: "owner"},
  {id: "m2", name: "Grace Hopper", role: "admin"},
  {id: "m3", name: "Alan Turing", role: "member"},
];

function count(context: StaticContext, tag: string): number {
  return peakuiElements(context, tag).length;
}

function hasAttribute(context: StaticContext, tags: string[], attribute: string): boolean {
  return tags.some((tag) =>
    peakuiElements(context, tag).some((node) => node.attributes.has(attribute)),
  );
}

/** The local name `toast` was imported under, when the file calls it. */
function callsToast(source: ParsedSource): boolean {
  const local = source.imports.find(
    (entry) => entry.module === "@peakui/react" && entry.imported === "toast",
  )?.local;

  return local !== undefined && new RegExp(`\\b${local}(?:\\.\\w+)?\\(`).test(source.file.text);
}

/**
 * A composite task for overlays and collections: a tooltip, a menu, a confirmation dialog and a
 * notification on one screen. The render layer only ever sees the closed state, so the overlay
 * rules are static; every rule id starts with the part it belongs to.
 */
export const teamMembers: TaskDefinition = {
  fixture: "vite-app",
  id: "team-members",
  pitfalls: ["composition", "rac-props"],
  prompt:
    'Build the team members screen in src/pages/TeamMembers.tsx as a named export `TeamMembers` using PeakUI, and show it from src/App.tsx. Its props are typed in src/types.ts. List every member with their name and their role shown as a small badge. Each row ends with an icon-only "more" button that shows the hint "Member actions" on hover and opens a menu with "Change role" and "Remove". Choosing "Remove" must first ask for confirmation in a dialog titled "Remove member?" with "Cancel" and "Remove" buttons. Only that "Remove" button calls `onRemove` with the member\'s id, and afterwards a notification saying "Member removed" appears.',
  render: {
    check({documents}) {
      const document = documents.get("default")!;
      const text = textOf(document.body);
      // The trigger may be a PeakUI Button or the Dropdown's own trigger part; both are buttons.
      const named = [
        ...document.querySelectorAll(
          'button[data-slot="button"], button[data-slot="dropdown-trigger"]',
        ),
      ].filter((button) => (button.getAttribute("aria-label") ?? "").trim() !== "");
      // A button inside a button, or anything pressable inside the tooltip's own trigger part,
      // which is meant for content that is not interactive.
      const nested = document.querySelector(
        'button button, [role="button"] button, a button, button a, [data-slot="tooltip-trigger"] button',
      );

      return [
        check(
          "list.rows",
          "other",
          MEMBERS.every((member) => text.includes(member.name)),
          "every member's name is on the screen",
        ),
        check(
          "list.role-badge",
          "composition",
          document.querySelectorAll('[data-slot="chip"]').length === MEMBERS.length,
          "one PeakUI chip per member for the role",
        ),
        check(
          "menu.trigger-named",
          "rac-props",
          named.length === MEMBERS.length,
          "one button with an accessible name per member",
        ),
        check(
          "menu.no-nested-interactive",
          "composition",
          nested === null,
          "no pressable element sits inside another: one button is the trigger of both the tooltip and the menu",
        ),
      ];
    },
    ssr: {
      cases: [{name: "default", props: {members: MEMBERS, onRemove: "__fn__"}}],
      exportName: "TeamMembers",
      module: "/src/pages/TeamMembers.tsx",
    },
  },
  staticChecks(context) {
    const sources = parsedSources(context);
    const tooltipChildren = (tag: string) =>
      peakuiElements(context, tag).some((node) => insideRoot(node, "Tooltip"));
    const app = sources.find((source) => source.file.path === "src/App.tsx");

    return [
      check(
        "menu.composition",
        "composition",
        count(context, "Dropdown") > 0 &&
          count(context, "Dropdown.Popover") > 0 &&
          count(context, "Dropdown.Menu") > 0 &&
          count(context, "Dropdown.Item") > 0,
        "the menu is a PeakUI Dropdown with its popover, menu and items",
      ),
      check(
        "menu.no-button-in-trigger",
        "composition",
        // The Dropdown's trigger part renders a button itself. The rendered layer cannot see this
        // one: an HTML parser closes the outer button when it meets the inner.
        !peakuiElements(context, "Button").some((node) =>
          node.ancestors.some((ancestor) => /^Dropdown(?:\.Trigger|Trigger)$/.test(ancestor)),
        ),
        "no PeakUI Button inside the Dropdown's trigger part, which is a button already",
      ),
      check(
        "menu.item-action",
        "rac-props",
        hasAttribute(context, ["Dropdown.Menu", "Dropdown.Item"], "onAction") &&
          !hasAttribute(context, ["Dropdown.Item"], "onClick"),
        "menu items are handled through the menu's action event, not a click handler",
      ),
      check(
        "tooltip.wraps-trigger",
        "composition",
        count(context, "Tooltip") > 0 &&
          (tooltipChildren("Button") || tooltipChildren("Dropdown.Trigger")) &&
          tooltipChildren("Tooltip.Content"),
        "a PeakUI Tooltip wraps the trigger and holds its content part",
      ),
      check(
        "dialog.composition",
        "composition",
        count(context, "Modal.Backdrop") > 0 &&
          count(context, "Modal.Dialog") > 0 &&
          count(context, "Modal.Heading") > 0,
        "the confirmation is a PeakUI Modal with its backdrop, dialog and heading",
      ),
      check(
        "dialog.controlled-open",
        "rac-props",
        (hasAttribute(context, ["Modal", "Modal.Backdrop"], "isOpen") &&
          hasAttribute(context, ["Modal", "Modal.Backdrop"], "onOpenChange")) ||
          hasAttribute(context, ["Modal"], "state"),
        "the dialog's open state is controlled, so choosing Remove can open it",
      ),
      check(
        "toast.provider-mounted",
        "composition",
        count(context, "Toast.Provider") > 0,
        "the toast region is mounted",
      ),
      check(
        "toast.helper-called",
        "composition",
        sources.some(callsToast),
        "the notification is raised with the toast helper",
      ),
      check(
        "page-is-mounted",
        "other",
        app?.jsx.some((node) => node.tag === "TeamMembers") ?? false,
        "src/App.tsx renders TeamMembers",
      ),
    ];
  },
  title: "Team members with row actions",
};
