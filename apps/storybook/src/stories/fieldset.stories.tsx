import type {Meta, StoryObj} from "@storybook/react-vite";

/* Голая разметка: ни одного React-компонента PeakUI — см. input.stories.tsx. */

const meta = {
  title: "Components/Fieldset",
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

      <fieldset className="fieldset max-w-sm">
        <legend className="fieldset__legend">Адрес доставки</legend>

        <div className="fieldset__group">
          <div data-required className="textfield textfield--full-width">
            <label className="label" htmlFor="city">
              Город
            </label>
            <input className="input" id="city" placeholder="Вена" />
            <span className="description" data-slot="description">
              Город, в который везём заказ
            </span>
          </div>

          <div className="textfield textfield--full-width">
            <label className="label" htmlFor="street">
              Улица
            </label>
            <div className="input-group input-group--full-width">
              <div className="input-group__prefix" data-slot="input-group-prefix">
                ул.
              </div>
              <input
                className="input-group__input"
                data-slot="input-group-input"
                id="street"
                placeholder="Карла Маркса"
              />
            </div>
          </div>
        </div>

        <div className="fieldset__actions">
          <button className="button button--primary" type="button">
            Сохранить
          </button>
          <button className="button button--ghost" type="button">
            Отмена
          </button>
        </div>
      </fieldset>

      {/*
       * Нативный disabled: браузер дизейблит вложенные контролы сам, а data-disabled на том же
       * элементе каскадирует стиль на подписи. В React его ставит компонент; здесь — руками.
       */}
      <fieldset disabled className="fieldset max-w-sm" data-disabled="true">
        <legend className="fieldset__legend">Недоступная группа</legend>

        <div className="fieldset__group">
          <div className="textfield textfield--full-width">
            <label className="label" htmlFor="city-off">
              Город
            </label>
            <input className="input" defaultValue="Вена" id="city-off" />
          </div>
        </div>

        <div className="fieldset__actions">
          <button className="button button--primary" type="button">
            Сохранить
          </button>
        </div>
      </fieldset>
    </div>
  ),
};
