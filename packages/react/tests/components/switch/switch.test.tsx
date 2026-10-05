import type {ComponentProps} from "react";

import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Switch, SwitchRoot} from "@/components/switch/index.ts";

const pointerOpts = {
  button: 0,
  clientX: 1,
  clientY: 1,
  pointerId: 1,
  pointerType: "mouse",
} as const;

/* Последовательность usePress в jsdom: pointerDown, затем pointerUp вместе с click. */
const press = async (element: HTMLElement) => {
  fireEvent.pointerDown(element, pointerOpts);
  fireEvent.pointerUp(element, pointerOpts);
  fireEvent.click(element, {button: 0});
};

const renderSwitch = (props: ComponentProps<typeof Switch> = {}, text = "Уведомления") =>
  render(
    <Switch {...props}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label>{text}</Label>
      </Switch.Content>
    </Switch>,
  );

describe("Switch", () => {
  it("рендерит switch с доступным именем из Label", () => {
    renderSwitch();

    expect(screen.getByRole("switch", {name: "Уведомления"})).toBeInTheDocument();
  });

  it("переключается по нажатию и вызывает onChange", async () => {
    const onChange = vi.fn();

    renderSwitch({onChange});
    const control = screen.getByRole("switch", {name: "Уведомления"});

    await press(control);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(control).toBeChecked();
    expect(document.querySelector('[data-slot="switch-content"]')).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("части несут свои data-slot", () => {
    renderSwitch();

    expect(document.querySelector('[data-slot="switch"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="switch-content"]')?.tagName).toBe("LABEL");
    expect(document.querySelector('[data-slot="switch-control"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="switch-thumb"]')).toBeInTheDocument();
  });

  it("применяет модификатор размера", () => {
    renderSwitch({size: "lg"});

    expect(document.querySelector('[data-slot="switch"]')).toHaveClass("switch--lg");
  });

  it("заблокированный переключатель не реагирует", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    renderSwitch({isDisabled: true, onChange});
    const control = screen.getByRole("switch", {name: "Уведомления"});

    expect(control).toBeDisabled();

    await user.click(control);

    expect(onChange).not.toHaveBeenCalled();
    expect(control).not.toBeChecked();
  });

  it("переключается с клавиатуры пробелом", async () => {
    const user = setupUser();

    renderSwitch();
    const control = screen.getByRole("switch", {name: "Уведомления"});

    control.focus();
    await user.keyboard(" ");

    expect(control).toBeChecked();
  });

  it("ведёт себя одинаково как Switch.Root и SwitchRoot", () => {
    render(
      <>
        <Switch.Root aria-label="Имена">
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </Switch.Root>
        <SwitchRoot aria-label="Плоский">
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Content>
        </SwitchRoot>
      </>,
    );

    expect(screen.getByRole("switch", {name: "Имена"})).toBeInTheDocument();
    expect(screen.getByRole("switch", {name: "Плоский"})).toBeInTheDocument();
  });

  it("передаёт состояние в render-prop children корня", () => {
    render(
      <Switch defaultSelected>
        {(state) => (
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb>{state.isSelected ? "вкл" : "выкл"}</Switch.Thumb>
            </Switch.Control>
            <Label>Уведомления</Label>
          </Switch.Content>
        )}
      </Switch>,
    );

    expect(screen.getByText("вкл")).toBeInTheDocument();
  });
});
