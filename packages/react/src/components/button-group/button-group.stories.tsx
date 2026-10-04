import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Menu, MenuItem, MenuTrigger} from "react-aria-components/Menu";
import {Popover} from "react-aria-components/Popover";

import {Button} from "../button/index.ts";
import {Chip} from "../chip/index.ts";
import {Description} from "../description/index.ts";
import {IconChevronDown, IconChevronLeft, IconChevronRight} from "../icons.tsx";
import {Label} from "../label/index.ts";

import {ButtonGroup} from "./index.ts";

/*
 * `size`, `variant`, `isDisabled` and `fullWidth` are set once on the group and inherited by
 * every button (the toggle-button.tsx context merge); a button's own prop wins.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const SectionLabel = ({children}: {children: ReactNode}) => (
  <p className="text-sm text-muted">{children}</p>
);

const AlignLeftIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5h16M4 12h10M4 19h13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5h16M7 12h10M6 19h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
  </svg>
);

const AlignRightIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 5h16M10 12h10M7 19h13"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

const EllipsisIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="12" fill="currentColor" r="2" />
    <circle cx="12" cy="12" fill="currentColor" r="2" />
    <circle cx="19" cy="12" fill="currentColor" r="2" />
  </svg>
);

const StarIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

const MergeMenu = () => (
  <MenuTrigger>
    <Button isIconOnly aria-label="Ещё варианты" variant="tertiary">
      <ButtonGroup.Separator />
      <IconChevronDown />
    </Button>
    <Popover
      className="min-w-64 rounded-2xl bg-overlay p-1 text-overlay-foreground shadow-overlay outline-none"
      placement="bottom end"
    >
      <Menu className="outline-none">
        <MenuItem
          className="flex flex-col items-start gap-1 rounded-xl px-3 py-2 outline-none"
          id="merge"
          textValue="Создать merge-коммит"
        >
          <Label>Создать merge-коммит</Label>
          <Description>Все коммиты ветки будут добавлены в базовую ветку</Description>
        </MenuItem>
        <MenuItem
          className="flex flex-col items-start gap-1 rounded-xl px-3 py-2 outline-none"
          id="squash"
          textValue="Объединить и влить"
        >
          <Label>Объединить и влить</Label>
          <Description>14 коммитов этой ветки станут одним коммитом в базовой</Description>
        </MenuItem>
      </Menu>
    </Popover>
  </MenuTrigger>
);

const meta = {
  component: ButtonGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/ButtonGroup",
} satisfies Meta<typeof ButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const Three = () => (
  <>
    <Button>Первый</Button>
    <Button>
      <ButtonGroup.Separator />
      Второй
    </Button>
    <Button>
      <ButtonGroup.Separator />
      Третий
    </Button>
  </>
);

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <ButtonGroup>
        <Three />
      </ButtonGroup>
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      <div className="flex flex-col gap-2">
        <SectionLabel>Маленький</SectionLabel>
        <ButtonGroup size="sm">
          <Three />
        </ButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <SectionLabel>Средний (по умолчанию)</SectionLabel>
        <ButtonGroup size="md">
          <Three />
        </ButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <SectionLabel>Большой</SectionLabel>
        <ButtonGroup size="lg">
          <Three />
        </ButtonGroup>
      </div>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      {(["primary", "secondary", "tertiary", "outline", "ghost", "danger"] as const).map(
        (variant) => (
          <div key={variant} className="flex flex-col gap-2">
            <SectionLabel>{variant}</SectionLabel>
            <ButtonGroup variant={variant}>
              <Three />
            </ButtonGroup>
          </div>
        ),
      )}
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "На всю ширину",
  render: () => (
    <Showcase title="На всю ширину">
      <div className="w-96 space-y-3">
        <ButtonGroup fullWidth>
          <Three />
        </ButtonGroup>
        <ButtonGroup fullWidth>
          <Button isIconOnly aria-label="По левому краю">
            <AlignLeftIcon />
          </Button>
          <Button isIconOnly aria-label="По центру">
            <ButtonGroup.Separator />
            <AlignCenterIcon />
          </Button>
          <Button isIconOnly aria-label="По правому краю">
            <ButtonGroup.Separator />
            <AlignRightIcon />
          </Button>
        </ButtonGroup>
      </div>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступные кнопки",
  render: () => (
    <Showcase title="Недоступные кнопки">
      <div className="flex flex-col gap-2">
        <SectionLabel>Все кнопки недоступны</SectionLabel>
        <ButtonGroup isDisabled>
          <Button>Первый</Button>
          <Button>
            <ButtonGroup.Separator />
            Вторый
          </Button>
          <Button>
            <ButtonGroup.Separator />
            Третий
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <SectionLabel>Группа недоступна, одна кнопка перекрывает</SectionLabel>
        <ButtonGroup isDisabled>
          <Button>Первый</Button>
          <Button>
            <ButtonGroup.Separator />
            Вторый
          </Button>
          <Button isDisabled={false}>
            <ButtonGroup.Separator />
            Третий (доступен)
          </Button>
        </ButtonGroup>
      </div>
    </Showcase>
  ),
};

export const WithIcons: Story = {
  name: "С иконками",
  render: () => (
    <Showcase title="С иконками">
      <div className="flex flex-col gap-2">
        <SectionLabel>Иконка и текст</SectionLabel>
        <ButtonGroup>
          <Button variant="secondary">
            <IconChevronLeft />
            Назад
          </Button>
          <Button variant="secondary">
            <ButtonGroup.Separator />
            Вперёд
            <IconChevronRight />
          </Button>
        </ButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <SectionLabel>Только иконки</SectionLabel>
        <ButtonGroup>
          <Button isIconOnly aria-label="По левому краю" variant="tertiary">
            <AlignLeftIcon />
          </Button>
          <Button isIconOnly aria-label="По центру" variant="tertiary">
            <ButtonGroup.Separator />
            <AlignCenterIcon />
          </Button>
          <Button isIconOnly aria-label="По правому краю" variant="tertiary">
            <ButtonGroup.Separator />
            <EllipsisIcon />
          </Button>
        </ButtonGroup>
      </div>
    </Showcase>
  ),
};

export const Orientation: Story = {
  name: "Ориентация",
  render: () => (
    <Showcase title="Ориентация">
      <div className="flex items-start gap-8">
        <div className="flex flex-col gap-2">
          <SectionLabel>Горизонтальная</SectionLabel>
          <ButtonGroup orientation="horizontal">
            <Button isIconOnly aria-label="По левому краю" variant="tertiary">
              <AlignLeftIcon />
            </Button>
            <Button isIconOnly aria-label="По центру" variant="tertiary">
              <ButtonGroup.Separator />
              <AlignCenterIcon />
            </Button>
            <Button isIconOnly aria-label="По правому краю" variant="tertiary">
              <ButtonGroup.Separator />
              <AlignRightIcon />
            </Button>
          </ButtonGroup>
        </div>
        <div className="flex flex-col gap-2">
          <SectionLabel>Вертикальная</SectionLabel>
          <ButtonGroup orientation="vertical">
            <Button isIconOnly aria-label="По левому краю" variant="tertiary">
              <AlignLeftIcon />
            </Button>
            <Button isIconOnly aria-label="По центру" variant="tertiary">
              <ButtonGroup.Separator />
              <AlignCenterIcon />
            </Button>
            <Button isIconOnly aria-label="По правому краю" variant="tertiary">
              <ButtonGroup.Separator />
              <AlignRightIcon />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </Showcase>
  ),
};

export const WithoutSeparator: Story = {
  name: "Без разделителя",
  render: () => (
    <Showcase title="Без разделителя">
      <ButtonGroup>
        <Button>Первый</Button>
        <Button>Второй</Button>
        <Button>Третий</Button>
      </ButtonGroup>
    </Showcase>
  ),
};

/*
 * Split button и «гитхабовские» пары: кнопка действия и кнопка-шеврон одной группой. Меню здесь —
 * сырые примитивы RAC: собственного Dropdown в наборе ещё нет.
 */
