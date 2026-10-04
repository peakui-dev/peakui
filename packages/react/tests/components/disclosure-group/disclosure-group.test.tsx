import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";
import React, {useState} from "react";

import {Disclosure} from "@/components/disclosure/index.ts";
import {
  DisclosureGroup,
  DisclosureGroupRoot,
  useDisclosureGroupNavigation,
} from "@/components/disclosure-group/index.ts";

const GroupItem = ({body, id, title}: {body: string; id: string; title: string}) => (
  <Disclosure aria-label={title} id={id}>
    <Disclosure.Heading>
      <Disclosure.Trigger>
        {title}
        <Disclosure.Indicator />
      </Disclosure.Trigger>
    </Disclosure.Heading>
    <Disclosure.Content>
      <Disclosure.Body>{body}</Disclosure.Body>
    </Disclosure.Content>
  </Disclosure>
);

const renderGroup = (props: ComponentProps<typeof DisclosureGroup> = {}) =>
  render(
    <DisclosureGroup data-testid="disclosure-group" {...props}>
      <GroupItem body="Содержимое предпросмотра." id="preview" title="Предпросмотр" />
      <GroupItem body="Содержимое загрузки." id="download" title="Загрузка" />
    </DisclosureGroup>,
  );

describe("DisclosureGroup", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("выставляет data-slot и BEM-блок", () => {
      renderGroup();

      const group = screen.getByTestId("disclosure-group");

      expect(group).toHaveAttribute("data-slot", "disclosure-group");
      expect(group.className).toEqual(expect.stringContaining("disclosure-group"));
    });

    it("рисует триггер каждого дочернего раскрытия", () => {
      renderGroup();

      expect(screen.getByRole("button", {name: "Предпросмотр"})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: "Загрузка"})).toBeInTheDocument();
    });

    it("DisclosureGroup.Root и DisclosureGroupRoot ведут себя одинаково", () => {
      render(
        <>
          <DisclosureGroup.Root>
            <GroupItem body="Первое." id="first" title="Первый" />
          </DisclosureGroup.Root>
          <DisclosureGroupRoot>
            <GroupItem body="Второе." id="second" title="Второй" />
          </DisclosureGroupRoot>
        </>,
      );

      expect(screen.getByRole("button", {name: "Первый"})).toBeInTheDocument();
      expect(screen.getByRole("button", {name: "Второй"})).toBeInTheDocument();
    });
  });

  describe("эксклюзивность", () => {
    it("по умолчанию раскрыт один элемент: новый закрывает предыдущий", async () => {
      renderGroup();

      const preview = screen.getByRole("button", {name: "Предпросмотр"});
      const download = screen.getByRole("button", {name: "Загрузка"});

      await user.click(preview);
      expect(preview).toHaveAttribute("aria-expanded", "true");

      await user.click(download);
      expect(download).toHaveAttribute("aria-expanded", "true");
      expect(preview).toHaveAttribute("aria-expanded", "false");
    });

    it("allowsMultipleExpanded держит раскрытыми несколько элементов", async () => {
      renderGroup({allowsMultipleExpanded: true});

      const preview = screen.getByRole("button", {name: "Предпросмотр"});
      const download = screen.getByRole("button", {name: "Загрузка"});

      await user.click(preview);
      await user.click(download);

      expect(preview).toHaveAttribute("aria-expanded", "true");
      expect(download).toHaveAttribute("aria-expanded", "true");
    });

    it("defaultExpandedKeys задаёт начальное состояние", () => {
      renderGroup({defaultExpandedKeys: ["preview"]});

      expect(screen.getByRole("button", {name: "Предпросмотр"})).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByRole("button", {name: "Загрузка"})).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
  });

  describe("управление", () => {
    it("expandedKeys и onExpandedChange дают контроль извне", async () => {
      const onExpandedChange = vi.fn();

      renderGroup({expandedKeys: new Set(["preview"]), onExpandedChange});

      expect(screen.getByRole("button", {name: "Предпросмотр"})).toHaveAttribute(
        "aria-expanded",
        "true",
      );

      await user.click(screen.getByRole("button", {name: "Загрузка"}));

      expect(onExpandedChange).toHaveBeenCalledWith(new Set(["download"]));
    });

    it("isDisabled отключает все элементы группы", () => {
      renderGroup({isDisabled: true});

      expect(screen.getByRole("button", {name: "Предпросмотр"})).toBeDisabled();
      expect(screen.getByRole("button", {name: "Загрузка"})).toBeDisabled();
    });
  });

  describe("useDisclosureGroupNavigation", () => {
    const NavigationProbe = ({
      allowsMultipleExpanded = false,
    }: {
      allowsMultipleExpanded?: boolean;
    }) => {
      const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set(["preview"]));
      const navigation = useDisclosureGroupNavigation({
        allowsMultipleExpanded,
        expandedKeys,
        itemIds: ["preview", "download"],
        onExpandedChange: setExpandedKeys,
      });

      return (
        <div>
          <output data-testid="keys">{[...expandedKeys].join(",")}</output>
          <button
            data-testid="prev"
            disabled={navigation.isPrevDisabled}
            onClick={navigation.onPrevious}
          >
            prev
          </button>
          <button
            data-testid="next"
            disabled={navigation.isNextDisabled}
            onClick={navigation.onNext}
          >
            next
          </button>
        </div>
      );
    };

    it("на старте предыдущий недоступен, следующий перемещает вперёд", async () => {
      render(<NavigationProbe />);

      expect(screen.getByTestId("prev")).toBeDisabled();
      expect(screen.getByTestId("next")).toBeEnabled();

      await user.click(screen.getByTestId("next"));

      expect(screen.getByTestId("keys")).toHaveTextContent("download");
    });

    it("последний элемент отключает следующий, возврат возвращает предыдущий", async () => {
      render(<NavigationProbe />);

      await user.click(screen.getByTestId("next"));

      expect(screen.getByTestId("next")).toBeDisabled();
      expect(screen.getByTestId("prev")).toBeEnabled();

      await user.click(screen.getByTestId("prev"));

      expect(screen.getByTestId("keys")).toHaveTextContent("preview");
    });

    it("с allowsMultipleExpanded переход добавляет элемент, не закрывая текущий", async () => {
      render(<NavigationProbe allowsMultipleExpanded />);

      await user.click(screen.getByTestId("next"));

      expect(screen.getByTestId("keys")).toHaveTextContent("preview,download");
    });
  });
});
