import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";

import {Button} from "../button/index.ts";
import {InfoIcon} from "../icons.tsx";
import {Surface} from "../surface/index.ts";

import {Popover} from "./index.ts";

/*
 * Заголовок второго уровня есть у каждой истории не для красоты: аудит в apps/storybook/e2e ждёт
 * его как признак готовности превью. Без него axe запускается по ещё пустому iframe, находит ноль
 * нарушений и проходит молча.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex items-center gap-6">{children}</div>
  </div>
);

const AvatarStub = ({children}: {children: ReactNode}) => (
  <span className="bg-accent-soft text-accent-soft-foreground flex size-10 items-center justify-center rounded-full text-sm font-medium">
    {children}
  </span>
);

/*
 * Без `component` в meta: у StoryObj<typeof meta> иначе обязательны args с children в каждой
 * истории, у которой есть только render. Истории здесь собраны явными render-функциями.
 */
const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/Popover",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Базовый",
  render: () => (
    <Showcase title="Базовый">
      <Popover>
        <Button isIconOnly aria-label="Подробнее" variant="tertiary">
          <InfoIcon />
        </Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Heading>Заголовок поповера</Popover.Heading>
            <p>Содержимое поповера</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </Showcase>
  ),
};

export const WithArrow: Story = {
  name: "Со стрелкой",
  render: () => (
    <Showcase title="Со стрелкой">
      <Popover>
        <Button isIconOnly aria-label="Подробнее" variant="tertiary">
          <InfoIcon />
        </Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Arrow />
            <Popover.Heading>Заголовок поповера</Popover.Heading>
            <p>Содержимое поповера</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </Showcase>
  ),
};

export const WithCustomContent: Story = {
  name: "Своё содержимое",
  render: () => {
    const [isFollowing, setIsFollowing] = React.useState(false);

    return (
      <Showcase title="Своё содержимое">
        <Popover>
          <Popover.Trigger aria-label="Профиль Зои">
            <div className="flex items-center gap-2">
              <AvatarStub>З</AvatarStub>
              <div className="flex flex-col gap-0">
                <p className="text-sm leading-5 font-medium">Зоя</p>
                <p className="text-xs leading-none text-muted">zoe@example.com</p>
              </div>
            </div>
          </Popover.Trigger>
          <Popover.Content className="w-[290px]">
            <Popover.Dialog className="flex flex-col gap-3">
              <Popover.Heading>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AvatarStub>З</AvatarStub>
                    <div className="flex h-full flex-col items-start justify-center">
                      <span className="text-sm font-medium">Зоя Лэнг</span>
                      <span className="text-muted text-sm leading-4 font-normal tracking-tight">
                        @zoe
                      </span>
                    </div>
                  </div>
                  <Button
                    className="rounded-full text-xs font-normal"
                    size="sm"
                    variant={isFollowing ? "tertiary" : "primary"}
                    onPress={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? "Читаю" : "Читать"}
                  </Button>
                </div>
              </Popover.Heading>
              <p className="text-sm">
                Дизайнер интерфейсов, заливает крутые демки в дизайн-систему.
              </p>
              <div className="flex gap-3">
                <div className="flex gap-1">
                  <p className="text-sm font-semibold">4</p>
                  <p className="text-muted text-sm">читает</p>
                </div>
                <div className="flex gap-1">
                  <p className="text-sm font-semibold">97,1K</p>
                  <p className="text-muted text-sm">читателей</p>
                </div>
              </div>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </Showcase>
    );
  },
};

export const OnSurface: Story = {
  name: "На поверхности",
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      <h2 className="text-sm font-medium text-foreground">На поверхности</h2>
      <Surface className="flex w-[400px] flex-col gap-2 p-6">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium">Заголовок блока</h3>
          <Popover>
            <Button isIconOnly aria-label="Справка" size="sm" variant="ghost">
              <InfoIcon />
            </Button>
            <Popover.Content className="max-w-[200px]" placement="right">
              <Popover.Dialog>
                <Popover.Arrow />
                <Popover.Heading>Справка</Popover.Heading>
                <p className="text-muted text-sm">
                  Поповер поверх поверхности: дополнительный контекст к заголовку блока, не
                  загромождая основной контент.
                </p>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
        <p className="text-muted text-sm">
          Иконка справки стоит сразу за заголовком: контекст доступен, основной контент не
          загромождён.
        </p>
      </Surface>
    </div>
  ),
};
