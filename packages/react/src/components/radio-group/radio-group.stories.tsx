import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Description} from "../description/index.ts";
import {Label} from "../label/index.ts";
import {Radio} from "../radio/index.ts";

import {RadioGroup} from "./index.ts";

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
  <Radio.Control>
    <Radio.Indicator />
  </Radio.Control>
);

const option = (value: string, label: string, description?: string) => (
  <Radio value={value}>
    <Radio.Content>
      <Control />
      {label}
    </Radio.Content>
    {description ? <Description>{description}</Description> : null}
  </Radio>
);

const meta = {
  component: RadioGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/RadioGroup",
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычная",
  render: () => (
    <Showcase title="Обычная">
      <RadioGroup defaultValue="sm">
        <Label>Размер</Label>
        {option("sm", "Маленький", "38 см")}
        {option("md", "Обычный", "45 см")}
        {option("lg", "Большой", "60 см")}
      </RadioGroup>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Основной вариант</p>
          <RadioGroup defaultValue="a" variant="primary">
            {option("a", "Первый")}
            {option("b", "Второй")}
          </RadioGroup>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Второстепенный вариант</p>
          <RadioGroup defaultValue="a" variant="secondary">
            {option("a", "Первый")}
            {option("b", "Второй")}
          </RadioGroup>
        </div>
      </div>
    </Showcase>
  ),
};

/*
 * История PerRadioInvalid эталона передаёт isInvalid отдельной радиокнопке, но этого пропа нет
 * в типах RadioField — валидация у радио живёт на уровне группы. История не типизируется и
 * опущена; невалидная группа покрывается css-правилами [data-invalid] через isInvalid группы.
 */

export const WithCustomIndicator: Story = {
  name: "Свой индикатор",
  render: () => (
    <Showcase title="Свой индикатор">
      <RadioGroup defaultValue="a">
        {(["a", "b"] as const).map((value) => (
          <Radio key={value} value={value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator>
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
                </Radio.Indicator>
              </Radio.Control>
              Вариант {value}
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
    </Showcase>
  ),
};

export const Orientation: Story = {
  name: "Ориентация",
  render: () => (
    <Showcase title="Ориентация">
      <div className="flex gap-10 px-4">
        <RadioGroup defaultValue="a" orientation="vertical">
          <Label>Вертикально</Label>
          {option("a", "Первый")}
          {option("b", "Второй")}
        </RadioGroup>
        <RadioGroup defaultValue="a" orientation="horizontal">
          <Label>Горизонтально</Label>
          {option("a", "Первый")}
          {option("b", "Второй")}
        </RadioGroup>
      </div>
    </Showcase>
  ),
};

/*
 * История Validation эталона оборачивает группу в Form — компонент ещё не перенесён (запись 31
 * дорожной карты); вернётся вместе с Form.
 */

export const Controlled: Story = {
  name: "Управляемая",
  render: () => {
    const [value, setValue] = useState("md");

    return (
      <Showcase title="Управляемая">
        <RadioGroup className="min-w-[320px]" value={value} onChange={setValue}>
          <Label>Размер</Label>
          {option("sm", "Маленький")}
          {option("md", "Обычный")}
          {option("lg", "Большой")}
          <Label className="my-4 text-sm text-muted">Выбрано: {value}</Label>
        </RadioGroup>
      </Showcase>
    );
  },
};

export const Uncontrolled: Story = {
  name: "Неконтролируемая",
  render: () => (
    <Showcase title="Неконтролируемая">
      <RadioGroup defaultValue="md">
        <Label>Размер</Label>
        {option("sm", "Маленький")}
        {option("md", "Обычный")}
        {option("lg", "Большой")}
      </RadioGroup>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Заблокированная",
  render: () => (
    <Showcase title="Заблокированная">
      <RadioGroup isDisabled defaultValue="md">
        <Label>Размер</Label>
        {option("sm", "Маленький", "Недоступно")}
        {option("md", "Обычный", "Недоступно")}
      </RadioGroup>
    </Showcase>
  ),
};

export const DeliveryAndPaymentExample: Story = {
  name: "Пример доставки",
  render: () => {
    const deliveryOptions = [
      {description: "4–10 рабочих дней", price: "$5.00", title: "Обычная", value: "standard"},
      {description: "2–5 рабочих дней", price: "$16.00", title: "Быстрая", value: "express"},
      {
        description: "1 рабочий день",
        price: "$25.00",
        title: "На следующий день",
        value: "super-fast",
      },
    ];

    return (
      <Showcase title="Пример доставки">
        <div className="flex w-full flex-col items-center gap-10 px-4 py-8">
          <section className="flex w-full max-w-lg flex-col gap-4">
            <RadioGroup defaultValue="express" name="delivery">
              <Label>Способ доставки</Label>
              <div className="grid gap-x-4 md:grid-cols-3">
                {deliveryOptions.map((item) => (
                  <Radio key={item.value} value={item.value}>
                    <Radio.Content className="flex flex-col items-start gap-1">
                      <Control />
                      <span>{item.title}</span>
                      <Description>{item.description}</Description>
                      <span className="text-sm font-medium">{item.price}</span>
                    </Radio.Content>
                  </Radio>
                ))}
              </div>
            </RadioGroup>
          </section>
        </div>
      </Showcase>
    );
  },
};
