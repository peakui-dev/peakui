import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Accordion, AccordionRoot} from "@/components/accordion/index.ts";

const renderAccordion = (props: ComponentProps<typeof Accordion> = {}) =>
  render(
    <Accordion data-testid="accordion" {...props}>
      <Accordion.Item id="a">
        <Accordion.Heading>
          <Accordion.Trigger>
            First
            <Accordion.Indicator />
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>First content</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item id="b">
        <Accordion.Heading>
          <Accordion.Trigger>Second</Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body>Second content</Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>,
  );

describe("Accordion", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("rendering", () => {
    it("exposes the BEM block and a data-slot on every part", () => {
      renderAccordion();

      const root = screen.getByTestId("accordion");

      expect(root).toHaveAttribute("data-slot", "accordion");
      expect(root.className).toEqual(expect.stringContaining("accordion"));

      for (const slot of [
        "accordion-item",
        "accordion-heading",
        "accordion-trigger",
        "accordion-panel",
        "accordion-body",
        "accordion-body-inner",
        "accordion-indicator",
      ]) {
        expect(document.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
      }
    });

    it("renders headings as level three and triggers as buttons", () => {
      renderAccordion();

      expect(screen.getAllByRole("heading", {level: 3})).toHaveLength(2);
      expect(screen.getByRole("button", {name: /first/i})).toHaveAttribute(
        "data-slot",
        "accordion-trigger",
      );
    });

    it("behaves identically as Accordion.Root and AccordionRoot", () => {
      render(
        <>
          <Accordion.Root data-testid="namespaced" />
          <AccordionRoot data-testid="flat" />
        </>,
      );

      for (const id of ["namespaced", "flat"]) {
        expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "accordion");
      }
    });

    it("merges a consumer className with the block", () => {
      renderAccordion({className: "custom"});

      expect(screen.getByTestId("accordion").className).toEqual(
        expect.stringMatching(/accordion.*custom|custom.*accordion/),
      );
    });

    it("applies the surface modifier for variant=surface", () => {
      renderAccordion({variant: "surface"});

      expect(screen.getByTestId("accordion").className).toEqual(
        expect.stringContaining("accordion--surface"),
      );
    });

    it("marks items when hideSeparator is set", () => {
      renderAccordion({hideSeparator: true});

      for (const item of document.querySelectorAll('[data-slot="accordion-item"]')) {
        expect(item).toHaveAttribute("data-hide-separator", "true");
      }
    });

    it("does not mark items by default", () => {
      renderAccordion();

      for (const item of document.querySelectorAll('[data-slot="accordion-item"]')) {
        expect(item).not.toHaveAttribute("data-hide-separator");
      }
    });
  });

  describe("interaction", () => {
    it("expands and collapses an item on press", async () => {
      renderAccordion();

      const trigger = screen.getByRole("button", {name: /first/i});

      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(document.querySelector('[data-slot="accordion-indicator"]')).toHaveAttribute(
        "data-expanded",
        "true",
      );

      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("collapses the open item when another opens, by default", async () => {
      renderAccordion();

      const first = screen.getByRole("button", {name: /first/i});
      const second = screen.getByRole("button", {name: /second/i});

      await user.click(first);
      await user.click(second);

      expect(first).toHaveAttribute("aria-expanded", "false");
      expect(second).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps several items open with allowsMultipleExpanded", async () => {
      renderAccordion({allowsMultipleExpanded: true});

      const first = screen.getByRole("button", {name: /first/i});
      const second = screen.getByRole("button", {name: /second/i});

      await user.click(first);
      await user.click(second);

      expect(first).toHaveAttribute("aria-expanded", "true");
      expect(second).toHaveAttribute("aria-expanded", "true");
    });

    it("opens the items named in defaultExpandedKeys", () => {
      renderAccordion({defaultExpandedKeys: ["b"]});

      expect(screen.getByRole("button", {name: /second/i})).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByRole("button", {name: /first/i})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("reports changes through onExpandedChange", async () => {
      const onExpandedChange = vi.fn();

      renderAccordion({onExpandedChange});
      await user.click(screen.getByRole("button", {name: /first/i}));

      expect(onExpandedChange).toHaveBeenCalledTimes(1);
      expect([...onExpandedChange.mock.calls[0]![0]]).toEqual(["a"]);
    });

    it("toggles from the keyboard", async () => {
      renderAccordion();

      const trigger = screen.getByRole("button", {name: /first/i});

      await user.tab();
      expect(trigger).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("does not expand when the group is disabled", async () => {
      renderAccordion({isDisabled: true});

      const trigger = screen.getByRole("button", {name: /first/i});

      expect(trigger).toBeDisabled();
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("indicator", () => {
    it("clones a custom child and keeps the contract attributes", () => {
      render(
        <Accordion>
          <Accordion.Item id="a">
            <Accordion.Heading>
              <Accordion.Trigger>
                Title
                <Accordion.Indicator>
                  <span data-testid="custom" />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>Content</Accordion.Panel>
          </Accordion.Item>
        </Accordion>,
      );

      expect(screen.getByTestId("custom")).toHaveAttribute("data-slot", "accordion-indicator");
    });
  });
});
