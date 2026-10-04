import {Description, Label, ListBox, Surface} from "@peakui/react";

export function MultiSelect() {
  return (
    <Surface className="w-[256px] rounded-3xl shadow-surface">
      <ListBox aria-label="Users" selectionMode="multiple">
        <ListBox.Item id="1" textValue="Bob">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
            B
          </span>
          <div className="flex flex-col">
            <Label>Bob</Label>
            <Description>bob@peakui.dev</Description>
          </div>
          <ListBox.ItemIndicator />
        </ListBox.Item>
        <ListBox.Item id="2" textValue="Fred">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
            F
          </span>
          <div className="flex flex-col">
            <Label>Fred</Label>
            <Description>fred@peakui.dev</Description>
          </div>
          <ListBox.ItemIndicator />
        </ListBox.Item>
        <ListBox.Item id="3" textValue="Martha">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
            M
          </span>
          <div className="flex flex-col">
            <Label>Martha</Label>
            <Description>martha@peakui.dev</Description>
          </div>
          <ListBox.ItemIndicator />
        </ListBox.Item>
      </ListBox>
    </Surface>
  );
}
