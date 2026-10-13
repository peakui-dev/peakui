import {render, screen} from "@peakui/testing/helpers";

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
        <ProgressBar.Output data-testid="out" />
      </ProgressBar>,
    );

    expect(screen.getByTestId("out")).toHaveTextContent("40%");
    rerender(
      <ProgressBar aria-label="Upload" value={40}>
        <ProgressBar.Output data-testid="out">2 of 5</ProgressBar.Output>
      </ProgressBar>,
    );
    expect(screen.getByTestId("out")).toHaveTextContent("2 of 5");
  });

  it("несёт цвет и размер классами", () => {
    render(<ProgressBar aria-label="Disk" color="danger" size="sm" value={90} />);

    const bar = screen.getByRole("progressbar");

    expect(bar.className).toContain("progress-bar--danger");
    expect(bar.className).toContain("progress-bar--sm");
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
