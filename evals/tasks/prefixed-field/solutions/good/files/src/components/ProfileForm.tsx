import {Input, InputGroup, Label, TextField} from "@peakui/react";

export function ProfileForm() {
  return (
    <form className="flex max-w-md flex-col gap-4 rounded-xl bg-neutral-100 p-6">
      <h2 className="text-lg font-semibold">Profile</h2>
      <TextField name="displayName" variant="secondary">
        <Label>Display name</Label>
        <Input />
      </TextField>
      <TextField name="website" variant="secondary">
        <Label>Website</Label>
        <InputGroup>
          <InputGroup.Prefix>https://</InputGroup.Prefix>
          <InputGroup.Input />
        </InputGroup>
      </TextField>
    </form>
  );
}
