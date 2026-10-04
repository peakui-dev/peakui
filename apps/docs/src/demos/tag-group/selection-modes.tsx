"use client";

import {Description, Label, Tag, TagGroup} from "@peakui/react";
import {useState} from "react";

export function SelectionModes() {
  const [singleSelected, setSingleSelected] = useState<Iterable<string | number>>(
    new Set(["news"]),
  );
  const [multipleSelected, setMultipleSelected] = useState<Iterable<string | number>>(
    new Set(["news", "travel"]),
  );

  return (
    <div className="flex flex-col gap-8">
      <TagGroup
        selectedKeys={singleSelected}
        selectionMode="single"
        onSelectionChange={(keys) => setSingleSelected(keys)}
      >
        <Label>Single Selection</Label>
        <TagGroup.List>
          <Tag>News</Tag>
          <Tag>Travel</Tag>
          <Tag>Gaming</Tag>
          <Tag>Shopping</Tag>
        </TagGroup.List>
        <Description>Choose one category</Description>
      </TagGroup>

      <TagGroup
        selectedKeys={multipleSelected}
        selectionMode="multiple"
        onSelectionChange={(keys) => setMultipleSelected(keys)}
      >
        <Label>Multiple Selection</Label>
        <TagGroup.List>
          <Tag>News</Tag>
          <Tag>Travel</Tag>
          <Tag>Gaming</Tag>
          <Tag>Shopping</Tag>
        </TagGroup.List>
        <Description>Choose multiple categories</Description>
      </TagGroup>
    </div>
  );
}
