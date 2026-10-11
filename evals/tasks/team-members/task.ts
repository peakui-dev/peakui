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
      const named = [...document.querySelectorAll('button[data-slot="button"]')].filter(
        (button) => (button.getAttribute("aria-label") ?? "").trim() !== "",
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
          "one PeakUI button with an accessible name per member",
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
          tooltipChildren("Button") &&
          tooltipChildren("Tooltip.Content"),
        "a PeakUI Tooltip wraps the button and holds its content part",
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
