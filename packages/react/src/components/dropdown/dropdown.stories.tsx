import type {Selection} from "@react-types/shared";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";

import React from "react";
import {Header as HeaderPrimitive} from "react-aria-components/Menu";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {Kbd} from "../kbd/index.ts";
import {Label} from "../label/index.ts";
import {Separator} from "../separator/index.ts";

import {Dropdown} from "./index.ts";

/*
 * Заголовок второго уровня есть у каждой истории: аудит в apps/storybook/e2e ждёт его как признак
 * готовности превью. Без него axe запускается по пустому iframe и молча проходит.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex min-h-56 flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-8">{children}</div>
  </div>
);

/*
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md.
 */
interface IconProps extends ComponentProps<"svg"> {}

const SquarePlusIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3m-3 1.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3zm7.25 1a.75.75 0 0 0-1.5 0v1.75H5.5a.75.75 0 1 0 0 1.5h1.75v1.75a.75.75 0 0 0 1.5 0V8.75h1.75a.75.75 0 0 0 0-1.5H8.75z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const FolderOpenIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="m6.379 4.5-.44-.44-.621-.62A1.5 1.5 0 0 0 4.258 3H3a1.5 1.5 0 0 0-1.5 1.5v5.25l1.376-2.293A3 3 0 0 1 5.45 6h7.05A1.5 1.5 0 0 0 11 4.5zM14 6.026V6a3 3 0 0 0-3-3H7l-.621-.621A3 3 0 0 0 4.257 1.5H3a3 3 0 0 0-3 3V11a3 3 0 0 0 3 3h8.301a3 3 0 0 0 2.573-1.457l1.791-2.985A2.35 2.35 0 0 0 14 6.026M10 12.5h1.301a1.5 1.5 0 0 0 1.287-.728l1.791-2.986 1.286.772-1.286-.772a.85.85 0 0 0-.728-1.286H5.449a1.5 1.5 0 0 0-1.287.728l-1.791 2.986a.85.85 0 0 0 .728 1.286z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const FloppyDiskIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M3 11.5A1.5 1.5 0 0 0 4.5 13v-2.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V13a1.5 1.5 0 0 0 1.5-1.5V6.036a1 1 0 0 0-.293-.708l-2.035-2.035A1 1 0 0 0 9.964 3H6v1a.5.5 0 0 0 .5.5h3a.75.75 0 0 1 0 1.5h-3a2 2 0 0 1-2-2V3A1.5 1.5 0 0 0 3 4.5zm-1.5 0a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3V6.036a2.5 2.5 0 0 0-.732-1.768l-2.036-2.036A2.5 2.5 0 0 0 9.964 1.5H4.5a3 3 0 0 0-3 3zm8.5-1V13H6v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const TrashBinIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M9 2H7a.5.5 0 0 0-.5.5V3h3v-.5A.5.5 0 0 0 9 2m2 1v-.5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V3H2.251a.75.75 0 0 0 0 1.5h.312l.317 7.625A3 3 0 0 0 5.878 15h4.245a3 3 0 0 0 2.997-2.875l.318-7.625h.312a.75.75 0 0 0 0-1.5zm.936 1.5H4.064l.315 7.562A1.5 1.5 0 0 0 5.878 13.5h4.245a1.5 1.5 0 0 0 1.498-1.438zm-6.186 2v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0m3.75-.75a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const PencilIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M11.423 1A3.577 3.577 0 0 1 15 4.577c0 .27-.108.53-.3.722l-.528.529-1.971 1.971-5.059 5.059a3 3 0 0 1-1.533.82l-2.638.528a1 1 0 0 1-1.177-1.177l.528-2.638a3 3 0 0 1 .82-1.533l5.059-5.059 2.5-2.5c.191-.191.451-.299.722-.299m-2.31 4.009-4.91 4.91a1.5 1.5 0 0 0-.41.766l-.38 1.903 1.902-.38a1.5 1.5 0 0 0 .767-.41l4.91-4.91a2.08 2.08 0 0 0-1.88-1.88m3.098.658a3.6 3.6 0 0 0-1.878-1.879l1.28-1.28c.995.09 1.788.884 1.878 1.88z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const EllipsisVerticalIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M8 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const BarsIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M1.25 3.25A.75.75 0 0 1 2 2.5h12A.75.75 0 0 1 14 4H2a.75.75 0 0 1-.75-.75m0 4.75A.75.75 0 0 1 2 7.25h12a.75.75 0 0 1 0 1.5H2A.75.75 0 0 1 1.25 8M2 12a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const GearIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M7.199 2H8.8a.2.2 0 0 1 .2.2c0 1.808 1.958 2.939 3.524 2.034a.2.2 0 0 1 .271.073l.802 1.388a.2.2 0 0 1-.073.272c-1.566.904-1.566 3.164 0 4.069a.2.2 0 0 1 .073.271l-.802 1.388a.2.2 0 0 1-.271.073C10.958 10.863 9 11.993 9 13.8a.2.2 0 0 1-.199.2H7.2a.2.2 0 0 1-.2-.2c0-1.808-1.958-2.938-3.524-2.034a.2.2 0 0 1-.272-.073l-.8-1.388a.2.2 0 0 1 .072-.271c1.566-.905 1.566-3.165 0-4.07a.2.2 0 0 1-.073-.27l.801-1.389a.2.2 0 0 1 .272-.072C5.042 5.138 7 4.007 7 2.199c0-.11.089-.199.199-.199M5.5 2.2c0-.94.76-1.7 1.699-1.7H8.8c.94 0 1.7.76 1.7 1.7a.85.85 0 0 0 1.274.735 1.7 1.7 0 0 1 2.32.622l.802 1.388c.469.813.19 1.851-.622 2.32a.85.85 0 0 0 0 1.472 1.7 1.7 0 0 1 .622 2.32l-.802 1.388a1.7 1.7 0 0 1-2.32.622.85.85 0 0 0-1.274.735c0 .939-.76 1.7-1.699 1.7H7.2a1.7 1.7 0 0 1-1.699-1.7.85.85 0 0 0-1.274-.735 1.7 1.7 0 0 1-2.32-.622l-.802-1.388a1.7 1.7 0 0 1 .622-2.32.85.85 0 0 0 0-1.471 1.7 1.7 0 0 1-.622-2.32l.801-1.389a1.7 1.7 0 0 1 2.32-.622A.85.85 0 0 0 5.5 2.2m4 5.8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const PersonsIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M5.5 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m0 1.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-3.029 2.886c-.777.54-.971 1.063-.971 1.306 0 .446.362.808.808.808h6.384a.81.81 0 0 0 .808-.808c0-.244-.194-.767-.971-1.306C7.792 9.875 6.719 9.5 5.5 9.5s-2.292.375-3.029.886M0 11.692C0 9.846 2.475 8 5.5 8c1.18 0 2.278.281 3.177.734A5.67 5.67 0 0 1 11.5 8c2.475 0 4.5 1.538 4.5 3.077A1.923 1.923 0 0 1 14.077 13h-3.483c-.416.604-1.113 1-1.902 1H2.308A2.31 2.31 0 0 1 0 11.692m10.991-.192h3.086c.234 0 .423-.19.423-.423 0-.103-.096-.472-.688-.89-.554-.393-1.375-.687-2.312-.687-.517 0-.999.09-1.42.236.526.534.854 1.146.911 1.764M12.5 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0M14 5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const ArrowRightFromSquareIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M14.78 7.47a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 1 1-1.06-1.06l1.22-1.22H4.75a.75.75 0 0 1 0-1.5h7.69l-1.22-1.22a.75.75 0 0 1 1.06-1.06zM9.5 4.25a.75.75 0 0 1-1.5 0V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v8A1.5 1.5 0 0 0 4 13.5h2.5A1.5 1.5 0 0 0 8 12v-.25a.75.75 0 0 1 1.5 0V12a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3h2.5a3 3 0 0 1 3 3z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const ArrowRightIcon = (props: IconProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M1.25 8A.75.75 0 0 1 2 7.25h10.19L9.47 4.53a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 1 1-1.06-1.06l2.72-2.72H2A.75.75 0 0 1 1.25 8"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/*
 * Без `component` в meta: у StoryObj<typeof meta> иначе обязательны args с children в каждой
 * истории, у которой есть только render. Истории здесь собраны явными render-функциями.
 */
