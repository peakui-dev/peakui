import type {ScrollShadowVisibility} from "./index.ts";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Button} from "../button/index.ts";
import {IconChevronRight, IconSearch} from "../icons.tsx";
import {Surface} from "../surface/index.ts";

import {ScrollShadow} from "./index.ts";

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

const Caption = ({children}: {children: ReactNode}) => (
  <p className="mb-2 text-sm font-medium text-muted">{children}</p>
);

const meta = {
  component: ScrollShadow,
  parameters: {
    layout: "padded",
  },
  title: "Components/ScrollShadow",
} satisfies Meta<typeof ScrollShadow>;

export default meta;

type Story = StoryObj<typeof meta>;

const LoremContent = () => (
  <div className="space-y-4">
    {Array.from({length: 10}).map((_, idx) => (
      <p key={`scroll-shadow-lorem-content-${idx}`}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam pulvinar risus non risus
        hendrerit venenatis. Pellentesque sit amet hendrerit risus, sed porttitor quam. Morbi
        accumsan cursus enim, sed ultricies sapien.
      </p>
    ))}
  </div>
);

const ContentRow = ({title}: {title: string}) => (
  <Surface
    className="flex min-w-[200px] flex-row items-center gap-3 rounded-xl p-1 pr-3"
    variant="secondary"
  >
    <span className="flex aspect-square h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-surface-tertiary text-muted">
      <IconSearch />
    </span>
    <div className="flex flex-1 flex-col justify-center gap-1">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted">Today, 6:30 PM</p>
    </div>
    <IconChevronRight className="shrink-0 text-muted" />
  </Surface>
);

const LoremRows = () => (
  <div className="flex flex-row gap-4">
    {Array.from({length: 10}).map((_, idx) => (
      <ContentRow key={`scroll-shadow-row-${idx}`} title={`Bridging the Future ${idx + 1}`} />
    ))}
  </div>
);

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <div className="w-full p-0 sm:max-w-sm">
        <ScrollShadow className="max-h-[240px] p-4" data-testid="vertical-scroller">
          <LoremContent />
        </ScrollShadow>
      </div>
    </Showcase>
  ),
};

export const Orientation: Story = {
  name: "Ориентация",
  render: () => (
    <Showcase title="Ориентация">
      <div className="flex flex-col gap-8">
        <div>
          <Caption>Vertical</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="max-h-[240px] p-4"
              data-testid="vertical-scroller"
              orientation="vertical"
            >
              <LoremContent />
            </ScrollShadow>
          </div>
        </div>

        <div>
          <Caption>Horizontal</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="p-4"
              data-testid="horizontal-scroller"
              orientation="horizontal"
            >
              <LoremRows />
            </ScrollShadow>
          </div>
        </div>
      </div>
    </Showcase>
  ),
};

export const HideScrollBar: Story = {
  name: "Без скроллбара",
  render: () => (
    <Showcase title="Без скроллбара">
      <div className="w-full p-0 sm:max-w-sm">
        <ScrollShadow hideScrollBar className="max-h-[240px] p-4" data-testid="vertical-scroller">
          <LoremContent />
        </ScrollShadow>
      </div>
    </Showcase>
  ),
};

export const CustomSize: Story = {
  name: "Размер тени",
  render: () => (
    <Showcase title="Размер тени">
      <div className="flex flex-col gap-6">
        <div>
          <Caption>Small Shadow (20px)</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow className="max-h-[200px] p-4" data-testid="vertical-scroller" size={20}>
              <LoremContent />
            </ScrollShadow>
          </div>
        </div>
        <div>
          <Caption>Default Shadow (40px)</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow className="max-h-[200px] p-4" data-testid="vertical-scroller">
              <LoremContent />
            </ScrollShadow>
          </div>
        </div>
        <div>
          <Caption>Large Shadow (80px)</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow className="max-h-[200px] p-4" data-testid="vertical-scroller" size={80}>
              <LoremContent />
            </ScrollShadow>
          </div>
        </div>
      </div>
    </Showcase>
  ),
};

export const VisibilityChange: Story = {
  name: "Колбэк видимости",
  render: () => {
    const [verticalState, setVerticalState] = useState<ScrollShadowVisibility>("none");
    const [horizontalState, setHorizontalState] = useState<ScrollShadowVisibility>("none");

    return (
      <Showcase title="Колбэк видимости">
        <div className="mb-4 flex flex-col gap-4">
          <div className="rounded-lg bg-surface-secondary p-4">
            <p className="text-sm font-semibold">Vertical Shadow State: {verticalState}</p>
          </div>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="max-h-[240px] p-4"
              data-testid="vertical-scroller"
              orientation="vertical"
              onVisibilityChange={(visibility) => setVerticalState(visibility)}
            >
              <LoremContent />
            </ScrollShadow>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-surface-secondary p-4">
            <p className="text-sm font-semibold">Horizontal Shadow State: {horizontalState}</p>
          </div>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="p-4"
              data-testid="horizontal-scroller"
              orientation="horizontal"
              onVisibilityChange={(visibility) => setHorizontalState(visibility)}
            >
              <LoremRows />
            </ScrollShadow>
          </div>
        </div>
      </Showcase>
    );
  },
};

export const WithoutOverflow: Story = {
  name: "Без переполнения",
  render: () => (
    <Showcase title="Без переполнения">
      <div className="w-full p-0 sm:max-w-sm">
        <ScrollShadow className="p-4" data-testid="fitting-scroller">
          <p>Short content that fits without scrolling.</p>
        </ScrollShadow>
      </div>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Контролируемая видимость",
  render: () => (
    <Showcase title="Контролируемая видимость">
      <div className="flex flex-col gap-6">
        <div>
          <Caption>visibility: "both"</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="h-[160px] p-4"
              data-testid="controlled-scroller"
              visibility="both"
            >
              <p>Both edges carry a shadow regardless of the scroll position.</p>
            </ScrollShadow>
          </div>
        </div>
        <div>
          <Caption>isEnabled: false</Caption>
          <div className="w-full p-0 sm:max-w-sm">
            <ScrollShadow
              className="h-[160px] p-4"
              data-testid="disabled-scroller"
              isEnabled={false}
            >
              <p>Detection is off: no shadows and no scroll-state attributes.</p>
            </ScrollShadow>
          </div>
        </div>
      </div>
    </Showcase>
  ),
};

export const Rtl: Story = {
  name: "Направление RTL",
  render: () => (
    <Showcase title="Направление RTL">
      <div dir="rtl">
        <div className="w-full p-0 sm:max-w-sm">
          <ScrollShadow className="p-4" data-testid="horizontal-scroller" orientation="horizontal">
            <LoremRows />
          </ScrollShadow>
        </div>
      </div>
    </Showcase>
  ),
};

export const WithSurface: Story = {
  name: "На поверхности",
  render: () => (
    <Showcase title="На поверхности">
      <Surface className="flex w-full max-w-[400px] flex-col gap-4 rounded-3xl p-6">
        <h3 className="text-base font-semibold text-foreground">Terms and Conditions</h3>
        <p className="text-sm text-muted">Please review before proceeding</p>
        <ScrollShadow className="h-[300px] px-4" data-testid="vertical-scroller" size={80}>
          <LoremContent />
        </ScrollShadow>
        <div className="flex flex-row gap-2">
          <Button className="w-full" variant="secondary">
            Cancel
          </Button>
          <Button className="w-full">Accept</Button>
        </div>
      </Surface>
    </Showcase>
  ),
};
