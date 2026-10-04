import type {Selection} from "react-aria-components";

import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";

describe("TagGroup", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("выставляет data-slot и BEM-блок на корне и списке", () => {
    render(
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    const list = document.querySelector('[data-slot="tag-group-list"]');

    expect(document.querySelector('[data-slot="tag-group"]')?.className).toEqual(
      expect.stringContaining("tag-group"),
    );
    expect(list?.className).toEqual(expect.stringContaining("tag-group__list"));
    expect(document.querySelectorAll('[data-slot="tag"]')).toHaveLength(2);
  });

  it("рендерит каждый Tag строкой внутри сетки", () => {
    render(
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(2);
    expect(screen.getByRole("row", {name: "Новости"})).toBeInTheDocument();
  });

  it("связывается с Label", () => {
    render(
      <TagGroup selectionMode="single">
        <Label>Удобства</Label>
        <TagGroup.List>
          <Tag id="laundry">Стирка</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(screen.getByRole("grid", {name: "Удобства"})).toBeInTheDocument();
  });

  it("вызывает onSelectionChange при одиночном выборе", async () => {
    const onSelectionChange = vi.fn();

    render(
      <TagGroup aria-label="Категории" selectionMode="single" onSelectionChange={onSelectionChange}>
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    const news = screen.getByRole("row", {name: "Новости"});

    expect(news).toHaveAttribute("aria-selected", "false");

    await user.click(news);

    expect(news).toHaveAttribute("aria-selected", "true");
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const selection = onSelectionChange.mock.calls[0]?.[0] as Selection;

    expect(selection === "all" ? null : [...selection]).toEqual(["news"]);
  });

  it("поддерживает множественный выбор", async () => {
    const onSelectionChange = vi.fn();

    render(
      <TagGroup
        aria-label="Категории"
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
      >
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    await user.click(screen.getByRole("row", {name: "Новости"}));
    await user.click(screen.getByRole("row", {name: "Путешествия"}));

    const lastCallSelection = onSelectionChange.mock.calls.at(-1)?.[0] as Selection;

    expect(lastCallSelection === "all" ? null : [...lastCallSelection].sort()).toEqual([
      "news",
      "travel",
    ]);
  });

  it("помечает неактивными отдельные теги", () => {
    render(
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag isDisabled id="news">
            Новости
          </Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(screen.getByRole("row", {name: "Новости"})).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("row", {name: "Путешествия"})).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("поддерживает disabledKeys на группе", () => {
    render(
      <TagGroup aria-label="Категории" disabledKeys={["news"]} selectionMode="single">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(screen.getByRole("row", {name: "Новости"})).toHaveAttribute("aria-disabled", "true");
  });

  it("рисует кнопку удаления по умолчанию и вызывает onRemove", async () => {
    const onRemove = vi.fn();

    render(
      <TagGroup aria-label="Категории" selectionMode="single" onRemove={onRemove}>
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(document.querySelector('[data-slot="tag-remove-button"]')).not.toBeNull();

    await user.click(screen.getByRole("button", {name: "Remove tag Новости"}));

    expect(onRemove).toHaveBeenCalledTimes(1);
    const removedKeys = onRemove.mock.calls[0]?.[0] as Selection;

    expect(removedKeys === "all" ? null : [...removedKeys]).toEqual(["news"]);
  });

  it("удаляет сфокусированный тег с клавиатуры", async () => {
    const onRemove = vi.fn();

    render(
      <TagGroup aria-label="Категории" selectionMode="single" onRemove={onRemove}>
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    screen.getByRole("row", {name: "Новости"}).focus();
    await user.keyboard("{Delete}");

    expect(onRemove).toHaveBeenCalledTimes(1);
    const removedKeys = onRemove.mock.calls[0]?.[0] as Selection;

    expect(removedKeys === "all" ? null : [...removedKeys]).toEqual(["news"]);
  });

  it("выставляет модификаторы размера и варианта на теге", () => {
    render(
      <TagGroup aria-label="Категории" selectionMode="single" size="lg" variant="surface">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    const row = screen.getByRole("row", {name: "Новости"});

    expect(row.className).toEqual(expect.stringContaining("tag--lg"));
    expect(row.className).toEqual(expect.stringContaining("tag--surface"));
  });
});
