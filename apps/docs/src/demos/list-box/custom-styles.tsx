import {Description, Label, ListBox} from "@peakui/react";

export function CustomStyles() {
  return (
    <ListBox
      aria-label="Assignee"
      className="w-56 rounded-xl border border-border/80 bg-surface p-1 shadow-sm"
      selectionMode="single"
    >
      <ListBox.Item
        className="rounded-lg data-[focused=true]:bg-accent/10 data-[selected=true]:bg-accent/5"
        id="1"
        textValue="Bob"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
          B
        </span>
        <div className="flex flex-col">
          <Label>Bob</Label>
          <Description>bob@peakui.dev</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item
        className="rounded-lg data-[focused=true]:bg-accent/10 data-[selected=true]:bg-accent/5"
        id="2"
        textValue="Fred"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
          F
        </span>
        <div className="flex flex-col">
          <Label>Fred</Label>
          <Description>fred@peakui.dev</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>
  );
}
