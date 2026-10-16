"use client";

import {Description, Label, ListBox, Select} from "@peakui/react";

const USERS = [
  {email: "bob@peakui.dev", id: "1", name: "Bob"},
  {email: "fred@peakui.dev", id: "2", name: "Fred"},
  {email: "martha@peakui.dev", id: "3", name: "Martha"},
];

/* Avatar is not ported yet; a span of the same shape stands in for it. */
const AvatarStandIn = ({children}: {children: string}) => (
  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-[10px] font-medium text-surface-secondary-foreground">
    {children}
  </span>
);

export function CustomValue() {
  return (
    <Select className="w-[256px]" placeholder="Select a user">
      <Label>User</Label>
      <Select.Trigger>
        <Select.Value>
          {({defaultChildren, isPlaceholder, state}) => {
            if (isPlaceholder || state.selectedItems.length === 0) {
              return defaultChildren;
            }

            if (state.selectedItems.length > 1) {
              return `${state.selectedItems.length} users selected`;
            }

            const selectedKey = state.selectedItems[0]?.key;
            const selectedItem = USERS.find((user) => user.id === selectedKey);

            if (!selectedItem) {
              return defaultChildren;
            }

            return (
              <span className="flex items-center gap-2">
                <AvatarStandIn>{selectedItem.name.charAt(0)}</AvatarStandIn>
                {selectedItem.name}
              </span>
            );
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
