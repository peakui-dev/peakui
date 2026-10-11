import type {ProfileSettingsProps} from "../types";

import {Button, Card, Input, Switch} from "@peakui/react";

export function ProfileSettings({onSave, profile, saving}: ProfileSettingsProps) {
  return (
    <Card title="Profile">
      <form className="flex flex-col gap-4" onSubmit={() => onSave(profile)}>
        <Input
          required
          defaultValue={profile.displayName}
          label="Display name"
          name="displayName"
        />
        <Input
          required
          defaultValue={profile.email}
          errorMessage="Enter a valid email"
          label="Email"
          name="email"
          type="email"
        />
        <textarea defaultValue={profile.bio} name="bio" />
        <Switch defaultSelected={profile.newsletter} label="Email me product news" />
        <select defaultValue={profile.plan} name="plan">
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team">Team</option>
        </select>
        <div className="flex gap-3">
          <Button isLoading={saving} type="submit">
            Save changes
          </Button>
          <Button href="/account" variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
