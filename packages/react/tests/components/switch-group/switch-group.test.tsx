import {render, screen} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Switch} from "@/components/switch/index.ts";
import {SwitchGroup} from "@/components/switch-group/index.ts";

const item = (label: string) => (
  <Switch>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Label>{label}</Label>
    </Switch.Content>
  </Switch>
);

describe("SwitchGroup", () => {
  it("рендерит презентационную группу с data-slot", () => {
    render(<SwitchGroup aria-label="Настройки">{item("Почта")}</SwitchGroup>);

    expect(document.querySelector('[data-slot="switch-group"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="switch-group-items"]')).toBeInTheDocument();
    expect(screen.getByRole("switch", {name: "Почта"})).toBeInTheDocument();
  });

  it("применяет модификатор ориентации", () => {
    render(<SwitchGroup orientation="horizontal">{item("Почта")}</SwitchGroup>);

    expect(document.querySelector('[data-slot="switch-group"]')).toHaveClass(
      "switch-group--horizontal",
    );
  });

  it("вертикальная ориентация — модификатор по умолчанию", () => {
    render(<SwitchGroup>{item("Почта")}</SwitchGroup>);

    expect(document.querySelector('[data-slot="switch-group"]')).toHaveClass(
      "switch-group--vertical",
    );
  });

  it("переключатели внутри группы независимы", async () => {
    render(
      <SwitchGroup>
        {item("Почта")}
        {item("СМС")}
      </SwitchGroup>,
    );

    const first = screen.getByRole("switch", {name: "Почта"});

    first.click();

    expect(first).toBeChecked();
    expect(screen.getByRole("switch", {name: "СМС"})).not.toBeChecked();
  });
});
