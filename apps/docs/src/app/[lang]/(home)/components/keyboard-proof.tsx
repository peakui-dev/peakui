"use client";

import {Description, Kbd, Label, ListBox} from "@peakui/react";

/** A real list to drive from the keyboard: the proof for the accessibility claim beside it. */
export function KeyboardProof({hint}: {hint: string}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-72 rounded-2xl bg-overlay p-1 shadow-overlay">
        <ListBox
          aria-label="Notifications"
          defaultSelectedKeys={["mentions"]}
          selectionMode="single"
        >
          <ListBox.Item id="all" textValue="Everything">
            <div className="flex flex-col">
              <Label>Everything</Label>
              <Description>Every comment and change</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="mentions" textValue="Mentions only">
            <div className="flex flex-col">
              <Label>Mentions only</Label>
              <Description>When someone names you</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="none" textValue="Nothing">
            <div className="flex flex-col">
              <Label>Nothing</Label>
              <Description>Check in when you choose</Description>
            </div>
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
        <Kbd>
          <Kbd.Content>Tab</Kbd.Content>
        </Kbd>
        <Kbd>
          <Kbd.Content>↑</Kbd.Content>
        </Kbd>
        <Kbd>
          <Kbd.Content>↓</Kbd.Content>
        </Kbd>
        {hint}
      </p>
    </div>
  );
}
