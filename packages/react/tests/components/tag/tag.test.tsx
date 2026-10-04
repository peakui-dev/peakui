import {render, screen, setupUser} from "@peakui/testing/helpers";

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
});
