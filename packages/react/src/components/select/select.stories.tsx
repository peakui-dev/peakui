import type {Key} from "@react-types/shared";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";
import {Collection, Header, ListBoxLoadMoreItem} from "react-aria-components/ListBox";

import {Button} from "../button/index.ts";
import {Chip} from "../chip/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Form} from "../form/index.ts";
import {Label} from "../label/index.ts";
import {ListBox} from "../list-box/index.ts";
import {Separator} from "../separator/index.ts";
import {Spinner} from "../spinner/index.ts";

import {Select} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex min-h-56 flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-8">{children}</div>
  </div>
);

/*
 * Story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md.
 */
const ChevronsExpandVerticalIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M3.58 4.109a.75.75 0 0 0 1.061 1.06L8 1.811l3.354 3.353a.75.75 0 0 0 1.06-1.06L8.53.22a.75.75 0 0 0-1.06 0zm8.84 7.782a.75.75 0 1 0-1.061-1.06l-3.36 3.358l-3.353-3.353a.75.75 0 1 0-1.06 1.06L7.47 15.78a.75.75 0 0 0 1.06 0z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

/*
 * Avatar stand-in: the reference builds these rows on Avatar, which peakui has not ported yet
 * (roadmap wave 3.1). Same shape and size, so the row layout is unchanged.
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
  {email: "john@peakui.dev", id: "4", name: "John"},
  {email: "jane@peakui.dev", id: "5", name: "Jane"},
];

const STATES = [
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "florida", name: "Florida"},
  {id: "new-york", name: "New York"},
  {id: "illinois", name: "Illinois"},
  {id: "pennsylvania", name: "Pennsylvania"},
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

interface Pokemon {
  name: string;
}

/*
 * The reference drives this story with useAsyncList from @react-stately/data, which is not one
 * of peakui's dependencies and which this order adds none of — so the story owns a minimal
 * cursor-paginated hook of the same shape: items, loadingState, loadMore.
 */
function usePokemonList() {
  const [items, setItems] = React.useState<Pokemon[]>([]);
  const [loadingState, setLoadingState] = React.useState<"idle" | "loading" | "loadingMore">(
    "idle",
  );
  const cursorRef = React.useRef<string | null>("https://pokeapi.co/api/v2/pokemon");
  const inFlightRef = React.useRef(false);

  const load = React.useCallback(async (mode: "loading" | "loadingMore") => {
    if (inFlightRef.current) return;

    const cursor = cursorRef.current;

    if (!cursor) return;

    inFlightRef.current = true;
    setLoadingState(mode);

    try {
      const res = await fetch(cursor);
      const json: {next?: string; results?: Pokemon[]} = await res.json();

      setItems((previous) => [...previous, ...(json.results ?? [])]);
      cursorRef.current = json.next ?? null;
    } catch {
      // Aborted or offline: keep whatever has loaded.
    } finally {
      inFlightRef.current = false;
      setLoadingState("idle");
    }
  }, []);

  React.useEffect(() => {
    void load("loading");
  }, [load]);

  return {items, loadingState, loadMore: () => void load("loadingMore")};
}

const meta = {
  component: Select,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/Select",
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Select className="w-[256px]" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-york" textValue="New York">
              New York
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="washington" textValue="Washington">
              Washington
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <Showcase title="Variants">
      <Select className="w-[256px]" placeholder="Select one" variant="primary">
        <Label>Primary variant</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="option1" textValue="Option 1">
              Option 1
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="option2" textValue="Option 2">
              Option 2
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <Select className="w-[256px]" placeholder="Select one" variant="secondary">
        <Label>Secondary variant</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="option1" textValue="Option 1">
              Option 1
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="option2" textValue="Option 2">
              Option 2
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="FullWidth">
      <div className="w-[400px] space-y-4">
        <Select fullWidth placeholder="Select one">
          <Label>State</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="florida" textValue="Florida">
                Florida
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="delaware" textValue="Delaware">
                Delaware
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="california" textValue="California">
                California
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="WithDescription">
      <Select className="w-[256px]" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-york" textValue="New York">
              New York
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="washington" textValue="Washington">
              Washington
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
        <Description>Select your state of residence</Description>
      </Select>
    </Showcase>
  ),
};

