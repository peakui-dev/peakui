import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Checkbox} from "../checkbox/index.ts";
import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";

import {CheckboxGroup} from "./index.ts";

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

const Control = () => (
  <Checkbox.Control>
    <Checkbox.Indicator />
  </Checkbox.Control>
);

const option = (value: string, label: string, description?: string) => (
  <Checkbox value={value}>
    <Checkbox.Content>
      <Control />
      {label}
    </Checkbox.Content>
    {description ? <Description>{description}</Description> : null}
  </Checkbox>
);

const meta = {
  component: CheckboxGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/CheckboxGroup",
} satisfies Meta<typeof CheckboxGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычная",
  render: () => (
    <Showcase title="Обычная">
      <CheckboxGroup name="interests">
        <Label>Выберите интересы</Label>
        <Description>Отметьте всё подходящее</Description>
        {option("coding", "Программирование", "Люблю создавать софт")}
        {option("design", "Дизайн", "Нравится делать красивые интерфейсы")}
        {option("writing", "Тексты", "Увлекаюсь созданием контента")}
      </CheckboxGroup>
    </Showcase>
  ),
};

export const WithCustomIndicator: Story = {
  name: "Свой индикатор",
  render: () => (
    <Showcase title="Свой индикатор">
      <CheckboxGroup name="features">
        <Label>Функции</Label>
        <Description>Выберите нужные функции</Description>
        <Checkbox value="notifications">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({isSelected}) =>
                  isSelected ? (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            Почтовые уведомления
          </Checkbox.Content>
          <Description>Получать обновления по почте</Description>
        </Checkbox>
        <Checkbox value="newsletter">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({isSelected}) =>
                  isSelected ? (
                    <svg
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            Рассылка
          </Checkbox.Content>
          <Description>Еженедельные письма</Description>
        </Checkbox>
      </CheckboxGroup>
    </Showcase>
  ),
};

export const Indeterminate: Story = {
  name: "Промежуточное состояние",
  render: () => {
    const [selected, setSelected] = useState(["coding"]);
    const allOptions = ["coding", "design", "writing"];

    return (
      <Showcase title="Промежуточное состояние">
        <div>
          <Checkbox
            isIndeterminate={selected.length > 0 && selected.length < allOptions.length}
            isSelected={selected.length === allOptions.length}
            name="select-all"
            onChange={(isSelected: boolean) => {
              setSelected(isSelected ? allOptions : []);
            }}
          >
            <Checkbox.Content>
              <Control />
              Выбрать всё
            </Checkbox.Content>
          </Checkbox>
          <div className="ms-6 flex flex-col gap-2">
            <CheckboxGroup value={selected} onChange={setSelected}>
              {option("coding", "Программирование")}
              {option("design", "Дизайн")}
              {option("writing", "Тексты")}
            </CheckboxGroup>
          </div>
        </div>
      </Showcase>
    );
  },
};

/*
 * История Validation эталона оборачивает группу в Form — компонент ещё не перенесён (запись 31
 * дорожной карты); вернётся вместе с Form.
 */

export const Controlled: Story = {
  name: "Управляемая",
  render: () => {
    const [selected, setSelected] = useState(["coding", "design"]);

    return (
      <Showcase title="Управляемая">
        <CheckboxGroup
          className="min-w-[320px]"
          name="skills"
          value={selected}
          onChange={setSelected}
        >
          <Label>Ваши навыки</Label>
          {option("coding", "Программирование")}
          {option("design", "Дизайн")}
          {option("writing", "Тексты")}
          <Label className="my-4 text-sm text-muted">
            Выбрано: {selected.join(", ") || "ничего"}
          </Label>
        </CheckboxGroup>
      </Showcase>
    );
  },
};

export const Disabled: Story = {
  name: "Заблокированная",
  render: () => (
    <Showcase title="Заблокированная">
      <CheckboxGroup isDisabled name="disabled-features">
        <Label>Функции</Label>
        <Description>Выбор функций временно недоступен</Description>
        {option("feature1", "Функция 1", "Эта функция скоро появится")}
        {option("feature2", "Функция 2", "Эта функция скоро появится")}
      </CheckboxGroup>
    </Showcase>
  ),
};
