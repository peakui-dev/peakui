import {
  Autocomplete,
  Avatar,
  Description,
  EmptyState,
  Label,
  ListBox,
  SearchField,
} from "@peakui/react";

const USERS = [
  {email: "bob@peakui.dev", id: "1", name: "Bob"},
  {email: "fred@peakui.dev", id: "2", name: "Fred"},
  {email: "martha@peakui.dev", id: "3", name: "Martha"},
];

export function UserSelection() {
  return (
    <Autocomplete className="w-[256px]" placeholder="Select a user">
      <Label>User</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({defaultChildren, isPlaceholder, state}) => {
            const user = USERS.find((u) => u.id === state.selectedItems[0]?.key);

            return isPlaceholder || !user ? (
              defaultChildren
            ) : (
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
      </Autocomplete.Popover>
    </Autocomplete>
  );
}
