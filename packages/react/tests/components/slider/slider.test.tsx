import type {ComponentProps} from "react";

import {render, screen, setupUser} from "@peakui/testing/helpers";
import {useState} from "react";

import {Slider, SliderRoot} from "@/components/slider/index.ts";

/*
 * RAC рендерит каждый бегунок как визуально скрытый нативный <input type="range">: роль slider —
 * у него, значение — в value и aria-valuetext, а не в aria-valuenow. Все проверки значения идут
 * через этот input (getByRole("slider") находит именно его).
 */
const track = () => (
  <Slider.Track>
    <Slider.Fill />
    <Slider.Thumb />
  </Slider.Track>
);

const rangeTrack = () => (
  <Slider.Track>
    {({state}) => (
      <>
        <Slider.Fill />
        {state.values.map((_, i) => (
          <Slider.Thumb key={i} index={i} />
        ))}
      </>
    )}
  </Slider.Track>
);

const renderSlider = (props: ComponentProps<typeof Slider> = {}) =>
  render(
    <Slider aria-label="Громкость" defaultValue={30} {...props}>
      <Slider.Output />
      {track()}
    </Slider>,
  );

describe("Slider", () => {
  it("рендерит бегунок со значением и доступным именем", () => {
    renderSlider();

    expect(screen.getByRole("slider", {name: "Громкость"})).toHaveValue("30");
  });

  it("части несут свои data-slot", () => {
    renderSlider();

    expect(document.querySelector('[data-slot="slider"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="slider-output"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="slider-track"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="slider-fill"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="slider-thumb"]')).toBeInTheDocument();
  });

  it("выход показывает значение по умолчанию", () => {
    renderSlider();

    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("стрелка вправо увеличивает значение", async () => {
    const user = setupUser();
    const onChange = vi.fn();

    renderSlider({onChange});
    const thumb = screen.getByRole("slider", {name: "Громкость"});

    thumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(thumb).toHaveValue("31");
    expect(onChange).toHaveBeenCalledWith(31);
  });

  it("Home и End кладут значение на границы", async () => {
    const user = setupUser();

    renderSlider({maxValue: 200, minValue: 0});
    const thumb = screen.getByRole("slider", {name: "Громкость"});

    thumb.focus();
    await user.keyboard("{Home}");
    expect(thumb).toHaveValue("0");

    await user.keyboard("{End}");
    expect(thumb).toHaveValue("200");
  });

  it("уважает шаг", async () => {
    const user = setupUser();

    renderSlider({defaultValue: 30, step: 10});
    const thumb = screen.getByRole("slider", {name: "Громкость"});

    thumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(thumb).toHaveValue("40");
  });

  it("клавиатура не меняет заблокированный бегунок", async () => {
    const user = setupUser();

    renderSlider({isDisabled: true});
    const thumb = screen.getByRole("slider", {name: "Громкость"});

    expect(thumb).toBeDisabled();

    thumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(thumb).toHaveValue("30");
  });

  it("диапазон рендерит два бегунка со своими значениями", () => {
    render(
      <Slider aria-label="Ценовой диапазон" defaultValue={[100, 500]} maxValue={1000} minValue={0}>
        <Slider.Output />
        {rangeTrack()}
      </Slider>,
    );

    const thumbs = screen.getAllByRole("slider");

    expect(thumbs).toHaveLength(2);
    expect(thumbs[0]).toHaveValue("100");
    expect(thumbs[1]).toHaveValue("500");
  });

  it("выход диапазона соединяет значения через тире", () => {
    render(
      <Slider aria-label="Ценовой диапазон" defaultValue={[100, 500]} maxValue={1000} minValue={0}>
        <Slider.Output />
        {rangeTrack()}
      </Slider>,
    );

    expect(screen.getByText("100 – 500")).toBeInTheDocument();
  });

  it("Tab переводит фокус между бегунками диапазона", async () => {
    const user = setupUser();

    render(
      <Slider aria-label="Ценовой диапазон" defaultValue={[100, 500]} maxValue={1000} minValue={0}>
        {rangeTrack()}
      </Slider>,
    );

    const [first, second] = screen.getAllByRole("slider");

    expect(first).toBeInTheDocument();
    expect(second).toBeInTheDocument();

    first?.focus();
    await user.tab();

    expect(second).toHaveFocus();
  });

  it("управляемое значение следует за пропом", async () => {
    const user = setupUser();
    const Controlled = () => {
      const [value, setValue] = useState(25);

      return (
        <Slider
          aria-label="Громкость"
          value={value}
          onChange={(nextValue) => {
            if (typeof nextValue === "number") {
              setValue(nextValue);
            }
          }}
        >
          {track()}
        </Slider>
      );
    };

    render(<Controlled />);
    const thumb = screen.getByRole("slider", {name: "Громкость"});

    thumb.focus();
    await user.keyboard("{ArrowRight}");

    expect(thumb).toHaveValue("26");
  });

  it("полоса заполняется от нуля для одного бегунка", () => {
    renderSlider();

    const fill = document.querySelector('[data-slot="slider-fill"]') as HTMLElement;

    expect(fill.style.left).toBe("0%");
    expect(fill.style.width).toBe("30%");
  });

  it("вертикальная полоса растёт снизу", () => {
    renderSlider({orientation: "vertical"});

    const fill = document.querySelector('[data-slot="slider-fill"]') as HTMLElement;

    expect(fill.style.bottom).toBe("0%");
    expect(fill.style.height).toBe("30%");
  });

  it("дорожка помечает заполненный край", () => {
    renderSlider({defaultValue: 100});

    const trackElement = document.querySelector('[data-slot="slider-track"]') as HTMLElement;

    expect(trackElement).toHaveAttribute("data-fill-start", "true");
    expect(trackElement).toHaveAttribute("data-fill-end", "true");
  });

  it("ведёт себя одинаково как Slider.Root и SliderRoot", () => {
    render(
      <>
        <Slider.Root aria-label="Имена" defaultValue={1}>
          {track()}
        </Slider.Root>
        <SliderRoot aria-label="Плоский" defaultValue={2}>
          {track()}
        </SliderRoot>
      </>,
    );

    expect(screen.getByRole("slider", {name: "Имена"})).toHaveValue("1");
    expect(screen.getByRole("slider", {name: "Плоский"})).toHaveValue("2");
  });
});