export const Examples: Story = {
  name: "Примеры",
  render: () => (
    <Showcase title="Примеры">
      <div className="flex flex-col items-start gap-8">
        <div className="flex flex-col gap-2">
          <SectionLabel>Кнопка с меню</SectionLabel>
          <ButtonGroup>
            <Button variant="tertiary">Влить pull request</Button>
            <MergeMenu />
          </ButtonGroup>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Действие со счётчиком</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <ButtonGroup>
              <Button variant="tertiary">
                <StarIcon />В избранном
              </Button>
              <Button className="px-2" variant="tertiary">
                <ButtonGroup.Separator />
                <Chip size="sm" variant="soft">
                  104
                </Chip>
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button variant="tertiary">
                <StarIcon />
                Избранное
                <Chip size="sm" variant="soft">
                  24
                </Chip>
              </Button>
              <Button isIconOnly aria-label="Ещё варианты" variant="tertiary">
                <ButtonGroup.Separator />
                <IconChevronDown />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Навигация назад/вперёд</SectionLabel>
          <ButtonGroup>
            <Button variant="tertiary">
              <IconChevronLeft />
              Назад
            </Button>
            <Button variant="tertiary">
              <ButtonGroup.Separator />
              Вперёд
              <IconChevronRight />
            </Button>
          </ButtonGroup>
        </div>

        <div className="flex flex-col gap-2">
          <SectionLabel>Выбор содержимого</SectionLabel>
          <ButtonGroup>
            <Button variant="tertiary">Фото</Button>
            <Button variant="tertiary">
              <ButtonGroup.Separator />
              Видео
            </Button>
            <Button isIconOnly aria-label="Ещё варианты" variant="tertiary">
              <ButtonGroup.Separator />
              <EllipsisIcon />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </Showcase>
  ),
};
