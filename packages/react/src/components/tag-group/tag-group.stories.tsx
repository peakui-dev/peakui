import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";
import type {Key} from "react-aria-components/TagGroup";

import {useMemo, useState} from "react";

import {Description} from "../description/index.ts";
import {EmptyState} from "../empty-state/index.ts";
import {ErrorMessage} from "../error-message/index.ts";
import {Label} from "../label/index.ts";
import {Tag} from "../tag/index.ts";

import {TagGroup} from "./index.ts";

/*
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md. A tag's natural habitat is a
 * prefixed label, and a real svg exercises the `& svg` sizing rule in tag.css.
 */
interface IconProps extends ComponentProps<"svg"> {}

const icon = (d: string) => {
  const Glyph = (props: IconProps) => (
    <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path clipRule="evenodd" d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );

  return Glyph;
};

const SquareArticleIcon = icon(
  "M11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3m-7-1.5a3 3 0 0 0-3 3v7a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-7a3 3 0 0 0-3-3zm6 6H5.43a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5.07a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1m-5.32-3h3.57a.75.75 0 0 1 0 1.5H5.18a.75.75 0 0 1 0-1.5",
);
const PlanetEarthIcon = icon(
  "M8 13.5c1.63 0 3.094-.709 4.101-1.835A2.5 2.5 0 0 1 10.25 9.25V9a.75.75 0 0 0-.75-.75 2.25 2.25 0 0 1 0-4.5.75.75 0 0 0 .75-.75v-.02a5.5 5.5 0 0 0-7.471 3.287A2.25 2.25 0 0 1 4.75 8.5c0 .414.336.75.75.75a2.25 2.25 0 0 1 1.265 4.11q.597.139 1.235.14m-3.491-1.25H5.5a.75.75 0 0 0 0-1.5A2.25 2.25 0 0 1 3.25 8.5a.75.75 0 0 0-.744-.75 5.49 5.49 0 0 0 2.003 4.5m8.241-2h.27A5.5 5.5 0 0 0 13.5 8c0-1.665-.74-3.158-1.91-4.166A2.25 2.25 0 0 1 9.5 5.25a.75.75 0 1 0 0 1.5A2.25 2.25 0 0 1 11.75 9v.25a1 1 0 0 0 1 1M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14",
);
const RocketIcon = icon(
  "m6.993 5.628-.787-.157-1.118-.224a1.13 1.13 0 0 0-1.024.31L2.837 6.785a1.15 1.15 0 0 0-.285.474l1.02.185a6.19 6.19 0 0 1 4.985 4.985l.185 1.02c.178-.055.34-.152.474-.285l1.227-1.227c.268-.268.384-.652.31-1.024l-.224-1.118-.157-.787.567-.568 1.243-1.242A4.5 4.5 0 0 0 13.5 4.015V2.5h-1.515a4.5 4.5 0 0 0-3.182 1.318L7.561 5.061zM12 9.5l1.243-1.243A6 6 0 0 0 15 4.015V2.5A1.5 1.5 0 0 0 13.5 1h-1.515a6 6 0 0 0-4.242 1.757L6.5 4l-1.118-.224a2.63 2.63 0 0 0-2.379.72L1.777 5.724A2.65 2.65 0 0 0 1 7.598c0 .522.373.97.887 1.063l1.417.258a4.69 4.69 0 0 1 3.777 3.777l.258 1.417c.093.514.54.887 1.063.887.703 0 1.377-.28 1.875-.777l1.226-1.226a2.63 2.63 0 0 0 .72-2.38zm-8.06 2.571c-.311-.31-.76-.28-1.005-.036-.233.233-.423.658-.527 1.247a5 5 0 0 0-.05.366q.184-.019.377-.053c.596-.106 1.017-.296 1.24-.52.245-.244.275-.693-.036-1.004M5 11.011c-.873-.874-2.273-.89-3.126-.036C.777 12.07.802 14.094.837 14.712c.007.12.06.23.145.315a.5.5 0 0 0 .32.145c.622.032 2.652.046 3.734-1.035.853-.854.837-2.253-.036-3.126m6.78-5.73a.75.75 0 0 0-1.06-1.061l-1.5 1.5a.75.75 0 0 0 1.06 1.06z",
);
const ShoppingBagIcon = icon(
  "M5.174 3h5.652a1.5 1.5 0 0 1 1.49 1.328l.808 7A1.5 1.5 0 0 1 11.634 13H4.366a1.5 1.5 0 0 1-1.49-1.672l.808-7A1.5 1.5 0 0 1 5.174 3m-2.98 1.156A3 3 0 0 1 5.174 1.5h5.652a3 3 0 0 1 2.98 2.656l.808 7a3 3 0 0 1-2.98 3.344H4.366a3 3 0 0 1-2.98-3.344zM5 5.25a.75.75 0 0 1 1.5 0v.25a1.5 1.5 0 1 0 3 0v-.25a.75.75 0 0 1 1.5 0v.25a3 3 0 0 1-6 0z",
);
const CircleXmarkFillIcon = icon(
  "M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14M6.53 5.47a.75.75 0 0 0-1.06 1.06L6.94 8 5.47 9.47a.75.75 0 1 0 1.06 1.06L8 9.06l1.47 1.47a.75.75 0 1 0 1.06-1.06L9.06 8l1.47-1.47a.75.75 0 1 0-1.06-1.06L8 6.94z",
);

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: TagGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/TagGroup",
} satisfies Meta<typeof TagGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag id="default-news">
            <SquareArticleIcon />
            Новости
          </Tag>
          <Tag id="default-travel">
            <PlanetEarthIcon />
            Путешествия
          </Tag>
          <Tag id="default-gaming">
            <RocketIcon />
            Игры
          </Tag>
          <Tag id="default-shopping">
            <ShoppingBagIcon />
            Покупки
          </Tag>
        </TagGroup.List>
      </TagGroup>
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      <div className="flex flex-col gap-6">
        <TagGroup selectionMode="single" size="sm">
          <Label>Малый</Label>
          <TagGroup.List>
            <Tag>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag>Игры</Tag>
          </TagGroup.List>
        </TagGroup>
        <TagGroup selectionMode="single" size="md">
          <Label>Средний</Label>
          <TagGroup.List>
            <Tag>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag>Игры</Tag>
          </TagGroup.List>
        </TagGroup>
        <TagGroup selectionMode="single" size="lg">
          <Label>Большой</Label>
          <TagGroup.List>
            <Tag>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag>Игры</Tag>
          </TagGroup.List>
        </TagGroup>
      </div>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-8">
        <TagGroup selectionMode="single" variant="default">
          <Label>Обычный</Label>
          <TagGroup.List>
            <Tag>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag>Игры</Tag>
          </TagGroup.List>
        </TagGroup>

        <TagGroup selectionMode="single" variant="surface">
          <Label>Поверхность</Label>
          <TagGroup.List>
            <Tag>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag>Игры</Tag>
          </TagGroup.List>
        </TagGroup>
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Неактивные",
  render: () => (
    <Showcase title="Неактивные">
      <div className="flex flex-col gap-4">
        <TagGroup selectionMode="single">
          <Label>Неактивные теги</Label>
          <TagGroup.List>
            <Tag isDisabled>Новости</Tag>
            <Tag>Путешествия</Tag>
            <Tag isDisabled>Игры</Tag>
          </TagGroup.List>
          <Description>Часть тегов неактивна</Description>
        </TagGroup>

        <TagGroup disabledKeys={["disabled-travel"]} selectionMode="single">
          <Label>Неактивные по ключам</Label>
          <TagGroup.List>
            <Tag id="disabled-news">Новости</Tag>
            <Tag id="disabled-travel">Путешествия</Tag>
            <Tag id="disabled-gaming">Игры</Tag>
          </TagGroup.List>
          <Description>Теги выключены пропсом disabledKeys</Description>
        </TagGroup>
      </div>
    </Showcase>
  ),
};

