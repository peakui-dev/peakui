import type {Key} from "@react-types/shared";
import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";
import {Header} from "react-aria-components/ListBox";

import {Button} from "../button/index.ts";
import {Chip} from "../chip/index.ts";
import {Description} from "../description/index.ts";
import {FieldError} from "../field-error/index.ts";
import {Form} from "../form/index.ts";
import {Input} from "../input/index.ts";
import {Label} from "../label/index.ts";
import {ListBox} from "../list-box/index.ts";
import {Separator} from "../separator/index.ts";

import {ComboBox} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex min-h-72 flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    <div className="flex flex-col gap-8">{children}</div>
  </div>
);

interface Animal {
  id: string;
  name: string;
}

const ANIMALS: Animal[] = [
  {id: "aardvark", name: "Aardvark"},
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "kangaroo", name: "Kangaroo"},
  {id: "panda", name: "Panda"},
  {id: "snake", name: "Snake"},
];

/* The static list most stories share: one item per animal, with the selection indicator. */
const AnimalItems = () =>
  ANIMALS.map((animal) => (
    <ListBox.Item key={animal.id} id={animal.id} textValue={animal.name}>
      {animal.name}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  ));

const meta = {
  component: ComboBox,
  parameters: {
    layout: "centered",
  },
  title: "Components/Pickers/ComboBox",
} satisfies Meta<typeof ComboBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ComboBox className="w-[256px]">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const Variants: Story = {
  render: () => (
    <Showcase title="Variants">
      {(["primary", "secondary"] as const).map((variant) => (
        <ComboBox key={variant} className="w-[256px]" variant={variant}>
          <Label>{variant === "primary" ? "Primary" : "Secondary"}</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>{AnimalItems()}</ListBox>
          </ComboBox.Popover>
        </ComboBox>
      ))}
    </Showcase>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Showcase title="FullWidth">
      <div className="w-[400px]">
        <ComboBox fullWidth>
          <Label>Favorite Animal</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>{AnimalItems()}</ListBox>
          </ComboBox.Popover>
        </ComboBox>
      </div>
    </Showcase>
  ),
};

