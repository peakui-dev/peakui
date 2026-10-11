import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";
import type {Key} from "react-aria-components/TagGroup";

import {useState} from "react";

import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";
import {Tag} from "../tag/index.ts";
import {TagGroup} from "../tag-group/index.ts";

import {ErrorMessage} from "./index.ts";

/*
 * Среда компонента — коллекционный корень: слот errorMessage публикует TagGroup, и только там
 * сообщение связывается с контролом. История в свободном поле обещала бы контракт, которого нет.
 * Видимость сообщения решает тот, кто его кладёт: дети условны, компонент лишь предъявляет слот.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: ErrorMessage,
  parameters: {
    layout: "padded",
  },
  title: "Components/ErrorMessage",
} satisfies Meta<typeof ErrorMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => {
    const [selected, setSelected] = useState<Iterable<Key>>(new Set());

    return (
      <Showcase title="По умолчанию">
        <TagGroup
          className="w-72"
          selectedKeys={selected}
          selectionMode="multiple"
          onSelectionChange={(keys) => setSelected(keys)}
        >
          <Label>Обязательные категории</Label>
          <TagGroup.List>
            <Tag id="news">Новости</Tag>
            <Tag id="travel">Путешествия</Tag>
            <Tag id="gaming">Игры</Tag>
            <Tag id="shopping">Покупки</Tag>
          </TagGroup.List>
          <ErrorMessage>
            {Array.from(selected).length === 0 && <>Выберите хотя бы одну категорию</>}
          </ErrorMessage>
        </TagGroup>
      </Showcase>
    );
  },
};

export const WithDescription: Story = {
  name: "Вместе с описанием",
  render: () => {
    const [selected, setSelected] = useState<Iterable<Key>>(new Set(["news"]));

    return (
      <Showcase title="Вместе с описанием">
        <TagGroup
          className="w-72"
          selectedKeys={selected}
          selectionMode="multiple"
          onSelectionChange={(keys) => setSelected(keys)}
        >
          <Label>Темы</Label>
          <TagGroup.List>
            <Tag id="api">API</Tag>
            <Tag id="design">Дизайн</Tag>
            <Tag id="docs">Документация</Tag>
          </TagGroup.List>
          <Description>Тема выбрана — сообщения об ошибке нет</Description>
          <ErrorMessage>{Array.from(selected).length === 0 && <>Выберите тему</>}</ErrorMessage>
        </TagGroup>
      </Showcase>
    );
  },
};
