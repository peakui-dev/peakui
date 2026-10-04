import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";
import type {Key} from "react-aria-components/ToggleButtonGroup";

import {useState} from "react";

import {ToggleButton} from "../toggle-button/index.ts";

import {ToggleButtonGroup} from "./index.ts";

/*
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md. A toolbar is the natural ToggleButton
 * habitat, and a real svg exercises the `& svg` sizing rule in toggle-button.css.
 */
interface IconProps extends ComponentProps<"svg"> {}

const icon = (d: string) => {
  const Glyph = (props: IconProps) => (
    <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path clipRule="evenodd" d={d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );

  return Glyph;
};

const BoldIcon = icon(
  "M4.25 2.25A.75.75 0 0 0 3.5 3v10c0 .414.336.75.75.75H9.5a3.25 3.25 0 0 0 1.477-6.146A3.25 3.25 0 0 0 8.5 2.25zm3.5 5a1.75 1.75 0 1 0 0-3.5h-2v3.5zm-2 1.5v3.5h3a1.75 1.75 0 1 0 0-3.5z",
);
const ItalicIcon = icon(
  "M7.25 2a.75.75 0 0 0 0 1.5h1.317l-2.7 9H4.25a.75.75 0 1 0 0 1.5h4.5a.75.75 0 0 0 0-1.5H7.433l2.7-9h1.617a.75.75 0 0 0 0-1.5z",
);
const UnderlineIcon = icon(
  "M5 2.75a.75.75 0 0 0-1.5 0V7a4.5 4.5 0 0 0 9 0V2.75a.75.75 0 0 0-1.5 0V7a3 3 0 0 1-6 0zm-.75 9.75a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5z",
);
const StrikethroughIcon = icon(
  "M5.502 2.757C6.214 2.236 7.122 2 7.984 2c1.685 0 3.015.572 3.687 1.915a.75.75 0 1 1-1.342.67C10.001 3.93 9.331 3.5 7.984 3.5c-.611 0-1.19.17-1.597.468-.384.28-.627.678-.627 1.242 0 .403.165.758.463 1.04H4.447a2.9 2.9 0 0 1-.187-1.04c0-1.084.507-1.916 1.242-2.453m6.047 5.993h1.201a.75.75 0 0 0 0-1.5h-9.5a.75.75 0 0 0 0 1.5h5.475l.043.012h.002c1.196.323 1.98 1.005 1.98 1.988 0 .669-.289 1.063-.742 1.33-.5.296-1.222.437-2 .437-1.398 0-2.453-.472-2.796-1.504a.75.75 0 1 0-1.424.474c.657 1.969 2.602 2.53 4.22 2.53.915 0 1.94-.16 2.762-.644.869-.512 1.48-1.376 1.48-2.623 0-.822-.276-1.481-.7-2",
);
const TextAlignLeftIcon = icon(
  "M2.75 2a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zm0 7a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zm0 3.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5zM2 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 2 6.25",
);
const TextAlignCenterIcon = icon(
  "M2.75 2a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zm0 7a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zm2 3.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5zM4 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 4 6.25",
);
const TextAlignRightIcon = icon(
  "M2.75 2a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zM6 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5A.75.75 0 0 1 6 6.25M2.75 9a.75.75 0 0 0 0 1.5h10.5a.75.75 0 0 0 0-1.5zm4 3.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5z",
);
const LayoutCellsLargeIcon = icon(
  "M12 3.5H8.75v3.75h4.75V5A1.5 1.5 0 0 0 12 3.5m1.5 5.25H8.75v3.75H12a1.5 1.5 0 0 0 1.5-1.5zm-6.25-1.5V3.5H4A1.5 1.5 0 0 0 2.5 5v2.25zM2.5 8.75h4.75v3.75H4A1.5 1.5 0 0 1 2.5 11zM4 2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z",
);
const ListUlIcon = icon(
  "M2.5 5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5m3.25-2a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zm0 8.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zM5 8a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 5 8M3.75 8a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0M2.5 13.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5",
);
const LayoutColumns3Icon = icon(
  "M12 3.5h-1.25v9H12a1.5 1.5 0 0 0 1.5-1.5V5A1.5 1.5 0 0 0 12 3.5m-5.25 0h2.5v9h-2.5zm-1.5 0H4A1.5 1.5 0 0 0 2.5 5v6A1.5 1.5 0 0 0 4 12.5h1.25zM4 2a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3z",
);

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

const GroupLabel = ({children}: {children: ReactNode}) => (
  <p className="text-sm text-muted">{children}</p>
);

const meta = {
  component: ToggleButtonGroup,
  parameters: {
    layout: "padded",
  },
  title: "Components/ToggleButtonGroup",
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/* The Separator lives INSIDE a button (not between them): it positions against the button's box. */
const FormattingGroup = (props: ComponentProps<typeof ToggleButtonGroup>) => (
  <ToggleButtonGroup selectionMode="multiple" {...props}>
    <ToggleButton isIconOnly aria-label="Жирный" id="bold">
      <BoldIcon />
    </ToggleButton>
    <ToggleButton isIconOnly aria-label="Курсив" id="italic">
      <ToggleButtonGroup.Separator />
      <ItalicIcon />
    </ToggleButton>
    <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
      <ToggleButtonGroup.Separator />
      <UnderlineIcon />
    </ToggleButton>
    <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
      <ToggleButtonGroup.Separator />
      <StrikethroughIcon />
    </ToggleButton>
  </ToggleButtonGroup>
);

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <FormattingGroup />
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Размеры",
  render: () => (
    <Showcase title="Размеры">
      {(["sm", "md", "lg"] as const).map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <GroupLabel>
            {size === "sm" ? "Маленький" : size === "md" ? "Средний" : "Большой"}
          </GroupLabel>
          <FormattingGroup size={size} />
        </div>
      ))}
    </Showcase>
  ),
};

