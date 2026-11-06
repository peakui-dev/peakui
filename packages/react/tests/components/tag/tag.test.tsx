import {render, screen, setupUser} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";

// Тег требует предка TagGroup/TagList.
const renderTag = () =>
  render(
    <TagGroup aria-label="Категории" selectionMode="single" onRemove={vi.fn()}>
      <TagGroup.List>
        <Tag id="news">Новости</Tag>
      </TagGroup.List>
    </TagGroup>,
  );

describe("Tag", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  it("рендерится со ролью row и доступным именем", () => {
    renderTag();

    expect(screen.getByRole("row", {name: "Новости"})).toBeInTheDocument();
  });

  it("выставляет BEM-блок и data-slot", () => {
    renderTag();
    const tag = screen.getByRole("row", {name: "Новости"});

    expect(tag).toHaveAttribute("data-slot", "tag");
    expect(tag.className).toEqual(expect.stringContaining("tag"));
  });

  it("поддерживает собственный RemoveButton вместо стандартного", async () => {
    const onRemove = vi.fn();

    render(
      <TagGroup aria-label="Категории" selectionMode="single" onRemove={onRemove}>
        <TagGroup.List>
          <Tag id="news">
            Новости
            <Tag.RemoveButton data-testid="custom-remove" />
          </Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(screen.getByTestId("custom-remove")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="tag-remove-button"]')).toHaveLength(1);

    await user.click(screen.getByTestId("custom-remove"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  describe("локализация", () => {
    const renderLocalized = (locale?: string, removeLabel?: string) => {
      const group = (
        <TagGroup aria-label="Категории" selectionMode="single" onRemove={vi.fn()}>
          <TagGroup.List>
            <Tag id="news">
              Новости
              {removeLabel ? <Tag.RemoveButton aria-label={removeLabel} /> : null}
            </Tag>
          </TagGroup.List>
        </TagGroup>
      );

      return render(locale ? <I18nProvider locale={locale}>{group}</I18nProvider> : group);
    };

    it("называет элемент по-русски при ru-RU", () => {
      renderLocalized("ru-RU");

      expect(screen.getByRole("button", {name: "Удалить тег Новости"})).toBeInTheDocument();
    });

    it("по умолчанию называет по-английски", () => {
      renderLocalized();

      expect(screen.getByRole("button", {name: "Remove tag Новости"})).toBeInTheDocument();
    });

    it("метка потребителя побеждает", () => {
      renderLocalized("ru-RU", "Моё имя");

      expect(screen.getByRole("button", {name: "Моё имя Новости"})).toBeInTheDocument();
    });

    it.each(["ru", "de-DE", "ar-EG"])("откатывается к английскому для %s", (locale) => {
      renderLocalized(locale);

      // RAC appends the tag's own name to the remove button's label through aria-labelledby.
      const name = locale === "ru" ? "Удалить тег Новости" : "Remove tag Новости";

      expect(screen.getByRole("button", {name})).toBeInTheDocument();
    });
  });
});
