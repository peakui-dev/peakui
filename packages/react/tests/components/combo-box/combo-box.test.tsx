import type {ComboBoxRootProps} from "@/components/combo-box/index.ts";

import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {ComboBox, ComboBoxRoot} from "@/components/combo-box/index.ts";
import {Description} from "@/components/description/index.ts";
import {FieldError} from "@/components/field-error/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {ListBox} from "@/components/list-box/index.ts";

/* Overlay state updates run through the timers wrapper, as the select and dropdown suites do. */
const runAllTimers = () => act(() => vi.runAllTimers());

const ANIMALS = [
  {id: "cat", name: "Cat"},
  {id: "dog", name: "Dog"},
  {id: "panda", name: "Panda"},
];

/*
 * Static item children: under jsdom RAC's collection builder does not report a dynamic `items`
 * collection ready, so the suite composes the list the way the select suite does.
 */
function AnimalComboBox(props: Partial<ComboBoxRootProps<object, "single">> = {}) {
  const {children, ...rest} = props;

  return (
    <ComboBox {...rest}>
      {children ?? (
        <>
          <Label>Animal</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals" />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <Description>Pick one</Description>
          <ComboBox.Popover>
            <ListBox>
              {ANIMALS.map((animal) => (
                <ListBox.Item key={animal.id} id={animal.id} textValue={animal.name}>
                  {animal.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </>
      )}
    </ComboBox>
  );
}

describe("ComboBox", () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  describe("render", () => {
    it("exposes the block and the data-slot of every part", () => {
      const {container} = render(<AnimalComboBox />);

      expect(container.querySelector('[data-slot="combo-box"]')).toHaveClass("combo-box");
      expect(container.querySelector('[data-slot="combo-box-input-group"]')).toHaveClass(
        "combo-box__input-group",
      );
      expect(container.querySelector('[data-slot="combo-box-trigger"]')).toHaveClass(
        "combo-box__trigger",
      );
      expect(container.querySelector('[data-slot="input"]')).toBeInTheDocument();
    });

    it("renders one input and one trigger, not a copy per collection pass", () => {
      const {container} = render(<AnimalComboBox />);

      expect(screen.getAllByRole("combobox")).toHaveLength(1);
      expect(container.querySelectorAll('[data-slot="combo-box-trigger"]')).toHaveLength(1);
      expect(container.querySelectorAll('[data-slot="combo-box-input-group"]')).toHaveLength(1);
    });

    it("names the input by its label and describes it", () => {
      render(<AnimalComboBox />);

      const input = screen.getByRole("combobox", {name: "Animal"});

      expect(input).toHaveAccessibleDescription("Pick one");
    });

    it("merges a consumer className with the block", () => {
      const {container} = render(<AnimalComboBox className="custom" />);

      expect(container.querySelector('[data-slot="combo-box"]')).toHaveClass("combo-box", "custom");
    });

    it("applies the full-width modifier to the block and the group", () => {
      const {container} = render(<AnimalComboBox fullWidth />);

      expect(container.querySelector('[data-slot="combo-box"]')).toHaveClass(
        "combo-box--full-width",
      );
      expect(container.querySelector('[data-slot="combo-box-input-group"]')).toHaveClass(
        "combo-box__input-group--full-width",
      );
    });

    it("draws the default chevron in the trigger, or the consumer's content", () => {
      const {container, rerender} = render(<AnimalComboBox />);

      expect(
        container.querySelector('[data-slot="combo-box-trigger-default-icon"]'),
      ).toBeInTheDocument();

      rerender(
        <AnimalComboBox>
          <Label>Animal</Label>
          <ComboBox.InputGroup>
            <Input />
            <ComboBox.Trigger>Open</ComboBox.Trigger>
          </ComboBox.InputGroup>
        </AnimalComboBox>,
      );

      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="combo-box-trigger-default-icon"]'),
      ).not.toBeInTheDocument();
    });
  });

  describe("interaction", () => {
    it("opens from the trigger and selects an option", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onSelectionChange = vi.fn();

      render(<AnimalComboBox onSelectionChange={onSelectionChange} />);

      const input = screen.getByRole("combobox");

      expect(input).toHaveAttribute("aria-expanded", "false");

      await user.click(screen.getByRole("button"));
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();
      expect(input).toHaveAttribute("aria-expanded", "true");

      await user.click(screen.getByRole("option", {name: "Dog"}));
      runAllTimers();

      expect(onSelectionChange).toHaveBeenCalledWith("dog");
      expect(input).toHaveValue("Dog");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("filters the options as the user types", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<AnimalComboBox />);

      await user.click(screen.getByRole("combobox"));
      runAllTimers();
      await user.keyboard("pa");
      runAllTimers();

      expect(screen.getAllByRole("option")).toHaveLength(1);
      expect(screen.getByRole("option", {name: "Panda"})).toBeInTheDocument();
    });

    it("opens on focus by default and waits for typing under menuTrigger=input", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const {unmount} = render(<AnimalComboBox />);

      await user.click(screen.getByRole("combobox"));
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();

      unmount();
      render(<AnimalComboBox menuTrigger="input" />);

      await user.click(screen.getByRole("combobox"));
      runAllTimers();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      await user.keyboard("c");
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();
    });

    it("selects by keyboard and closes on Escape", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onSelectionChange = vi.fn();

      render(<AnimalComboBox onSelectionChange={onSelectionChange} />);

      const input = screen.getByRole("combobox");

      input.focus();
      await user.keyboard("{ArrowDown}");
      runAllTimers();
      await user.keyboard("{ArrowDown}{Enter}");
      runAllTimers();

      expect(onSelectionChange).toHaveBeenCalledTimes(1);

      await user.keyboard("{ArrowDown}");
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();

      await user.keyboard("{Escape}");
      runAllTimers();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("follows a controlled selectedKey across rerenders", () => {
      const {rerender} = render(<AnimalComboBox selectedKey="cat" />);

      expect(screen.getByRole("combobox")).toHaveValue("Cat");

      rerender(<AnimalComboBox selectedKey="panda" />);

      expect(screen.getByRole("combobox")).toHaveValue("Panda");
    });

    it("keeps typed text that matches no item only under allowsCustomValue", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<AnimalComboBox allowsCustomValue />);

      await user.click(screen.getByRole("combobox"));
      await user.keyboard("zebra");
      runAllTimers();
      await user.tab();
      runAllTimers();

      expect(screen.getByRole("combobox")).toHaveValue("zebra");
    });
  });

  describe("states", () => {
    it("does not open or accept input when disabled", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<AnimalComboBox isDisabled />);

      expect(screen.getByRole("combobox")).toBeDisabled();
      expect(screen.getByRole("button")).toBeDisabled();

      await user.click(screen.getByRole("button"));
      runAllTimers();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("does not select a disabled option", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onSelectionChange = vi.fn();

      render(<AnimalComboBox disabledKeys={["dog"]} onSelectionChange={onSelectionChange} />);

      await user.click(screen.getByRole("button"));
      runAllTimers();

      expect(screen.getByRole("option", {name: "Dog"})).toHaveAttribute("aria-disabled", "true");

      await user.click(screen.getByRole("option", {name: "Dog"}));
      runAllTimers();

      expect(onSelectionChange).not.toHaveBeenCalled();
    });

    it("marks the trigger open while the popover is open", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<AnimalComboBox />);

      const trigger = screen.getByRole("button");

      expect(trigger).not.toHaveAttribute("data-open");

      await user.click(trigger);
      runAllTimers();

      expect(trigger).toHaveAttribute("data-open", "true");
    });

    it("flags the input invalid and shows the field error", () => {
      render(
        <AnimalComboBox isInvalid>
          <Label>Animal</Label>
          <ComboBox.InputGroup>
            <Input />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              <ListBox.Item id="cat" textValue="Cat">
                Cat
              </ListBox.Item>
            </ListBox>
          </ComboBox.Popover>
          <FieldError>Pick an animal</FieldError>
        </AnimalComboBox>,
      );

      const input = screen.getByRole("combobox");

      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAccessibleDescription("Pick an animal");
    });
  });

  describe("multiple selection", () => {
    it("keeps the popover open and reports each key under selectionMode=multiple", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onChange = vi.fn();

      render(
        <ComboBox selectionMode="multiple" onChange={onChange}>
          <Label>Animals</Label>
          <ComboBox.InputGroup>
            <Input />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox selectionMode="multiple">
              {ANIMALS.map((animal) => (
                <ListBox.Item key={animal.id} id={animal.id} textValue={animal.name}>
                  {animal.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>,
      );

      await user.click(screen.getByRole("button"));
      runAllTimers();
      await user.click(screen.getByRole("option", {name: "Cat"}));
      runAllTimers();
      await user.click(screen.getByRole("option", {name: "Panda"}));
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();
      expect(onChange).toHaveBeenLastCalledWith(["cat", "panda"]);
    });
  });

  describe("parts", () => {
    it("behaves identically as ComboBox.Root and ComboBoxRoot", () => {
      const {container} = render(
        <>
          <ComboBox.Root aria-label="Namespaced" />
          <ComboBoxRoot aria-label="Flat" />
        </>,
      );

      expect(container.querySelectorAll('[data-slot="combo-box"]')).toHaveLength(2);
    });

    it("lets a part's own className and ref through", () => {
      const ref = {current: null as HTMLButtonElement | null};

      render(
        <AnimalComboBox>
          <Label>Animal</Label>
          <ComboBox.InputGroup className="my-group">
            <Input />
            <ComboBox.Trigger ref={ref} className="my-trigger" />
          </ComboBox.InputGroup>
        </AnimalComboBox>,
      );

      expect(screen.getByRole("button")).toHaveClass("combo-box__trigger", "my-trigger");
      expect(ref.current).toBe(screen.getByRole("button"));
      expect(document.querySelector(".my-group")).toHaveClass("combo-box__input-group");
    });
  });
});
