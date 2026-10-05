import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";

import {Switch} from "./index.ts";

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

const Thumb = () => (
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
);

const meta = {
  component: Switch,
  parameters: {
    layout: "padded",
  },
  title: "Components/Switch",
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычный",
  render: () => (
    <Showcase title="Обычный">
      <Switch>
        <Switch.Content>
          <Thumb />
          Включить уведомления
        </Switch.Content>
      </Switch>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Заблокированный",
  render: () => (
    <Showcase title="Заблокированный">
      <Switch isDisabled>
        <Switch.Content>
          <Thumb />
          Включить уведомления
        </Switch.Content>
      </Switch>
    </Showcase>
  ),
};

export const DefaultSelected: Story = {
  name: "Выбранный по умолчанию",
  render: () => (
    <Showcase title="Выбранный по умолчанию">
      <Switch defaultSelected>
        <Switch.Content>
          <Thumb />
          Включить уведомления
        </Switch.Content>
      </Switch>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемый",
  render: () => {
    const [isSelected, setIsSelected] = useState(false);

    return (
      <Showcase title="Управляемый">
        <div className="flex flex-col gap-4">
          <Switch isSelected={isSelected} onChange={setIsSelected}>
            <Switch.Content>
              <Thumb />
              Включить уведомления
            </Switch.Content>
          </Switch>
          <p className="text-sm text-muted">Переключатель {isSelected ? "включен" : "выключен"}</p>
        </div>
      </Showcase>
    );
  },
};

export const WithoutLabel: Story = {
  name: "Без подписи",
  render: () => (
    <Showcase title="Без подписи">
      <Switch aria-label="Включить уведомления">
        <Switch.Content>
          <Thumb />
        </Switch.Content>
      </Switch>
    </Showcase>
  ),
};

export const Invalid: Story = {
  name: "Невалидный",
  render: () => (
    <Showcase title="Невалидный">
      <Switch isInvalid isRequired name="notifications">
        <Switch.Content>
          <Thumb />
          Включить уведомления
        </Switch.Content>
        <FieldError>Включите уведомления, чтобы продолжить</FieldError>
      </Switch>
    </Showcase>
  ),
};

export const Validation: Story = {
  name: "Валидация",
  render: () => (
    <Showcase title="Валидация">
      <Switch
        isRequired
        name="terms-switch"
        validate={(isSelected) => (isSelected ? true : "Примите условия, чтобы продолжить")}
      >
        <Switch.Content>
          <Thumb />
          Принять условия
        </Switch.Content>
        <FieldError />
      </Switch>
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      <div className="flex gap-6">
        <Switch size="sm">
          <Switch.Content>
            <Thumb />
            Маленький
          </Switch.Content>
        </Switch>
        <Switch size="md">
          <Switch.Content>
            <Thumb />
            Обычный
          </Switch.Content>
        </Switch>
        <Switch size="lg">
          <Switch.Content>
            <Thumb />
            Большой
          </Switch.Content>
        </Switch>
      </div>
    </Showcase>
  ),
};

export const LabelBefore: Story = {
  name: "Подпись перед переключателем",
  render: () => (
    <Showcase title="Подпись перед переключателем">
      <Switch>
        <Switch.Content>
          Включить уведомления
          <Thumb />
        </Switch.Content>
      </Switch>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  name: "С описанием",
  render: () => (
    <Showcase title="С описанием">
      <div className="max-w-sm">
        <Switch>
          <Switch.Content>
            <Thumb />
            Публичный профиль
          </Switch.Content>
          <Description>Другие видят информацию вашего профиля</Description>
        </Switch>
      </div>
    </Showcase>
  ),
};
