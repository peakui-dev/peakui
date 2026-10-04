import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {EmptyState, EmptyStateRoot} from "@/components/empty-state";

describe("EmptyState", () => {
  it("рендерит div-контейнер с BEM-блоком и data-slot, не добавляя роли", () => {
    render(<EmptyState data-testid="empty-state">Пусто</EmptyState>);

    const emptyState = screen.getByTestId("empty-state");

    expect(emptyState.tagName).toBe("DIV");
    expect(emptyState.className).toEqual(expect.stringContaining("empty-state"));
    expect(emptyState).toHaveAttribute("data-slot", "empty-state");
    /* Блок — носитель содержимого: семантику ему добавляет потребитель. */
    expect(emptyState).not.toHaveAttribute("role");
  });

  it("показывает «No results found», когда children не передан", () => {
    render(<EmptyState />);

    expect(screen.getByText("No results found")).toHaveAttribute("data-slot", "empty-state");
  });

  it("показывает «No results found» и для пустого children", () => {
    /* children передан и это именно пустая строка, а не «не передан». */
    const emptyChildren = "";

    render(<EmptyState>{emptyChildren}</EmptyState>);

    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("рендерит переданное содержимое вместо дефолтной фразы", () => {
    render(<EmptyState>Здесь пока ничего нет</EmptyState>);

    expect(screen.getByText("Здесь пока ничего нет")).toBeInTheDocument();
    expect(screen.queryByText("No results found")).not.toBeInTheDocument();
  });

  it("объединяет потребительский className с блоком", () => {
    render(
      <EmptyState className="py-8" data-testid="empty-state">
        Пусто
      </EmptyState>,
    );

    const className = screen.getByTestId("empty-state").className;

    expect(className).toEqual(expect.stringContaining("empty-state"));
    expect(className).toEqual(expect.stringContaining("py-8"));
  });

  it("одинаково работает как EmptyState.Root и EmptyStateRoot", () => {
    render(
      <>
        <EmptyState.Root data-testid="namespaced">Один</EmptyState.Root>
        <EmptyStateRoot data-testid="flat">Два</EmptyStateRoot>
      </>,
    );

    for (const testId of ["namespaced", "flat"]) {
      expect(screen.getByTestId(testId)).toHaveAttribute("data-slot", "empty-state");
    }
  });

  it("пробрасывает произвольные атрибуты div на элемент", () => {
    render(
      <EmptyState aria-label="Список пуст" data-testid="empty-state">
        Пусто
      </EmptyState>,
    );

    expect(screen.getByTestId("empty-state")).toHaveAttribute("aria-label", "Список пуст");
  });

  it("пробрасывает ref на DOM-элемент", () => {
    const ref = createRef<HTMLDivElement>();

    render(<EmptyState ref={ref}>Пусто</EmptyState>);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("передаёт render-проп в рендерящийся элемент", () => {
    render(
      <EmptyState
        data-testid="empty-state"
        render={(props) => <div {...props} data-rendered="true" />}
      >
        Пусто
      </EmptyState>,
    );

    const emptyState = screen.getByTestId("empty-state");

    expect(emptyState).toHaveAttribute("data-rendered", "true");
    expect(emptyState).toHaveAttribute("data-slot", "empty-state");
    expect(emptyState).toHaveTextContent("Пусто");
  });
});
