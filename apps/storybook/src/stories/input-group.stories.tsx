import type {Meta, StoryObj} from "@storybook/react-vite";

import {inputGroupVariants} from "@peakui/styles";

/* Голая разметка: ни одного React-компонента PeakUI — см. input.stories.tsx. */

const slots = inputGroupVariants();

const meta = {
  title: "Components/InputGroup",
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
        <h3 className="text-sm font-semibold text-foreground">Слоты</h3>

        <div className="input-group input-group--full-width">
          <div className="input-group__prefix" data-slot="input-group-prefix">
            @
          </div>
          <input
            aria-label="Только префикс"
            className="input-group__input"
            data-slot="input-group-input"
            placeholder="только префикс"
          />
        </div>

        <div className="input-group input-group--full-width">
          <input
            aria-label="Только суффикс"
            className="input-group__input"
            data-slot="input-group-input"
            placeholder="только суффикс"
          />
          <div className="input-group__suffix" data-slot="input-group-suffix">
            .com
          </div>
        </div>

        <div className="input-group input-group--full-width">
          <div className="input-group__prefix" data-slot="input-group-prefix">
            https://
          </div>
          <input
            aria-label="Два слота"
            className={slots.input()}
            data-slot="input-group-input"
            placeholder="два слота — класс из рецепта"
          />
          <div className={slots.suffix()} data-slot="input-group-suffix">
            .com
          </div>
        </div>

        <div className="input-group input-group--secondary input-group--full-width">
          <div className="input-group__prefix" data-slot="input-group-prefix">
            @
          </div>
          <input
            aria-label="secondary"
            className="input-group__input"
            data-slot="input-group-input"
            placeholder="secondary"
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">С многострочным контролом</h3>
        {/* :has(textarea) переводит оболочку в items-start и отпускает её высоту. */}
        <div className="input-group input-group--full-width">
          <div className="input-group__prefix" data-slot="input-group-prefix">
            ✎
          </div>
          <textarea
            aria-label="Многострочный"
            className="input-group__input"
            data-slot="input-group-textarea"
            placeholder="три строки"
            rows={3}
          />
        </div>
      </section>
    </div>
  ),
};

export const StatesByHand: Story = {
  name: "Состояния руками",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Состояния оболочки</h2>

      {(
        [
          ["data-hovered", {"data-hovered": true}],
          ["data-focus-within", {"data-focus-within": true}],
          ["data-invalid", {"data-invalid": true}],
          ["data-disabled", {"data-disabled": true}],
          ["aria-invalid", {"aria-invalid": "true"}],
        ] as const
      ).map(([label, attrs]) => (
        <div key={label} className="flex flex-col gap-1">
          <code className="font-mono text-xs text-muted">{label}</code>
          <div className="input-group input-group--full-width" {...attrs}>
            <div className="input-group__prefix" data-slot="input-group-prefix">
              @
            </div>
            <input
              aria-label={label}
              className="input-group__input"
              data-slot="input-group-input"
              defaultValue={label}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};

/*
 * RTL. Разделительная линия слота и радиусы его внешних углов заданы логическими свойствами, и
 * проверить это можно только зеркально: ошибка в физическом свойстве в LTR не видна вовсе.
 */
export const Rtl: Story = {
  name: "Справа налево",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6" dir="rtl">
      <h2 className="text-xl font-semibold text-foreground">dir="rtl"</h2>

      <div className="input-group input-group--full-width">
        <div className="input-group__prefix" data-slot="input-group-prefix">
          https://
        </div>
        <input
          aria-label="rtl"
          className="input-group__input"
          data-slot="input-group-input"
          placeholder="префикс обязан оказаться справа"
        />
        <div className="input-group__suffix" data-slot="input-group-suffix">
          .com
        </div>
      </div>
    </div>
  ),
};
