import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {InputGroup} from "./index.ts";

/*
 * Невалидное и недоступное состояния показаны через TextField, а не пропом на группе: именно так они
 * и приходят в жизни — GroupContext провайдит сам RAC TextField. История, ставящая data-invalid
 * руками, доказывала бы CSS, а не контракт; за CSS отвечает стилевой ярус в apps/storybook.
 */

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: InputGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/InputGroup",
} satisfies Meta<typeof InputGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <InputGroup className="w-72">
        <InputGroup.Input aria-label="Запрос" placeholder="Без слотов" />
      </InputGroup>
    </Showcase>
  ),
};

export const WithPrefix: Story = {
  name: "С префиксом",
  render: () => (
    <Showcase title="С префиксом">
      <InputGroup className="w-72">
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Логин" placeholder="peakui" />
      </InputGroup>
    </Showcase>
  ),
};

export const WithSuffix: Story = {
  name: "С суффиксом",
  render: () => (
    <Showcase title="С суффиксом">
      <InputGroup className="w-72">
        <InputGroup.Input aria-label="Домен" placeholder="peakui" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>
    </Showcase>
  ),
};

export const WithBoth: Story = {
  name: "С двумя слотами",
  render: () => (
    <Showcase title="С двумя слотами">
      <InputGroup className="w-72">
        <InputGroup.Prefix>https://</InputGroup.Prefix>
        <InputGroup.Input aria-label="Сайт" placeholder="peakui" />
        <InputGroup.Suffix>.com</InputGroup.Suffix>
      </InputGroup>
    </Showcase>
  ),
};

export const WithTextArea: Story = {
  name: "С многострочным контролом",
  render: () => (
    <Showcase title="С многострочным контролом">
      {/*
       * Клик по префиксу ставит фокус и здесь: эталон ищет только "input" и на textarea не
       * срабатывает — см. тест «focuses the textarea when the prefix is clicked».
       */}
      <InputGroup className="w-72">
        <InputGroup.Prefix>✎</InputGroup.Prefix>
        <InputGroup.TextArea aria-label="О себе" placeholder="Несколько строк" rows={3} />
      </InputGroup>
    </Showcase>
  ),
};

export const WithButtonInSuffix: Story = {
  name: "С кнопкой в суффиксе",
  render: () => (
    <Showcase title="С кнопкой в суффиксе">
      <InputGroup className="w-72">
        <InputGroup.Input aria-label="Запрос" defaultValue="Вена" />
        <InputGroup.Suffix>
          <Button isIconOnly aria-label="Очистить" size="sm" variant="ghost">
            ✕
          </Button>
        </InputGroup.Suffix>
      </InputGroup>
    </Showcase>
  ),
};

export const Variants: Story = {
  name: "Варианты",
  render: () => (
    <Showcase title="Варианты">
      <div className="flex w-72 flex-col gap-3">
        <InputGroup fullWidth variant="primary">
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.Input aria-label="primary" placeholder="primary" />
        </InputGroup>
        <InputGroup fullWidth variant="secondary">
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.Input aria-label="secondary" placeholder="secondary" />
        </InputGroup>
      </div>
    </Showcase>
  ),
};

export const InField: Story = {
  name: "Внутри поля: невалидное и недоступное",
  render: () => (
    <Showcase title="Внутри поля: невалидное и недоступное">
      <div className="flex w-72 flex-col gap-4">
        <TextField fullWidth isInvalid>
          <Label>Невалидное</Label>
          <InputGroup>
            <InputGroup.Prefix>@</InputGroup.Prefix>
            <InputGroup.Input defaultValue="не логин" />
          </InputGroup>
        </TextField>
        <TextField fullWidth isDisabled>
          <Label>Недоступное</Label>
          <InputGroup>
            <InputGroup.Prefix>@</InputGroup.Prefix>
            <InputGroup.Input defaultValue="peakui" />
          </InputGroup>
        </TextField>
      </div>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <InputGroup fullWidth>
        <InputGroup.Prefix>https://</InputGroup.Prefix>
        <InputGroup.Input aria-label="Сайт" placeholder="Растягивается" />
      </InputGroup>
    </Showcase>
  ),
};