export const SelectionModes: Story = {
  name: "Режимы выбора",
  render: () => {
    const [singleSelected, setSingleSelected] = useState<Iterable<Key>>(new Set(["news"]));
    const [multipleSelected, setMultipleSelected] = useState<Iterable<Key>>(
      new Set(["news", "travel"]),
    );

    return (
      <Showcase title="Режимы выбора">
        <div className="flex flex-col gap-8">
          <TagGroup
            selectedKeys={singleSelected}
            selectionMode="single"
            onSelectionChange={(keys) => setSingleSelected(keys)}
          >
            <Label>Одиночный выбор</Label>
            <TagGroup.List>
              <Tag>Новости</Tag>
              <Tag>Путешествия</Tag>
              <Tag>Игры</Tag>
              <Tag>Покупки</Tag>
            </TagGroup.List>
            <Description>Выберите одну категорию</Description>
          </TagGroup>

          <TagGroup
            selectedKeys={multipleSelected}
            selectionMode="multiple"
            onSelectionChange={(keys) => setMultipleSelected(keys)}
          >
            <Label>Множественный выбор</Label>
            <TagGroup.List>
              <Tag>Новости</Tag>
              <Tag>Путешествия</Tag>
              <Tag>Игры</Tag>
              <Tag>Покупки</Tag>
            </TagGroup.List>
            <Description>Выберите несколько категорий</Description>
          </TagGroup>
        </div>
      </Showcase>
    );
  },
};

