"use client";

import {Description, ErrorMessage, Label, Tag, TagGroup} from "@peakui/react";
import {useState} from "react";

export function CustomStyles() {
  const [selected, setSelected] = useState<Iterable<string | number>>(new Set());
  const isInvalid = Array.from(selected).length === 0;

  return (
    <TagGroup
      className="w-full max-w-xs gap-1.5"
      selectedKeys={selected}
      selectionMode="multiple"
      onSelectionChange={setSelected}
    >
      <Label>Topics</Label>
      <TagGroup.List>
        <Tag id="api">API</Tag>
        <Tag id="design">Design</Tag>
        <Tag id="docs">Docs</Tag>
      </TagGroup.List>
      <Description>Pick at least one topic</Description>
      <ErrorMessage className="font-medium text-danger-soft-foreground">
        {!!isInvalid && <>Choose at least one topic</>}
      </ErrorMessage>
    </TagGroup>
  );
}
