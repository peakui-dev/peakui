import type {ScrollShadowVisibility} from "@/components/scroll-shadow/index.ts";

import {act, fireEvent, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
import {useState} from "react";

import {ScrollShadow, ScrollShadowRoot} from "@/components/scroll-shadow/index.ts";

/** jsdom reports zero for every layout box, so the scroll metrics are stubbed. */
const stubScrollMetrics = (
  element: HTMLElement,
  metrics: {clientHeight: number; scrollHeight: number; scrollTop: number},
) => {
  for (const [property, value] of Object.entries(metrics)) {
    Object.defineProperty(element, property, {configurable: true, value});
  }
};

/** The visibility callback is dispatched from a rAF, so drain a couple of frames. */
const flushFrames = async () => {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  });
};

const VisibilityHarness = ({
  onVisibilityChange,
}: {
  onVisibilityChange: (visibility: ScrollShadowVisibility, renderCount: number) => void;
}) => {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <>
      <button type="button" onClick={() => setRenderCount((count) => count + 1)}>
        Re-render
      </button>
      <ScrollShadow
        data-testid="scroll-shadow"
        // Inline on purpose, and closing over renderCount so a stale callback is
        // distinguishable from the current one: a fresh identity each render must
        // not re-notify, but the newest closure must be the one invoked.
        onVisibilityChange={(visibility) => onVisibilityChange(visibility, renderCount)}
      >
        Content {renderCount}
      </ScrollShadow>
    </>
  );
};

/** Re-renders without touching anything inside the scroll container. */
const InertRerenderHarness = () => {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <>
      <button type="button" onClick={() => setRenderCount((count) => count + 1)}>
        Re-render
      </button>
      <span data-testid="render-count">{renderCount}</span>
      <ScrollShadow data-testid="scroll-shadow">
        <p>Static content</p>
      </ScrollShadow>
    </>
  );
};

const ContentGrowthHarness = () => {
  const [rows, setRows] = useState(1);

  return (
    <>
      <button type="button" onClick={() => setRows((count) => count + 1)}>
        Add row
      </button>
      <ScrollShadow data-testid="scroll-shadow">
        {Array.from({length: rows}, (_, index) => (
          <p key={index}>Row {index}</p>
        ))}
      </ScrollShadow>
    </>
  );
};

