import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Input} from "../input/index.ts";
import {InputGroup} from "../input-group/index.ts";
import {Label} from "../label/index.ts";
import {TextField} from "../textfield/index.ts";

import {Fieldset} from "./index.ts";

const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const meta = {
  component: Fieldset,
  parameters: {
    layout: "padded",
  },
  title: "Components/Fieldset",
} satisfies Meta<typeof Fieldset>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <Fieldset className="max-w-sm">
        <Fieldset.Legend>Адрес доставки</Fieldset.Legend>
        <Fieldset.Group>
          <TextField fullWidth isRequired>
            <Label>Город</Label>
            <Input placeholder="Вена" />
            <Description>Город, в который везём заказ</Description>
          </TextField>
          <TextField fullWidth>
            <Label>Улица</Label>
            <InputGroup fullWidth>
              <InputGroup.Prefix>ул.</InputGroup.Prefix>
              <InputGroup.Input placeholder="Карла Маркса" />
            </InputGroup>
          </TextField>
          <TextField fullWidth isInvalid>
            <Label>Индекс</Label>
            <Input defaultValue="12" />
            <FieldError>Индекс состоит из шести цифр</FieldError>
          </TextField>
        </Fieldset.Group>
        <Fieldset.Actions>
          <Button>Сохранить</Button>
          <Button variant="ghost">Отмена</Button>
        </Fieldset.Actions>
      </Fieldset>
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступная группа",
  render: () => (
    <Showcase title="Недоступная группа">
      {/*
       * disabled нативный: браузер дизейблит контролы формы сам, а семь контекстов RAC внутри
       * компонента доводят состояние до кнопок — иначе их render-проп продолжал бы отдавать
       * isDisabled: false.
       */}
      <Fieldset disabled className="max-w-sm">
        <Fieldset.Legend>Адрес доставки</Fieldset.Legend>
        <Fieldset.Group>
          <TextField fullWidth>
            <Label>Город</Label>
            <Input defaultValue="Вена" />
          </TextField>
        </Fieldset.Group>
        <Fieldset.Actions>
          <Button>Сохранить</Button>
        </Fieldset.Actions>
      </Fieldset>
    </Showcase>
  ),
};

export const WithRenderProp: Story = {
  name: "Своим элементом",
  render: () => (
    <Showcase title="Своим элементом">
      {/*
       * render заменяет элемент целиком — это единственная форма полиморфизма в библиотеке, пропа as
       * не существует. Возвращённый элемент обязан принять props и ref.
       *
       * Заменяется именно строка действий: корень заменить на <section> нельзя без потерь —
       * <legend> вне <fieldset> невалиден, и группа осталась бы без доступного имени. То, что
       * компонент такую замену разрешает, проверяет тест, а история — это рецепт, и рецепт должен
       * быть верным.
       */}
      <Fieldset className="max-w-sm">
        <Fieldset.Legend>Адрес доставки</Fieldset.Legend>
        <Fieldset.Group>
          <TextField fullWidth>
            <Label>Город</Label>
            <Input placeholder="Вена" />
          </TextField>
        </Fieldset.Group>
        <Fieldset.Actions render={(props) => <footer {...props} />}>
          <Button>Сохранить</Button>
        </Fieldset.Actions>
      </Fieldset>
    </Showcase>
  ),
};
