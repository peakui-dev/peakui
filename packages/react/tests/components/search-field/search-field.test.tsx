import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {FieldError} from "@/components/field-error/index.ts";
import {Label} from "@/components/label/index.ts";
import {SearchField, SearchFieldRoot} from "@/components/search-field/index.ts";
import {FieldVariantContext} from "@/contexts/field-variant.ts";

/*
 * Кнопка очистки идентифицируется по data-slot, а не по роли: имя «Clear search» даёт ей сам
 * компонент, и запрос по имени отличал бы часть от любой другой кнопки в тестовом дереве лишь
 * случайно.
 */
const clearButton = () =>
  document.querySelector('[data-slot="search-field-clear-button"]') as HTMLElement | null;

describe("SearchField", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  const renderSearch = (props: ComponentProps<typeof SearchField> = {}) =>
    render(
      <SearchField name="search" {...props}>
        <Label>Поиск</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Поиск..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>,
    );

  it("рендерит searchbox с доступным именем", () => {
    renderSearch();

    expect(screen.getByRole("searchbox", {name: "Поиск"})).toBeInTheDocument();
  });

  it("выставляет BEM-блок и data-slot каждой части", () => {
    renderSearch();

    expect(document.querySelector('[data-slot="search-field"]')?.className).toEqual(
      expect.stringContaining("search-field"),
    );
    expect(document.querySelector('[data-slot="search-field-group"]')).not.toBeNull();
    expect(screen.getByRole("searchbox")).toHaveAttribute("data-slot", "search-field-input");
    expect(document.querySelector('[data-slot="search-field-search-icon"]')).not.toBeNull();
    expect(clearButton()).not.toBeNull();
  });

  it("кнопка очистки объявляет контекстное имя", () => {
    renderSearch();

    expect(clearButton()).toHaveAttribute("aria-label", "Clear search");
  });

  it("имя кнопки очистки перекрывается потребителем", () => {
    render(
      <SearchField aria-label="Поиск" name="search">
        <SearchField.Group>
          <SearchField.Input />
          <SearchField.ClearButton aria-label="Очистить фильтры" />
        </SearchField.Group>
      </SearchField>,
    );

    expect(clearButton()).toHaveAttribute("aria-label", "Очистить фильтры");
  });

  it("применяет модификатор variant", () => {
    renderSearch({variant: "secondary"});

    expect(document.querySelector('[data-slot="search-field"]')?.className).toEqual(
      expect.stringContaining("search-field--secondary"),
    );
  });

  it("наследует вариант из контекста поля", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <SearchField name="search">
          <Label>Поиск</Label>
          <SearchField.Group>
            <SearchField.Input />
          </SearchField.Group>
        </SearchField>
      </FieldVariantContext>,
    );

    expect(document.querySelector('[data-slot="search-field"]')?.className).toEqual(
      expect.stringContaining("search-field--secondary"),
    );
  });

  it("явный variant побеждает унаследованный контекст", () => {
    render(
      <FieldVariantContext value={{variant: "secondary"}}>
        <SearchField name="search" variant="primary">
          <Label>Поиск</Label>
          <SearchField.Group>
            <SearchField.Input />
          </SearchField.Group>
        </SearchField>
      </FieldVariantContext>,
    );

    expect(document.querySelector('[data-slot="search-field"]')?.className).toEqual(
      expect.stringContaining("search-field--primary"),
    );
  });

  it("применяет модификатор full-width", () => {
    renderSearch({fullWidth: true});

    expect(document.querySelector('[data-slot="search-field"]')?.className).toEqual(
      expect.stringContaining("search-field--full-width"),
    );
  });

  it("вводит текст и вызывает onChange", async () => {
    const onChange = vi.fn();

    renderSearch({onChange});
    const input = screen.getByRole("searchbox", {name: "Поиск"});

    await user.type(input, "пик");

    expect(input).toHaveValue("пик");
    expect(onChange.mock.calls.at(-1)?.[0]).toBe("пик");
  });

  it("работает как контролируемое поле", async () => {
    function Controlled() {
      const [value, setValue] = useState("запрос");

      return (
        <SearchField name="search" value={value} onChange={setValue}>
          <Label>Поиск</Label>
          <SearchField.Group>
            <SearchField.Input />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      );
    }

    render(<Controlled />);
    const input = screen.getByRole("searchbox", {name: "Поиск"});

    await user.type(input, "!");

    expect(input).toHaveValue("запрос!");
  });

  it("кнопка очистки сбрасывает значение и зовёт onClear", async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();

    renderSearch({defaultValue: "пик", onChange, onClear});

    await user.click(clearButton()!);

    expect(screen.getByRole("searchbox", {name: "Поиск"})).toHaveValue("");
    expect(onChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("после очистки появляется data-empty", async () => {
    renderSearch({defaultValue: "пик"});

    const field = document.querySelector('[data-slot="search-field"]');

    expect(field).not.toHaveAttribute("data-empty");

    await user.click(clearButton()!);

    expect(field).toHaveAttribute("data-empty", "true");
  });

  it("не вводит и не зовёт onChange в disabled", async () => {
    const onChange = vi.fn();

    renderSearch({isDisabled: true, onChange});
    const input = screen.getByRole("searchbox", {name: "Поиск"});

    expect(input).toBeDisabled();
    expect(document.querySelector('[data-slot="search-field"]')).toHaveAttribute(
      "data-disabled",
      "true",
    );

    await user.type(input, "x");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("рендерит FieldError у невалидного поля", () => {
    render(
      <SearchField isInvalid isRequired name="search" value="ab">
        <Label>Поиск</Label>
        <SearchField.Group>
          <SearchField.Input />
          <SearchField.ClearButton />
        </SearchField.Group>
        <FieldError>Минимум 3 символа</FieldError>
      </SearchField>,
    );

    expect(screen.getByText("Минимум 3 символа")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="search-field"]')).toHaveAttribute(
      "data-invalid",
      "true",
    );
  });

  it("принимает клавиатурный фокус", async () => {
    renderSearch();

    await user.tab();

    expect(screen.getByRole("searchbox", {name: "Поиск"})).toHaveFocus();
  });

  it("ведёт себя одинаково как SearchField.Root и SearchFieldRoot", () => {
    render(
      <>
        <SearchField.Root aria-label="Пространство имён" name="a">
          <SearchField.Group>
            <SearchField.Input />
          </SearchField.Group>
        </SearchField.Root>
        <SearchFieldRoot aria-label="Плоское имя" name="b">
          <SearchField.Group>
            <SearchField.Input />
          </SearchField.Group>
        </SearchFieldRoot>
      </>,
    );

    for (const name of ["Пространство имён", "Плоское имя"]) {
      expect(screen.getByRole("searchbox", {name})).toHaveAttribute(
        "data-slot",
        "search-field-input",
      );
    }
  });
});
