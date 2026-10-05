import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Label} from "../label/index.ts";

import {NumberField} from "./index.ts";

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

const Stepper = () => (
  <NumberField.Group>
    <NumberField.DecrementButton />
    <NumberField.Input className="w-[120px]" />
    <NumberField.IncrementButton />
  </NumberField.Group>
);

const meta = {
  component: NumberField,
  parameters: {
    layout: "padded",
  },
  title: "Components/NumberField",
} satisfies Meta<typeof NumberField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычное",
  render: () => (
    <Showcase title="Обычное">
      <NumberField defaultValue={1024} minValue={0} name="width">
        <Label>Ширина</Label>
        <Stepper />
      </NumberField>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex flex-col gap-4">
        <NumberField defaultValue={100} minValue={0} name="primary-width" variant="primary">
          <Label>Основной вариант</Label>
          <Stepper />
        </NumberField>
        <NumberField defaultValue={100} minValue={0} name="secondary-width" variant="secondary">
          <Label>Второстепенный вариант</Label>
          <Stepper />
        </NumberField>
      </div>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <div className="w-[400px] space-y-4">
        <NumberField fullWidth defaultValue={1024} minValue={0} name="width">
          <Label>Ширина</Label>
          <NumberField.Group>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
      </div>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  name: "С описанием",
  render: () => (
    <Showcase title="С описанием">
      <NumberField defaultValue={1024} minValue={0} name="width">
        <Label>Ширина</Label>
        <Stepper />
        <Description>Ширина картинки в пикселях</Description>
      </NumberField>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Заблокированное",
  render: () => (
    <Showcase title="Заблокированное">
      <NumberField isDisabled defaultValue={1024} minValue={0} name="width">
        <Label>Ширина</Label>
        <Stepper />
      </NumberField>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемое",
  render: () => {
    const [value, setValue] = useState(10);

    return (
      <Showcase title="Управляемое">
        <div className="flex flex-col gap-3">
          <NumberField minValue={0} name="width" value={value} onChange={setValue}>
            <Label>Ширина</Label>
            <Stepper />
          </NumberField>
          <p className="text-sm text-muted">Значение: {value}</p>
        </div>
      </Showcase>
    );
  },
};

export const WithValidation: Story = {
  name: "Валидация",
  render: () => (
    <Showcase title="Валидация">
      <NumberField
        isRequired
        defaultValue={0}
        maxValue={100}
        minValue={0}
        name="width"
        validate={(value) =>
          value !== undefined && value > 0 ? true : "Введите число больше нуля"
        }
      >
        <Label>Ширина</Label>
        <Stepper />
        <FieldError />
      </NumberField>
    </Showcase>
  ),
};

export const WithStep: Story = {
  name: "Шаг",
  render: () => (
    <Showcase title="Шаг">
      <div className="flex flex-col gap-4">
        <NumberField defaultValue={0} maxValue={100} minValue={0} name="step1" step={1}>
          <Label>Шаг: 1</Label>
          <Stepper />
          <Description>Приращение на 1</Description>
        </NumberField>
        <NumberField defaultValue={0} maxValue={100} minValue={0} name="step5" step={5}>
          <Label>Шаг: 5</Label>
          <Stepper />
          <Description>Приращение на 5</Description>
        </NumberField>
      </div>
    </Showcase>
  ),
};

export const WithFormatOptions: Story = {
  name: "Форматирование",
  render: () => (
    <Showcase title="Форматирование">
      <NumberField
        defaultValue={99}
        formatOptions={{style: "currency", currency: "USD"}}
        minValue={0}
        name="price"
      >
        <Label>Цена</Label>
        <Stepper />
        <Description>Валюта через formatOptions</Description>
      </NumberField>
    </Showcase>
  ),
};
