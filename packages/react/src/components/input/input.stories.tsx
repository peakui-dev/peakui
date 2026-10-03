import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {FieldVariantContext} from "../../contexts/field-variant.ts";

import {Input} from "./index.ts";

/*
 * Истории React-компонента. Стилевой слой доказывается отдельно, в
 * apps/storybook/src/stories/input.stories.tsx — там голая разметка без React, и одно не заменяет
 * другое.
 *
 * aria-label на каждом поле: подписывать поле умеет Label внутри TextField, а соло-Input без
 * доступного имени — нарушение, которое компонент не исправит за потребителя. История — это ещё и
 * рецепт.
 */

const VARIANTS = ["primary", "secondary"] as const;

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Input,
  parameters: {
    layout: "padded",
  },
  title: "Components/Input",
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Input aria-label="Город" placeholder="Вена" />
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex w-60 flex-col gap-3">
        {VARIANTS.map((variant) => (
          <Input
            key={variant}
            fullWidth
            aria-label={variant}
            placeholder={variant}
            variant={variant}
          />
        ))}
      </div>
    </Showcase>
  ),
};

export const InheritedVariant: Story = {
  name: "Вариант из контекста поля",
  render: () => (
    <Showcase title="Вариант из контекста поля">
      {/*
       * Корень поля провайдит контекст сам — здесь он подставлен руками, чтобы наследование было
       * видно до того, как появится TextField.
       */}
      <FieldVariantContext value={{variant: "secondary"}}>
        <Input aria-label="Унаследовал secondary" placeholder="secondary из контекста" />
      </FieldVariantContext>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <Input fullWidth aria-label="Во всю ширину" placeholder="Во всю ширину" />
    </Showcase>
  ),
};

export const Invalid: Story = {
  name: "Невалидное",
  render: () => (
    <Showcase title="Невалидное">
      <Input aria-invalid aria-label="Невалидное" defaultValue="не почта" />
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступное",
  render: () => (
    <Showcase title="Недоступное">
      <Input disabled aria-label="Недоступное" defaultValue="Вена" />
    </Showcase>
  ),
};
