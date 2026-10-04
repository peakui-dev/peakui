import {Label, Tag, TagGroup} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-8">
      <TagGroup selectionMode="single" variant="default">
        <Label>Default</Label>
        <TagGroup.List>
          <Tag>News</Tag>
          <Tag>Travel</Tag>
          <Tag>Gaming</Tag>
        </TagGroup.List>
      </TagGroup>

      <TagGroup selectionMode="single" variant="surface">
        <Label>Surface</Label>
        <TagGroup.List>
          <Tag>News</Tag>
          <Tag>Travel</Tag>
          <Tag>Gaming</Tag>
        </TagGroup.List>
      </TagGroup>
    </div>
  );
}
