import type {Key} from "@react-types/shared";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React, {useEffect, useState} from "react";
import {Header} from "react-aria-components/ListBox";
import {ListLayout, Virtualizer} from "react-aria-components/Virtualizer";

import {Avatar} from "../avatar/index.ts";
import {Button} from "../button/index.ts";
import {Description} from "../description/index.ts";
import {EmptyState} from "../empty-state/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Form} from "../form/index.ts";
import {Label} from "../label/index.ts";
import {ListBox} from "../list-box/index.ts";
import {SearchField} from "../search-field/index.ts";
import {Separator} from "../separator/index.ts";
import {Spinner} from "../spinner/index.ts";
import {Tag} from "../tag/index.ts";
import {TagGroup} from "../tag-group/index.ts";

import {Autocomplete} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex min-h-96 flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-8">{children}</div>
  </div>
);

interface Item {
  id: string;
  name: string;
}

const ANIMALS: Item[] = [
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "elephant", name: "Elephant"},
  {id: "lion", name: "Lion"},
  {id: "tiger", name: "Tiger"},
  {id: "giraffe", name: "Giraffe"},
];

const STATES: Item[] = [
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "florida", name: "Florida"},
  {id: "new-york", name: "New York"},
  {id: "illinois", name: "Illinois"},
  {id: "pennsylvania", name: "Pennsylvania"},
];

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

/*
 * The search field and the options of every story below: the popover content never changes, the
 * stories vary the root and the trigger.
 */
