import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ComponentProps, ReactNode} from "react";
import type {Selection} from "react-aria-components/ListBox";

import React, {useState} from "react";
import {Header} from "react-aria-components/ListBox";
import {ListLayout, Virtualizer} from "react-aria-components/Virtualizer";

import {Description} from "../description/index.ts";
import {Kbd} from "../kbd/index.ts";
import {Label} from "../label/index.ts";
import {Separator} from "../separator/index.ts";
import {Surface} from "../surface/index.ts";

import {ListBox} from "./index.ts";

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
 * Story-local glyphs, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md.
 */
interface GlyphProps extends ComponentProps<"svg"> {}

const CheckIcon = (props: GlyphProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M13.488 3.43a.75.75 0 0 1 .081 1.058l-6 7a.75.75 0 0 1-1.1.042l-3.5-3.5A.75.75 0 0 1 4.03 6.97l2.928 2.927 5.473-6.385a.75.75 0 0 1 1.057-.081"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const SquarePlusIcon = (props: GlyphProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M4.5 3h7A1.5 1.5 0 0 1 13 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 11.5v-7A1.5 1.5 0 0 1 4.5 3m-3 1.5a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3zm7.25 1a.75.75 0 0 0-1.5 0v1.75H5.5a.75.75 0 1 0 0 1.5h1.75v1.75a.75.75 0 0 0 1.5 0V8.75h1.75a.75.75 0 0 0 0-1.5H8.75z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const PencilIcon = (props: GlyphProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M11.423 1A3.577 3.577 0 0 1 15 4.577c0 .27-.108.53-.3.722l-.528.529-1.971 1.971-5.059 5.059a3 3 0 0 1-1.533.82l-2.638.528a1 1 0 0 1-1.177-1.177l.528-2.638a3 3 0 0 1 .82-1.533l5.059-5.059 2.5-2.5c.191-.191.451-.299.722-.299m-2.31 4.009-4.91 4.91a1.5 1.5 0 0 0-.41.766l-.38 1.903 1.902-.38a1.5 1.5 0 0 0 .767-.41l4.91-4.91a2.08 2.08 0 0 0-1.88-1.88m3.098.658a3.6 3.6 0 0 0-1.878-1.879l1.28-1.28c.995.09 1.788.884 1.878 1.88z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const TrashBinIcon = (props: GlyphProps) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M9 2H7a.5.5 0 0 0-.5.5V3h3v-.5A.5.5 0 0 0 9 2m2 1v-.5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2V3H2.251a.75.75 0 0 0 0 1.5h.312l.317 7.625A3 3 0 0 0 5.878 15h4.245a3 3 0 0 0 2.997-2.875l.318-7.625h.312a.75.75 0 0 0 0-1.5zm.936 1.5H4.064l.315 7.562A1.5 1.5 0 0 0 5.878 13.5h4.245a1.5 1.5 0 0 0 1.498-1.438zm-6.186 2v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0m3.75-.75a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/*
 * Место аватара: у эталона строки со списком пользователей собраны на Avatar, которого в peakui
 * ещё нет (волна 3.1). Здесь — локальная заглушка той же формы и размера, чтобы раскладка строки
 * не изменилась.
 */
const AvatarStandIn = ({children}: {children: ReactNode}) => (
  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
    {children}
  </span>
);

interface User {
  email: string;
  id: string;
  name: string;
}

const USERS: User[] = [
  {email: "bob@peakui.dev", id: "1", name: "Bob"},
  {email: "fred@peakui.dev", id: "2", name: "Fred"},
  {email: "martha@peakui.dev", id: "3", name: "Martha"},
];

const UserItem = ({user}: {user: User}) => (
  <ListBox.Item id={user.id} textValue={user.name}>
    <AvatarStandIn>{user.name.charAt(0)}</AvatarStandIn>
    <div className="flex flex-col">
      <Label>{user.name}</Label>
      <Description>{user.email}</Description>
    </div>
    <ListBox.ItemIndicator />
  </ListBox.Item>
);

/*
 * Заголовок секции — ребёнок Header из react-aria-components: PeakUI ещё не портировал свою
 * обёртку Header, а это ровно тот примитив, который она обернёт.
 */
const ActionsSection = () => (
  <>
    <ListBox.Section>
      <Header>Actions</Header>
      <ListBox.Item id="new-file" textValue="New file">
        <div className="flex h-8 items-start justify-center pt-px">
          <SquarePlusIcon className="size-4 shrink-0 text-muted" />
        </div>
        <div className="flex flex-col">
          <Label>New file</Label>
          <Description>Create a new file</Description>
        </div>
        <Kbd className="ms-auto" variant="light">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>N</Kbd.Content>
        </Kbd>
      </ListBox.Item>
      <ListBox.Item id="edit-file" textValue="Edit file">
        <div className="flex h-8 items-start justify-center pt-px">
          <PencilIcon className="size-4 shrink-0 text-muted" />
        </div>
        <div className="flex flex-col">
          <Label>Edit file</Label>
          <Description>Make changes</Description>
        </div>
        <Kbd className="ms-auto" variant="light">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>E</Kbd.Content>
        </Kbd>
      </ListBox.Item>
    </ListBox.Section>
    <Separator />
    <ListBox.Section>
      <Header>Danger zone</Header>
      <ListBox.Item id="delete-file" textValue="Delete file" variant="danger">
        <div className="flex h-8 items-start justify-center pt-px">
          <TrashBinIcon className="size-4 shrink-0 text-danger" />
        </div>
        <div className="flex flex-col">
          <Label>Delete file</Label>
          <Description>Move to trash</Description>
        </div>
        <Kbd className="ms-auto" variant="light">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Abbr keyValue="shift" />
          <Kbd.Content>D</Kbd.Content>
        </Kbd>
      </ListBox.Item>
    </ListBox.Section>
  </>
);

const meta = {
  component: ListBox,
  parameters: {
    layout: "padded",
  },
  title: "Components/ListBox",
} satisfies Meta<typeof ListBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "По умолчанию",
  render: () => (
    <Showcase title="По умолчанию">
      <ListBox aria-label="Users" className="w-[220px]" selectionMode="single">
        {USERS.map((user) => (
          <UserItem key={user.id} user={user} />
        ))}
      </ListBox>
    </Showcase>
  ),
};