export const Orientation: Story = {
  name: "Ориентация",
  render: () => (
    <Showcase title="Ориентация">
      <div className="flex items-start gap-8">
        <div className="flex flex-col gap-2">
          <GroupLabel>Горизонтальная</GroupLabel>
          <FormattingGroup orientation="horizontal" />
        </div>
        <div className="flex flex-col gap-2">
          <GroupLabel>Вертикальная</GroupLabel>
          <FormattingGroup orientation="vertical" />
        </div>
      </div>
    </Showcase>
  ),
};

export const AttachedVsDetached: Story = {
  name: "Слитная и отстыкованная",
  render: () => (
    <Showcase title="Слитная и отстыкованная">
      <div className="flex flex-col gap-2">
        <GroupLabel>Слитная (по умолчанию)</GroupLabel>
        <FormattingGroup />
      </div>
      <div className="flex flex-col gap-2">
        <GroupLabel>Отстыкованная</GroupLabel>
        <ToggleButtonGroup isDetached selectionMode="multiple">
          <ToggleButton isIconOnly aria-label="Жирный" id="bold">
            <BoldIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Курсив" id="italic">
            <ItalicIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
            <UnderlineIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
            <StrikethroughIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  name: "Во всю ширину",
  render: () => (
    <Showcase title="Во всю ширину">
      <div className="w-[400px] space-y-3">
        <FormattingGroup fullWidth />
        <ToggleButtonGroup fullWidth selectionMode="single">
          <ToggleButton id="left">
            <TextAlignLeftIcon />
            Слева
          </ToggleButton>
          <ToggleButton id="center">
            <ToggleButtonGroup.Separator />
            <TextAlignCenterIcon />
            По центру
          </ToggleButton>
          <ToggleButton id="right">
            <ToggleButtonGroup.Separator />
            <TextAlignRightIcon />
            Справа
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </Showcase>
  ),
};

export const SelectionMode: Story = {
  name: "Режим выбора",
  render: () => (
    <Showcase title="Режим выбора">
      <div className="flex flex-col gap-2">
        <GroupLabel>Одиночный выбор</GroupLabel>
        <ToggleButtonGroup defaultSelectedKeys={["center"]} selectionMode="single">
          <ToggleButton id="left">
            <TextAlignLeftIcon />
            Слева
          </ToggleButton>
          <ToggleButton id="center">
            <ToggleButtonGroup.Separator />
            <TextAlignCenterIcon />
            По центру
          </ToggleButton>
          <ToggleButton id="right">
            <ToggleButtonGroup.Separator />
            <TextAlignRightIcon />
            Справа
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="flex flex-col gap-2">
        <GroupLabel>Множественный выбор</GroupLabel>
        <ToggleButtonGroup defaultSelectedKeys={["bold", "underline"]} selectionMode="multiple">
          <ToggleButton isIconOnly aria-label="Жирный" id="bold">
            <BoldIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Курсив" id="italic">
            <ToggleButtonGroup.Separator />
            <ItalicIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
            <ToggleButtonGroup.Separator />
            <UnderlineIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
            <ToggleButtonGroup.Separator />
            <StrikethroughIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемая",
  render: () => {
    const [selectedKeys, setSelectedKeys] = useState(new Set<Key>(["bold"]));

    return (
      <Showcase title="Управляемая">
        <div className="flex flex-col gap-4">
          <ToggleButtonGroup
            selectedKeys={selectedKeys}
            selectionMode="multiple"
            onSelectionChange={setSelectedKeys}
          >
            <ToggleButton isIconOnly aria-label="Жирный" id="bold">
              <BoldIcon />
            </ToggleButton>
            <ToggleButton isIconOnly aria-label="Курсив" id="italic">
              <ToggleButtonGroup.Separator />
              <ItalicIcon />
            </ToggleButton>
            <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
              <ToggleButtonGroup.Separator />
              <UnderlineIcon />
            </ToggleButton>
            <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
              <ToggleButtonGroup.Separator />
              <StrikethroughIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <p className="text-sm text-muted">
            Выбрано:{" "}
            <span className="font-medium">
              {selectedKeys.size > 0 ? [...selectedKeys].join(", ") : "ничего"}
            </span>
          </p>
        </div>
      </Showcase>
    );
  },
};

export const Disabled: Story = {
  name: "Недоступна",
  render: () => (
    <Showcase title="Недоступна">
      <div className="flex flex-col gap-2">
        <GroupLabel>Все кнопки недоступны</GroupLabel>
        <FormattingGroup isDisabled />
      </div>
      <div className="flex flex-col gap-2">
        <GroupLabel>Одна кнопка недоступна</GroupLabel>
        <ToggleButtonGroup selectionMode="multiple">
          <ToggleButton isIconOnly aria-label="Жирный" id="bold">
            <BoldIcon />
          </ToggleButton>
          <ToggleButton isDisabled isIconOnly aria-label="Курсив" id="italic">
            <ToggleButtonGroup.Separator />
            <ItalicIcon />
          </ToggleButton>
          <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
            <ToggleButtonGroup.Separator />
            <UnderlineIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
    </Showcase>
  ),
};

export const WithoutSeparator: Story = {
  name: "Без разделителя",
  render: () => (
    <Showcase title="Без разделителя">
      <ToggleButtonGroup selectionMode="multiple">
        <ToggleButton isIconOnly aria-label="Жирный" id="bold">
          <BoldIcon />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Курсив" id="italic">
          <ItalicIcon />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
          <UnderlineIcon />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
          <StrikethroughIcon />
        </ToggleButton>
      </ToggleButtonGroup>
    </Showcase>
  ),
};

export const WithLabels: Story = {
  name: "С подписями",
  render: () => (
    <Showcase title="С подписями">
      <ToggleButtonGroup defaultSelectedKeys={["italic"]} selectionMode="multiple">
        <ToggleButton id="bold">
          <BoldIcon />
          Жирный
        </ToggleButton>
        <ToggleButton id="italic">
          <ToggleButtonGroup.Separator />
          <ItalicIcon />
          Курсив
        </ToggleButton>
        <ToggleButton id="underline">
          <ToggleButtonGroup.Separator />
          <UnderlineIcon />
          Подчёркнутый
        </ToggleButton>
      </ToggleButtonGroup>
    </Showcase>
  ),
};

export const Examples: Story = {
  name: "Примеры",
  render: () => {
    const [alignment, setAlignment] = useState(new Set<Key>(["left"]));
    const [formatting, setFormatting] = useState(new Set<Key>(["bold", "underline"]));

    return (
      <Showcase title="Примеры">
        <div className="flex flex-col gap-2">
          <GroupLabel>Панель форматирования текста</GroupLabel>
          <div className="flex gap-2">
            <ToggleButtonGroup
              selectedKeys={formatting}
              selectionMode="multiple"
              onSelectionChange={setFormatting}
            >
              <ToggleButton isIconOnly aria-label="Жирный" id="bold">
                <BoldIcon />
              </ToggleButton>
              <ToggleButton isIconOnly aria-label="Курсив" id="italic">
                <ToggleButtonGroup.Separator />
                <ItalicIcon />
              </ToggleButton>
              <ToggleButton isIconOnly aria-label="Подчёркнутый" id="underline">
                <ToggleButtonGroup.Separator />
                <UnderlineIcon />
              </ToggleButton>
              <ToggleButton isIconOnly aria-label="Зачёркнутый" id="strikethrough">
                <ToggleButtonGroup.Separator />
                <StrikethroughIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              disallowEmptySelection
              selectedKeys={alignment}
              selectionMode="single"
              onSelectionChange={setAlignment}
            >
              <ToggleButton isIconOnly aria-label="По левому краю" id="left">
                <TextAlignLeftIcon />
              </ToggleButton>
              <ToggleButton isIconOnly aria-label="По центру" id="center">
                <ToggleButtonGroup.Separator />
                <TextAlignCenterIcon />
              </ToggleButton>
              <ToggleButton isIconOnly aria-label="По правому краю" id="right">
                <ToggleButtonGroup.Separator />
                <TextAlignRightIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <GroupLabel>Переключатель вида</GroupLabel>
          <ToggleButtonGroup
            disallowEmptySelection
            defaultSelectedKeys={["grid"]}
            selectionMode="single"
            size="sm"
          >
            <ToggleButton isIconOnly aria-label="Плитка" id="grid">
              <LayoutCellsLargeIcon />
            </ToggleButton>
            <ToggleButton isIconOnly aria-label="Список" id="list">
              <ToggleButtonGroup.Separator />
              <ListUlIcon />
            </ToggleButton>
            <ToggleButton isIconOnly aria-label="Колонки" id="columns">
              <ToggleButtonGroup.Separator />
              <LayoutColumns3Icon />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div className="flex flex-col gap-2">
          <GroupLabel>Вертикальная панель</GroupLabel>
          <FormattingGroup orientation="vertical" />
        </div>
      </Showcase>
    );
  },
};
