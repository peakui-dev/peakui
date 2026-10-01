import type {Meta, StoryObj} from "@storybook/react-vite";

/*
 * Нецветовая часть токенов: радиусы, типографика, тени, собственные утилиты и варианты из
 * @peakui/styles. Эти истории — проверка, что слой стилей действительно скомпилировался:
 * если утилита не доехала, блок визуально разъезжается.
 */

const meta = {
  title: "Foundations/Tokens",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const RADII = [
  {className: "rounded-xs", label: "rounded-xs"},
  {className: "rounded-sm", label: "rounded-sm"},
  {className: "rounded-md", label: "rounded-md"},
  {className: "rounded-lg", label: "rounded-lg"},
  {className: "rounded-xl", label: "rounded-xl"},
  {className: "rounded-2xl", label: "rounded-2xl"},
  {className: "rounded-3xl", label: "rounded-3xl"},
  {className: "rounded-field", label: "rounded-field"},
] as const;

/** Все радиусы выводятся из одного --radius: шкала масштабируется одной правкой пресета. */
export const Radii: Story = {
  name: "Радиусы",
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Радиусы</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {RADII.map(({className, label}) => (
          <div key={label} className="flex flex-col gap-1">
            <div className={`h-16 bg-accent-soft ${className}`} />
            <code className="font-mono text-xs text-muted">{label}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};

const SCALE = [
  {className: "text-xs", label: "text-xs"},
  {className: "text-sm", label: "text-sm"},
  {className: "text-base", label: "text-base"},
  {className: "text-lg", label: "text-lg"},
  {className: "text-xl", label: "text-xl"},
  {className: "text-2xl", label: "text-2xl"},
  {className: "text-3xl", label: "text-3xl"},
  {className: "text-4xl", label: "text-4xl"},
  {className: "text-5xl", label: "text-5xl"},
] as const;

/** Каждый шаг шкалы несёт свой line-height — он часть токена, а не отдельное решение вёрстки. */
export const Typography: Story = {
  name: "Типографика",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Типографика</h2>
      <dl className="flex flex-col gap-2">
        {SCALE.map(({className, label}) => (
          <div key={label} className="flex items-baseline gap-4">
            <dt className="w-24 shrink-0 font-mono text-xs text-muted">{label}</dt>
            <dd className={`text-foreground ${className}`}>Съешь ещё этих мягких булок</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Гарнитуры и насыщенность</h3>
        <p className="font-sans text-base text-foreground">font-sans — Inter</p>
        <p className="font-mono text-base text-foreground">font-mono — JetBrains Mono</p>
        <p className="text-base font-normal text-foreground">font-weight-normal</p>
        <p className="text-base font-medium text-foreground">font-weight-medium</p>
        <p className="text-base font-semibold text-foreground">font-weight-semibold</p>
        <p className="text-base font-bold text-foreground">font-weight-bold</p>
      </div>
    </div>
  ),
};

/** Тени привязаны к назначению поверхности, а не к размеру. */
export const Shadows: Story = {
  name: "Тени",
  render: () => (
    <div className="flex flex-col gap-4 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Тени</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <div className="h-20 rounded-xl bg-surface shadow-surface" />
          <code className="font-mono text-xs text-muted">shadow-surface</code>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-20 rounded-xl bg-overlay shadow-overlay" />
          <code className="font-mono text-xs text-muted">shadow-overlay</code>
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-20 rounded-field bg-field shadow-field" />
          <code className="font-mono text-xs text-muted">shadow-field</code>
        </div>
      </div>
    </div>
  ),
};

/*
 * Собственные утилиты и варианты. data-атрибуты выставлены вручную — так их отдаёт
 * react-aria-components, и так же их увидят компоненты ядра.
 */
export const States: Story = {
  name: "Состояния",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Состояния</h2>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Утилиты</h3>
        <div className="flex flex-wrap gap-4">
          <div className="status-focused rounded-lg bg-surface px-4 py-2 text-sm text-surface-foreground">
            status-focused
          </div>
          <div className="status-disabled rounded-lg bg-surface px-4 py-2 text-sm text-surface-foreground">
            status-disabled
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">Варианты по data-атрибутам</h3>
        <div className="flex flex-wrap gap-4">
          <div
            className="rounded-lg bg-surface px-4 py-2 text-sm text-surface-foreground hovered:bg-surface-hover"
            data-hovered
          >
            hovered:bg-surface-hover
          </div>
          <div
            className="rounded-lg bg-default px-4 py-2 text-sm text-default-foreground selected:bg-accent selected:text-accent-foreground"
            data-selected
          >
            selected:bg-accent
          </div>
          <div
            className="rounded-lg bg-surface px-4 py-2 text-sm text-surface-foreground disabled-state:status-disabled"
            data-disabled
          >
            disabled-state:status-disabled
          </div>
        </div>
      </section>
    </div>
  ),
};
