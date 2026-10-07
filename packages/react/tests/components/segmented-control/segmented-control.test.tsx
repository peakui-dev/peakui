import {render, screen, setupUser, waitFor} from "@peakui/testing/helpers";

import {SegmentedControl, SegmentedControlRoot} from "@/components/segmented-control/index.ts";

/** Три сегмента, которыми пользуется большинство тестов ниже. */
function views() {
  return (
    <>
      <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
      <SegmentedControl.Item id="list">Список</SegmentedControl.Item>
      <SegmentedControl.Item id="table">Таблица</SegmentedControl.Item>
    </>
  );
}

describe("SegmentedControl", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("выставляет BEM-блок и data-slot", () => {
      render(
        <SegmentedControl aria-label="Вид" data-testid="control">
          {views()}
        </SegmentedControl>,
      );

      const control = screen.getByTestId("control");

      expect(control).toHaveClass("segmented-control");
      expect(control).toHaveAttribute("data-slot", "segmented-control");
    });

    it("имеет роль radiogroup", () => {
      render(<SegmentedControl aria-label="Вид">{views()}</SegmentedControl>);

      expect(screen.getByRole("radiogroup", {name: "Вид"})).toBeInTheDocument();
    });

    it("сливает className консьюмера с блоком", () => {
      render(
        <SegmentedControl aria-label="Вид" className="custom" data-testid="control">
          {views()}
        </SegmentedControl>,
      );

      const control = screen.getByTestId("control");

      expect(control).toHaveClass("segmented-control");
      expect(control).toHaveClass("custom");
    });

    it("ведёт себя одинаково как SegmentedControl.Root и как SegmentedControlRoot", () => {
      render(
        <>
          <SegmentedControl.Root aria-label="Первый" data-testid="namespaced">
            <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
          </SegmentedControl.Root>
          <SegmentedControlRoot aria-label="Второй" data-testid="flat">
            <SegmentedControl.Item id="list">Список</SegmentedControl.Item>
          </SegmentedControlRoot>
        </>,
      );

      for (const testId of ["namespaced", "flat"]) {
        expect(screen.getByTestId(testId)).toHaveAttribute("data-slot", "segmented-control");
      }
    });
  });

  describe("размер", () => {
    it("по умолчанию применяет размер md", () => {
      render(
        <SegmentedControl aria-label="Вид" data-testid="control">
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByTestId("control")).toHaveClass("segmented-control--md");
    });

    it.each(["sm", "md", "lg"] as const)("применяет класс размера %s", (size) => {
      render(
        <SegmentedControl aria-label="Вид" data-testid="control" size={size}>
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByTestId("control")).toHaveClass(`segmented-control--${size}`);
    });

    it("класс размера стоит на корне, а не на сегменте", () => {
      render(
        <SegmentedControl aria-label="Вид" data-testid="control" size="sm">
          {views()}
        </SegmentedControl>,
      );

      const item = screen.getByRole("radio", {name: "Сетка"});

      expect(screen.getByTestId("control")).toHaveClass("segmented-control--sm");
      expect(item).toHaveClass("segmented-control__item");
      expect(item.className).not.toMatch(/--sm|--md|--lg/);
    });
  });

  describe("выбор", () => {
    it("defaultSelectedKey выбирает сегмент при монтировании", () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByRole("radio", {name: "Список"})).toBeChecked();
      expect(screen.getByRole("radio", {name: "Сетка"})).not.toBeChecked();
    });

    it("onSelectionChange получает одиночный ключ, а не Set", async () => {
      const onSelectionChange = vi.fn();

      render(
        <SegmentedControl
          aria-label="Вид"
          defaultSelectedKey="grid"
          onSelectionChange={onSelectionChange}
        >
          {views()}
        </SegmentedControl>,
      );

      await user.click(screen.getByRole("radio", {name: "Таблица"}));

      expect(onSelectionChange).toHaveBeenCalledWith("table");
    });

    it("selectedKey управляет выбором извне", () => {
      const {rerender} = render(
        <SegmentedControl aria-label="Вид" selectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByRole("radio", {name: "Сетка"})).toBeChecked();

      rerender(
        <SegmentedControl aria-label="Вид" selectedKey="table">
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByRole("radio", {name: "Таблица"})).toBeChecked();
      expect(screen.getByRole("radio", {name: "Сетка"})).not.toBeChecked();
    });

    it("isDisabled выключает все сегменты", () => {
      render(
        <SegmentedControl isDisabled aria-label="Вид" defaultSelectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      for (const name of ["Сетка", "Список", "Таблица"]) {
        expect(screen.getByRole("radio", {name})).toBeDisabled();
      }
    });
  });

  describe("сегмент", () => {
    it("сегмент имеет роль radio и aria-checked", () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      const selected = screen.getByRole("radio", {name: "Сетка"});

      expect(selected).toHaveAttribute("data-slot", "segmented-control-item");
      expect(selected).toHaveAttribute("aria-checked", "true");
      expect(screen.getByRole("radio", {name: "Список"})).toHaveAttribute("aria-checked", "false");
    });

    it("индикатор рендерится только внутри выбранного сегмента", () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
          {views()}
        </SegmentedControl>,
      );

      const indicators = document.querySelectorAll('[data-slot="segmented-control-indicator"]');

      expect(indicators).toHaveLength(1);
      expect(indicators[0]).toHaveClass("segmented-control__indicator");
      expect(screen.getByRole("radio", {name: "Список"})).toContainElement(
        indicators[0] as HTMLElement,
      );
    });

    it("повторный клик по выбранному сегменту не снимает выбор", async () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      const selected = screen.getByRole("radio", {name: "Сетка"});

      await user.click(selected);

      expect(selected).toBeChecked();
    });

    it("отключённый сегмент не выбирается", async () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
          <SegmentedControl.Item isDisabled id="list">
            Список
          </SegmentedControl.Item>
        </SegmentedControl>,
      );

      const disabled = screen.getByRole("radio", {name: "Список"});

      await user.click(disabled);

      expect(disabled).not.toBeChecked();
      expect(screen.getByRole("radio", {name: "Сетка"})).toBeChecked();
    });
  });

  describe("клавиатура", () => {
    it("стрелка переносит фокус, но не меняет выбор", async () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      const first = screen.getByRole("radio", {name: "Сетка"});
      const second = screen.getByRole("radio", {name: "Список"});

      await user.tab();
      expect(first).toHaveFocus();

      await user.keyboard("{ArrowRight}");

      expect(second).toHaveFocus();
      expect(first).toBeChecked();
      expect(second).not.toBeChecked();
    });

    it("Space выбирает сегмент, на котором фокус", async () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          {views()}
        </SegmentedControl>,
      );

      const second = screen.getByRole("radio", {name: "Список"});

      await user.tab();
      await user.keyboard("{ArrowRight}");
      await user.keyboard(" ");

      expect(second).toBeChecked();
    });
  });

  describe("граничные случаи", () => {
    it("selectedKey, не совпадающий ни с одним сегментом, не выбирает ничего и не падает", () => {
      render(
        <SegmentedControl aria-label="Вид" selectedKey="missing">
          {views()}
        </SegmentedControl>,
      );

      for (const name of ["Сетка", "Список", "Таблица"]) {
        expect(screen.getByRole("radio", {name})).not.toBeChecked();
      }
      expect(document.querySelectorAll('[data-slot="segmented-control-indicator"]')).toHaveLength(
        0,
      );
    });

    it("рендерится с единственным сегментом", () => {
      render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="grid">
          <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
        </SegmentedControl>,
      );

      const only = screen.getByRole("radio", {name: "Сетка"});
      const indicators = document.querySelectorAll('[data-slot="segmented-control-indicator"]');

      expect(only).toBeChecked();
      expect(indicators).toHaveLength(1);
      expect(only).toContainElement(indicators[0] as HTMLElement);
    });

    it("размонтирование выбранного сегмента оставляет группу без выбора и без индикатора", async () => {
      const {rerender} = render(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
          {views()}
        </SegmentedControl>,
      );

      expect(screen.getByRole("radio", {name: "Список"})).toBeChecked();

      rerender(
        <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
          <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
          <SegmentedControl.Item id="table">Таблица</SegmentedControl.Item>
        </SegmentedControl>,
      );

      expect(screen.getByRole("radio", {name: "Сетка"})).not.toBeChecked();
      expect(screen.getByRole("radio", {name: "Таблица"})).not.toBeChecked();

      /*
       * The capsule does not vanish on the same tick. The segments carry no React key, so the DOM
       * node that held the selected segment is reused for the one after it, and RAC moves the
       * indicator to its exit path in a microtask. The settled state is what matters to a person:
       * nothing selected, and no capsule left behind.
       */
      await waitFor(() =>
        expect(document.querySelectorAll('[data-slot="segmented-control-indicator"]')).toHaveLength(
          0,
        ),
      );
    });
  });
});
