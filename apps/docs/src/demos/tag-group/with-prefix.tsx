import {PlanetEarth, Rocket, ShoppingBag, SquareArticle} from "@gravity-ui/icons";
import {Description, Label, Tag, TagGroup} from "@peakui/react";

export function WithPrefix() {
  return (
    <TagGroup selectionMode="single">
      <Label>With Icons</Label>
      <TagGroup.List>
        <Tag>
          <SquareArticle />
          News
        </Tag>
        <Tag>
          <PlanetEarth />
          Travel
        </Tag>
        <Tag>
          <Rocket />
          Gaming
        </Tag>
        <Tag>
          <ShoppingBag />
          Shopping
        </Tag>
      </TagGroup.List>
      <Description>Tags with icons</Description>
    </TagGroup>
  );
}
