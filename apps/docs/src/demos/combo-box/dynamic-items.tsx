import {ComboBox, Input, Label, ListBox} from "@peakui/react";

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
];

export function DynamicItems() {
  // The combo box filters `defaultItems` as the user types; it leaves `items` to the consumer.
  return (
    <ComboBox className="w-[256px]" defaultItems={ANIMALS}>
      <Label>Animal</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Search animals..." />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {(animal: Animal) => (
            <ListBox.Item id={animal.id} textValue={animal.name}>
              {animal.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}