export const MultipleSelect: Story = {
  render: () => (
    <Showcase title="MultipleSelect">
      <Select className="w-[256px]" placeholder="Select countries" selectionMode="multiple">
        <Label>Countries to Visit</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox selectionMode="multiple">
            <ListBox.Item id="argentina" textValue="Argentina">
              Argentina
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="venezuela" textValue="Venezuela">
              Venezuela
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="japan" textValue="Japan">
              Japan
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="france" textValue="France">
              France
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="italy" textValue="Italy">
              Italy
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="spain" textValue="Spain">
              Spain
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="thailand" textValue="Thailand">
              Thailand
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-zealand" textValue="New Zealand">
              New Zealand
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="iceland" textValue="Iceland">
              Iceland
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Showcase title="WithSections">
      <Select className="w-[256px]" placeholder="Select a country">
        <Label>Country</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Section>
              <Header>North America</Header>
              <ListBox.Item id="usa" textValue="United States">
                United States
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="canada" textValue="Canada">
                Canada
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="mexico" textValue="Mexico">
                Mexico
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox.Section>
            <Separator />
            <ListBox.Section>
              <Header>Europe</Header>
              <ListBox.Item id="uk" textValue="United Kingdom">
                United Kingdom
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="france" textValue="France">
                France
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="germany" textValue="Germany">
                Germany
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="spain" textValue="Spain">
                Spain
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="italy" textValue="Italy">
                Italy
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox.Section>
            <Separator />
            <ListBox.Section>
              <Header>Asia</Header>
              <ListBox.Item id="japan" textValue="Japan">
                Japan
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="china" textValue="China">
                China
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="india" textValue="India">
                India
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="south-korea" textValue="South Korea">
                South Korea
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox.Section>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Showcase title="WithDisabledOptions">
      <Select
        className="w-[256px]"
        disabledKeys={["cat", "kangaroo"]}
        placeholder="Select an animal"
      >
        <Label>Animal</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="dog" textValue="Dog">
              Dog
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="cat" textValue="Cat">
              Cat
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="bird" textValue="Bird">
              Bird
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="kangaroo" textValue="Kangaroo">
              Kangaroo
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="elephant" textValue="Elephant">
              Elephant
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="tiger" textValue="Tiger">
              Tiger
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const WithClearButton: Story = {
  render: () => (
    <Showcase title="WithClearButton">
      <Select className="w-[256px]" defaultValue="california" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.ClearButton />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-york" textValue="New York">
              New York
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="washington" textValue="Washington">
              Washington
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="CustomIndicator">
      <Select className="w-[256px]" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator className="size-3">
            <ChevronsExpandVerticalIcon />
          </Select.Indicator>
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-york" textValue="New York">
              New York
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="washington" textValue="Washington">
              Washington
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const Required: Story = {
  render: () => {
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data: Record<string, string> = {};

      // Convert FormData to plain object
      formData.forEach((value, key) => {
        data[key] = value.toString();
      });

      alert("Form submitted successfully!");
    };

    return (
      <Showcase title="Required">
        <Form className="flex w-[256px] flex-col gap-4" onSubmit={onSubmit}>
          <Select isRequired className="w-full" name="state" placeholder="Select one">
            <Label>State</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="florida" textValue="Florida">
                  Florida
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="delaware" textValue="Delaware">
                  Delaware
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="california" textValue="California">
                  California
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="texas" textValue="Texas">
                  Texas
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="new-york" textValue="New York">
                  New York
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="washington" textValue="Washington">
                  Washington
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
            <FieldError />
          </Select>
          <Select isRequired className="w-full" name="country" placeholder="Select a country">
            <Label>Country</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="usa" textValue="United States">
                  United States
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="canada" textValue="Canada">
                  Canada
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="mexico" textValue="Mexico">
                  Mexico
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="uk" textValue="United Kingdom">
                  United Kingdom
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="france" textValue="France">
                  France
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="germany" textValue="Germany">
                  Germany
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
            <FieldError />
          </Select>
          <Button type="submit">Submit</Button>
        </Form>
      </Showcase>
    );
  },
};

export const CustomValue: Story = {
  render: () => (
    <Showcase title="CustomValue">
      <Select className="w-[256px]" placeholder="Select a user">
        <Label>User</Label>
        <Select.Trigger>
          <Select.Value>
            {({defaultChildren, isPlaceholder, state}) => {
              if (isPlaceholder || state.selectedItems.length === 0) {
                return defaultChildren;
              }

              const selectedItems = state.selectedItems;

              if (selectedItems.length > 1) {
                return `${selectedItems.length} users selected`;
              }

              const selectedKey = selectedItems[0]?.key;
              const selectedItem = USERS.find((user) => user.id === selectedKey);

              if (!selectedItem) {
                return defaultChildren;
              }

              return (
                <div className="flex items-center gap-2">
                  <AvatarStandIn>{selectedItem.name.charAt(0)}</AvatarStandIn>
                  <span>{selectedItem.name}</span>
                </div>
              );
            }}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {USERS.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const CustomValueMultiple: Story = {
  render: () => (
    <Showcase title="CustomValueMultiple">
      <Select
        className="w-[256px]"
        defaultValue={["1", "2"]}
        placeholder="Select your teammates"
        selectionMode="multiple"
      >
        <Label>Users</Label>
        <Select.Trigger>
          <Select.Value className="no-truncate flex flex-wrap gap-2">
            {({defaultChildren, isPlaceholder, state}) => {
              if (isPlaceholder || state.selectedItems.length === 0) {
                return defaultChildren;
              }

              const selectedItemsKeys = state.selectedItems.map((item) => item.key);

              return selectedItemsKeys.map((selectedItemKey) => {
                const selectedItem = USERS.find((user) => user.id === selectedItemKey);

                if (!selectedItem) {
                  return null;
                }

                return (
                  <Chip key={selectedItemKey} variant="soft">
                    <AvatarStandIn>{selectedItem.name.charAt(0)}</AvatarStandIn>
                    <Chip.Label>{selectedItem.name}</Chip.Label>
                  </Chip>
                );
              });
            }}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {USERS.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [state, setState] = React.useState<Key | null>("california");

    const selectedState = STATES.find((s) => s.id === state);

    return (
      <Showcase title="Controlled">
        <Select
          className="w-[256px]"
          placeholder="Select a state"
          value={state}
          onChange={(value) => setState(value)}
        >
          <Label>State (controlled)</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATES.map((state) => (
                <ListBox.Item key={state.id} id={state.id} textValue={state.name}>
                  {state.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <p className="text-sm text-muted">Selected: {selectedState?.name || "None"}</p>
      </Showcase>
    );
  },
};

export const ControlledMultiple: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<Key[]>(["california", "texas"]);

    return (
      <Showcase title="ControlledMultiple">
        <Select
          className="w-[256px]"
          placeholder="Select states"
          selectionMode="multiple"
          value={selected}
          onChange={(keys) => setSelected(keys as Key[])}
        >
          <Label>States (controlled multiple)</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox selectionMode="multiple">
              <ListBox.Item id="california" textValue="California">
                California
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="texas" textValue="Texas">
                Texas
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="florida" textValue="Florida">
                Florida
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="new-york" textValue="New York">
                New York
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="illinois" textValue="Illinois">
                Illinois
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="pennsylvania" textValue="Pennsylvania">
                Pennsylvania
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
        <p className="text-sm text-muted">
          Selected: {selected.length > 0 ? selected.join(", ") : "None"}
        </p>
      </Showcase>
    );
  },
};

export const ControlledOpenState: Story = {
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <Showcase title="ControlledOpenState">
        <Select
          className="w-[256px]"
          isOpen={isOpen}
          placeholder="Select one"
          onOpenChange={setIsOpen}
        >
          <Label>State</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item id="florida" textValue="Florida">
                Florida
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="delaware" textValue="Delaware">
                Delaware
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="california" textValue="California">
                California
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="texas" textValue="Texas">
                Texas
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="new-york" textValue="New York">
                New York
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="washington" textValue="Washington">
                Washington
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
        <Button onPress={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "Open"} Select</Button>
        <p className="text-sm text-muted">Select is {isOpen ? "open" : "closed"}</p>
      </Showcase>
    );
  },
};

export const AsynchronousLoading: Story = {
  render: () => {
    const list = usePokemonList();

    return (
      <Showcase title="AsynchronousLoading">
        <Select className="w-[256px]" placeholder="Select a Pokemon">
          <Label>Pick a Pokemon</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <Collection items={list.items}>
                {(item: Pokemon) => (
                  <ListBox.Item id={item.name} textValue={item.name}>
                    {item.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </Collection>
              <ListBoxLoadMoreItem
                isLoading={list.loadingState === "loadingMore"}
                onLoadMore={list.loadMore}
              >
                <div className="flex items-center justify-center gap-2 py-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-muted">Loading more...</span>
                </div>
              </ListBoxLoadMoreItem>
            </ListBox>
          </Select.Popover>
        </Select>
      </Showcase>
    );
  },
};

/*
 * A dynamic `items` collection with function children — the collection contract jsdom refuses
 * (RAC's Select never reports the dynamic collection ready there), so the unit suite composes
 * static item children instead and the e2e spec in apps/storybook/e2e/select.spec.ts proves
 * this story in a real browser. The `Collection` inside the ListBox is RAC's dynamic-collection
 * mechanism: the Select builds its collection from children, not from a root `items` prop.
 */
export const DynamicItems: Story = {
  render: () => (
    <Showcase title="DynamicItems">
      <Select className="w-[256px]" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <Collection items={STATES}>
              {(state) => (
                <ListBox.Item id={state.id} textValue={state.name}>
                  {state.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </Collection>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <Select isDisabled className="w-[256px]" defaultValue="california" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="new-york" textValue="New York">
              New York
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="washington" textValue="Washington">
              Washington
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <Select
        isDisabled
        className="w-[256px]"
        defaultValue={["argentina", "japan", "france"]}
        placeholder="Select countries"
        selectionMode="multiple"
      >
        <Label>Countries to Visit</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="argentina" textValue="Argentina">
              Argentina
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="venezuela" textValue="Venezuela">
              Venezuela
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="japan" textValue="Japan">
              Japan
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="france" textValue="France">
              France
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="italy" textValue="Italy">
              Italy
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="spain" textValue="Spain">
              Spain
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
    </Showcase>
  ),
};
