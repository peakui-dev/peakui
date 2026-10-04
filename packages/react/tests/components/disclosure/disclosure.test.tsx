import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Disclosure, DisclosureRoot} from "@/components/disclosure/index.ts";

const renderDisclosure = (props: ComponentProps<typeof Disclosure> = {}) =>
  render(
    <Disclosure data-testid="disclosure" {...props}>
      <Disclosure.Heading>
        <Disclosure.Trigger>
          Показать подробности
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>Скрытое содержимое.</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>,
  );

describe("Disclosure", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("выставляет data-slot, BEM-блок и слоты составных частей", () => {
      renderDisclosure();

      const root = screen.getByTestId("disclosure");

      expect(root).toHaveAttribute("data-slot", "disclosure");
      expect(root.className).toEqual(expect.stringContaining("disclosure"));
      expect(document.querySelector('[data-slot="disclosure-heading"]')).not.toBeNull();
      expect(document.querySelector('[data-slot="disclosure-trigger"]')).not.toBeNull();
      expect(document.querySelector('[data-slot="disclosure-content"]')).not.toBeNull();
      expect(document.querySelector('[data-slot="disclosure-indicator"]')).not.toBeNull();
    });

    it("заголовок рендерится заголовком третьего уровня, триггер — кнопкой", () => {
      renderDisclosure();

      const heading = screen.getByRole("heading", {level: 3});

      expect(heading).toHaveAttribute("data-slot", "disclosure-heading");
      expect(screen.getByRole("button", {name: /показать подробности/i})).toHaveAttribute(
        "data-slot",
        "disclosure-trigger",
      );
    });

    it("Disclosure.Root и DisclosureRoot ведут себя одинаково", () => {
      render(
        <>
          <Disclosure.Root>
            <Disclosure.Heading>
              <Disclosure.Trigger>Первый</Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body>Первое тело</Disclosure.Body>
            </Disclosure.Content>
          </Disclosure.Root>
          <DisclosureRoot>
            <Disclosure.Heading>
              <Disclosure.Trigger>Второй</Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body>Второе тело</Disclosure.Body>
            </Disclosure.Content>
          </DisclosureRoot>
        </>,
      );

      for (const name of ["Первый", "Второй"]) {
        expect(screen.getByRole("button", {name})).toHaveAttribute(
          "data-slot",
          "disclosure-trigger",
        );
      }
    });
  });

  describe("открытие и закрытие", () => {
    it("клик по триггеру переключает панель", async () => {
      renderDisclosure();

      const trigger = screen.getByRole("button", {name: /показать подробности/i});

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText("Скрытое содержимое.")).not.toBeVisible();

      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Скрытое содержимое.")).toBeVisible();

      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByText("Скрытое содержимое.")).not.toBeVisible();
    });

    it("defaultExpanded раскрывает панель при первом рендере", () => {
      renderDisclosure({defaultExpanded: true});

      expect(screen.getByRole("button", {name: /показать подробности/i})).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByText("Скрытое содержимое.")).toBeInTheDocument();
    });

    it("управляемый isExpanded не меняется без родителя", async () => {
      const onExpandedChange = vi.fn();

      renderDisclosure({isExpanded: false, onExpandedChange});

      await user.click(screen.getByRole("button", {name: /показать подробности/i}));

      expect(onExpandedChange).toHaveBeenCalledWith(true);
      expect(screen.getByText("Скрытое содержимое.")).not.toBeVisible();
    });
  });

  describe("клавиатура", () => {
    it("Enter и Space переключают состояние", async () => {
      renderDisclosure();

      const trigger = screen.getByRole("button", {name: /показать подробности/i});

      await user.tab();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.keyboard("{Enter}");
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      await user.keyboard(" ");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("состояния", () => {
    it("в отключённом состоянии триггер заблокирован и не переключается", async () => {
      renderDisclosure({isDisabled: true});

      const trigger = screen.getByRole("button", {name: /показать подробности/i});

      expect(trigger).toBeDisabled();

      await user.click(trigger);

      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("индикатор", () => {
    it("отражает состояние в data-expanded", async () => {
      renderDisclosure();

      const indicator = document.querySelector('[data-slot="disclosure-indicator"]');

      expect(indicator).not.toHaveAttribute("data-expanded");

      await user.click(screen.getByRole("button", {name: /показать подробности/i}));

      expect(indicator).toHaveAttribute("data-expanded", "true");
    });

    it("свой элемент индикатора получает контракт слота и состояние", async () => {
      render(
        <Disclosure>
          <Disclosure.Heading>
            <Disclosure.Trigger>
              Свои детали
              <Disclosure.Indicator>
                <svg data-testid="custom-indicator" viewBox="0 0 16 16" />
              </Disclosure.Indicator>
            </Disclosure.Trigger>
          </Disclosure.Heading>
          <Disclosure.Content>
            <Disclosure.Body>Тело</Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>,
      );

      const custom = screen.getByTestId("custom-indicator");

      expect(custom).toHaveAttribute("data-slot", "disclosure-indicator");
      expect(custom).not.toHaveAttribute("data-expanded");

      await user.click(screen.getByRole("button", {name: /свои детали/i}));

      expect(custom).toHaveAttribute("data-expanded", "true");
    });
  });

  describe("render props", () => {
    it("children-функция корня получает render props примитива", () => {
      render(
        <Disclosure defaultExpanded>
          {(values) => <>раскрыт: {String(values.isExpanded)}</>}
        </Disclosure>,
      );

      expect(screen.getByText("раскрыт: true")).toBeInTheDocument();
    });
  });
});
