import type {SelectRootProps} from "@/components/select/index.ts";

import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {ListBox} from "@/components/list-box/index.ts";
import {Select, SelectRoot} from "@/components/select/index.ts";

/*
 * Overlay state updates run through the timers wrapper, as the dropdown suite records.
 */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * RAC's Select trigger is a <button> with aria-haspopup="listbox", and the native <select>
 * mirror is aria-hidden: no combobox role exists to query, so the trigger is addressed by
 * its data-slot — the same lookup the reference's own suite uses.
 */
const getTrigger = () => document.querySelector<HTMLButtonElement>('[data-slot="select-trigger"]')!;

const FRUITS = [
  {id: "apple", label: "Apple"},
  {id: "banana", label: "Banana"},
];

/*
 * Static item children, as the reference's own fixtures.tsx builds them: under jsdom RAC's
 * Select refuses to open over a dynamic `items` collection (the collection never reports
 * ready), so the suite composes the list the way the reference's suite does.
 *
 * Children passed through props override the default composition — JSX children in a spread
 * would otherwise win over props.children silently.
 */
function FruitSelect(props: SelectRootProps<(typeof FRUITS)[number], "single" | "multiple"> = {}) {
  const {children, ...rest} = props;

  return (
    <Select aria-label="Fruit" {...rest}>
      {children ?? (
        <>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {FRUITS.map((fruit) => (
                <ListBox.Item key={fruit.id} id={fruit.id} textValue={fruit.label}>
                  {fruit.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </>
      )}
    </Select>
  );
}

describe("Select", () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  it("opens on press and selects an option", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<FruitSelect />);

    const trigger = getTrigger();

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    runAllTimers();

    expect(screen.getByRole("listbox")).toBeVisible();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("option", {name: "Banana"}));
    runAllTimers();

    expect(getTrigger()).toHaveTextContent("Banana");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects by keyboard and reports to onChange", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});
    const onSelectionChange = vi.fn();

    render(<FruitSelect onSelectionChange={onSelectionChange} />);

    const trigger = getTrigger();

    trigger.focus();
    await user.keyboard("{Enter}");
    runAllTimers();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    runAllTimers();

    /*
     * Enter opens with focusStrategy "first", so Apple is already focused and ArrowDown
     * lands on Banana — that is what Enter then selects. RAC's own keyboard contract.
     */
    expect(onSelectionChange).toHaveBeenCalledWith("banana");
  });

  it("opens with Space and lands typeahead on the matching option", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<FruitSelect />);

    const trigger = getTrigger();

    trigger.focus();
    /*
     * A literal " ", not "{Space}": this userEvent emits key "Space" for the bracket form,
     * while RAC's open shortcut matches the browser's real key, a single space character.
     */
    await user.keyboard(" ");
    runAllTimers();

    /* Space toggles the trigger like Enter: the listbox mounts and takes focus. */
    expect(screen.getByRole("listbox")).toBeVisible();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    /* One typeahead keystroke jumps focus to the first option starting with "b". */
    await user.keyboard("b");
    runAllTimers();

    expect(screen.getByRole("option", {name: "Banana"})).toHaveFocus();
  });

  it("follows a controlled value across rerenders", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});
    const onChange = vi.fn();
    const {rerender} = render(<FruitSelect value="apple" onChange={onChange} />);

    expect(getTrigger()).toHaveTextContent("Apple");

    /* Only the parent's value moves the selection, with no user event involved. */
    rerender(<FruitSelect value="banana" onChange={onChange} />);

    expect(getTrigger()).toHaveTextContent("Banana");
    expect(onChange).not.toHaveBeenCalled();

    /* Selecting against a controlled value reports and defers: the parent's value wins. */
    await user.click(getTrigger());
    runAllTimers();
    await user.click(screen.getByRole("option", {name: "Apple"}));
    runAllTimers();

    expect(onChange).toHaveBeenCalledWith("apple");
    expect(getTrigger()).toHaveTextContent("Banana");

    rerender(<FruitSelect value="apple" onChange={onChange} />);

    expect(getTrigger()).toHaveTextContent("Apple");
  });

  it("holds the popover under isOpen and onOpenChange control", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    function ControlledOpenSelect() {
      const [isOpen, setIsOpen] = useState(false);

      return <FruitSelect isOpen={isOpen} onOpenChange={setIsOpen} />;
    }

    render(<ControlledOpenSelect />);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    /* The press reaches the parent through onOpenChange; its state opens the popover. */
    await user.click(getTrigger());
    runAllTimers();

    expect(getTrigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeVisible();

    /* Escape reports the close back, the parent flips isOpen, the popover unmounts. */
    await user.keyboard("{Escape}");
    runAllTimers();

    expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears through the clear button and reports onClear", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});
    const onClear = vi.fn();

    render(
      <FruitSelect defaultSelectedKey="apple" onClear={onClear}>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
          <Select.ClearButton />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {FRUITS.map((fruit) => (
              <ListBox.Item key={fruit.id} id={fruit.id} textValue={fruit.label}>
                {fruit.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </FruitSelect>,
    );

    /*
     * The closed trigger already carries the selection text. Clearing is asserted on the
     * closed select, as the reference's own suite does: a click while the listbox is open
     * is consumed by the overlay's dismissal and only closes it.
     */
    expect(getTrigger()).toHaveTextContent("Apple");

    await user.click(getTrigger().querySelector('[data-slot="select-clear-button"]')!);
    runAllTimers();

    expect(getTrigger()).not.toHaveTextContent("Apple");
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("Backspace on the trigger clears only when a clear button is composed", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});
    const onClear = vi.fn();
    const {rerender} = render(<FruitSelect defaultSelectedKey="apple" onClear={onClear} />);

    const trigger = getTrigger();

    trigger.focus();
    await user.keyboard("{Backspace}");
    runAllTimers();
    expect(trigger).toHaveTextContent("Apple");
    /* Without a composed clear button the shortcut is inert, and onClear stays untouched. */
    expect(onClear).not.toHaveBeenCalled();

    rerender(
      <FruitSelect defaultSelectedKey="apple" onClear={onClear}>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
          <Select.ClearButton />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {FRUITS.map((fruit) => (
              <ListBox.Item key={fruit.id} id={fruit.id} textValue={fruit.label}>
                {fruit.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </FruitSelect>,
    );

    getTrigger().focus();
    await user.keyboard("{Backspace}");
    runAllTimers();
    expect(getTrigger()).not.toHaveTextContent("Apple");
    /* The clearing shortcut reports through onClear, exactly like the click path. */
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("marks the indicator with the open state", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<FruitSelect />);

    const indicator = getTrigger().querySelector('[data-slot="select-default-indicator"]')!;

    /* dataAttr omits the attribute for false; only the open state carries data-open. */
    expect(indicator).not.toHaveAttribute("data-open");

    await user.click(getTrigger());
    runAllTimers();

    expect(indicator).toHaveAttribute("data-open", "true");
  });

  it("collects keys in multiple mode", async () => {
    const user = setupUser({advanceTimers: vi.advanceTimersByTime});

    render(<FruitSelect selectionMode="multiple" />);

    await user.click(getTrigger());
    runAllTimers();
    await user.click(screen.getByRole("option", {name: "Apple"}));
    await user.click(screen.getByRole("option", {name: "Banana"}));
    runAllTimers();

    expect(getTrigger()).toHaveTextContent("Apple");
    expect(getTrigger()).toHaveTextContent("Banana");
  });

  it("carries variant and fullWidth as classes", () => {
    render(<FruitSelect fullWidth variant="secondary" />);

    expect(getTrigger().closest('[data-slot="select"]')!.className).toContain("select--secondary");
    expect(getTrigger().closest('[data-slot="select"]')!.className).toContain("select--full-width");
  });

  it("behaves identically as Select.Root and SelectRoot", () => {
    render(
      <>
        <Select.Root aria-label="First">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </Select.Root>
        <SelectRoot aria-label="Second">
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
        </SelectRoot>
      </>,
    );

    const triggers = document.querySelectorAll('[data-slot="select-trigger"]');

    expect(triggers).toHaveLength(2);
    expect(document.querySelectorAll('[data-slot="select"]')).toHaveLength(2);
  });
});
