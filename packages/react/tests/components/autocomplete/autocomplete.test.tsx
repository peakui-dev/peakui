import type {AutocompleteRootProps} from "@/components/autocomplete/index.ts";

import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {Autocomplete, AutocompleteRoot} from "@/components/autocomplete/index.ts";
import {EmptyState} from "@/components/empty-state/index.ts";
import {ListBox} from "@/components/list-box/index.ts";
import {SearchField} from "@/components/search-field/index.ts";

/* Overlay state updates run through the timers wrapper, as the select suite records. */
const runAllTimers = () => act(() => vi.runAllTimers());

/*
 * The trigger is a <button aria-haspopup="listbox"> and the native <select> mirror is
 * aria-hidden, so no combobox role exists to query: the trigger is addressed by its data-slot.
 */
const getTrigger = () =>
  document.querySelector<HTMLButtonElement>('[data-slot="autocomplete-trigger"]')!;

const FRUITS = [
  {id: "apple", label: "Apple"},
  {id: "apricot", label: "Apricot"},
  {id: "banana", label: "Banana"},
];

function Filtered() {
  return (
    <Autocomplete.Filter>
      <SearchField autoFocus aria-label="Search fruit">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search fruit" />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
        {FRUITS.map((fruit) => (
          <ListBox.Item key={fruit.id} id={fruit.id} textValue={fruit.label}>
            {fruit.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Autocomplete.Filter>
  );
}

/*
 * Static item children: under jsdom RAC's Select refuses to open over a dynamic `items`
 * collection, so the suite composes the list directly. Children passed through props override
 * the default composition.
 */
function FruitAutocomplete(
  props: AutocompleteRootProps<(typeof FRUITS)[number], "single" | "multiple"> = {},
) {
  const {children, ...rest} = props;

  return (
    <Autocomplete aria-label="Fruit" {...rest}>
      {children ?? (
        <>
          <Autocomplete.Trigger>
            <Autocomplete.Value />
            <Autocomplete.Indicator />
          </Autocomplete.Trigger>
          <Autocomplete.Popover>
            <Filtered />
          </Autocomplete.Popover>
        </>
      )}
    </Autocomplete>
  );
}

describe("Autocomplete", () => {
  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
  });

  afterEach(() => {
    cleanup();
    runAllTimers();
    vi.useRealTimers();
  });

  describe("opening and selecting", () => {
    it("opens on press, focuses the search field and selects an option", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete />);

      const trigger = getTrigger();

      expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
      expect(trigger).toHaveAttribute("aria-expanded", "false");

      await user.click(trigger);
      runAllTimers();

      expect(screen.getByRole("listbox")).toBeVisible();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("searchbox", {name: "Search fruit"})).toHaveFocus();

      await user.click(screen.getByRole("option", {name: "Banana"}));
      runAllTimers();

      expect(getTrigger()).toHaveTextContent("Banana");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("selects by keyboard from the search field and reports to onChange", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onChange = vi.fn();

      render(<FruitAutocomplete onChange={onChange} />);

      getTrigger().focus();
      await user.keyboard("{Enter}");
      runAllTimers();
      /* Focus stays in the search field; arrows drive a virtual focus in the list. */
      await user.keyboard("{ArrowDown}{Enter}");
      runAllTimers();

      expect(onChange).toHaveBeenCalledOnce();
    });

    it("follows a controlled value across rerenders", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onChange = vi.fn();
      const {rerender} = render(<FruitAutocomplete value="apple" onChange={onChange} />);

      expect(getTrigger()).toHaveTextContent("Apple");

      rerender(<FruitAutocomplete value="banana" onChange={onChange} />);

      expect(getTrigger()).toHaveTextContent("Banana");
      expect(onChange).not.toHaveBeenCalled();

      await user.click(getTrigger());
      runAllTimers();
      await user.click(screen.getByRole("option", {name: "Apple"}));
      runAllTimers();

      expect(onChange).toHaveBeenCalledWith("apple");
      expect(getTrigger()).toHaveTextContent("Banana");
    });

    it("holds the popover under isOpen and onOpenChange control", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      function ControlledOpen() {
        const [isOpen, setIsOpen] = useState(false);

        return <FruitAutocomplete isOpen={isOpen} onOpenChange={setIsOpen} />;
      }

      render(<ControlledOpen />);

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

      await user.click(getTrigger());
      runAllTimers();

      expect(getTrigger()).toHaveAttribute("aria-expanded", "true");

      await user.keyboard("{Escape}");
      runAllTimers();

      expect(getTrigger()).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("collects keys in multiple mode", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete selectionMode="multiple" />);

      await user.click(getTrigger());
      runAllTimers();
      await user.click(screen.getByRole("option", {name: "Apple"}));
      await user.click(screen.getByRole("option", {name: "Banana"}));
      runAllTimers();

      expect(getTrigger()).toHaveTextContent("Apple");
      expect(getTrigger()).toHaveTextContent("Banana");
    });
  });

  describe("filtering", () => {
    it("narrows the options as the user types", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete />);

      await user.click(getTrigger());
      runAllTimers();

      expect(screen.getAllByRole("option")).toHaveLength(3);

      await user.type(screen.getByRole("searchbox"), "ap");
      runAllTimers();

      expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
        "Apple",
        "Apricot",
      ]);
    });

    it("renders the empty state when nothing matches", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete />);

      await user.click(getTrigger());
      runAllTimers();
      await user.type(screen.getByRole("searchbox"), "zzz");
      runAllTimers();

      /* RAC wraps the empty state in an option-role element; no fruit survives the filter. */
      for (const fruit of FRUITS) {
        expect(screen.queryByRole("option", {name: fruit.label})).not.toBeInTheDocument();
      }

      expect(screen.getByText("No results found")).toBeInTheDocument();
    });
  });

  describe("clearing", () => {
    const withClearButton = (
      <>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
          <Autocomplete.ClearButton />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Filtered />
        </Autocomplete.Popover>
      </>
    );

    it("clears through the clear button and reports onClear", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onClear = vi.fn();

      render(
        <FruitAutocomplete defaultValue="apple" onClear={onClear}>
          {withClearButton}
        </FruitAutocomplete>,
      );

      expect(getTrigger()).toHaveTextContent("Apple");

      await user.click(getTrigger().querySelector('[data-slot="autocomplete-clear-button"]')!);
      runAllTimers();

      expect(getTrigger()).not.toHaveTextContent("Apple");
      expect(onClear).toHaveBeenCalledOnce();
      /* The press stays off the trigger: the popover did not open. */
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("Backspace on the trigger clears only when a clear button is composed", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});
      const onClear = vi.fn();
      const {rerender} = render(<FruitAutocomplete defaultValue="apple" onClear={onClear} />);

      getTrigger().focus();
      await user.keyboard("{Backspace}");
      runAllTimers();

      expect(getTrigger()).toHaveTextContent("Apple");
      expect(onClear).not.toHaveBeenCalled();

      rerender(
        <FruitAutocomplete defaultValue="apple" onClear={onClear}>
          {withClearButton}
        </FruitAutocomplete>,
      );

      getTrigger().focus();
      await user.keyboard("{Backspace}");
      runAllTimers();

      expect(getTrigger()).not.toHaveTextContent("Apple");
      expect(onClear).toHaveBeenCalledOnce();
    });
  });

  describe("states and parts", () => {
    it("does not open when disabled", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete isDisabled />);

      expect(getTrigger()).toBeDisabled();

      await user.click(getTrigger());
      runAllTimers();

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("marks the indicator with the open state", async () => {
      const user = setupUser({advanceTimers: vi.advanceTimersByTime});

      render(<FruitAutocomplete />);

      const indicator = getTrigger().querySelector('[data-slot="autocomplete-default-indicator"]')!;

      expect(indicator).not.toHaveAttribute("data-open");

      await user.click(getTrigger());
      runAllTimers();

      expect(indicator).toHaveAttribute("data-open", "true");
    });

    it("carries variant and fullWidth as classes", () => {
      render(<FruitAutocomplete fullWidth variant="secondary" />);

      const root = getTrigger().closest('[data-slot="autocomplete"]')!;

      expect(root.className).toContain("autocomplete--secondary");
      expect(root.className).toContain("autocomplete--full-width");
    });

    it("behaves identically as Autocomplete.Root and AutocompleteRoot", () => {
      render(
        <>
          <Autocomplete.Root aria-label="First">
            <Autocomplete.Trigger>
              <Autocomplete.Value />
            </Autocomplete.Trigger>
          </Autocomplete.Root>
          <AutocompleteRoot aria-label="Second">
            <Autocomplete.Trigger>
              <Autocomplete.Value />
            </Autocomplete.Trigger>
          </AutocompleteRoot>
        </>,
      );

      expect(document.querySelectorAll('[data-slot="autocomplete-trigger"]')).toHaveLength(2);
      expect(document.querySelectorAll('[data-slot="autocomplete"]')).toHaveLength(2);
    });
  });
});
