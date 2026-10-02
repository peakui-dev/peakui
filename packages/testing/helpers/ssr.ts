import type {ReactElement, ReactNode} from "react";
import type {Root} from "react-dom/client";

import {act} from "@testing-library/react";
import {createElement, isValidElement} from "react";
import {hydrateRoot} from "react-dom/client";
import {renderToString} from "react-dom/server";

/*
 * React не бросает исключение на расхождении разметки — он пишет в console.error и молча
 * перерисовывает поддерево. Поэтому единственный способ превратить расхождение в падение теста:
 * перехватить console.error и сверить сообщения со списком известных формулировок, включая
 * минифицированные коды продакшн-сборки.
 */
const HYDRATION_WARNING =
  /Hydration|did not match|Text content does not match|Expected server HTML|Minified React error #(418|419|422|423|425)/i;

export type SsrSmokeOptions = {
  wrapper?: (props: {children: ReactNode}) => ReactNode;
};

const wrap = (ui: ReactElement, wrapper?: SsrSmokeOptions["wrapper"]): ReactElement => {
  if (!wrapper) {
    return ui;
  }

  const wrapped = wrapper({children: ui});

  return isValidElement(wrapped) ? wrapped : createElement("div", null, wrapped);
};

/** renderToString → hydrateRoot. Падает на любой ошибке гидратации. */
export const ssrSmoke = async (ui: ReactElement, options: SsrSmokeOptions = {}) => {
  const tree = wrap(ui, options.wrapper);
  const html = renderToString(tree);

  expect(html.length).toBeGreaterThan(0);

  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.appendChild(container);

  const errors: unknown[] = [];
  /* Перехват console.error — это механизм проверки, а не отладочный вывод. */
  // eslint-disable-next-line no-console
  const originalError = console.error;

  // eslint-disable-next-line no-console
  console.error = (...args: unknown[]) => {
    errors.push(args);
    originalError(...args);
  };

  /*
   * Таймеры, заведённые во время гидратации, иначе срабатывают после того, как jsdom свернул
   * документ, и роняют следующий тест ошибкой без связи с его кодом.
   */
  const originalSetTimeout = globalThis.setTimeout;
  const originalSetInterval = globalThis.setInterval;
  const strayTimers: ReturnType<typeof setTimeout>[] = [];

  globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
    const timer = originalSetTimeout(...args);

    strayTimers.push(timer);

    return timer;
  }) as typeof setTimeout;

  globalThis.setInterval = ((...args: Parameters<typeof setInterval>) => {
    const timer = originalSetInterval(...args);

    strayTimers.push(timer);

    return timer;
  }) as typeof setInterval;

  let root: Root | undefined;

  try {
    await act(async () => {
      root = hydrateRoot(container, wrap(ui, options.wrapper));
    });

    const hydrationErrors = errors.filter((entry) => {
      const text = Array.isArray(entry) ? entry.map(String).join(" ") : String(entry);

      return HYDRATION_WARNING.test(text);
    });

    expect(hydrationErrors).toEqual([]);
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.setInterval = originalSetInterval;

    for (const timer of strayTimers) {
      clearTimeout(timer);
      clearInterval(timer);
    }

    // eslint-disable-next-line no-console
    console.error = originalError;

    await act(async () => {
      root?.unmount();
    });

    container.remove();
  }

  return {html};
};
