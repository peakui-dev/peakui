import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {CheckboxGroup} from "../checkbox-group/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Label} from "../label/index.ts";

import {Checkbox} from "./index.ts";

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

const meta = {
  component: Checkbox,
  parameters: {
    layout: "padded",
  },
  title: "Components/Checkbox",
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Обычный",
  render: () => (
    <Showcase title="Обычный">
      <Checkbox name="terms">
        <Checkbox.Content>
          <Control />
          Принять условия использования
        </Checkbox.Content>
      </Checkbox>
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
          <Checkbox name="primary" variant="primary">
            <Checkbox.Content>
              <Control />
              Основной чекбокс
            </Checkbox.Content>
            <Description>Стандартное оформление с обычным фоном</Description>
          </Checkbox>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted">Второстепенный вариант</p>
          <Checkbox name="secondary" variant="secondary">
            <Checkbox.Content>
              <Control />
              Второстепенный чекбокс
            </Checkbox.Content>
            <Description>Спокойный вариант для использования на поверхностях</Description>
          </Checkbox>
        </div>
      </div>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  name: "С описанием",
  render: () => (
    <Showcase title="С описанием">
      <Checkbox name="terms">
        <Checkbox.Content>
          <Control />
          Принять условия использования
        </Checkbox.Content>
        <Description>Соглашаюсь с условиями и политикой конфиденциальности</Description>
      </Checkbox>
    </Showcase>
  ),
};

export const WithCustomIndicator: Story = {
  name: "Свой индикатор",
  render: () => (
    <Showcase title="Свой индикатор">
      <div className="flex gap-4 px-4">
        <Checkbox defaultSelected aria-label="Сердце">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({isSelected}) =>
                  isSelected ? (
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.49 3.1 7.56 3.1c1.82 0 3.43.88 4.44 2.24a5.53 5.53 0 0 1 4.44-2.24C19.51 3.1 22 5.6 22 8.69c0 7-6.48 11.13-9.38 12.12Z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            Сердце
          </Checkbox.Content>
        </Checkbox>
        <Checkbox defaultSelected aria-label="Плюс">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({isSelected}) =>
                  isSelected ? (
                    <svg fill="none" viewBox="0 0 24 24">
                      <path
                        d="M6 12H18"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                      />
                      <path
                        d="M12 18V6"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                      />
                    </svg>
                  ) : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            Плюс
          </Checkbox.Content>
        </Checkbox>
        <Checkbox isIndeterminate aria-label="Промежуточный">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>
                {({isIndeterminate}) =>
                  isIndeterminate ? (
                    <svg stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <line x1="21" x2="3" y1="12" y2="12" />
                    </svg>
                  ) : null
                }
              </Checkbox.Indicator>
            </Checkbox.Control>
            Промежуточный
          </Checkbox.Content>
        </Checkbox>
      </div>
    </Showcase>
  ),
};

export const Indeterminate: Story = {
  name: "Промежуточное состояние",
  render: () => (
    <Showcase title="Промежуточное состояние">
      <Checkbox isIndeterminate aria-label="Выбрать всё">
        <Checkbox.Content>
          <Control />
          Выбрать всё
        </Checkbox.Content>
        <Description>Показывает промежуточное состояние</Description>
      </Checkbox>
    </Showcase>
  ),
};

export const ControlOnly: Story = {
  name: "Только индикатор",
  render: () => (
    <Showcase title="Только индикатор">
      <Checkbox aria-label="Принять" name="control-only">
        <Checkbox.Content>
          <Control />
        </Checkbox.Content>
      </Checkbox>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Заблокированный",
  render: () => (
    <Showcase title="Заблокированный">
      <Checkbox isDisabled aria-label="Функция">
        <Checkbox.Content>
          <Control />
          Функция
        </Checkbox.Content>
        <Description>Эта функция скоро появится</Description>
      </Checkbox>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемый",
  render: () => {
    const [isSelected, setIsSelected] = useState(true);

    return (
      <Showcase title="Управляемый">
        <div className="flex flex-col gap-3 px-4">
          <Checkbox
            aria-label="Почтовые уведомления"
            isSelected={isSelected}
            onChange={setIsSelected}
          >
            <Checkbox.Content>
              <Control />
              Почтовые уведомления
            </Checkbox.Content>
          </Checkbox>
          <p className="mt-2 text-sm text-muted">
            Состояние: <span className="font-medium">{isSelected ? "включено" : "выключено"}</span>
          </p>
        </div>
      </Showcase>
    );
  },
};

export const RenderProps: Story = {
  name: "Render-пропы",
  render: () => (
    <Showcase title="Render-пропы">
      <Checkbox aria-label="Условия">
        {({isSelected}) => (
          <>
            <Checkbox.Content>
              <Control />
              {isSelected ? "Условия приняты" : "Принять условия"}
            </Checkbox.Content>
            <Description>
              {isSelected ? "Спасибо, что приняли условия" : "Прочитайте и примите условия"}
            </Description>
          </>
        )}
      </Checkbox>
    </Showcase>
  ),
};

export const Invalid: Story = {
  name: "Невалидный",
  render: () => (
    <Showcase title="Невалидный">
      <Checkbox isInvalid isRequired aria-label="Согласие" name="agreement">
        <Checkbox.Content>
          <Control />
          Согласен с условиями
        </Checkbox.Content>
        <FieldError>Чтобы продолжить, примите условия</FieldError>
      </Checkbox>
    </Showcase>
  ),
};

export const Validation: Story = {
  name: "Валидация",
  render: () => (
    <Showcase title="Валидация">
      <Checkbox
        isRequired
        aria-label="Рассылка"
        name="newsletter"
        validate={(isSelected) => (isSelected ? true : "Подпишитесь, чтобы продолжить")}
      >
        <Checkbox.Content>
          <Control />
          Подписаться на рассылку
        </Checkbox.Content>
        <FieldError />
      </Checkbox>
    </Showcase>
  ),
};

export const FullRounded: Story = {
  name: "Круглые индикаторы",
  render: () => (
    <Showcase title="Круглые индикаторы">
      <div className="flex flex-col gap-6 px-4">
        <div className="flex flex-col gap-3">
          <Label className="text-muted">Круглые чекбоксы</Label>
          <Checkbox
            aria-label="Маленький"
            className="[&_[data-slot='checkbox-default-indicator--checkmark']]:size-2"
          >
            <Checkbox.Content>
              <Checkbox.Control className="size-3 rounded-full before:rounded-full">
                <Checkbox.Indicator />
              </Checkbox.Control>
              Маленький
            </Checkbox.Content>
          </Checkbox>
        </div>
        <div className="flex flex-col gap-3">
          <Checkbox aria-label="Обычный размер">
            <Checkbox.Content>
              <Checkbox.Control className="size-4 rounded-full before:rounded-full">
                <Checkbox.Indicator />
              </Checkbox.Control>
              Обычный размер
            </Checkbox.Content>
          </Checkbox>
        </div>
        <div className="flex flex-col gap-3">
          <Checkbox aria-label="Большой">
            <Checkbox.Content>
              <Checkbox.Control className="size-5 rounded-full before:rounded-full">
                <Checkbox.Indicator />
              </Checkbox.Control>
              Большой
            </Checkbox.Content>
          </Checkbox>
        </div>
        <div className="flex flex-col gap-3">
          <Checkbox
            aria-label="Очень большой"
            className="[&_[data-slot='checkbox-default-indicator--checkmark']]:size-4"
          >
            <Checkbox.Content>
              <Checkbox.Control className="size-6 rounded-full before:rounded-full">
                <Checkbox.Indicator />
              </Checkbox.Control>
              Очень большой
            </Checkbox.Content>
          </Checkbox>
        </div>
      </div>
    </Showcase>
  ),
};

export const FeaturesAndAddOnsExample: Story = {
  name: "Пример настроек",
  render: () => {
    const addOns = [
      {title: "Почтовые уведомления", value: "email", description: "Получать обновления по почте"},
      {title: "SMS-уведомления", value: "sms", description: "Мгновенные SMS-оповещения"},
      {
        title: "Push-уведомления",
        value: "push",
        description: "Оповещения в браузере и на телефоне",
      },
    ];

    return (
      <Showcase title="Пример настроек">
        <div className="flex w-full flex-col items-center gap-10 px-4 py-8">
          <section className="flex w-full min-w-[320px] flex-col gap-4">
            <CheckboxGroup name="notification-preferences">
              <Label>Предпочтения по уведомлениям</Label>
              <Description>Выберите, как получать обновления</Description>
              <div className="flex flex-col gap-2">
                {addOns.map((addon) => (
                  <Checkbox key={addon.value} aria-label={addon.title} value={addon.value}>
                    <Checkbox.Content className="group relative flex w-full flex-row items-start justify-start gap-4 rounded-3xl bg-surface-tertiary px-5 py-4 transition-all data-[selected=true]:bg-accent/10">
                      <Checkbox.Control className="absolute end-4 top-3 size-5 rounded-full before:rounded-full">
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <div className="flex flex-col gap-1">
                        <span>{addon.title}</span>
                        <Description>{addon.description}</Description>
                      </div>
                    </Checkbox.Content>
                  </Checkbox>
                ))}
              </div>
            </CheckboxGroup>
          </section>
        </div>
      </Showcase>
    );
  },
};
