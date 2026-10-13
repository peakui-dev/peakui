"use client";

import {CircleCheckFill} from "@gravity-ui/icons";
import {Button, Card, Description, Input, InputGroup, Label, TextField} from "@peakui/react";

/*
 * The composed scene the site shows a theme on: the body sits on the surface and the actions on
 * the level above it, so the surface ladder, the on-surface control fills and the accent are
 * read together, as they meet in an app. The fields are filled in — a theme is judged on
 * content, not on placeholders.
 */
export function WorkspaceCard({className}: {className?: string}) {
  return (
    <Card className={`w-full gap-0 overflow-hidden p-0 ${className ?? ""}`}>
      <Card.Content className="justify-center gap-6 p-6 @3xl:p-8">
        <div className="flex items-center gap-3.5">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-lg font-semibold text-accent-foreground"
          >
            N
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg leading-tight font-semibold tracking-tight text-foreground">
              Create a workspace
            </h3>
            <p className="text-sm text-muted">A shared home for your team&apos;s work.</p>
          </div>
        </div>
        <TextField fullWidth defaultValue="Northwind Studio" name="workspace" variant="secondary">
          <Label>Name</Label>
          <Input />
        </TextField>
        <TextField fullWidth defaultValue="northwind" name="address" variant="secondary">
          <Label>Web address</Label>
          <InputGroup fullWidth>
            <InputGroup.Prefix>example.com/</InputGroup.Prefix>
            <InputGroup.Input />
          </InputGroup>
          <Description className="flex items-center gap-1.5 text-success-soft-foreground">
            <CircleCheckFill aria-hidden="true" />
            This address is available
          </Description>
        </TextField>
      </Card.Content>
      <Card.Footer className="justify-end gap-2 border-t border-separator bg-surface-secondary px-6 py-4 @3xl:px-8">
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Create workspace</Button>
      </Card.Footer>
    </Card>
  );
}
