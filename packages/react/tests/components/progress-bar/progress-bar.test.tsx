import {render, screen} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {ProgressBar, ProgressBarRoot} from "@/components/progress-bar/index.ts";

describe("ProgressBar", () => {
  it("отдаёт значение вспомогательным технологиям под заданным именем", () => {
    render(
      <ProgressBar aria-label="Loading" value={40}>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    const bar = screen.getByRole("progressbar", {name: "Loading"});

    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("data-slot", "progress-bar");
  });

  it("считает ширину заполнения от значения в заданном диапазоне", () => {
    render(
      <ProgressBar aria-label="Steps" maxValue={8} minValue={0} value={2}>
        <ProgressBar.Track>
          {/* testid: у Fill нет роли, имени и текста — найти его иначе нельзя */}
          <ProgressBar.Fill data-testid="fill" />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("25%");
  });

  it("обрезает значение выше максимума", () => {
    render(
      <ProgressBar aria-label="Over" value={140}>
        <ProgressBar.Track>
          {/* testid: у Fill нет роли, имени и текста — найти его иначе нельзя */}
          <ProgressBar.Fill data-testid="fill" />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("100%");
  });

  it("не ставит значение и ширину заполнения в неопределённом состоянии", () => {
    render(
      <ProgressBar isIndeterminate aria-label="Working">
        <ProgressBar.Track>
          {/* testid: у Fill нет роли, имени и текста — найти его иначе нельзя */}
          <ProgressBar.Fill data-testid="fill" />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
    expect(screen.getByTestId("fill").style.width).toBe("");
  });

  it("показывает в выводе отформатированное значение или переданных детей", () => {
    const {rerender} = render(
      <ProgressBar aria-label="Upload" value={40}>
        {/* testid: у Output нет роли и имени, а текст как раз под проверкой */}
        <ProgressBar.Output data-testid="out" />
      </ProgressBar>,
    );

    expect(screen.getByTestId("out")).toHaveTextContent("40%");
    rerender(
      <ProgressBar aria-label="Upload" value={40}>
        {/* testid: тот же Output после rerender, см. выше */}
        <ProgressBar.Output data-testid="out">2 of 5</ProgressBar.Output>
      </ProgressBar>,
    );
    expect(screen.getByTestId("out")).toHaveTextContent("2 of 5");
  });

  it.each(["default", "accent", "success", "warning", "danger"] as const)(
    "цвет «%s» добавляет свой модификатор",
    (color) => {
      render(<ProgressBar aria-label="Disk" color={color} value={90} />);

      expect(screen.getByRole("progressbar").className).toContain(`progress-bar--${color}`);
    },
  );

  it.each(["sm", "md", "lg"] as const)("размер «%s» добавляет свой модификатор", (size) => {
    render(<ProgressBar aria-label="Disk" size={size} value={90} />);

    expect(screen.getByRole("progressbar").className).toContain(`progress-bar--${size}`);
  });

  it("без цвета и размера берёт accent и md", () => {
    render(<ProgressBar aria-label="Disk" value={90} />);

    const bar = screen.getByRole("progressbar");

    expect(bar.className).toContain("progress-bar--accent");
    expect(bar.className).toContain("progress-bar--md");
  });

  it("помечает части своими data-slot", () => {
    render(
      <ProgressBar aria-label="Parts" value={40}>
        {/* testid: части без роли и имени, а data-slot как раз под проверкой */}
        <ProgressBar.Output data-testid="output" />
        <ProgressBar.Track data-testid="track">
          <ProgressBar.Fill data-testid="fill" />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByTestId("output")).toHaveAttribute("data-slot", "progress-bar-output");
    expect(screen.getByTestId("track")).toHaveAttribute("data-slot", "progress-bar-track");
    expect(screen.getByTestId("fill")).toHaveAttribute("data-slot", "progress-bar-fill");
  });

  it("называет полосу видимой подписью, а не aria-label", () => {
    render(
      <ProgressBar value={40}>
        <Label>Загрузка</Label>
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByRole("progressbar", {name: "Загрузка"})).toHaveAttribute(
      "aria-valuenow",
      "40",
    );
  });

  it("считает ширину заполнения от ненулевого минимума", () => {
    render(
      <ProgressBar aria-label="Range" maxValue={50} minValue={10} value={30}>
        <ProgressBar.Track>
          {/* testid: у Fill нет роли, имени и текста — найти его иначе нельзя */}
          <ProgressBar.Fill data-testid="fill" />
        </ProgressBar.Track>
      </ProgressBar>,
    );

    expect(screen.getByTestId("fill").style.width).toBe("50%");
  });

  it("объединяет className потребителя с классами блока", () => {
    render(<ProgressBar aria-label="Merged" className="custom" value={10} />);

    const bar = screen.getByRole("progressbar");

    expect(bar.className).toContain("custom");
    expect(bar.className).toContain("progress-bar");
  });

  it("ведёт себя одинаково как ProgressBar.Root и ProgressBarRoot", () => {
    render(
      <>
        <ProgressBar.Root aria-label="Namespaced" value={10} />
        <ProgressBarRoot aria-label="Flat" value={10} />
      </>,
    );

    for (const name of ["Namespaced", "Flat"]) {
      expect(screen.getByRole("progressbar", {name})).toHaveAttribute("data-slot", "progress-bar");
    }
  });
});
