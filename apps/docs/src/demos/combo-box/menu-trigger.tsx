import {ComboBox, Input, Label, ListBox} from "@peakui/react";

export function MenuTrigger() {
  return (
    <div className="flex flex-col gap-6">
      {(["focus", "input", "manual"] as const).map((menuTrigger) => (
        <ComboBox key={menuTrigger} className="w-[256px]" menuTrigger={menuTrigger}>
          <Label>{`menuTrigger="${menuTrigger}"`}</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              <ListBox.Item id="aardvark" textValue="Aardvark">
                Aardvark
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="cat" textValue="Cat">
                Cat
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="dog" textValue="Dog">
                Dog
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      ))}
    </div>
  );
}
