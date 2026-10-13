"use client";

import {Envelope} from "@gravity-ui/icons";
import {Alert, Button, Card, Chip, InputGroup, Switch, Tabs} from "@peakui/react";

const MEMBERS = [
  {
    avatar: "bg-accent-soft text-accent-soft-foreground",
    chip: "accent",
    email: "maya@example.com",
    initials: "MK",
    name: "Maya Kovac",
    role: "Owner",
  },
  {
    avatar: "bg-default text-default-foreground",
    chip: "default",
    email: "jonas@example.com",
    initials: "JO",
    name: "Jonas Olsen",
    role: "Editor",
  },
  {
    avatar: "bg-warning-soft text-warning-soft-foreground",
    chip: "warning",
    email: "aiko@example.com",
    initials: "AR",
    name: "Aiko Reyes",
    role: "Invited",
  },
] as const;

/*
 * The hero's scene: one believable screen assembled from many components — tabs, a member
 * list with status chips, an invite field with its button inside, a switch, and the alert that
 * follows the action. A visitor sees how the parts sit together, and a preset repaints all of
 * them at once.
 */
export function TeamScene() {
  return (
    <div className="flex flex-col gap-3">
      <Card className="w-full gap-0 overflow-hidden p-0">
        <div className="px-4 pt-4 sm:px-5">
          <Tabs defaultSelectedKey="members">
            <Tabs.ListContainer>
              <Tabs.List aria-label="Workspace settings">
                {(["Members", "Roles", "Billing"] as const).map((label) => (
                  <Tabs.Tab key={label} id={label.toLowerCase()}>
                    {label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
        <ul className="flex flex-col px-4 py-2 sm:px-5">
          {MEMBERS.map((member) => (
            <li key={member.email} className="flex items-center gap-3 py-2.5">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${member.avatar}`}
              >
                {member.initials}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{member.name}</span>
                <span className="truncate text-xs text-muted">{member.email}</span>
              </div>
              <Chip color={member.chip} variant="soft">
                {member.role}
              </Chip>
            </li>
          ))}
        </ul>
        <div className="px-4 pb-4 sm:px-5">
          <InputGroup fullWidth variant="secondary">
            <InputGroup.Prefix>
              <Envelope />
            </InputGroup.Prefix>
            <InputGroup.Input aria-label="Invite by email" placeholder="name@company.com" />
            <InputGroup.Suffix>
              <Button size="sm" variant="primary">
                Send invite
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-separator bg-surface-secondary px-4 py-3 sm:px-5">
          <Switch defaultSelected>
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              Two-step sign-in
            </Switch.Content>
          </Switch>
          <span className="text-sm text-muted">3 of 5 seats</span>
        </div>
      </Card>
      <Alert status="success">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Invite sent</Alert.Title>
          <Alert.Description>Aiko has 7 days to accept it.</Alert.Description>
        </Alert.Content>
      </Alert>
    </div>
  );
}