export const DefaultSelectedKey: Story = {
  render: () => (
    <Showcase title="DefaultSelectedKey">
      <ComboBox className="w-[256px]" defaultSelectedKey="cat">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Showcase title="WithDescription">
      <ComboBox className="w-[256px]">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <Description>Search and select your favorite animal</Description>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const WithSections: Story = {
  render: () => (
    <Showcase title="WithSections">
      <ComboBox className="w-[256px]">
        <Label>Country</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search countries..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
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
            </ListBox.Section>
            <Separator />
            <ListBox.Section>
              <Header>Asia</Header>
              <ListBox.Item id="japan" textValue="Japan">
                Japan
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="india" textValue="India">
                India
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox.Section>
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const WithDisabledOptions: Story = {
  render: () => (
    <Showcase title="WithDisabledOptions">
      <ComboBox className="w-[256px]" disabledKeys={["cat", "kangaroo"]}>
        <Label>Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const CustomIndicator: Story = {
  render: () => (
    <Showcase title="CustomIndicator">
      <ComboBox className="w-[256px]">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger>
            <svg aria-hidden className="size-4" fill="none" viewBox="0 0 16 16">
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </ComboBox.Trigger>
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const Required: Story = {
  render: () => (
    <Showcase title="Required">
      <Form
        className="flex w-[256px] flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <ComboBox isRequired className="w-full" name="animal">
          <Label>Favorite Animal</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>{AnimalItems()}</ListBox>
          </ComboBox.Popover>
          <FieldError />
        </ComboBox>
        <Button type="submit">Submit</Button>
      </Form>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: () => {
    const [selectedKey, setSelectedKey] = React.useState<Key | null>("dog");

    return (
      <Showcase title="Controlled">
        <div className="flex flex-col gap-2">
          <ComboBox
            className="w-[256px]"
            selectedKey={selectedKey}
            onSelectionChange={setSelectedKey}
          >
            <Label>Favorite Animal</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Search animals..." />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>{AnimalItems()}</ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <p className="text-sm text-muted">Selected: {selectedKey ?? "None"}</p>
        </div>
      </Showcase>
    );
  },
};

export const ControlledInputValue: Story = {
  render: () => {
    const [inputValue, setInputValue] = React.useState("Pan");

    return (
      <Showcase title="ControlledInputValue">
        <div className="flex flex-col gap-2">
          <ComboBox className="w-[256px]" inputValue={inputValue} onInputChange={setInputValue}>
            <Label>Favorite Animal</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Search animals..." />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Popover>
              <ListBox>{AnimalItems()}</ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <p className="text-sm text-muted">Input: {inputValue}</p>
        </div>
      </Showcase>
    );
  },
};

/*
 * A dynamic collection: `defaultItems` on the root and a function child on the list. The browser spec
 * runs this story, because jsdom cannot open a ComboBox over one.
 */
export const DynamicItems: Story = {
  render: () => (
    <Showcase title="DynamicItems">
      <ComboBox className="w-[256px]" defaultItems={ANIMALS}>
        <Label>Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox renderEmptyState={() => <p className="p-3 text-sm text-muted">No results</p>}>
            {(animal: Animal) => (
              <ListBox.Item id={animal.id} textValue={animal.name}>
                {animal.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const CustomFiltering: Story = {
  render: () => (
    <Showcase title="CustomFiltering">
      <ComboBox
        className="w-[256px]"
        defaultFilter={(text, inputValue) =>
          !inputValue || text.toLowerCase().startsWith(inputValue.toLowerCase())
        }
      >
        <Label>Animal (starts with)</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const AllowsCustomValue: Story = {
  render: () => (
    <Showcase title="AllowsCustomValue">
      <ComboBox allowsCustomValue className="w-[256px]">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search or type an animal..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const MenuTrigger: Story = {
  render: () => (
    <Showcase title="MenuTrigger">
      {(["focus", "input", "manual"] as const).map((menuTrigger) => (
        <ComboBox key={menuTrigger} className="w-[256px]" menuTrigger={menuTrigger}>
          <Label>{`menuTrigger="${menuTrigger}"`}</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>{AnimalItems()}</ListBox>
          </ComboBox.Popover>
        </ComboBox>
      ))}
    </Showcase>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Showcase title="Disabled">
      <ComboBox isDisabled className="w-[256px]" defaultSelectedKey="cat">
        <Label>Favorite Animal</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const MultipleSelection: Story = {
  render: () => (
    <Showcase title="MultipleSelection">
      <ComboBox className="w-[256px]" selectionMode="multiple">
        <Label>Favorite Animals</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Value placeholder="No animals selected" />
        <ComboBox.Popover>
          <ListBox selectionMode="multiple">{AnimalItems()}</ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};

export const MultipleSelectionControlled: Story = {
  render: () => {
    const [value, setValue] = React.useState<Key[]>(["cat", "dog"]);

    return (
      <Showcase title="MultipleSelectionControlled">
        <div className="flex flex-col gap-2">
          <ComboBox
            className="w-[256px]"
            selectionMode="multiple"
            value={value}
            onChange={(keys) => setValue(keys as Key[])}
          >
            <Label>Animals (controlled)</Label>
            <ComboBox.InputGroup>
              <Input placeholder="Search animals..." />
              <ComboBox.Trigger />
            </ComboBox.InputGroup>
            <ComboBox.Value placeholder="No animals selected" />
            <ComboBox.Popover>
              <ListBox selectionMode="multiple">{AnimalItems()}</ListBox>
            </ComboBox.Popover>
          </ComboBox>
          <p className="text-sm text-muted">Selected: {value.join(", ") || "None"}</p>
        </div>
      </Showcase>
    );
  },
};

export const MultipleSelectionWithChips: Story = {
  render: () => (
    <Showcase title="MultipleSelectionWithChips">
      <ComboBox<Animal, "multiple">
        className="w-[256px]"
        defaultValue={["cat", "dog"]}
        items={ANIMALS}
        selectionMode="multiple"
      >
        <Label>Favorite Animals</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Value<Animal> className="flex flex-wrap gap-2">
          {({isPlaceholder, selectedItems}) => {
            if (isPlaceholder || selectedItems.length === 0) {
              return <span className="text-sm text-muted">No animals selected</span>;
            }

            return selectedItems.map((item) =>
              item ? (
                <Chip key={item.id} variant="soft">
                  <Chip.Label>{item.name}</Chip.Label>
                </Chip>
              ) : null,
            );
          }}
        </ComboBox.Value>
        <ComboBox.Popover>
          <ListBox selectionMode="multiple">
            {(animal: Animal) => (
              <ListBox.Item id={animal.id} textValue={animal.name}>
                {animal.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
    </Showcase>
  ),
};
