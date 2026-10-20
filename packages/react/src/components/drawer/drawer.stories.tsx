import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useOverlayState} from "../../hooks/index.ts";
import {Button} from "../button/index.ts";

import {Drawer} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-wrap items-center gap-4">{children}</div>
  </div>
);

const PLACEMENTS = ["bottom", "top", "left", "right"] as const;
const BACKDROPS = ["opaque", "blur", "transparent"] as const;

interface DrawerExampleProps {
  backdrop?: (typeof BACKDROPS)[number];
  isDismissable?: boolean;
  label: string;
  placement?: (typeof PLACEMENTS)[number];
  withHandle?: boolean;
}

const DrawerExample = ({
  backdrop,
  isDismissable,
  label,
  placement,
  withHandle = placement === "bottom" || placement === undefined,
}: DrawerExampleProps) => (
  <Drawer>
    <Button variant="secondary">{label}</Button>
    <Drawer.Backdrop isDismissable={isDismissable} variant={backdrop}>
      <Drawer.Content placement={placement}>
        <Drawer.Dialog>
          {withHandle ? <Drawer.Handle /> : null}
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Notifications</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            <p>
              A drawer slides in from a screen edge and holds focus until it is dismissed: press
              Escape, use the close button, click the backdrop, or drag the panel toward its edge.
            </p>
          </Drawer.Body>
          <Drawer.Footer>
            <Button slot="close" variant="secondary">
              Cancel
            </Button>
            <Button slot="close">Mark all read</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  </Drawer>
);

/*
 * No `component` in meta: with it every story needs args carrying children, and these stories are
 * explicit render functions.
 */
const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/Drawer",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <DrawerExample label="Open drawer" />
    </Showcase>
  ),
};

export const Placements: Story = {
  render: () => (
    <Showcase title="Placements">
      {PLACEMENTS.map((placement) => (
        <DrawerExample key={placement} label={`Open ${placement}`} placement={placement} />
      ))}
    </Showcase>
  ),
};

export const BackdropVariants: Story = {
  render: () => (
    <Showcase title="Backdrop variants">
      {BACKDROPS.map((backdrop) => (
        <DrawerExample key={backdrop} backdrop={backdrop} label={`Backdrop ${backdrop}`} />
      ))}
    </Showcase>
  ),
};

export const DismissBehavior: Story = {
  render: () => (
    <Showcase title="Dismiss behavior">
      <DrawerExample isDismissable={false} label="Not dismissable" />
    </Showcase>
  ),
};

export const ScrollingBody: Story = {
  render: () => (
    <Showcase title="Scrolling body">
      <Drawer>
        <Button variant="secondary">Open long drawer</Button>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Release notes</Drawer.Heading>
              </Drawer.Header>
              {/* A scrollable region must be keyboard reachable: tabIndex lets Tab land on it. */}
              <Drawer.Body tabIndex={0}>
                {Array.from({length: 24}, (_, index) => (
                  <p key={index} className="mb-3">
                    Entry {index + 1}: the body scrolls on its own while the header and footer stay
                    in place.
                  </p>
                ))}
              </Drawer.Body>
              <Drawer.Footer>
                <Button slot="close">Done</Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </Showcase>
  ),
};

const ControlledExample = () => {
  const state = useOverlayState();

  return (
    <>
      <p className="text-xs text-muted">
        isOpen: <span className="font-mono text-foreground">{String(state.isOpen)}</span>
      </p>
      <Button variant="secondary" onPress={state.open}>
        Open controlled drawer
      </Button>
      <Drawer state={state}>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Controlled</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <p>The open state lives outside the drawer.</p>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </>
  );
};

export const Controlled: Story = {
  render: () => (
    <Showcase title="Controlled">
      <ControlledExample />
    </Showcase>
  ),
};
