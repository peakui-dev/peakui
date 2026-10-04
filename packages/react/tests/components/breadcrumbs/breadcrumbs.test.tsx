import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Breadcrumbs, BreadcrumbsItem, BreadcrumbsRoot} from "@/components/breadcrumbs/index.ts";

describe("Breadcrumbs", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  const renderTrail = () =>
    render(
      <Breadcrumbs aria-label="Навигационная цепочка">
        <BreadcrumbsItem href="/">Главная</BreadcrumbsItem>
        <BreadcrumbsItem href="/products">Продукция</BreadcrumbsItem>
        <BreadcrumbsItem href="/electronics">Электроника</BreadcrumbsItem>
        <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
      </Breadcrumbs>,
    );

  describe("структура списка", () => {
    it("рисует упорядоченный список с доступным именем", () => {
      renderTrail();

      const list = screen.getByRole("list", {name: "Навигационная цепочка"});

      expect(list).toHaveAttribute("data-slot", "breadcrumbs");
      expect(list.className).toEqual(expect.stringContaining("breadcrumbs"));
    });

    it("рендерит пункты элементами списка со своим слотом", () => {
      renderTrail();

      const items = screen.getAllByRole("listitem");

      expect(items).toHaveLength(4);
      for (const item of items) {
        expect(item).toHaveAttribute("data-slot", "breadcrumbs-item");
      }
    });

    it("рисует содержимое пункта ссылкой с href", () => {
      renderTrail();

      const link = screen.getByRole("link", {name: "Продукция"});

      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/products");
    });

    it("вставляет встроенный шеврон между пунктами", () => {
      renderTrail();

      const separators = document.querySelectorAll('[data-slot="breadcrumbs-separator"]');

      expect(separators).toHaveLength(3);
    });
  });

  describe("текущая страница", () => {
    it("помечает последний пункт как текущий", () => {
      renderTrail();

      const last = screen.getAllByRole("listitem").at(-1);

      expect(last).toHaveAttribute("data-current", "true");
    });

    it("ссылка текущей страницы несёт aria-current со значением page", () => {
      renderTrail();

      expect(screen.getByRole("link", {name: "Ноутбуки"})).toHaveAttribute("aria-current", "page");
    });

    it("текущая ссылка неактивна как элемент управления", () => {
      renderTrail();

      expect(screen.getByRole("link", {name: "Ноутбуки"})).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("клавиатура", () => {
    it("Tab обходит ссылки цепочки по порядку", async () => {
      renderTrail();

      await user.tab();
      expect(screen.getByRole("link", {name: "Главная"})).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("link", {name: "Продукция"})).toHaveFocus();
    });
  });

  describe("настраиваемый разделитель", () => {
    it("элемент-разделитель заменяет шеврон и получает слот", () => {
      render(
        <Breadcrumbs separator={<span>/</span>}>
          <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          <BreadcrumbsItem href="#">Продукция</BreadcrumbsItem>
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      const separators = document.querySelectorAll('[data-slot="breadcrumbs-separator"]');

      expect(separators).toHaveLength(2);
      expect(separators[0]?.textContent).toBe("/");
    });

    it("неэлементный разделитель рендерится как есть", () => {
      render(
        <Breadcrumbs separator="/">
          <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          <BreadcrumbsItem href="#">Продукция</BreadcrumbsItem>
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      expect(document.querySelectorAll('[data-slot="breadcrumbs-separator"]')).toHaveLength(0);
      expect(screen.getAllByText("/")).toHaveLength(2);
    });
  });

  describe("неактивное состояние", () => {
    it("isDisabled на корне запрещает все ссылки", () => {
      render(
        <Breadcrumbs isDisabled>
          <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      for (const name of ["Главная", "Ноутбуки"]) {
        expect(screen.getByRole("link", {name})).toHaveAttribute("aria-disabled", "true");
      }
    });

    it("клик по запрещённой ссылке не вызывает onAction", async () => {
      const onAction = vi.fn();

      render(
        <Breadcrumbs isDisabled onAction={onAction}>
          <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      await user.click(screen.getByRole("link", {name: "Главная"}));

      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe("активация пункта", () => {
    it("onAction получает ключ пункта", async () => {
      const onAction = vi.fn();

      render(
        <Breadcrumbs onAction={onAction}>
          <BreadcrumbsItem href="#" id="home">
            Главная
          </BreadcrumbsItem>
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      await user.click(screen.getByRole("link", {name: "Главная"}));

      expect(onAction).toHaveBeenCalledWith("home");
    });
  });

  describe("варианты вызова", () => {
    it("Breadcrumbs.Root и BreadcrumbsRoot ведут себя одинаково", () => {
      render(
        <>
          <Breadcrumbs.Root aria-label="Первая">
            <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          </Breadcrumbs.Root>
          <BreadcrumbsRoot aria-label="Вторая">
            <BreadcrumbsItem href="#">Главная</BreadcrumbsItem>
          </BreadcrumbsRoot>
        </>,
      );

      for (const name of ["Первая", "Вторая"]) {
        expect(screen.getByRole("list", {name})).toHaveAttribute("data-slot", "breadcrumbs");
      }
    });
  });

  describe("render", () => {
    it("заменяет элемент ссылки пункта, не сам пункт", () => {
      render(
        <Breadcrumbs>
          <BreadcrumbsItem
            href="#"
            render={(props) => (
              <em data-testid="rendered-link" {...props}>
                Главная
              </em>
            )}
          />
          <BreadcrumbsItem>Ноутбуки</BreadcrumbsItem>
        </Breadcrumbs>,
      );

      const rendered = screen.getByTestId("rendered-link");

      expect(rendered.tagName).toBe("EM");
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(screen.getAllByRole("listitem")[0]).toHaveAttribute("data-slot", "breadcrumbs-item");
    });
  });
});