export const Controlled: Story = {
  name: "Управляемый выбор",
  render: () => {
    const [selected, setSelected] = useState<Iterable<Key>>(new Set(["news", "travel"]));

    return (
      <Showcase title="Управляемый выбор">
        <div className="flex flex-col gap-3">
          <TagGroup
            selectedKeys={selected}
            selectionMode="multiple"
            onSelectionChange={(keys) => setSelected(keys)}
          >
            <Label>Категории (управляемые)</Label>
            <TagGroup.List>
              <Tag id="news">Новости</Tag>
              <Tag id="travel">Путешествия</Tag>
              <Tag id="gaming">Игры</Tag>
              <Tag id="shopping">Покупки</Tag>
            </TagGroup.List>
            <Description>
              Выбрано:{" "}
              {Array.from(selected).length > 0 ? Array.from(selected).join(", ") : "ничего"}
            </Description>
          </TagGroup>
        </div>
      </Showcase>
    );
  },
};

export const WithErrorMessage: Story = {
  name: "С сообщением об ошибке",
  render: () => {
    const [selected, setSelected] = useState<Iterable<Key>>(new Set());

    const isInvalid = useMemo(() => Array.from(selected).length === 0, [selected]);

    return (
      <Showcase title="С сообщением об ошибке">
        <TagGroup
          className="w-72"
          selectedKeys={selected}
          selectionMode="multiple"
          onSelectionChange={(keys) => setSelected(keys)}
        >
          <Label>Удобства</Label>
          <TagGroup.List>
            <Tag id="laundry">Стирка</Tag>
            <Tag id="fitness">Фитнес-центр</Tag>
            <Tag id="parking">Парковка</Tag>
            <Tag id="pool">Бассейн</Tag>
            <Tag id="breakfast">Завтрак</Tag>
          </TagGroup.List>
          <Description>
            {isInvalid
              ? "Выберите хотя бы одну категорию"
              : `Выбрано: ${Array.from(selected).join(", ")}`}
          </Description>
          {!!isInvalid && <ErrorMessage>Выберите хотя бы одну категорию</ErrorMessage>}
        </TagGroup>
      </Showcase>
    );
  },
};