describe("ScrollShadow", () => {
  it("рендерит переданный контент", () => {
    render(<ScrollShadow>Scrollable content</ScrollShadow>);

    expect(screen.getByText("Scrollable content")).toBeInTheDocument();
  });

  it("выставляет БЭМ-блок и data-slot", () => {
    render(<ScrollShadow data-testid="scroll-shadow">Content</ScrollShadow>);
    const scrollShadow = screen.getByTestId("scroll-shadow");

    expect(scrollShadow).toHaveAttribute("data-slot", "scroll-shadow");
    expect(scrollShadow.className).toEqual(expect.stringContaining("scroll-shadow"));
  });

  it("подмешивает consumer-ский className к блоку", () => {
    render(
      <ScrollShadow className="custom" data-testid="scroll-shadow">
        Content
      </ScrollShadow>,
    );

    expect(screen.getByTestId("scroll-shadow").className).toEqual(
      expect.stringContaining("custom"),
    );
  });

  it("ведёт себя одинаково как ScrollShadow.Root и ScrollShadowRoot", () => {
    render(
      <>
        <ScrollShadow.Root data-testid="namespaced">Namespaced</ScrollShadow.Root>
        <ScrollShadowRoot data-testid="flat">Flat</ScrollShadowRoot>
      </>,
    );

    for (const id of ["namespaced", "flat"]) {
      expect(screen.getByTestId(id)).toHaveAttribute("data-slot", "scroll-shadow");
    }
  });

  it("выставляет БЭМ-модификатор и data-атрибут ориентации", () => {
    render(
      <ScrollShadow data-testid="scroll-shadow" orientation="horizontal">
        Content
      </ScrollShadow>,
    );
    const scrollShadow = screen.getByTestId("scroll-shadow");

    expect(scrollShadow).toHaveAttribute("data-orientation", "horizontal");
    expect(scrollShadow.className).toEqual(expect.stringContaining("scroll-shadow--horizontal"));
  });

  it("выставляет БЭМ-модификатор скрытого скроллбара", () => {
    render(
      <ScrollShadow hideScrollBar data-testid="scroll-shadow">
        Content
      </ScrollShadow>,
    );

    expect(screen.getByTestId("scroll-shadow").className).toEqual(
      expect.stringContaining("scroll-shadow--hide-scrollbar"),
    );
  });

  describe("режим тени", () => {
    it("выставляет авто-режим, ведущий scroll-timeline-затемнение", () => {
      render(<ScrollShadow data-testid="scroll-shadow">Content</ScrollShadow>);

      expect(screen.getByTestId("scroll-shadow")).toHaveAttribute(
        "data-scroll-shadow-mode",
        "auto",
      );
    });

    it("падает в ручной режим при контролируемой видимости", () => {
      render(
        <ScrollShadow data-testid="scroll-shadow" visibility="both">
          Content
        </ScrollShadow>,
      );

      expect(screen.getByTestId("scroll-shadow")).toHaveAttribute(
        "data-scroll-shadow-mode",
        "manual",
      );
    });

    it("падает в ручной режим при выключенном детектировании", () => {
      render(
        <ScrollShadow data-testid="scroll-shadow" isEnabled={false}>
          Content
        </ScrollShadow>,
      );

      expect(screen.getByTestId("scroll-shadow")).toHaveAttribute(
        "data-scroll-shadow-mode",
        "manual",
      );
    });

    it("ставит атрибуты контролируемой видимости по ориентации", async () => {
      const {rerender} = render(
        <ScrollShadow data-testid="scroll-shadow" orientation="vertical" visibility="both">
          Content
        </ScrollShadow>,
      );

      expect(screen.getByTestId("scroll-shadow")).toHaveAttribute("data-top-bottom-scroll", "true");

      rerender(
        <ScrollShadow data-testid="scroll-shadow" orientation="horizontal" visibility="right">
          Content
        </ScrollShadow>,
      );

      expect(screen.getByTestId("scroll-shadow")).toHaveAttribute("data-right-scroll", "true");
      expect(screen.getByTestId("scroll-shadow")).not.toHaveAttribute("data-top-bottom-scroll");
    });
  });

  describe("состояние тени", () => {
    it("обновляет состояние тени, когда контент растёт без событий scroll и resize", async () => {
      const user = setupUser();

      render(<ContentGrowthHarness />);
      await flushFrames();

      const scrollShadow = screen.getByTestId("scroll-shadow");

      expect(scrollShadow).toHaveAttribute("data-bottom-scroll", "false");

      // A fixed-height container: its own box never changes, so ResizeObserver
      // stays silent, and nothing scrolls. Only the content grew taller.
      stubScrollMetrics(scrollShadow, {clientHeight: 100, scrollHeight: 300, scrollTop: 0});

      await user.click(screen.getByRole("button", {name: "Add row"}));
      await flushFrames();

      expect(scrollShadow).toHaveAttribute("data-bottom-scroll", "true");
    });

    it("не измеряет контейнер на рендере, который контент не трогал", async () => {
      const user = setupUser();

      render(<InertRerenderHarness />);
      await flushFrames();

      const scrollShadow = screen.getByTestId("scroll-shadow");
      let scrollHeightReads = 0;

      Object.defineProperty(scrollShadow, "scrollHeight", {
        configurable: true,
        get() {
          scrollHeightReads += 1;

          return 300;
        },
      });

      await user.click(screen.getByRole("button", {name: "Re-render"}));
      await flushFrames();

      expect(screen.getByTestId("render-count")).toHaveTextContent("1");
      // Measuring per render forces a layout read on every unrelated update, and
      // lets an onVisibilityChange handler that shifts the container's own
      // metrics drive an unbounded render loop.
      expect(scrollHeightReads).toBe(0);
    });
  });

  it("сохраняет переменные размера и смещения тени при переданном style", () => {
    render(
      <ScrollShadow data-testid="scroll-shadow" offset={20} size={64} style={{height: 240}}>
        Content
      </ScrollShadow>,
    );
    const scrollShadow = screen.getByTestId("scroll-shadow");

    expect(scrollShadow.style.getPropertyValue("--scroll-shadow-size")).toBe("64px");
    expect(scrollShadow.style.getPropertyValue("--scroll-shadow-offset")).toBe("20px");
    expect(scrollShadow.style.height).toBe("240px");
  });

  it("пробрасывает data-атрибуты", () => {
    render(
      <ScrollShadow data-foo="bar" data-testid="scroll-shadow">
        Content
      </ScrollShadow>,
    );

    expect(screen.getByTestId("scroll-shadow")).toHaveAttribute("data-foo", "bar");
  });

  describe("колбэк видимости", () => {
    it("вызывает onVisibilityChange при смене состояния скролла", async () => {
      const onVisibilityChange = vi.fn();

      render(<VisibilityHarness onVisibilityChange={onVisibilityChange} />);

      await waitFor(() => expect(onVisibilityChange).toHaveBeenLastCalledWith("none", 0));

      const scrollShadow = screen.getByTestId("scroll-shadow");

      stubScrollMetrics(scrollShadow, {clientHeight: 100, scrollHeight: 300, scrollTop: 0});
      fireEvent.scroll(scrollShadow);

      await waitFor(() => expect(onVisibilityChange).toHaveBeenLastCalledWith("bottom", 0));

      stubScrollMetrics(scrollShadow, {clientHeight: 100, scrollHeight: 300, scrollTop: 50});
      fireEvent.scroll(scrollShadow);

      await waitFor(() => expect(onVisibilityChange).toHaveBeenLastCalledWith("both", 0));
    });

    it("не вызывает onVisibilityChange повторно при неизменном состоянии", async () => {
      const onVisibilityChange = vi.fn();
      const user = setupUser();

      render(<VisibilityHarness onVisibilityChange={onVisibilityChange} />);

      await waitFor(() => expect(onVisibilityChange).toHaveBeenCalledTimes(1));

      const rerender = screen.getByRole("button", {name: "Re-render"});

      await user.click(rerender);
      await user.click(rerender);
      await flushFrames();

      expect(onVisibilityChange).toHaveBeenCalledTimes(1);
    });

    it("вызывает свежий колбэк, а не захваченный при монтировании", async () => {
      const onVisibilityChange = vi.fn();
      const user = setupUser();

      render(<VisibilityHarness onVisibilityChange={onVisibilityChange} />);

      await waitFor(() => expect(onVisibilityChange).toHaveBeenLastCalledWith("none", 0));

      await user.click(screen.getByRole("button", {name: "Re-render"}));
      await user.click(screen.getByRole("button", {name: "Re-render"}));
      await flushFrames();

      const scrollShadow = screen.getByTestId("scroll-shadow");

      stubScrollMetrics(scrollShadow, {clientHeight: 100, scrollHeight: 300, scrollTop: 0});
      fireEvent.scroll(scrollShadow);

      // renderCount 2 proves the ref was resynced; a stale closure would report 0.
      await waitFor(() => expect(onVisibilityChange).toHaveBeenLastCalledWith("bottom", 2));
    });
  });
});