export const WithSections: Story = {
  name: "С секциями",
  render: () => (
    <Showcase title="С секциями">
      <Surface className="w-[256px] rounded-3xl shadow-surface">
        <ListBox
          aria-label="File actions"
          className="w-full p-2"
          selectionMode="none"
          onAction={(key) => alert(`Selected item: ${key}`)}
        >
          <ActionsSection />
        </ListBox>
      </Surface>
    </Showcase>
  ),
};

export const WithDisabledItems: Story = {
  name: "С отключёнными пунктами",
  render: () => (
    <Showcase title="С отключёнными пунктами">
      <Surface className="w-[256px] rounded-3xl shadow-surface">
        <ListBox
          aria-label="File actions"
          className="w-full p-2"
          disabledKeys={["delete-file"]}
          selectionMode="none"
          onAction={(key) => alert(`Selected item: ${key}`)}
        >
          <ActionsSection />
        </ListBox>
      </Surface>
    </Showcase>
  ),
};

export const MultiSelect: Story = {
  name: "Множественный выбор",
  render: () => (
    <Showcase title="Множественный выбор">
      <Surface className="w-[256px] rounded-3xl shadow-surface">
        <ListBox aria-label="Users" selectionMode="multiple">
          {USERS.map((user) => (
            <UserItem key={user.id} user={user} />
          ))}
        </ListBox>
      </Surface>
    </Showcase>
  ),
};

