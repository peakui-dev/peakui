import {render, screen} from "@peakui/testing/helpers";
import {Header} from "react-aria-components/ListBox";

import {ListBox} from "@/components/list-box/index.ts";
import {ListBoxSection, ListBoxSectionRoot} from "@/components/list-box-section/index.ts";

/*
 * Заголовок секции — ребёнок Header из react-aria-components: PeakUI ещё не портировал свою
 * обёртку Header, а это ровно тот примитив, который она обернёт. Ссылка на эталон: его тесты
 * делают то же самое через '@/components/header'.
 */
describe("ListBoxSection", () => {
  it("выставляет БЭМ-блок и data-slot на секции", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxSection>
          <Header>Команда</Header>
          <ListBox.Item id="bob" textValue="Bob">
            Bob
          </ListBox.Item>
        </ListBoxSection>
      </ListBox>,
    );

    const section = screen.getByRole("group", {name: "Команда"});

    expect(section).toHaveClass("list-box-section");
    expect(section).toHaveAttribute("data-slot", "list-box-section");
  });

  it("ведёт себя одинаково как ListBoxSection.Root и ListBoxSectionRoot", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxSection.Root>
          <Header>Первая</Header>
          <ListBox.Item id="one" textValue="Один">
            Один
          </ListBox.Item>
        </ListBoxSection.Root>
        <ListBoxSectionRoot>
          <Header>Вторая</Header>
          <ListBox.Item id="two" textValue="Два">
            Два
          </ListBox.Item>
        </ListBoxSectionRoot>
      </ListBox>,
    );

    expect(screen.getByRole("group", {name: "Первая"})).toHaveAttribute(
      "data-slot",
      "list-box-section",
    );
    expect(screen.getByRole("group", {name: "Вторая"})).toHaveAttribute(
      "data-slot",
      "list-box-section",
    );
  });

  it("подмешивает consumer className к блоку", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxSection className="custom">
          <Header>Команда</Header>
          <ListBox.Item id="bob" textValue="Bob">
            Bob
          </ListBox.Item>
        </ListBoxSection>
      </ListBox>,
    );

    expect(screen.getByRole("group", {name: "Команда"})).toHaveClass("custom");
  });

  it("держит опции внутри секции с доступным заголовком", () => {
    render(
      <ListBox aria-label="Пользователи" selectionMode="single">
        <ListBoxSection>
          <Header>Команда</Header>
          <ListBox.Item id="bob" textValue="Bob">
            Bob
          </ListBox.Item>
        </ListBoxSection>
        <ListBoxSection>
          <Header>Гости</Header>
          <ListBox.Item id="fred" textValue="Fred">
            Fred
          </ListBox.Item>
        </ListBoxSection>
      </ListBox>,
    );

    const team = screen.getByRole("group", {name: "Команда"});

    expect(screen.getByRole("option", {name: "Bob"})).toBeInTheDocument();
    expect(screen.getByRole("option", {name: "Fred"})).toBeInTheDocument();
    expect(team).toContainElement(screen.getByRole("option", {name: "Bob"}));
    expect(team).not.toContainElement(screen.getByRole("option", {name: "Fred"}));
  });
});
