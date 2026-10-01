import type {Meta, StoryObj} from "@storybook/react-vite";

/*
 * Витрина цветового слоя @peakui/styles. Истории читают токены только через утилиты Tailwind,
 * объявленные в themes/shared/theme.css — ни одного литерального цвета.
 *
 * Классы выписаны целиком и намеренно: Tailwind находит их сканированием исходника, поэтому
 * собранное из интерполяции имя (`bg-${role}`) не превращается в CSS.
 */

interface RoleProps {
  readonly base: string;
  readonly hover: string;
  readonly name: string;
  readonly soft: string;
}

/** Роль показывается тройкой base / hover / soft: именно её и потребляет компонент. */
function Role({base, hover, name, soft}: RoleProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-foreground">{name}</h3>
      <div className="grid grid-cols-3 gap-2">
        <div className={`rounded-lg p-3 text-xs ${base}`}>base</div>
        <div className={`rounded-lg p-3 text-xs ${hover}`}>hover</div>
        <div className={`rounded-lg p-3 text-xs ${soft}`}>soft</div>
      </div>
    </section>
  );
}

const ROLES: readonly RoleProps[] = [
  {
    base: "bg-default text-default-foreground",
    hover: "bg-default-hover text-default-foreground",
    name: "default",
    soft: "bg-default-soft text-default-soft-foreground",
  },
  {
    base: "bg-accent text-accent-foreground",
    hover: "bg-accent-hover text-accent-foreground",
    name: "accent",
    soft: "bg-accent-soft text-accent-soft-foreground",
  },
  {
    base: "bg-success text-success-foreground",
    hover: "bg-success-hover text-success-foreground",
    name: "success",
    soft: "bg-success-soft text-success-soft-foreground",
  },
  {
    base: "bg-warning text-warning-foreground",
    hover: "bg-warning-hover text-warning-foreground",
    name: "warning",
    soft: "bg-warning-soft text-warning-soft-foreground",
  },
  {
    base: "bg-danger text-danger-foreground",
    hover: "bg-danger-hover text-danger-foreground",
    name: "danger",
    soft: "bg-danger-soft text-danger-soft-foreground",
  },
];

interface SwatchProps {
  readonly className: string;
  readonly label: string;
}

function Swatch({className, label}: SwatchProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`h-14 rounded-lg border border-border ${className}`} />
      <code className="font-mono text-xs text-muted">{label}</code>
    </div>
  );
}

const meta = {
  title: "Foundations/Colors",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** Пять ролей — контракт, на который опирается каждый компонент ядра. */
export const Roles: Story = {
  name: "Роли",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Роли</h2>
      {ROLES.map((role) => (
        <Role key={role.name} {...role} />
      ))}
    </div>
  ),
};

/** Поверхности разделены по назначению: surface — неплавающие части, overlay — плавающие. */
export const Surfaces: Story = {
  name: "Поверхности",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Поверхности</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Swatch className="bg-background" label="background" />
        <Swatch className="bg-background-secondary" label="background-secondary" />
        <Swatch className="bg-background-tertiary" label="background-tertiary" />
        <Swatch className="bg-background-inverse" label="background-inverse" />
        <Swatch className="bg-surface" label="surface" />
        <Swatch className="bg-surface-secondary" label="surface-secondary" />
        <Swatch className="bg-surface-tertiary" label="surface-tertiary" />
        <Swatch className="bg-overlay" label="overlay" />
        <Swatch className="bg-segment" label="segment" />
        <Swatch className="bg-muted" label="muted" />
        <Swatch className="bg-field" label="field" />
        <Swatch className="bg-backdrop" label="backdrop" />
      </div>
    </div>
  ),
};

/** Границы, разделители и фокус — три разных токена, их нельзя смешивать. */
export const Lines: Story = {
  name: "Границы и фокус",
  render: () => (
    <div className="flex flex-col gap-6 bg-background p-6">
      <h2 className="text-xl font-semibold text-foreground">Границы и фокус</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Swatch className="bg-border" label="border" />
        <Swatch className="bg-border-secondary" label="border-secondary" />
        <Swatch className="bg-border-tertiary" label="border-tertiary" />
        <Swatch className="bg-separator" label="separator" />
        <Swatch className="bg-focus" label="focus" />
        <Swatch className="bg-link" label="link" />
      </div>
    </div>
  ),
};