export const CustomCheckIcon: Story = {
  name: "Своя галочка",
  render: () => (
    <Showcase title="Своя галочка">
      <Surface className="w-[256px] rounded-3xl shadow-surface">
        <ListBox aria-label="Users" selectionMode="multiple">
          {USERS.map((user) => (
            <ListBox.Item key={user.id} id={user.id} textValue={user.name}>
              <AvatarStandIn>{user.name.charAt(0)}</AvatarStandIn>
              <div className="flex flex-col">
                <Label>{user.name}</Label>
                <Description>{user.email}</Description>
              </div>
              <ListBox.ItemIndicator>
                {({isSelected}) =>
                  isSelected ? <CheckIcon className="size-4 text-accent" /> : null
                }
              </ListBox.ItemIndicator>
            </ListBox.Item>
          ))}
        </ListBox>
      </Surface>
    </Showcase>
  ),
};

export const Controlled: Story = {
  name: "Управляемый выбор",
  render: () => {
    const [selected, setSelected] = useState<Selection>(new Set(["1"]));

    const selectedItems = selected === "all" ? "All" : [...selected].join(", ");

    return (
      <Showcase title="Управляемый выбор">
        <div className="space-y-4">
          <Surface className="w-[256px] rounded-3xl shadow-surface">
            <ListBox
              aria-label="Users"
              selectedKeys={selected}
              selectionMode="multiple"
              onSelectionChange={setSelected}
            >
              {USERS.map((user) => (
                <ListBox.Item key={user.id} id={user.id} textValue={user.name}>
                  <AvatarStandIn>{user.name.charAt(0)}</AvatarStandIn>
                  <div className="flex flex-col">
                    <Label>{user.name}</Label>
                    <Description>{user.email}</Description>
                  </div>
                  <ListBox.ItemIndicator>
                    {({isSelected}) =>
                      isSelected ? <CheckIcon className="size-4 text-accent" /> : null
                    }
                  </ListBox.ItemIndicator>
                </ListBox.Item>
              ))}
            </ListBox>
          </Surface>
          <p className="text-sm text-muted">
            Selected: {selectedItems.length > 0 ? selectedItems : "None"}
          </p>
        </div>
      </Showcase>
    );
  },
};

export const Virtualization: Story = {
  name: "Виртуализация",
  render: () => {
    const firstNames = [
      "Emma",
      "Liam",
      "Olivia",
      "Noah",
      "Ava",
      "James",
      "Sophia",
      "Oliver",
      "Isabella",
      "Lucas",
      "Mia",
      "Ethan",
      "Charlotte",
      "Mason",
      "Amelia",
      "Logan",
      "Harper",
      "Alexander",
      "Ella",
      "Benjamin",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Anderson",
      "Taylor",
      "Thomas",
      "Jackson",
      "White",
      "Harris",
      "Clark",
      "Lewis",
      "Robinson",
      "Walker",
    ];

    interface VirtualUser {
      id: number;
      name: string;
      email: string;
    }

    function generateUsers(n: number): VirtualUser[] {
      const users: VirtualUser[] = [];

      for (let i = 0; i < n; i++) {
        const firstName = firstNames[i % firstNames.length]!;
        const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]!;
        const name = `${firstName} ${lastName}`;

        users.push({
          id: i + 1,
          name,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.com`,
        });
      }

      return users;
    }

    const users = generateUsers(1000);

    return (
      <Showcase title="Виртуализация">
        <Virtualizer layout={ListLayout} layoutOptions={{rowHeight: 50}}>
          <ListBox
            aria-label="Virtualized list with 1000 items"
            className="h-[400px] w-[300px] overflow-y-auto"
            items={users}
          >
            {(user) => (
              <ListBox.Item id={user.id} textValue={user.name}>
                <div className="flex flex-col">
                  <Label>{user.name}</Label>
                  <Description>{user.email}</Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </Virtualizer>
      </Showcase>
    );
  },
};
