import {Chip, ComboBox, Input, Label, ListBox} from "@peakui/react";

interface Animal {
  id: string;
  name: string;
}

const ANIMALS: Animal[] = [
  {id: "aardvark", name: "Aardvark"},
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "kangaroo", name: "Kangaroo"},
];

export function MultipleSelectionWithChips() {
  return (
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
        {({isPlaceholder, selectedItems}) =>
          isPlaceholder || selectedItems.length === 0 ? (
            <span className="text-sm text-muted">No animals selected</span>
          ) : (
            selectedItems.map((item) =>
              item ? (
                <Chip key={item.id} variant="soft">
                  <Chip.Label>{item.name}</Chip.Label>
                </Chip>
              ) : null,
            )
          )
        }
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
  );
}