export const WithPrefix: Story = {
  name: "С префиксом",
  render: () => (
    <Showcase title="С префиксом">
      <TagGroup selectionMode="single">
        <Label>С иконками</Label>
        <TagGroup.List>
          <Tag>
            <SquareArticleIcon />
            Новости
          </Tag>
          <Tag>
            <PlanetEarthIcon />
            Путешествия
          </Tag>
          <Tag>
            <RocketIcon />
            Игры
          </Tag>
          <Tag>
            <ShoppingBagIcon />
            Покупки
          </Tag>
        </TagGroup.List>
        <Description>Теги с иконками</Description>
      </TagGroup>
    </Showcase>
  ),
};

export const WithRemoveButton: Story = {
  name: "С кнопкой удаления",
  render: () => {
    type TagItem = {id: string; name: string};

    const [tags, setTags] = useState<TagItem[]>([
      {id: "news", name: "Новости"},
      {id: "travel", name: "Путешествия"},
      {id: "gaming", name: "Игры"},
      {id: "shopping", name: "Покупки"},
    ]);

    const [frameworks, setFrameworks] = useState<TagItem[]>([
      {id: "react", name: "React"},
      {id: "vue", name: "Vue"},
      {id: "angular", name: "Angular"},
      {id: "svelte", name: "Svelte"},
    ]);

    const onRemoveTags = (keys: Set<Key>) => {
      setTags(tags.filter((tag) => !keys.has(tag.id)));
    };

    const onRemoveFrameworks = (keys: Set<Key>) => {
      setFrameworks(frameworks.filter((framework) => !keys.has(framework.id)));
    };

    return (
      <Showcase title="С кнопкой удаления">
        <div className="flex flex-col gap-8">
          <div className="w-sm">
            <TagGroup selectionMode="single" onRemove={onRemoveTags}>
              <Label>Обычная кнопка удаления</Label>
              <TagGroup.List
                items={tags}
                renderEmptyState={() => (
                  <EmptyState className="p-1">Категории закончились</EmptyState>
                )}
              >
                {(tag) => (
                  <Tag key={tag.name} id={tag.id} textValue={tag.name}>
                    {tag.name}
                  </Tag>
                )}
              </TagGroup.List>
              <Description>Нажмите крестик, чтобы убрать тег</Description>
            </TagGroup>
          </div>

          <div className="w-md">
            <TagGroup selectionMode="single" onRemove={onRemoveFrameworks}>
              <Label>Своя кнопка удаления (render-проп)</Label>
              <TagGroup.List
                items={frameworks}
                renderEmptyState={() => (
                  <EmptyState className="p-1">Фреймворки закончились</EmptyState>
                )}
              >
                {(tag) => (
                  <Tag key={tag.id} id={tag.id} textValue={tag.name}>
                    {(renderProps) => (
                      <>
                        {tag.name}
                        {!!renderProps.allowsRemoving && (
                          <Tag.RemoveButton>
                            <CircleXmarkFillIcon />
                          </Tag.RemoveButton>
                        )}
                      </>
                    )}
                  </Tag>
                )}
              </TagGroup.List>
              <Description>Своя кнопка удаления с иконкой через render-проп</Description>
            </TagGroup>
          </div>

          <div className="w-md">
            <TagGroup selectionMode="single" onRemove={onRemoveFrameworks}>
              <Label>Своя кнопка удаления (составная часть)</Label>
              <TagGroup.List
                items={frameworks}
                renderEmptyState={() => (
                  <EmptyState className="p-1">Фреймворки закончились</EmptyState>
                )}
              >
                {(tag) => (
                  <Tag key={tag.id} id={tag.id} textValue={tag.name}>
                    {tag.name}
                    <Tag.RemoveButton>
                      <CircleXmarkFillIcon />
                    </Tag.RemoveButton>
                  </Tag>
                )}
              </TagGroup.List>
              <Description>Своя кнопка удаления как составная часть тега</Description>
            </TagGroup>
          </div>
        </div>
      </Showcase>
    );
  },
};
