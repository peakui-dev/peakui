import {render, screen, setupUser} from "@peakui/testing/helpers";

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
});
