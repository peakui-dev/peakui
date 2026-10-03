import type {Meta, StoryObj} from "@storybook/react-vite";

import {labelVariants} from "@peakui/styles";

/* Голая разметка: ни одного React-компонента PeakUI — см. input.stories.tsx. */

const meta = {
  title: "Components/Label",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithoutReact: Story = {
  name: "Без React — только классы",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Голая разметка</h2>

      <section className="flex flex-col gap-3">
        <label className="label" htmlFor="plain">
          Обычная подпись
        </label>
        <input className="input" id="plain" />

        <label className={labelVariants({isRequired: true})} htmlFor="req">
          Обязательная — через labelVariants
        </label>
        <input className="input" id="req" />

        <label className="label label--invalid" htmlFor="inv">
          Невалидная — строкой
        </label>
        <input aria-invalid className="input" id="inv" />

        <label className="label label--disabled" htmlFor="dis">
          Недоступная
        </label>
        <input disabled className="input" id="dis" />
      </section>
    </div>
  ),
};

/*
 * Вторая форма каждого состояния: подпись красит состояние ПРЕДКА, и потребителю вне React не
 * приходится дублировать его на самой подписи. Без React это проверяется только так — руками
 * поставленным атрибутом на обёртке поля.
 */
export const StatesByHand: Story = {
  name: "Состояние от предка",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Каскад от обёртки поля</h2>

      <div data-required className="textfield">
        <label className="label" htmlFor="a">
          data-required на обёртке
        </label>
        <input className="input" id="a" />
      </div>

      <div aria-required="true" className="textfield">
        <label className="label" htmlFor="b">
          aria-required на обёртке
        </label>
        <input className="input" id="b" />
      </div>

      <div data-invalid className="textfield">
        <label className="label" htmlFor="c">
          data-invalid на обёртке
        </label>
        <input data-invalid className="input" id="c" />
      </div>

      <div data-disabled className="textfield">
        <label className="label" htmlFor="d">
          data-disabled на обёртке
        </label>
        <input disabled className="input" id="d" />
      </div>
    </div>
  ),
};
