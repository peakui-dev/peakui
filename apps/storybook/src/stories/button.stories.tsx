import type {Meta, StoryObj} from "@storybook/react-vite";

import {buttonVariants} from "@peakui/styles";

/*
 * Доказательство обещания Framework-Agnostic Styles: ни одна история здесь не рендерит
 * React-компонент PeakUI, хотя он уже существует — @peakui/react и его истории живут рядом, в
 * packages/react/src/components/button/. Здесь стилизуется голая разметка, ровно как это сделал
 * бы потребитель на Vue, Svelte или чистом HTML, и этот ярус вторым не вытесняется.
 *
 * Имена BEM собираются строкой сознательно и это безопасно, в отличие от утилит Tailwind:
 * .button--primary — настоящее правило в components/button.css, а не класс, который Tailwind
 * должен найти сканированием исходника. На этом и держится обещание — утилита, пришедшая к
 * потребителю вне @source, не скомпилировалась бы вовсе.
 */

const VARIANTS = [
  "primary",
  "secondary",
  "tertiary",
  "danger",
  "danger-soft",
  "ghost",
  "outline",
] as const;

const SIZES = ["sm", "md", "lg"] as const;

const meta = {
  title: "Components/Button",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Прямое применение классов: единственный рецепт, которому не нужен ни React, ни импорт. */
export const WithoutReact: Story = {
  name: "Без React — только классы",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Голая разметка</h2>

      <section className="flex flex-wrap items-center gap-3">
        <button className="button button--primary" type="button">
          Кнопка
        </button>
        <a className="button button--secondary" href="#anchor">
          Ссылка как кнопка
        </a>
        <button className="button button--outline" type="button">
          Контурная
        </button>
        <button disabled className="button button--primary" type="button">
          Недоступная
        </button>
        <button
          aria-label="Избранное"
          className="button button--ghost button--icon-only"
          type="button"
        >
          ★
        </button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Размеры</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button className="button button--primary button--sm" type="button">
            sm
          </button>
          <button className="button button--primary" type="button">
            md — без модификатора
          </button>
          <button className="button button--primary button--lg" type="button">
            lg
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Во всю ширину</h3>
        <button className="button button--secondary button--full-width" type="button">
          full-width
        </button>
      </section>
    </div>
  ),
};

/*
 * Шов, где две публичные поверхности могут разъехаться: модификатор, объявленный в tv(), но без
 * правила за ним в CSS, виден только глазом. Юнит-тест сравнивает строки и такого не заметит.
 */
export const VariantFunctionParity: Story = {
  name: "Вариант-функция против строки",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">buttonVariants() и класс руками</h2>

      {VARIANTS.map((variant) => (
        <section key={variant} className="flex flex-col gap-2">
          <code className="font-mono text-xs text-muted">{variant}</code>
          <div className="flex flex-wrap items-center gap-3">
            <button className={buttonVariants({variant})} type="button">
              buttonVariants
            </button>
            <button className={`button button--md button--${variant}`} type="button">
              строка
            </button>
          </div>
        </section>
      ))}

      {SIZES.map((size) => (
        <section key={size} className="flex flex-col gap-2">
          <code className="font-mono text-xs text-muted">{size}</code>
          <div className="flex flex-wrap items-center gap-3">
            <button className={buttonVariants({size})} type="button">
              buttonVariants
            </button>
            <button className={`button button--${size} button--primary`} type="button">
              строка
            </button>
          </div>
        </section>
      ))}
    </div>
  ),
};
