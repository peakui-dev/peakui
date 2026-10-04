import {ssrSmoke} from "@peakui/testing/helpers";

import {ScrollShadow} from "@/components/scroll-shadow/index.ts";

describe("ScrollShadow SSR", () => {
  it("рендерится без гидратационного расхождения со скроллируемым контентом", async () => {
    const {html} = await ssrSmoke(
      <ScrollShadow data-testid="scroll-shadow">Scrollable content</ScrollShadow>,
    );

    expect(html).toContain('data-slot="scroll-shadow"');
  });

  // The server cannot measure overflow, so the scroll-state attributes only arrive after
  // hydration. Shipping the mode attribute is what lets CSS paint the correct fade first.
  it("выставляет авто-режим тени, чтобы затемнение не ждало измерения", async () => {
    const {html} = await ssrSmoke(
      <ScrollShadow data-testid="scroll-shadow">Scrollable content</ScrollShadow>,
    );

    expect(html).toContain('data-scroll-shadow-mode="auto"');
  });

  it("выставляет переменные размера и смещения тени", async () => {
    const {html} = await ssrSmoke(
      <ScrollShadow data-testid="scroll-shadow" offset={20} size={64}>
        Scrollable content
      </ScrollShadow>,
    );

    expect(html).toContain("--scroll-shadow-size:64px");
    expect(html).toContain("--scroll-shadow-offset:20px");
  });

  it("выставляет ручной режим тени при контролируемой видимости", async () => {
    const {html} = await ssrSmoke(
      <ScrollShadow data-testid="scroll-shadow" visibility="both">
        Scrollable content
      </ScrollShadow>,
    );

    expect(html).toContain('data-scroll-shadow-mode="manual"');
  });
});
