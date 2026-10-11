"use client";

import {Description, ErrorMessage, Label, Tag, TagGroup} from "@peakui/react";
import {useState} from "react";

export function Basic() {
  const [selected, setSelected] = useState<Iterable<string | number>>(new Set());
  const isInvalid = Array.from(selected).length === 0;

  return (
    <TagGroup
      className="w-72"
      selectedKeys={selected}
      selectionMode="multiple"
      onSelectionChange={(keys) => setSelected(keys)}
    >
      <Label>Required categories</Label>
      <TagGroup.List>
        <Tag id="news">News</Tag>
        <Tag id="travel">Travel</Tag>
        <Tag id="gaming">Gaming</Tag>
        <Tag id="shopping">Shopping</Tag>
      </TagGroup.List>
      <Description>Select at least one category</Description>
      <ErrorMessage>{!!isInvalid && <>Please select at least one category</>}</ErrorMessage>
    </TagGroup>
  );
}
