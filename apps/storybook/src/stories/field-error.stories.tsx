import type {Meta, StoryObj} from "@storybook/react-vite";

/* Голая разметка: ни одного React-компонента PeakUI — см. input.stories.tsx. */

const meta = {
  title: "Components/FieldError",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/*
 * Сообщение схлопнуто по умолчанию и раскрывается по data-visible. В React этот атрибут ставит
 * компонент, и «схлопнутое» состояние там недостижимо — увидеть его можно только здесь.
 */
export const WithoutReact: Story = {
  name: "Без React — только классы",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Голая разметка</h2>

      <div data-invalid className="textfield">
        <label className="label" htmlFor="visible">
          Раскрытое сообщение
        </label>
        <input aria-invalid className="input" id="visible" />
        <span data-visible className="field-error">
          Укажите город из списка
        </span>
      </div>

      <div className="textfield">
        <label className="label" htmlFor="collapsed">
          Схлопнутое сообщение — без data-visible
        </label>
        <input className="input" id="collapsed" />
        <span className="field-error">Этот текст занимает нулевую высоту</span>
      </div>

      <div data-invalid className="textfield">
        <label className="label" htmlFor="replaces">
          Ошибка вместо описания
        </label>
        <input aria-invalid className="input" id="replaces" />
        <span className="description" data-slot="description">
          Это описание скрыто правилом .textfield[data-invalid]
        </span>
        <span data-visible className="field-error">
          Индекс состоит из шести цифр
        </span>
      </div>
    </div>
  ),
};
