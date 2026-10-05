import type {ComponentProps} from "react";

import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {Checkbox, CheckboxRoot} from "@/components/checkbox/index.ts";
import {CheckboxGroup} from "@/components/checkbox-group/index.ts";
import {Label} from "@/components/label/index.ts";

const pointerOpts = {
  button: 0,
  clientX: 1,
  clientY: 1,
  pointerId: 1,
  pointerType: "mouse",
} as const;

/* Последовательность usePress в jsdom: pointerDown, затем pointerUp вместе с click. */
const pressDown = (element: HTMLElement) => fireEvent.pointerDown(element, pointerOpts);
const pressUp = (element: HTMLElement) => {
  fireEvent.pointerUp(element, pointerOpts);
  fireEvent.click(element, {button: 0});
};

const press = async (element: HTMLElement) => {
  pressDown(element);
  pressUp(element);
};

const renderOption = (props: ComponentProps<typeof Checkbox> = {}) =>
  render(
    <Checkbox {...props}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label>Опция</Label>
      </Checkbox.Content>
    </Checkbox>,
  );

describe("Checkbox", () => {
  it("рендерит checkbox с доступным именем из Label", () => {
    renderOption();

    expect(screen.getByRole("checkbox", {name: "Опция"})).toBeInTheDocument();
  });

  it("переключает выбранность по нажатию на Content", async () => {
    renderOption();
    const checkbox = screen.getByRole("checkbox", {name: "Опция"});
    const content = document.querySelector('[data-slot="checkbox-content"]');

    expect(checkbox).not.toBeChecked();
    expect(content).not.toHaveAttribute("data-selected");

    await press(checkbox);

    expect(checkbox).toBeChecked();
    expect(content).toHaveAttribute("data-selected", "true");
  });

  it("вызывает onChange с выбранным значением", async () => {
    const onChange = vi.fn();

    renderOption({onChange});

    await press(screen.getByRole("checkbox", {name: "Опция"}));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("Content несёт свой data-slot, Control и Indicator — свои", () => {
    renderOption();
    const content = document.querySelector('[data-slot="checkbox-content"]');

    expect(content).toBeInTheDocument();
    expect(content?.tagName).toBe("LABEL");
    expect(document.querySelector('[data-slot="checkbox-control"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="checkbox-indicator"]')).toBeInTheDocument();
  });

  it("рисует галочку по умолчанию в выбранном состоянии", () => {
    renderOption({defaultSelected: true});

    expect(
      document.querySelector('[data-slot="checkbox-default-indicator--checkmark"]'),
    ).toBeInTheDocument();
  });

  it("рисует черту в промежуточном состоянии", () => {
    renderOption({isIndeterminate: true});

    expect(document.querySelector('[data-slot="checkbox-content"]')).toHaveAttribute(
      "data-indeterminate",
      "true",
    );
    expect(
      document.querySelector('[data-slot="checkbox-default-indicator--indeterminate"]'),
    ).toBeInTheDocument();
  });

  it("применяет модификатор варианта и наследует вариант группы", () => {
    const {rerender} = renderOption({variant: "secondary"});

    expect(screen.getByRole("checkbox").closest('[data-slot="checkbox"]')).toHaveClass(
      "checkbox--secondary",
    );

    rerender(
      <CheckboxGroup variant="secondary">
        <Checkbox>
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label>Опция</Label>
          </Checkbox.Content>
        </Checkbox>
      </CheckboxGroup>,
    );

    expect(screen.getByRole("checkbox").closest('[data-slot="checkbox"]')).toHaveClass(
      "checkbox--secondary",
    );
  });

  it("заблокированный чекбокс не реагирует на нажатие", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    renderOption({isDisabled: true, onChange});
    const checkbox = screen.getByRole("checkbox", {name: "Опция"});

    expect(checkbox).toBeDisabled();
    expect(document.querySelector('[data-slot="checkbox-content"]')).toHaveAttribute(
      "data-disabled",
      "true",
    );

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
    expect(checkbox).not.toBeChecked();
  });

  it("переключается с клавиатуры пробелом", async () => {
    const user = setupUser();

    renderOption();
    const checkbox = screen.getByRole("checkbox", {name: "Опция"});

    checkbox.focus();
    await user.keyboard(" ");

    expect(checkbox).toBeChecked();
  });

  it("ведёт себя одинаково как Checkbox.Root и CheckboxRoot", () => {
    render(
      <>
        <Checkbox.Root isSelected aria-label="Имена">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox.Root>
        <CheckboxRoot isSelected aria-label="Плоский">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </CheckboxRoot>
      </>,
    );

    expect(screen.getByRole("checkbox", {name: "Имена"})).toBeInTheDocument();
    expect(screen.getByRole("checkbox", {name: "Плоский"})).toBeInTheDocument();
  });

  it("передаёт состояние в render-prop children корня", () => {
    render(
      <Checkbox defaultSelected>
        {(state) => (
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator>{state.isSelected ? "выбрано" : "пусто"}</Checkbox.Indicator>
            </Checkbox.Control>
            <Label>Опция</Label>
          </Checkbox.Content>
        )}
      </Checkbox>,
    );

    expect(screen.getByText("выбрано")).toBeInTheDocument();
  });
});
