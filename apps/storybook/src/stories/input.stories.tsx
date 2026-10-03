import type {Meta, StoryObj} from "@storybook/react-vite";

import {inputVariants} from "@peakui/styles";

/*
 * Доказательство обещания Framework-Agnostic Styles: ни одна история здесь не рендерит
 * React-компонент PeakUI, хотя он уже существует — @peakui/react и его истории живут в
 * packages/react/src/components/input/. Здесь стилизуется голая разметка, ровно как это сделал бы
 * потребитель на Vue, Svelte или чистом HTML.
 *
 * Имена BEM собираются строкой сознательно и это безопасно, в отличие от утилит Tailwind:
 * .input--secondary — настоящее правило в components/input.css, а не класс, который Tailwind должен
 * найти сканированием исходника.
 */

const VARIANTS = ["primary", "secondary"] as const;

const meta = {
  title: "Components/Input",
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
        <h3 className="text-sm font-semibold text-foreground">Варианты</h3>
        <div className="flex flex-col gap-3">
          {VARIANTS.map((variant) => (
            <input
              key={variant}
              aria-label={variant}
              className={`input input--${variant} input--full-width`}
              placeholder={variant}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Во всю ширину</h3>
        <input
          aria-label="full-width"
          className="input input--full-width"
          placeholder="full-width"
        />
      </section>
    </div>
  ),
};

/*
 * Состояния выставлены руками, потому что без React их не выставит никто: data-* ставит React Aria в
 * рантайме, а псевдоклассы в статической истории не воспроизвести. Обе формы каждого состояния — это
 * и есть то, что здесь проверяется глазом и VRT.
 */
export const StatesByHand: Story = {
  name: "Состояния руками",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Состояния</h2>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Атрибутами React Aria</h3>
        <input data-hovered aria-label="hovered" className="input" defaultValue="data-hovered" />
        <input data-focused aria-label="focused" className="input" defaultValue="data-focused" />
        <input data-invalid aria-label="invalid" className="input" defaultValue="data-invalid" />
        {/*
         * disabled рядом с data-disabled не для красоты: React Aria ставит оба, и без нативного
         * атрибута контрол выглядит недоступным, оставаясь доступным — текст при opacity 0.5 тогда
         * обязан держать 4.5:1, и axe справедливо зовёт это нарушением.
         */}
        <input
          data-disabled
          disabled
          aria-label="disabled"
          className="input"
          defaultValue="data-disabled"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Нативными атрибутами</h3>
        <input
          aria-invalid
          aria-label="aria-invalid"
          className="input"
          defaultValue="aria-invalid"
        />
        <input disabled aria-label="native disabled" className="input" defaultValue="disabled" />
        <input aria-label="placeholder" className="input" placeholder="placeholder" />
      </section>
    </div>
  ),
};

/* Шов, где две публичные поверхности могут разъехаться: модификатор в tv() без правила за ним. */
export const VariantFunctionParity: Story = {
  name: "Вариант-функция против строки",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">inputVariants() и класс руками</h2>

      {VARIANTS.map((variant) => (
        <section key={variant} className="flex flex-col gap-2">
          <code className="font-mono text-xs text-muted">{variant}</code>
          <div className="flex flex-col gap-2">
            <input
              aria-label={`${variant} fn`}
              className={inputVariants({variant})}
              placeholder="inputVariants"
            />
            <input
              aria-label={`${variant} str`}
              className={`input input--${variant}`}
              placeholder="строка"
            />
          </div>
        </section>
      ))}
    </div>
  ),
};
