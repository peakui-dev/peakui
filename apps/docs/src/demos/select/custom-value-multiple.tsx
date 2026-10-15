"use client";

import {Chip, Description, Label, ListBox, Select} from "@peakui/react";

const USERS = [
  {email: "bob@peakui.dev", id: "1", name: "Bob"},
  {email: "fred@peakui.dev", id: "2", name: "Fred"},
  {email: "martha@peakui.dev", id: "3", name: "Martha"},
  {email: "jane@peakui.dev", id: "4", name: "Jane"},
];

/* Avatar is not ported yet; a span of the same shape stands in for it. */
const AvatarStandIn = ({children}: {children: string}) => (
  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-[10px] font-medium text-surface-secondary-foreground">
    {children}
  </span>
);

export function CustomValueMultiple() {
  return (
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

            return state.selectedItems.map(({key}) => {
              const selectedItem = USERS.find((user) => user.id === key);

              if (!selectedItem) {
                return null;
              }

              return (
                <Chip key={key} variant="soft">
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
            <ListBox.Item key={user.id} id={user.id} textValue={user.name}>
              <AvatarStandIn>{user.name.charAt(0)}</AvatarStandIn>
              <span className="flex flex-col">
                <Label>{user.name}</Label>
                <Description>{user.email}</Description>
              </span>
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
