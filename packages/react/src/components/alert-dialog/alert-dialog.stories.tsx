import type {AlertDialogStatus} from "./index.ts";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import {useState} from "react";

import {useOverlayState} from "../../hooks/index.ts";
import {Button} from "../button/index.ts";
import {InfoIcon} from "../icons.tsx";

import {AlertDialog} from "./index.ts";

/*
 * Every story carries an h2: the audit in apps/storybook/e2e reads it as the signal that the
 * preview has mounted. Without it axe would run over an empty iframe and pass silently.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-wrap items-center gap-6">{children}</div>
  </div>
);

interface ConfirmProps {
  body?: string;
  cancel?: string;
  confirm?: string;
  heading?: string;
  icon?: ReactNode;
  status?: AlertDialogStatus;
}

/* The frame of a confirmation: icon, heading, body, a cancel and a confirm action. */
const ConfirmDialog = ({
  body = "This will permanently delete My Project and all of its data. This action cannot be undone.",
  cancel = "Cancel",
  confirm = "Delete Project",
  heading = "Delete project permanently?",
  icon,
  status = "danger",
}: ConfirmProps) => (
  <AlertDialog.Dialog className="sm:max-w-[400px]">
    <AlertDialog.CloseTrigger />
    <AlertDialog.Header>
      <AlertDialog.Icon status={status}>{icon}</AlertDialog.Icon>
      <AlertDialog.Heading>{heading}</AlertDialog.Heading>
    </AlertDialog.Header>
    <AlertDialog.Body>
      <p>{body}</p>
    </AlertDialog.Body>
    <AlertDialog.Footer>
      <Button slot="close" variant="tertiary">
        {cancel}
      </Button>
      <Button slot="close" variant={status === "danger" ? "danger" : "primary"}>
        {confirm}
      </Button>
    </AlertDialog.Footer>
  </AlertDialog.Dialog>
);

const meta = {
  parameters: {
    layout: "padded",
  },
  title: "Components/AlertDialog",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "Default",
  render: () => (
    <Showcase title="Default">
      <AlertDialog>
        <Button variant="danger">Delete Project</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <ConfirmDialog />
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Showcase>
  ),
};

const STATUSES: {props: ConfirmProps; status: AlertDialogStatus; trigger: string}[] = [
  {
    props: {
      body: "You will need to sign in again. Unsaved changes will be lost.",
      cancel: "Stay Signed In",
      confirm: "Sign Out",
      heading: "Sign out of your account?",
    },
    status: "accent",
    trigger: "Sign Out",
  },
  {
    props: {
      body: "The task moves to your completed list and your team is notified.",
      cancel: "Not Yet",
      confirm: "Mark Complete",
      heading: "Complete this task?",
    },
    status: "success",
    trigger: "Complete Task",
  },
  {
    props: {
      body: "You have unsaved changes that will be lost if you leave.",
      cancel: "Keep Editing",
      confirm: "Discard",
      heading: "Discard unsaved changes?",
    },
    status: "warning",
    trigger: "Discard Changes",
  },
  {
    props: {
      body: "This permanently removes your account and all of its data.",
      confirm: "Delete Account",
      heading: "Delete your account?",
    },
    status: "danger",
    trigger: "Delete Account",
  },
];

export const Statuses: Story = {
  name: "Statuses",
  render: () => (
    <Showcase title="Statuses">
      {STATUSES.map(({props, status, trigger}) => (
        <AlertDialog key={status}>
          <Button variant="secondary">{trigger}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <ConfirmDialog {...props} status={status} />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </Showcase>
  ),
};

export const Placements: Story = {
  name: "Placements",
  render: () => (
    <Showcase title="Placements">
      {(["auto", "top", "center", "bottom"] as const).map((placement) => (
        <AlertDialog key={placement}>
          <Button variant="secondary">{placement}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container placement={placement}>
              <ConfirmDialog />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </Showcase>
  ),
};

export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <Showcase title="Sizes">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <AlertDialog key={size}>
          <Button variant="secondary">{size}</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container size={size}>
              <AlertDialog.Dialog>
                <AlertDialog.Header>
                  <AlertDialog.Icon status="warning" />
                  <AlertDialog.Heading>Size {size}</AlertDialog.Heading>
                </AlertDialog.Header>
                <AlertDialog.Body>
                  <p>The dialog width follows the size you pick.</p>
                </AlertDialog.Body>
                <AlertDialog.Footer>
                  <Button slot="close">Got It</Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </Showcase>
  ),
};

export const BackdropVariants: Story = {
  name: "Backdrop Variants",
  render: () => (
    <Showcase title="Backdrop Variants">
      {(["opaque", "blur", "transparent"] as const).map((variant) => (
        <AlertDialog key={variant}>
          <Button variant="secondary">{variant}</Button>
          <AlertDialog.Backdrop variant={variant}>
            <AlertDialog.Container>
              <ConfirmDialog />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      ))}
    </Showcase>
  ),
};

export const CustomIcon: Story = {
  name: "Custom Icon",
  render: () => (
    <Showcase title="Custom Icon">
      <AlertDialog>
        <Button variant="secondary">Archive Project</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <ConfirmDialog
              body="Archived projects are hidden from the sidebar and can be restored any time."
              confirm="Archive"
              heading="Archive this project?"
              icon={<InfoIcon className="size-5" />}
              status="accent"
            />
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Showcase>
  ),
};

export const DismissBehavior: Story = {
  name: "Dismiss Behavior",
  render: () => (
    <Showcase title="Dismiss Behavior">
      <AlertDialog>
        <Button variant="secondary">Dismiss on outside click</Button>
        <AlertDialog.Backdrop isDismissable>
          <AlertDialog.Container>
            <ConfirmDialog heading="Outside click closes this" />
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
      <AlertDialog>
        <Button variant="secondary">Dismiss on Escape</Button>
        <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
          <AlertDialog.Container>
            <ConfirmDialog heading="Escape closes this" />
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Controlled",
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const state = useOverlayState();

    return (
      <Showcase title="Controlled">
        <AlertDialog isOpen={isOpen} onOpenChange={setIsOpen}>
          <Button variant="secondary">Open with useState</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <ConfirmDialog heading="Controlled with useState" />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
        <AlertDialog state={state}>
          <Button variant="secondary">Open with useOverlayState</Button>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <ConfirmDialog heading="Controlled with useOverlayState" />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </Showcase>
    );
  },
};

export const CustomTrigger: Story = {
  name: "Custom Trigger",
  render: () => (
    <Showcase title="Custom Trigger">
      <AlertDialog>
        <AlertDialog.Trigger aria-label="Remove item">
          <span className="rounded-lg border border-border px-3 py-2 text-sm text-foreground">
            Remove item
          </span>
        </AlertDialog.Trigger>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <ConfirmDialog confirm="Remove" heading="Remove this item?" />
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </Showcase>
  ),
};
