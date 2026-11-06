import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {Button} from "../button/index.ts";

import {Sheet} from "./index.ts";

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

type Placement = (typeof PLACEMENTS)[number];

const capitalize = (value: Placement) => `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const meta = {
  component: Sheet,
  parameters: {
    layout: "padded",
  },
  title: "Components/Sheet",
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Sheet>
        <Sheet.Trigger>
          <Button variant="secondary">Open sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Share this page</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>
                  A sheet slides in from a screen edge. Drag it toward the edge, press Escape, use
                  the close button or click the backdrop to dismiss it.
                </p>
              </Sheet.Body>
              <Sheet.Footer>
                <Sheet.Close>
                  <Button variant="secondary">Cancel</Button>
                </Sheet.Close>
                <Sheet.Close>
                  <Button>Share</Button>
                </Sheet.Close>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

export const SnapPoints: Story = {
  render: () => (
    <Showcase title="Snap points">
      <Sheet snapPoints={["25%", "50%"]}>
        <Sheet.Trigger>
          <Button variant="secondary">Open with snap points</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.Header>
                <Sheet.Heading>Snap points</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>
                  The sheet opens at a quarter of the screen and can rest at half of it. Drag past
                  the last point to reveal the full sheet.
                </p>
                {Array.from({length: 6}, (_, index) => (
                  <p key={index} className="mt-3">
                    More content at this level ({index + 1}).
                  </p>
                ))}
                {/* A control below the first snap point: focusing it must bring it into view. */}
                <Button className="mt-3" variant="secondary">
                  Show all options
                </Button>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

/* A horizontal snap sheet: the handle is a horizontal slider and the arrows follow reading order. */
export const HorizontalSnap: Story = {
  render: () => (
    <Showcase title="Horizontal snap">
      <Sheet placement="right" snapPoints={["50%"]}>
        <Sheet.Trigger>
          <Button variant="secondary">Open side sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Side sheet</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>The sheet opens at half the screen width and can be pulled to full width.</p>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

export const TopSnap: Story = {
  render: () => (
    <Showcase title="Top snap">
      <Sheet placement="top" snapPoints={["25%"]}>
        <Sheet.Trigger>
          <Button variant="secondary">Open top sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Top sheet</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>The sheet opens at a quarter of the screen and can be pulled to full height.</p>
              </Sheet.Body>
              <Sheet.Handle />
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

export const Placements: Story = {
  render: () => (
    <Showcase title="Placements">
      {PLACEMENTS.map((placement) => (
        <Sheet key={placement} placement={placement}>
          <Sheet.Trigger>
            <Button variant="secondary">{`Open ${placement}`}</Button>
          </Sheet.Trigger>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog>
                {placement === "bottom" ? <Sheet.Handle /> : null}
                <Sheet.CloseTrigger />
                <Sheet.Header>
                  <Sheet.Heading>{`${capitalize(placement)} sheet`}</Sheet.Heading>
                </Sheet.Header>
                <Sheet.Body>
                  <p>{`This sheet slides in from the ${placement} edge of the screen.`}</p>
                </Sheet.Body>
                <Sheet.Footer>
                  <Sheet.Close>
                    <Button variant="secondary">Done</Button>
                  </Sheet.Close>
                </Sheet.Footer>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>
      ))}
    </Showcase>
  ),
};

export const Detached: Story = {
  render: () => (
    <Showcase title="Detached">
      <Sheet isDetached>
        <Sheet.Trigger>
          <Button variant="secondary">Open detached</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.Header>
                <Sheet.Heading>Detached sheet</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>The sheet floats away from the viewport edge with rounded corners all around.</p>
              </Sheet.Body>
              <Sheet.Footer>
                <Sheet.Close>
                  <Button variant="secondary">Close</Button>
                </Sheet.Close>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

/*
 * The nested root sits inside the parent's dialog and is opened from there. Mounting parent and
 * child open together is not supported: the parent becomes the topmost sheet.
 */
export const Nested: Story = {
  render: () => (
    <Showcase title="Nested">
      <Sheet>
        <Sheet.Trigger>
          <Button variant="secondary">Open parent sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Parent sheet</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>
                  Open a nested sheet from here: the parent scales back and the child slides on.
                </p>
              </Sheet.Body>
              <Sheet.Footer>
                <Sheet.NestedRoot>
                  <Sheet.Trigger>
                    <Button variant="secondary">Open nested sheet</Button>
                  </Sheet.Trigger>
                  <Sheet.Backdrop>
                    <Sheet.Content>
                      <Sheet.Dialog>
                        <Sheet.Handle />
                        <Sheet.CloseTrigger />
                        <Sheet.Header>
                          <Sheet.Heading>Nested sheet</Sheet.Heading>
                        </Sheet.Header>
                        <Sheet.Body>
                          <p>Dismiss this sheet to return to the parent.</p>
                        </Sheet.Body>
                        <Sheet.Footer>
                          <Sheet.Close>
                            <Button variant="secondary">Back</Button>
                          </Sheet.Close>
                        </Sheet.Footer>
                      </Sheet.Dialog>
                    </Sheet.Content>
                  </Sheet.Backdrop>
                </Sheet.NestedRoot>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

const RELEASE_NOTES = [
  "faster startup and a smaller bundle.",
  "keyboard shortcuts for the main menu.",
  "fixed a flicker when switching themes.",
  "added an offline indicator to the header.",
  "improved focus handling in dialogs.",
  "new empty states for lists and tables.",
  "search results now keep their scroll position.",
  "reduced memory use on long sessions.",
  "clearer error messages for failed uploads.",
  "date pickers respect the first day of the week.",
  "added drag handles to sortable lists.",
  "fixed clipped labels in compact layouts.",
  "notifications can be snoozed for an hour.",
  "better contrast for disabled controls.",
  "export now includes hidden columns on request.",
  "faster filtering on large tables.",
  "profile photos are cropped on the client.",
  "fixed double submit on slow connections.",
  "added a high contrast mode.",
  "settings remember the last opened tab.",
  "improved screen reader labels for icon buttons.",
  "tooltips no longer cover their trigger.",
  "fixed a rare crash when resizing panels.",
  "refreshed illustrations across onboarding.",
];

export const ScrollingBody: Story = {
  render: () => (
    <Showcase title="Scrolling body">
      <Sheet>
        <Sheet.Trigger>
          <Button variant="secondary">Open long sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Release notes</Sheet.Heading>
              </Sheet.Header>
              {/* A scrollable region must be keyboard reachable: tabIndex lets Tab land on it. */}
              <Sheet.Body aria-label="Release notes content" tabIndex={0}>
                {RELEASE_NOTES.map((note, index) => (
                  <p key={note} className="mb-3">
                    Version 1.{index + 1}: {note}
                  </p>
                ))}
              </Sheet.Body>
              <Sheet.Footer>
                <Sheet.Close>
                  <Button>Done</Button>
                </Sheet.Close>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};

const ControlledExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <p className="text-xs text-muted">
        isOpen: <span className="font-mono text-foreground">{String(isOpen)}</span>
      </p>
      <Button variant="secondary" onPress={() => setIsOpen(true)}>
        Open controlled sheet
      </Button>
      <Sheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle />
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Controlled</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>The open state lives outside the sheet.</p>
                <p className="mt-3 text-xs text-muted">
                  isOpen: <span className="font-mono text-foreground">{String(isOpen)}</span>
                </p>
              </Sheet.Body>
              <Sheet.Footer>
                <Button onPress={() => setIsOpen(false)}>Close from state</Button>
              </Sheet.Footer>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
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

export const NonDismissable: Story = {
  render: () => (
    <Showcase title="Non-dismissable">
      <Sheet isDismissable={false}>
        <Sheet.Trigger>
          <Button variant="secondary">Open required sheet</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.CloseTrigger />
              <Sheet.Header>
                <Sheet.Heading>Confirm action</Sheet.Heading>
              </Sheet.Header>
              <Sheet.Body>
                <p>
                  This sheet ignores outside presses, swipes and Escape. Use the close button to
                  leave it.
                </p>
              </Sheet.Body>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    </Showcase>
  ),
};
