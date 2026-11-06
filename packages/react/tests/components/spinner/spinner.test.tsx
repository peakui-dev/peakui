import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Spinner} from "@/components/spinner";

describe("Spinner", () => {
  it("renders with status role and default accessible name", () => {
    render(<Spinner />);

    expect(screen.getByRole("status", {name: "Loading"})).toBeInTheDocument();
  });

  it("exposes BEM block, data-slot, and icon sub-part", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status", {name: "Loading"});

    expect(spinner).toHaveAttribute("data-slot", "spinner");
    expect(spinner.className).toEqual(expect.stringContaining("spinner"));
    expect(spinner.querySelector('[data-slot="spinner-icon"]')).not.toBeNull();
  });

  it("supports overriding aria-label", () => {
    render(<Spinner aria-label="Saving changes" />);

    expect(screen.getByRole("status", {name: "Saving changes"})).toBeInTheDocument();
  });

  it("exposes color and size BEM modifiers", () => {
    render(<Spinner color="danger" data-testid="spinner" size="lg" />);
    const spinner = screen.getByTestId("spinner");

    expect(spinner.className).toEqual(expect.stringContaining("spinner--danger"));
    expect(spinner.className).toEqual(expect.stringContaining("spinner--lg"));
  });

  it("supports data attribute passthrough", () => {
    render(<Spinner data-foo="bar" data-testid="spinner" />);

    expect(screen.getByTestId("spinner")).toHaveAttribute("data-foo", "bar");
  });

  /* Review Focus 3: без forwardRef больше ничто не доказывает, что ref доезжает до узла. */
  it("forwards ref to the rendered element", () => {
    const ref = createRef<HTMLSpanElement>();

    render(<Spinner ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  /* Review Focus 4: столкновение id градиентов делает один из спиннеров невидимым. */
  it("gives each instance its own gradient ids", () => {
    render(
      <>
        <Spinner data-testid="first" />
        <Spinner data-testid="second" />
      </>,
    );

    const ids = (testId: string) =>
      [...screen.getByTestId(testId).querySelectorAll("linearGradient")].map((node) => node.id);

    expect(ids("first")).toHaveLength(2);
    expect(new Set([...ids("first"), ...ids("second")]).size).toBe(4);
  });

  /*
   * Уникальности id недостаточно, и это не придирка: суффикс useId() стоит в ЧЕТЫРЁХ отдельных
   * шаблонных строках — двух на id у linearGradient и двух на fill="url(#…)" у path. Разъедутся
   * только ссылки — id останутся уникальными, предыдущий тест останется зелёным, а оба спиннера
   * отрисуются пустыми рамками. Это ровно тот исход, ради которого проверка и существует.
   */
  it("resolves every gradient reference inside its own instance", () => {
    render(
      <>
        <Spinner data-testid="first" />
        <Spinner data-testid="second" />
      </>,
    );

    for (const testId of ["first", "second"]) {
      const root = screen.getByTestId(testId);
      const declared = new Set([...root.querySelectorAll("linearGradient")].map((node) => node.id));
      const referenced = [...root.querySelectorAll("path[fill]")]
        .map((node) => node.getAttribute("fill") ?? "")
        .filter((fill) => fill.startsWith("url(#"))
        .map((fill) => fill.slice("url(#".length, -1));

      expect(referenced.length).toBeGreaterThan(0);

      for (const id of referenced) {
        expect(declared, `${testId}: fill url(#${id}) ни на что не указывает`).toContain(id);
      }
    }
  });

  /*
   * render обязан вернуть элемент ожидаемого типа — это записано в контракте DOMRenderProps, и
   * первая версия этого теста его нарушала, возвращая <div> вместо <span>. Проверяется то, что
   * Spinner действительно пробрасывает render вниз, а не подмена тега.
   */
  it("passes the render prop through to the rendered element", () => {
    render(
      <Spinner
        data-testid="spinner"
        render={(props) => <span {...props} data-rendered="true" />}
      />,
    );
    const spinner = screen.getByTestId("spinner");

    expect(spinner).toHaveAttribute("data-rendered", "true");
    expect(spinner.querySelector('[data-slot="spinner-icon"]')).not.toBeNull();
  });

  describe("localization", () => {
    it("names the status in Russian under ru-RU", () => {
      render(
        <I18nProvider locale="ru-RU">
          <Spinner />
        </I18nProvider>,
      );

      expect(screen.getByRole("status", {name: "Загрузка"})).toBeInTheDocument();
    });

    it("names the status in English by default", () => {
      render(<Spinner />);

      expect(screen.getByRole("status", {name: "Loading"})).toBeInTheDocument();
    });

    it("lets the consumer label win", () => {
      render(
        <I18nProvider locale="ru-RU">
          <Spinner aria-label="Моё имя" />
        </I18nProvider>,
      );

      expect(screen.getByRole("status", {name: "Моё имя"})).toBeInTheDocument();
    });

    it.each(["ru", "de-DE", "ar-EG"])("falls back to English for %s", (locale) => {
      render(
        <I18nProvider locale={locale}>
          <Spinner />
        </I18nProvider>,
      );

      const name = locale === "ru" ? "Загрузка" : "Loading";

      expect(screen.getByRole("status", {name})).toBeInTheDocument();
    });

    it("lets the consumer aria-labelledby win", () => {
      render(
        <I18nProvider locale="ru-RU">
          <span id="x">Своё</span>
          <Spinner aria-labelledby="x" />
        </I18nProvider>,
      );

      expect(screen.getByRole("status", {name: "Своё"})).toBeInTheDocument();
    });
  });
});
