import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Tooltip, TooltipRoot} from "@/components/tooltip/index.ts";

/** Прогревает глобальный warmup-флаг RAC: первый ховер без него гоняется с фейковыми таймерами. */
const primeTooltipWarmup = async (user: ReturnType<typeof setupUser>) => {
  const view = render(
    <Tooltip delay={0}>
      <Button>Warmup</Button>
      <Tooltip.Content>warm</Tooltip.Content>
    </Tooltip>,
  );

  await user.hover(screen.getByRole("button", {name: "Warmup"}));
  view.unmount();

  await act(async () => {
    vi.runOnlyPendingTimers();
  });
};

describe("Tooltip", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    user = setupUser({advanceTimers: vi.advanceTimersByTime});
    await primeTooltipWarmup(user);
  });

  afterEach(() => {
    cleanup();
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("выставляет data-slot на собственном триггере", () => {
    render(
      <Tooltip delay={0}>
        <Tooltip.Trigger aria-label="Info">
          <span>i</span>
        </Tooltip.Trigger>
        <Tooltip.Content>Tooltip content</Tooltip.Content>
      </Tooltip>,
    );

    expect(document.querySelector('[data-slot="tooltip-trigger"]')).not.toBeNull();
  });

  it("показывает содержимое по ховеру с BEM-блоком", async () => {
    render(
      <Tooltip delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content>Hover tip</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", {name: "Hover me"}));
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent("Hover tip");
    expect(tooltip.className).toEqual(expect.stringContaining("tooltip"));
    expect(tooltip).toHaveAttribute("data-slot", "tooltip");
  });

  it("показывает содержимое по фокусу и связывает триггер с подсказкой", async () => {
    render(
      <Tooltip delay={0}>
        <Button>Focus me</Button>
        <Tooltip.Content>Focus tip</Tooltip.Content>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {name: "Focus me"});

    await user.tab();
    expect(trigger).toHaveFocus();
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole("tooltip");

    expect(tooltip).toHaveTextContent("Focus tip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("прячет содержимое по closeDelay после ухода с триггера", async () => {
    render(
      <Tooltip closeDelay={300} delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content>Closable tip</Tooltip.Content>
      </Tooltip>,
    );

    const trigger = screen.getByRole("button", {name: "Hover me"});

    await user.hover(trigger);
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.unhover(trigger);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("не показывает содержимое при isDisabled", async () => {
    render(
      <Tooltip isDisabled delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content>Should not appear</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", {name: "Hover me"}));
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("рисует стрелку, когда собран с showArrow", async () => {
    render(
      <Tooltip delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content showArrow>
          <Tooltip.Arrow />
          Arrow tip
        </Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", {name: "Hover me"}));
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="tooltip-arrow"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="overlay-arrow"]')).not.toBeNull();
  });

  it("ставит data-placement согласно пропу placement", async () => {
    render(
      <Tooltip delay={0}>
        <Button>Hover me</Button>
        <Tooltip.Content placement="bottom">Bottom tip</Tooltip.Content>
      </Tooltip>,
    );

    await user.hover(screen.getByRole("button", {name: "Hover me"}));
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole("tooltip")).toHaveAttribute("data-placement", "bottom");
  });

  it("ведёт себя одинаково как Tooltip.Root и TooltipRoot", () => {
    render(
      <>
        <TooltipRoot delay={0}>
          <Tooltip.Trigger aria-label="Namespaced">
            <span>n</span>
          </Tooltip.Trigger>
          <Tooltip.Content>Namespaced tip</Tooltip.Content>
        </TooltipRoot>
        <Tooltip.Root delay={0}>
          <Tooltip.Trigger aria-label="Flat">
            <span>f</span>
          </Tooltip.Trigger>
          <Tooltip.Content>Flat tip</Tooltip.Content>
        </Tooltip.Root>
      </>,
    );

    expect(document.querySelectorAll('[data-slot="tooltip-trigger"]')).toHaveLength(2);
  });
});
