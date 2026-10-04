import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Link, LinkIcon, LinkRoot} from "@/components/link/index.ts";

describe("Link", () => {
  let user: ReturnType<typeof setupUser>;

  beforeAll(() => {
    user = setupUser();
  });

  describe("рендеринг", () => {
    it("рисует якорь с ролью link, href, data-slot и блоком", () => {
      render(<Link href="/pricing">Тарифы</Link>);
      const link = screen.getByRole("link", {name: "Тарифы"});

      expect(link.tagName).toBe("A");
      expect(link).toHaveAttribute("href", "/pricing");
      expect(link).toHaveAttribute("data-slot", "link");
      expect(link.className).toEqual(expect.stringContaining("link"));
    });

    it("пробрасывает атрибуты якоря: target и rel", () => {
      render(
        <Link href="https://example.com" rel="noopener noreferrer" target="_blank">
          Внешний ресурс
        </Link>,
      );

      expect(screen.getByRole("link", {name: "Внешний ресурс"})).toHaveAttribute(
        "target",
        "_blank",
      );
      expect(screen.getByRole("link", {name: "Внешний ресурс"})).toHaveAttribute(
        "rel",
        "noopener noreferrer",
      );
    });

    it("сливает className потребителя с блоком", () => {
      render(
        <Link className="underline-offset-2" href="#">
          Смещение
        </Link>,
      );

      const className = screen.getByRole("link", {name: "Смещение"}).className;

      expect(className).toEqual(expect.stringContaining("link"));
      expect(className).toEqual(expect.stringContaining("underline-offset-2"));
    });

    it("неактивная ссылка объявляет себя через aria-disabled", () => {
      render(
        <Link isDisabled href="#">
          Недоступная
        </Link>,
      );

      expect(screen.getByRole("link", {name: "Недоступная"})).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    it("наведение переключает data-hovered", async () => {
      render(<Link href="#">Наведи</Link>);
      const link = screen.getByRole("link", {name: "Наведи"});

      expect(link).not.toHaveAttribute("data-hovered");

      await user.hover(link);
      expect(link).toHaveAttribute("data-hovered", "true");

      await user.unhover(link);
      expect(link).not.toHaveAttribute("data-hovered");
    });
  });

  describe("иконка", () => {
    it("без children рисует встроенную иконку внешней ссылки", () => {
      render(
        <Link href="#">
          Документация
          <Link.Icon />
        </Link>,
      );

      const icon = screen.getByText("Документация").querySelector('[data-slot="link-icon"]');

      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("data-default-icon", "true");
      expect(icon?.querySelector('[data-slot="link-default-icon"]')).not.toBeNull();
    });

    it("встроенная иконка декоративна: aria-hidden без роли", () => {
      render(
        <Link href="#">
          Документация
          <Link.Icon />
        </Link>,
      );

      const icon = screen.getByText("Документация").querySelector('[data-slot="link-icon"]');
      const svg = icon?.querySelector('[data-slot="link-default-icon"]');

      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("role", "presentation");
    });

    it("свои children заменяют иконку по умолчанию", () => {
      render(
        <Link href="#">
          <Link.Icon>
            <svg data-testid="custom-icon" viewBox="0 0 16 16" />
          </Link.Icon>
          Справка
        </Link>,
      );

      const icon = screen.getByTestId("custom-icon").closest('[data-slot="link-icon"]');

      expect(icon).not.toBeNull();
      expect(icon).not.toHaveAttribute("data-default-icon");
      expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
      expect(
        screen.getByText("Справка").querySelector('[data-slot="link-default-icon"]'),
      ).toBeNull();
    });

    it("иконка занимает свой слот и в начале, и в конце содержимого", () => {
      render(
        <Link href="#">
          <Link.Icon data-testid="leading" />В начале
        </Link>,
      );

      const link = screen.getByRole("link", {name: /В начале/});

      expect(link.firstElementChild).toBe(screen.getByTestId("leading"));
    });

    it("render заменяет элемент иконки, сохраняя контракт слота", () => {
      render(
        <Link href="#">
          Свои элементы
          <Link.Icon
            render={(props) => (
              <em data-testid="rendered-icon" {...props}>
                i
              </em>
            )}
          />
        </Link>,
      );

      const rendered = screen.getByTestId("rendered-icon");

      expect(rendered.tagName).toBe("EM");
      expect(rendered).toHaveAttribute("data-slot", "link-icon");
    });
  });

  describe("варианты вызова", () => {
    it("Link.Root и LinkRoot ведут себя одинаково", () => {
      render(
        <>
          <Link.Root href="#">Именованный</Link.Root>
          <LinkRoot href="#">Плоский</LinkRoot>
        </>,
      );

      expect(screen.getByRole("link", {name: "Именованный"})).toHaveAttribute("data-slot", "link");
      expect(screen.getByRole("link", {name: "Плоский"})).toHaveAttribute("data-slot", "link");
    });

    it("Link.Icon и LinkIcon ведут себя одинаково", () => {
      render(
        <>
          <Link href="#">
            Первая
            <Link.Icon />
          </Link>
          <Link href="#">
            Вторая
            <LinkIcon />
          </Link>
        </>,
      );

      for (const name of ["Первая", "Вторая"]) {
        const icon = screen.getByText(name).querySelector('[data-slot="link-icon"]');

        expect(icon).toHaveAttribute("data-default-icon", "true");
      }
    });
  });

  describe("render props", () => {
    it("children-функция получает render props примитива", () => {
      render(<Link href="#">{(values) => <>наведение: {String(values.isHovered)}</>}</Link>);

      expect(screen.getByRole("link", {name: "наведение: false"})).toBeInTheDocument();
    });
  });
});
