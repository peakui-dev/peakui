import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {CloseButton} from "./index.ts";

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

/*
 * A real svg glyph, not a text placeholder: the `& svg` rule in close-button.css sizes icons
 * inside the button, and only a real element exercises it. Stories may not pull an icon package —
 * @peakui/react keeps its two dependencies.
 */
const CircleXmarkIcon = () => (
  <svg aria-hidden fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.03a.75.75 0 0 0-1.06 1.06L10.94 12l-2.72 2.72a.75.75 0 1 0 1.06 1.06L12 13.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L13.06 12l2.72-2.72a.75.75 0 0 0-1.06-1.06L12 10.94l-2.72-2.72Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const meta = {
  component: CloseButton,
  parameters: {
    layout: "padded",
  },
  title: "Components/CloseButton",
} satisfies Meta<typeof CloseButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <div className="flex gap-3">
        <CloseButton />
      </div>
    </Showcase>
  ),
};

export const WithCustomIcon: Story = {
  name: "Пользовательская иконка",
  render: () => (
    <Showcase title="Пользовательская иконка">
      <div className="flex gap-3">
        <CloseButton aria-label="Сбросить фильтр">
          <CircleXmarkIcon />
        </CloseButton>
      </div>
    </Showcase>
  ),
};

/* A named component, not an inline render: hooks belong to a component, and lint wants to see it. */
const InteractiveExample = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <CloseButton
        aria-label={`Закрыть (нажато ${count} раз)`}
        onPress={() => setCount(count + 1)}
      />

      <span className="text-sm">Нажато: {count} раз</span>
    </div>
  );
};

export const Interactive: Story = {
  name: "Интерактивная",
  render: () => (
    <Showcase title="Интерактивная">
      <InteractiveExample />
    </Showcase>
  ),
};

export const Disabled: Story = {
  name: "Недоступна",
  render: () => (
    <Showcase title="Недоступна">
      <div className="flex gap-3">
        <CloseButton isDisabled />
      </div>
    </Showcase>
  ),
};