const meta = {
  parameters: {
    layout: "centered",
  },
  title: "Components/Dropdown",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Действия
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Section>
              <Dropdown.Item id="new-file" textValue="Новый файл">
                <Label>Новый файл</Label>
              </Dropdown.Item>
              <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
                <Label>Копировать ссылку</Label>
              </Dropdown.Item>
              <Dropdown.Item id="edit-file" textValue="Редактировать файл">
                <Label>Редактировать файл</Label>
              </Dropdown.Item>
            </Dropdown.Section>
            <Separator />
            <Dropdown.Section>
              <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
                <Label>Удалить файл</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithSingleSelection: Story = {
  name: "Одиночный выбор",
  render: () => {
    const [selected, setSelected] = React.useState<Selection>(new Set(["apple"]));

    return (
      <Showcase title="Одиночный выбор">
        <Dropdown>
          <Button aria-label="Меню" variant="secondary">
            Фрукт
          </Button>
          <Dropdown.Popover className="min-w-[256px]">
            <Dropdown.Menu
              selectedKeys={selected}
              selectionMode="single"
              onSelectionChange={setSelected}
            >
              <Dropdown.Section>
                <HeaderPrimitive>Выберите фрукт</HeaderPrimitive>
                <Dropdown.Item id="apple" textValue="Яблоко">
                  <Dropdown.ItemIndicator />
                  <Label>Яблоко</Label>
                </Dropdown.Item>
                <Dropdown.Item id="banana" textValue="Банан">
                  <Dropdown.ItemIndicator />
                  <Label>Банан</Label>
                </Dropdown.Item>
                <Dropdown.Item id="cherry" textValue="Вишня">
                  <Dropdown.ItemIndicator />
                  <Label>Вишня</Label>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Item id="orange" textValue="Апельсин">
                <Dropdown.ItemIndicator />
                <Label>Апельсин</Label>
              </Dropdown.Item>
              <Dropdown.Item id="pear" textValue="Груша">
                <Dropdown.ItemIndicator />
                <Label>Груша</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Showcase>
    );
  },
};

export const SingleWithCustomIndicator: Story = {
  name: "Одиночный выбор со своим индикатором",
  render: () => {
    const [selected, setSelected] = React.useState<Selection>(new Set(["apple"]));

    const CustomCheckmarkIcon = (
      <svg
        fill="none"
        height={16}
        viewBox="0 0 16 16"
        width={16}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="text-accent"
          clipRule="evenodd"
          d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14m3.1-8.55a.75.75 0 1 0-1.2-.9L7.419 8.858 6.03 7.47a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.13-.08z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    );

    return (
      <Showcase title="Одиночный выбор со своим индикатором">
        <Dropdown>
          <Button aria-label="Меню" variant="secondary">
            Фрукты
          </Button>
          <Dropdown.Popover className="min-w-[256px]">
            <Dropdown.Menu
              selectedKeys={selected}
              selectionMode="single"
              onSelectionChange={setSelected}
            >
              <Dropdown.Section>
                <HeaderPrimitive>Выберите фрукт</HeaderPrimitive>
                <Dropdown.Item id="apple" textValue="Яблоко">
                  <Dropdown.ItemIndicator>
                    {({isSelected}) => (isSelected ? CustomCheckmarkIcon : null)}
                  </Dropdown.ItemIndicator>
                  <Label>Яблоко</Label>
                </Dropdown.Item>
                <Dropdown.Item id="banana" textValue="Банан">
                  <Dropdown.ItemIndicator>
                    {({isSelected}) => (isSelected ? CustomCheckmarkIcon : null)}
                  </Dropdown.ItemIndicator>
                  <Label>Банан</Label>
                </Dropdown.Item>
                <Dropdown.Item id="cherry" textValue="Вишня">
                  <Dropdown.ItemIndicator>
                    {({isSelected}) => (isSelected ? CustomCheckmarkIcon : null)}
                  </Dropdown.ItemIndicator>
                  <Label>Вишня</Label>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Item id="orange" textValue="Апельсин">
                <Dropdown.ItemIndicator>
                  {({isSelected}) => (isSelected ? CustomCheckmarkIcon : null)}
                </Dropdown.ItemIndicator>
                <Label>Апельсин</Label>
              </Dropdown.Item>
              <Dropdown.Item id="pear" textValue="Груша">
                <Dropdown.ItemIndicator>
                  {({isSelected}) => (isSelected ? CustomCheckmarkIcon : null)}
                </Dropdown.ItemIndicator>
                <Label>Груша</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Showcase>
    );
  },
};

export const WithMultipleSelection: Story = {
  name: "Множественный выбор",
  render: () => {
    const [selected, setSelected] = React.useState<Selection>(new Set(["apple"]));

    return (
      <Showcase title="Множественный выбор">
        <Dropdown>
          <Button aria-label="Меню" variant="secondary">
            Любимые фрукты
          </Button>
          <Dropdown.Popover className="min-w-[256px]">
            <Dropdown.Menu
              selectedKeys={selected}
              selectionMode="multiple"
              onSelectionChange={setSelected}
            >
              <Dropdown.Section>
                <HeaderPrimitive>Выберите фрукты</HeaderPrimitive>
                <Dropdown.Item id="apple" textValue="Яблоко">
                  <Dropdown.ItemIndicator />
                  <Label>Яблоко</Label>
                </Dropdown.Item>
                <Dropdown.Item id="banana" textValue="Банан">
                  <Dropdown.ItemIndicator />
                  <Label>Банан</Label>
                </Dropdown.Item>
                <Dropdown.Item id="cherry" textValue="Вишня">
                  <Dropdown.ItemIndicator />
                  <Label>Вишня</Label>
                </Dropdown.Item>
              </Dropdown.Section>
              <Dropdown.Item id="orange" textValue="Апельсин">
                <Dropdown.ItemIndicator />
                <Label>Апельсин</Label>
              </Dropdown.Item>
              <Dropdown.Item id="pear" textValue="Груша">
                <Dropdown.ItemIndicator />
                <Label>Груша</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Showcase>
    );
  },
};

export const WithSectionLevelSelection: Story = {
  name: "Выбор на уровне секций",
  render: () => {
    const [textStyles, setTextStyles] = React.useState<Selection>(new Set(["bold", "italic"]));
    const [textAlignment, setTextAlignment] = React.useState<Selection>(new Set(["left"]));

    return (
      <Showcase title="Выбор на уровне секций">
        <Dropdown>
          <Button aria-label="Меню" variant="secondary">
            Стили
          </Button>
          <Dropdown.Popover className="min-w-[256px]">
            <Dropdown.Menu>
              <Dropdown.Section>
                <HeaderPrimitive>Действия</HeaderPrimitive>
                <Dropdown.Item id="cut" textValue="Вырезать">
                  <Label>Вырезать</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>X</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="copy" textValue="Копировать">
                  <Label>Копировать</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>C</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="paste" textValue="Вставить">
                  <Label>Вставить</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>V</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
              </Dropdown.Section>
              <Separator />
              <Dropdown.Section
                selectedKeys={textStyles}
                selectionMode="multiple"
                onSelectionChange={setTextStyles}
              >
                <HeaderPrimitive>Начертание</HeaderPrimitive>
                <Dropdown.Item id="bold" textValue="Полужирный">
                  <Dropdown.ItemIndicator />
                  <Label>Полужирный</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>B</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="italic" textValue="Курсив">
                  <Dropdown.ItemIndicator />
                  <Label>Курсив</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>I</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="underline" textValue="Подчёркнутый">
                  <Dropdown.ItemIndicator />
                  <Label>Подчёркнутый</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="command" />
                    <Kbd.Content>U</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
              </Dropdown.Section>
              <Separator />
              <Dropdown.Section
                selectedKeys={textAlignment}
                selectionMode="single"
                onSelectionChange={setTextAlignment}
              >
                <HeaderPrimitive>Выравнивание</HeaderPrimitive>
                <Dropdown.Item id="left" textValue="По левому краю">
                  <Dropdown.ItemIndicator type="dot" />
                  <Label>По левому краю</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="alt" />
                    <Kbd.Content>A</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="center" textValue="По центру">
                  <Dropdown.ItemIndicator type="dot" />
                  <Label>По центру</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="alt" />
                    <Kbd.Content>H</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
                <Dropdown.Item id="right" textValue="По правому краю">
                  <Dropdown.ItemIndicator type="dot" />
                  <Label>По правому краю</Label>
                  <Kbd className="ms-auto" slot="keyboard" variant="light">
                    <Kbd.Abbr keyValue="alt" />
                    <Kbd.Content>D</Kbd.Content>
                  </Kbd>
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </Showcase>
    );
  },
};

export const WithKeyboardShortcuts: Story = {
  name: "С горячими клавишами",
  render: () => (
    <Showcase title="С горячими клавишами">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Действия
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Item id="new" textValue="Новый">
              <Label>Новый</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>N</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="open" textValue="Открыть">
              <Label>Открыть</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>O</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="save" textValue="Сохранить">
              <Label>Сохранить</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>S</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="delete" textValue="Удалить" variant="danger">
              <Label>Удалить</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Abbr keyValue="shift" />
                <Kbd.Content>D</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithIcons: Story = {
  name: "С иконками",
  render: () => (
    <Showcase title="С иконками">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Действия
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Item id="new-file" textValue="Новый файл">
              <SquarePlusIcon className="size-4 shrink-0 text-muted" />
              <Label>Новый файл</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>N</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="open-file" textValue="Открыть файл">
              <FolderOpenIcon className="size-4 shrink-0 text-muted" />
              <Label>Открыть файл</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>O</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="save-file" textValue="Сохранить файл">
              <FloppyDiskIcon className="size-4 shrink-0 text-muted" />
              <Label>Сохранить файл</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>S</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
              <TrashBinIcon className="size-4 shrink-0 text-danger" />
              <Label>Удалить файл</Label>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Abbr keyValue="shift" />
                <Kbd.Content>D</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const LongPressTrigger: Story = {
  name: "Долгое нажатие",
  render: () => (
    <Showcase title="Долгое нажатие">
      <Dropdown trigger="longPress">
        <Button aria-label="Меню" variant="secondary">
          Долгое нажатие
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu>
            <Dropdown.Item id="new-file" textValue="Новый файл">
              <Label>Новый файл</Label>
            </Dropdown.Item>
            <Dropdown.Item id="open-file" textValue="Открыть файл">
              <Label>Открыть файл</Label>
            </Dropdown.Item>
            <Dropdown.Item id="save-file" textValue="Сохранить файл">
              <Label>Сохранить файл</Label>
            </Dropdown.Item>
            <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
              <Label>Удалить файл</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithDescriptions: Story = {
  name: "С описаниями",
  render: () => (
    <Showcase title="С описаниями">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Действия
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Item id="new-file" textValue="Новый файл">
              <div className="flex h-8 items-start justify-center pt-px">
                <SquarePlusIcon className="size-4 shrink-0 text-muted" />
              </div>
              <div className="flex flex-col">
                <Label>Новый файл</Label>
                <Description>Создать новый файл</Description>
              </div>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>N</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="open-file" textValue="Открыть файл">
              <div className="flex h-8 items-start justify-center pt-px">
                <FolderOpenIcon className="size-4 shrink-0 text-muted" />
              </div>
              <div className="flex flex-col">
                <Label>Открыть файл</Label>
                <Description>Открыть существующий файл</Description>
              </div>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>O</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="save-file" textValue="Сохранить файл">
              <div className="flex h-8 items-start justify-center pt-px">
                <FloppyDiskIcon className="size-4 shrink-0 text-muted" />
              </div>
              <div className="flex flex-col">
                <Label>Сохранить файл</Label>
                <Description>Сохранить текущий файл</Description>
              </div>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Content>S</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
            <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
              <div className="flex h-8 items-start justify-center pt-px">
                <TrashBinIcon className="size-4 shrink-0 text-danger" />
              </div>
              <div className="flex flex-col">
                <Label>Удалить файл</Label>
                <Description>Переместить в корзину</Description>
              </div>
              <Kbd className="ms-auto" slot="keyboard" variant="light">
                <Kbd.Abbr keyValue="command" />
                <Kbd.Abbr keyValue="shift" />
                <Kbd.Content>D</Kbd.Content>
              </Kbd>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithSections: Story = {
  name: "С секциями",
  render: () => (
    <Showcase title="С секциями">
      <Dropdown>
        <Dropdown.Trigger
          aria-label="Меню"
          className="button button--md button--secondary button--icon-only data-[focus-visible=true]:status-focused"
        >
          <EllipsisVerticalIcon className="outline-none" />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Section>
              <HeaderPrimitive>Действия</HeaderPrimitive>
              <Dropdown.Item id="new-file" textValue="Новый файл">
                <div className="flex h-8 items-start justify-center pt-px">
                  <SquarePlusIcon className="size-4 shrink-0 text-muted" />
                </div>
                <div className="flex flex-col">
                  <Label>Новый файл</Label>
                  <Description>Создать новый файл</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>N</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
              <Dropdown.Item id="edit-file" textValue="Редактировать файл">
                <div className="flex h-8 items-start justify-center pt-px">
                  <PencilIcon className="size-4 shrink-0 text-muted" />
                </div>
                <div className="flex flex-col">
                  <Label>Редактировать файл</Label>
                  <Description>Внести изменения</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>E</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            </Dropdown.Section>
            <Separator />
            <Dropdown.Section>
              <HeaderPrimitive>Опасная зона</HeaderPrimitive>
              <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
                <div className="flex h-8 items-start justify-center pt-px">
                  <TrashBinIcon className="size-4 shrink-0 text-danger" />
                </div>
                <div className="flex flex-col">
                  <Label>Удалить файл</Label>
                  <Description>Переместить в корзину</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Abbr keyValue="shift" />
                  <Kbd.Content>D</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithDisabledItems: Story = {
  name: "С недоступными элементами",
  render: () => (
    <Showcase title="С недоступными элементами">
      <Dropdown>
        <Button isIconOnly aria-label="Меню" variant="secondary">
          <BarsIcon className="outline-none" />
        </Button>
        <Dropdown.Popover className="min-w-[220px]">
          <Dropdown.Menu
            disabledKeys={["delete-file"]}
            onAction={(key) => alert(`Выбрано: ${key}`)}
          >
            <Dropdown.Section>
              <HeaderPrimitive>Действия</HeaderPrimitive>
              <Dropdown.Item id="new-file" textValue="Новый файл">
                <div className="flex h-8 items-start justify-center pt-px">
                  <SquarePlusIcon className="size-4 shrink-0 text-muted" />
                </div>
                <div className="flex flex-col">
                  <Label>Новый файл</Label>
                  <Description>Создать новый файл</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>N</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
              <Dropdown.Item id="edit-file" textValue="Редактировать файл">
                <div className="flex h-8 items-start justify-center pt-px">
                  <PencilIcon className="size-4 shrink-0 text-muted" />
                </div>
                <div className="flex flex-col">
                  <Label>Редактировать файл</Label>
                  <Description>Внести изменения</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Content>E</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            </Dropdown.Section>
            <Separator />
            <Dropdown.Section>
              <HeaderPrimitive>Опасная зона</HeaderPrimitive>
              <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
                <div className="flex h-8 items-start justify-center pt-px">
                  <TrashBinIcon className="size-4 shrink-0 text-danger" />
                </div>
                <div className="flex flex-col">
                  <Label>Удалить файл</Label>
                  <Description>Переместить в корзину</Description>
                </div>
                <Kbd className="ms-auto" slot="keyboard" variant="light">
                  <Kbd.Abbr keyValue="command" />
                  <Kbd.Abbr keyValue="shift" />
                  <Kbd.Content>D</Kbd.Content>
                </Kbd>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithSubmenus: Story = {
  name: "С подменю",
  render: () => (
    <Showcase title="С подменю">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Поделиться
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
              <Label>Копировать ссылку</Label>
            </Dropdown.Item>
            <Dropdown.Item id="facebook" textValue="Facebook">
              <Label>Facebook</Label>
            </Dropdown.Item>
            <Dropdown.Item id="twitter" textValue="Twitter">
              <Label>X / Twitter</Label>
            </Dropdown.Item>
            <Dropdown.SubmenuTrigger>
              <Dropdown.Item id="share" textValue="Ещё">
                <Label>Ещё</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  <Dropdown.Item id="whatsapp" textValue="WhatsApp">
                    <Label>WhatsApp</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="telegram" textValue="Telegram">
                    <Label>Telegram</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="discord" textValue="Discord">
                    <Label>Discord</Label>
                  </Dropdown.Item>
                  <Dropdown.SubmenuTrigger>
                    <Dropdown.Item id="email" textValue="Почта">
                      <Label>Почта</Label>
                      <Dropdown.SubmenuIndicator />
                    </Dropdown.Item>
                    <Dropdown.Popover>
                      <Dropdown.Menu>
                        <Dropdown.Item id="work" textValue="Рабочая почта">
                          <Label>Рабочая почта</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="personal" textValue="Личная почта">
                          <Label>Личная почта</Label>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown.SubmenuTrigger>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const WithCustomSubmenuIndicator: Story = {
  name: "Со своим индикатором подменю",
  render: () => (
    <Showcase title="Со своим индикатором подменю">
      <Dropdown>
        <Button aria-label="Меню" variant="secondary">
          Поделиться
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={(key) => alert(`Выбрано: ${key}`)}>
            <Dropdown.Item id="copy-link" textValue="Копировать ссылку">
              <Label>Копировать ссылку</Label>
            </Dropdown.Item>
            <Dropdown.Item id="facebook" textValue="Facebook">
              <Label>Facebook</Label>
            </Dropdown.Item>
            <Dropdown.SubmenuTrigger>
              <Dropdown.Item id="share" textValue="Ещё">
                <Label>Больше опций</Label>
                <Dropdown.SubmenuIndicator>
                  <ArrowRightIcon className="size-3.5 text-muted" />
                </Dropdown.SubmenuIndicator>
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  <Dropdown.Item id="whatsapp" textValue="WhatsApp">
                    <Label>WhatsApp</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="telegram" textValue="Telegram">
                    <Label>Telegram</Label>
                  </Dropdown.Item>
                  <Dropdown.SubmenuTrigger>
                    <Dropdown.Item id="email" textValue="Почта">
                      <Label>Почта</Label>
                      <Dropdown.SubmenuIndicator>
                        <svg
                          className="size-3.5 text-muted"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Dropdown.SubmenuIndicator>
                    </Dropdown.Item>
                    <Dropdown.Popover>
                      <Dropdown.Menu>
                        <Dropdown.Item id="work" textValue="Рабочая почта">
                          <Label>Рабочая почта</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="personal" textValue="Личная почта">
                          <Label>Личная почта</Label>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown.SubmenuTrigger>
                  <Dropdown.Item id="discord" textValue="Discord">
                    <Label>Discord</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
            <Dropdown.SubmenuTrigger>
              <Dropdown.Item id="other" textValue="Другое">
                <Label>Другое (стандартный индикатор)</Label>
                <Dropdown.SubmenuIndicator />
              </Dropdown.Item>
              <Dropdown.Popover>
                <Dropdown.Menu>
                  <Dropdown.Item id="sms" textValue="SMS">
                    <Label>SMS</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown.SubmenuTrigger>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Контролируемый выбор",
  render: () => {
    const [selected, setSelected] = React.useState<Selection>(new Set(["bold"]));

    const selectedItems = Array.from(selected);

    return (
      <Showcase title="Контролируемый выбор">
        <div className="min-w-sm space-y-4">
          <Dropdown>
            <Button aria-label="Меню" variant="secondary">
              Действия
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                selectedKeys={selected}
                selectionMode="multiple"
                onSelectionChange={setSelected}
              >
                <Dropdown.Item id="bold" textValue="Полужирный">
                  <Label>Полужирный</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="italic" textValue="Курсив">
                  <Label>Курсив</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
                <Dropdown.Item id="underline" textValue="Подчёркнутый">
                  <Label>Подчёркнутый</Label>
                  <Dropdown.ItemIndicator />
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          <p className="text-sm text-muted">
            Выбрано: {selectedItems.length > 0 ? selectedItems.join(", ") : "ничего"}
          </p>
        </div>
      </Showcase>
    );
  },
};

export const ControlledOpenState: Story = {
  name: "Контролируемое открытие",
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <Showcase title="Контролируемое открытие">
        <div className="min-w-sm space-y-4">
          <p className="text-sm text-muted">
            Меню: <strong>{open ? "открыто" : "закрыто"}</strong>
          </p>
          <Dropdown isOpen={open} onOpenChange={setOpen}>
            <Button aria-label="Меню" variant="secondary">
              Действия
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu>
                <Dropdown.Item id="new-file" textValue="Новый файл">
                  <Label>Новый файл</Label>
                </Dropdown.Item>
                <Dropdown.Item id="open-file" textValue="Открыть файл">
                  <Label>Открыть файл</Label>
                </Dropdown.Item>
                <Dropdown.Item id="save-file" textValue="Сохранить файл">
                  <Label>Сохранить файл</Label>
                </Dropdown.Item>
                <Dropdown.Item id="delete-file" textValue="Удалить файл" variant="danger">
                  <Label>Удалить файл</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </Showcase>
    );
  },
};

export const CustomTrigger: Story = {
  name: "Свой триггер",
  render: () => (
    <Showcase title="Свой триггер">
      {/*
       * Аватара в системе ещё нет — триггер держит обычный img, суть истории от этого не меняется:
       * Dropdown.Trigger оборачивает произвольный элемент, а не только кнопку.
       */}
      <Dropdown>
        <Dropdown.Trigger className="rounded-full">
          <img
            alt="Джейн Доу"
            className="size-10 rounded-full object-cover"
            src="https://picsum.photos/80/80"
          />
        </Dropdown.Trigger>
        <Dropdown.Popover>
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-2">
              <img
                alt="Джейн"
                className="size-8 rounded-full object-cover"
                src="https://picsum.photos/80/80"
              />
              <div className="flex flex-col gap-0">
                <p className="text-sm leading-5 font-medium">Джейн Доу</p>
                <p className="text-xs leading-none text-muted">jane@example.com</p>
              </div>
            </div>
          </div>
          <Dropdown.Menu>
            <Dropdown.Item id="dashboard" textValue="Панель">
              <Label>Панель</Label>
            </Dropdown.Item>
            <Dropdown.Item id="profile" textValue="Профиль">
              <Label>Профиль</Label>
            </Dropdown.Item>
            <Dropdown.Item id="settings" textValue="Настройки">
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Настройки</Label>
                <GearIcon className="size-3.5 text-muted" />
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="new-project" textValue="Новый проект">
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Создать команду</Label>
                <PersonsIcon className="size-3.5 text-muted" />
              </div>
            </Dropdown.Item>
            <Dropdown.Item id="logout" textValue="Выйти" variant="danger">
              <div className="flex w-full items-center justify-between gap-2">
                <Label>Выйти</Label>
                <ArrowRightFromSquareIcon className="size-3.5 text-danger" />
              </div>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </Showcase>
  ),
};