function SearchableItems({
  disabledKeys,
  items,
  searchLabel,
}: {
  disabledKeys?: Iterable<Key>;
  items: Item[];
  searchLabel: string;
}) {
  return (
    <Autocomplete.Filter>
      <SearchField autoFocus aria-label={searchLabel} variant="secondary">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder={`${searchLabel}...`} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <ListBox
        disabledKeys={disabledKeys}
        renderEmptyState={() => <EmptyState>No results found</EmptyState>}
      >
        {items.map((item) => (
          <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
            {item.name}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Autocomplete.Filter>
  );
}

const meta = {
  component: Autocomplete,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/Autocomplete",
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <Autocomplete className="w-[256px]" placeholder="Select an animal">
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={ANIMALS} searchLabel="Search animals" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

export const WithClearButton: Story = {
  render: () => (
    <Showcase title="WithClearButton">
      <Autocomplete className="w-[256px]" defaultValue="dog" placeholder="Select an animal">
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={ANIMALS} searchLabel="Search animals" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

function WithOnClearCallbackStory() {
  const [value, setValue] = useState<Key | null>("dog");
  const [clearCount, setClearCount] = useState(0);

  return (
    <Showcase title="WithOnClearCallback">
      <Autocomplete
        className="w-[256px]"
        placeholder="Select an animal"
        value={value}
        onChange={(next) => setValue(next as Key | null)}
        onClear={() => setClearCount((count) => count + 1)}
      >
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={ANIMALS} searchLabel="Search animals" />
        </Autocomplete.Popover>
      </Autocomplete>
      <p className="text-sm text-muted">Cleared {clearCount} times</p>
    </Showcase>
  );
}

export const WithOnClearCallback: Story = {
  render: () => <WithOnClearCallbackStory />,
};

export const Variants: Story = {
  render: () => (
    <Showcase title="Variants">
      {(["primary", "secondary"] as const).map((variant) => (
        <Autocomplete
          key={variant}
          className="w-[256px]"
          placeholder="Select an animal"
          variant={variant}
        >
          <Label>{variant === "primary" ? "Primary" : "Secondary"}</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <SearchableItems items={ANIMALS} searchLabel="Search animals" />
          </Autocomplete.Popover>
        </Autocomplete>
      ))}
    </Showcase>
  ),
};

function MultipleSelectStory() {
  const [value, setValue] = useState<Key[]>([]);

  return (
    <Showcase title="MultipleSelect">
      <Autocomplete
        className="w-[256px]"
        placeholder="Select states"
        selectionMode="multiple"
        value={value}
        onChange={(keys) => setValue(keys as Key[])}
      >
        <Label>States</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value>
            {({defaultChildren, isPlaceholder, state}) => {
              if (isPlaceholder || state.selectedItems.length === 0) {
                return defaultChildren;
              }

              return (
                <TagGroup
                  aria-label="Selected states"
                  size="sm"
                  onRemove={(keys) => setValue((prev) => prev.filter((key) => !keys.has(key)))}
                >
                  <TagGroup.List>
                    {state.selectedItems.map((selected) => {
                      const item = STATES.find((state) => state.id === selected.key);

                      return item ? (
                        <Tag key={item.id} id={item.id}>
                          {item.name}
                        </Tag>
                      ) : null;
                    })}
                  </TagGroup.List>
                </TagGroup>
              );
            }}
          </Autocomplete.Value>
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={STATES} searchLabel="Search states" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  );
}

export const MultipleSelect: Story = {
  render: () => <MultipleSelectStory />,
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="FullWidth">
      <div className="w-[480px]">
        <Autocomplete fullWidth placeholder="Select a state">
          <Label>State</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <SearchableItems items={STATES} searchLabel="Search states" />
          </Autocomplete.Popover>
        </Autocomplete>
      </div>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="WithDescription">
      <Autocomplete className="w-[256px]" placeholder="Select a state">
        <Label>State</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Description>Type to narrow the list</Description>
        <Autocomplete.Popover>
          <SearchableItems items={STATES} searchLabel="Search states" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

export const WithSections: Story = {
  render: () => {
    const sections = [
      {name: "North America", items: ["United States", "Canada", "Mexico"]},
      {name: "Europe", items: ["United Kingdom", "France", "Germany"]},
      {name: "Asia", items: ["Japan", "India", "South Korea"]},
    ];

    return (
      <Showcase title="WithSections">
        <Autocomplete className="w-[256px]" placeholder="Select a country">
          <Label>Country</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.ClearButton />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <SectionedItems sections={sections} />
          </Autocomplete.Popover>
        </Autocomplete>
      </Showcase>
    );
  },
};

function SectionedItems({sections}: {sections: {items: string[]; name: string}[]}) {
  return (
    <Autocomplete.Filter>
      <SearchField autoFocus aria-label="Search countries" variant="secondary">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search countries..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
        {sections.map((section, index) => (
          <React.Fragment key={section.name}>
            {index > 0 ? <Separator /> : null}
            <ListBox.Section>
              <Header>{section.name}</Header>
              {section.items.map((name) => (
                <ListBox.Item key={name} id={name} textValue={name}>
                  {name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox.Section>
          </React.Fragment>
        ))}
      </ListBox>
    </Autocomplete.Filter>
  );
}

export const WithDisabledOptions: Story = {
  render: () => (
    <Showcase title="WithDisabledOptions">
      <Autocomplete className="w-[256px]" placeholder="Select an animal">
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems
            disabledKeys={["elephant", "tiger"]}
            items={ANIMALS}
            searchLabel="Search animals"
          />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

/* Story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — see THIRD-PARTY-NOTICES.md. */
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

export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="CustomIndicator">
      <Autocomplete className="w-[256px]" placeholder="Select an animal">
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator>
            <ChevronsExpandVerticalIcon />
          </Autocomplete.Indicator>
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={ANIMALS} searchLabel="Search animals" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

export const Required: Story = {
  render: () => (
    <Showcase title="Required">
      <Form
        className="flex w-[256px] flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Autocomplete isRequired className="w-full" name="state" placeholder="Select one">
          <Label>State</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.ClearButton />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <SearchableItems items={STATES} searchLabel="Search states" />
          </Autocomplete.Popover>
          <FieldError />
        </Autocomplete>
        <Button type="submit">Submit</Button>
      </Form>
    </Showcase>
  ),
};

function ControlledStory() {
  const [value, setValue] = useState<Key | null>("texas");

  return (
    <Showcase title="Controlled">
      <Autocomplete
        className="w-[256px]"
        placeholder="Select a state"
        value={value}
        onChange={(next) => setValue(next as Key | null)}
      >
        <Label>State</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={STATES} searchLabel="Search states" />
        </Autocomplete.Popover>
      </Autocomplete>
      <p className="text-sm text-muted">Selected key: {value ?? "none"}</p>
    </Showcase>
  );
}

export const Controlled: Story = {
  render: () => <ControlledStory />,
};

function ControlledOpenStateStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Showcase title="ControlledOpenState">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onPress={() => setIsOpen((open) => !open)}>
          {isOpen ? "Close" : "Open"}
        </Button>
        <p className="text-sm text-muted">The popover is {isOpen ? "open" : "closed"}</p>
      </div>
      <Autocomplete
        className="w-[256px]"
        isOpen={isOpen}
        placeholder="Select a state"
        onOpenChange={setIsOpen}
      >
        <Label>State</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={STATES} searchLabel="Search states" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  );
}

export const ControlledOpenState: Story = {
  render: () => <ControlledOpenStateStory />,
};

/*
 * The library does no data fetching, and neither does this story: a timer stands in for the
 * request so the loading state and the controlled search text stay visible. The consumer's list
 * owns the filtering, which is why the Filter receives `inputValue` and no `filter`.
 */
function AsynchronousFilteringStory() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>(ANIMALS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(ANIMALS.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())));
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Showcase title="AsynchronousFiltering">
      <Autocomplete allowsEmptyCollection className="w-[256px]" placeholder="Search...">
        <Label>Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter
            inputValue={query}
            onInputChange={(next) => {
              setQuery(next);
              setIsLoading(true);
            }}
          >
            <SearchField autoFocus aria-label="Search animals" variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search animals..." />
                {isLoading ? <Spinner className="me-2" size="sm" /> : null}
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox
              items={items}
              renderEmptyState={() => <EmptyState>No results found</EmptyState>}
            >
              {(item: Item) => (
                <ListBox.Item id={item.id} textValue={item.name}>
                  {item.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  );
}

export const AsynchronousFiltering: Story = {
  render: () => <AsynchronousFilteringStory />,
};

const MANY_USERS: User[] = Array.from({length: 1000}, (_, index) => ({
  email: `user${index + 1}@peakui.dev`,
  id: String(index + 1),
  name: `User ${index + 1}`,
}));

export const Virtualization: Story = {
  render: () => {
    function Content() {
      return (
        <Autocomplete.Filter>
          <SearchField autoFocus aria-label="Search users" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search users..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <Virtualizer layout={ListLayout} layoutOptions={{rowHeight: 50}}>
            <ListBox
              items={MANY_USERS}
              renderEmptyState={() => <EmptyState>No results found</EmptyState>}
            >
              {(user: User) => (
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
        </Autocomplete.Filter>
      );
    }

    return (
      <Showcase title="Virtualization">
        <Autocomplete className="w-[256px]" placeholder="Select a user">
          <Label>User</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.ClearButton />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <Content />
          </Autocomplete.Popover>
        </Autocomplete>
      </Showcase>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <Autocomplete isDisabled className="w-[256px]" defaultValue="cat" placeholder="Select one">
        <Label>Favorite Animal</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <SearchableItems items={ANIMALS} searchLabel="Search animals" />
        </Autocomplete.Popover>
      </Autocomplete>
    </Showcase>
  ),
};

export const UserSelection: Story = {
  render: () => {
    function Content() {
      return (
        <Autocomplete.Filter>
          <SearchField autoFocus aria-label="Search users" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search users..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
            {USERS.map((user) => (
              <ListBox.Item key={user.id} id={user.id} textValue={user.name}>
                <Avatar size="sm">
                  <Avatar.Fallback>{user.name.charAt(0)}</Avatar.Fallback>
                </Avatar>
                <div className="flex flex-col">
                  <Label>{user.name}</Label>
                  <Description>{user.email}</Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Autocomplete.Filter>
      );
    }

    return (
      <Showcase title="UserSelection">
        <Autocomplete className="w-[256px]" placeholder="Select a user">
          <Label>User</Label>
          <Autocomplete.Trigger>
            <Autocomplete.Value>
              {({defaultChildren, isPlaceholder, state}) => {
                const user = USERS.find((u) => u.id === state.selectedItems[0]?.key);

                if (isPlaceholder || !user) {
                  return defaultChildren;
                }

                return (
                  <span className="flex items-center gap-2">
                    <Avatar className="size-4" size="sm">
                      <Avatar.Fallback>{user.name.charAt(0)}</Avatar.Fallback>
                    </Avatar>
                    {user.name}
                  </span>
                );
              }}
            </Autocomplete.Value>
            <Autocomplete.ClearButton />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <Content />
          </Autocomplete.Popover>
        </Autocomplete>
      </Showcase>
    );
  },
};
