import type {Profile, ProfileSettingsProps} from "../types";
import type {FormEvent} from "react";

import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  Radio,
  RadioGroup,
  Spinner,
  Switch,
  TextArea,
  TextField,
  buttonVariants,
} from "@peakui/react";

const PLANS: Array<{label: string; value: Profile["plan"]}> = [
  {label: "Free", value: "free"},
  {label: "Pro", value: "pro"},
  {label: "Team", value: "team"},
];

export function ProfileSettings({onSave, profile, saving}: ProfileSettingsProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const data = new FormData(event.currentTarget);

    onSave({
      bio: String(data.get("bio") ?? ""),
      displayName: String(data.get("displayName") ?? ""),
      email: String(data.get("email") ?? ""),
      newsletter: data.get("newsletter") !== null,
      plan: (data.get("plan") ?? profile.plan) as Profile["plan"],
    });
  }

  return (
    <Card>
      <Card.Header>
        <Card.Title>Profile</Card.Title>
      </Card.Header>
      <Card.Content>
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired defaultValue={profile.displayName} name="displayName">
            <Label>Display name</Label>
            <Input />
            <FieldError />
          </TextField>
          <TextField isRequired defaultValue={profile.email} name="email" type="email">
            <Label>Email</Label>
            <Input />
            <FieldError />
          </TextField>
          <TextField defaultValue={profile.bio} name="bio">
            <Label>Bio</Label>
            <TextArea rows={4} />
          </TextField>
          <Switch defaultSelected={profile.newsletter} name="newsletter">
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Email me product news
            </Switch.Content>
          </Switch>
          <RadioGroup defaultValue={profile.plan} name="plan">
            <Label>Plan</Label>
            {PLANS.map((plan) => (
              <Radio key={plan.value} value={plan.value}>
                <Radio.Content>
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  {plan.label}
                </Radio.Content>
              </Radio>
            ))}
          </RadioGroup>
          <div className="flex gap-3">
            <Button isPending={saving} type="submit">
              {saving ? <Spinner aria-hidden color="current" size="sm" /> : null}
              Save changes
            </Button>
            <a className={buttonVariants({variant: "secondary"})} href="/account">
              Cancel
            </a>
          </div>
        </Form>
      </Card.Content>
    </Card>
  );
}
