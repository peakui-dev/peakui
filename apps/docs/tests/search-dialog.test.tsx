// @vitest-environment jsdom
import type {SortedResult} from "fumadocs-core/search";

import {act, cleanup, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
import "@peakui/testing/setup/react";
import {Suspense, useState} from "react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

/*
 * Мок навигации: диалог уходит через router.push(url) при выборе результата.
 */
const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: pushMock,
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import SearchDialog from "@/components/search-dialog";

const RESULTS: Record<string, SortedResult[]> = {
  button: [
    {
      breadcrumbs: ["Components"],
      content: "Button",
      id: "en/button",
      type: "page",
      url: "/en/docs/react/components/button",
    },
    {
      breadcrumbs: ["Components", "Button"],
      content: "Use the <mark>Button</mark> component",
      id: "en/button/usage",
      type: "heading",
      url: "/en/docs/react/components/button#usage",
    },
  ],
};

const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
  const url = new URL(String(input));
  const query = url.searchParams.get("query") ?? "";

  return {json: async () => RESULTS[query] ?? [], ok: true} as unknown as Response;
});

/*
 * Харнесс держит состояние open, как это делает поисковый провайдер движка документации: только
 * провайдер решает, когда диалог открыт, и получает onOpenChange обратно.
 */
function OpenableDialog() {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button onClick={() => setOpen(true)}>Снова открыть</button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

/*
 * Рендер живёт внутри awaited act: движок поиска (useDocsSearch) изнутри suspends на динамическом
 * import'е fetch-клиента, и его пробуждение должно произойти внутри act-скоупа — иначе React
 * отбрасывает перерисовку („a suspended resource finished loading … not wrapped in act“). Под
 * нагрузкой параллельных воркеров import решается дольше микрозадач одного скоупа — ждём диалог.
 */
const renderDialog = async () => {
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <OpenableDialog />
      </Suspense>,
    );
  });

  await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument(), {timeout: 5000});
};

const searchFor = async (user: ReturnType<typeof setupUser>, query: string) => {
  await renderDialog();

  const input = screen.getByRole("searchbox");

  await user.click(input);
  await user.type(input, query);
  await waitFor(
    () => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    },
    {timeout: 5000},
  );

  return input;
};

describe("SearchDialog", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    user = setupUser();
    pushMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("открытие", () => {
    it("рендерит диалог с именем из i18n и ставит фокус в поле ввода", async () => {
      await renderDialog();

      expect(screen.getByRole("dialog", {name: "Search"})).toBeVisible();
      expect(screen.getByRole("searchbox", {name: "Search"})).toHaveFocus();
    });

    it("не запрашивает индекс и не показывает ни список, ни пустой результат без запроса", async () => {
      await renderDialog();

      expect(screen.queryByRole("option")).toBeNull();
      expect(screen.queryByText("No results found")).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("фильтрация", () => {
    it("отправляет запрос к индексу с текстом из поля", async () => {
      await searchFor(user, "button");

      const requestUrl = String(fetchMock.mock.calls[0]?.[0]);

      expect(requestUrl).toContain("/api/search");
      expect(requestUrl).toContain("query=button");
    });

    it("показывает результаты и подсвечивает совпадения элементом mark", async () => {
      await searchFor(user, "button");

      const highlighted = screen.getByText("Button", {selector: "mark"});

      expect(highlighted).toBeVisible();
      expect(screen.queryByText("<mark>Button</mark>")).toBeNull();
    });

    it("показывает пустой результат из i18n, когда индекс ничего не нашёл", async () => {
      await renderDialog();

      const input = screen.getByRole("searchbox");

      await user.click(input);
      await user.type(input, "nothing");

      await waitFor(
        () => {
          expect(screen.getByText("No results found")).toBeVisible();
        },
        {timeout: 5000},
      );
      expect(screen.queryByRole("option")).toBeNull();
    });
  });

  describe("выбор", () => {
    it("переходит на первый результат по Enter из поля ввода и закрывает диалог", async () => {
      await searchFor(user, "button");

      await user.keyboard("{Enter}");

      expect(pushMock).toHaveBeenCalledWith("/en/docs/react/components/button");
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("переходит по клику на результат и закрывает диалог", async () => {
      await searchFor(user, "button");

      await user.click(screen.getByRole("option", {name: /Use the Button component/i}));

      expect(pushMock).toHaveBeenCalledWith("/en/docs/react/components/button#usage");
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("переносит фокус в результаты стрелкой вниз и выбирает клавишей Enter", async () => {
      await searchFor(user, "button");

      await user.keyboard("{ArrowDown}");

      const options = screen.getAllByRole("option");

      expect(options[0]).toHaveFocus();

      await user.keyboard("{ArrowDown}");

      expect(options[1]).toHaveFocus();

      await user.keyboard("{Enter}");

      expect(pushMock).toHaveBeenCalledWith("/en/docs/react/components/button#usage");
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("закрытие", () => {
    it("закрывает диалог по Escape", async () => {
      await renderDialog();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("сбрасывает запрос при закрытии и повторном открытии", async () => {
      await searchFor(user, "button");

      await user.keyboard("{Escape}");
      await user.click(screen.getByRole("button", {name: "Снова открыть"}));

      const input = screen.getByRole("searchbox") as HTMLInputElement;

      expect(input.value).toBe("");

      // Строчка сброшена сразу; старые результаты уходят после дебаунса движка.
      await waitFor(() => {
        expect(screen.queryByRole("option")).toBeNull();
      });
    });

    it("сбрасывает запрос при повторном открытии после выбора результата", async () => {
      await searchFor(user, "button");

      await user.click(screen.getByRole("option", {name: /Use the Button component/i}));

      expect(pushMock).toHaveBeenCalledWith("/en/docs/react/components/button#usage");

      await user.click(screen.getByRole("button", {name: "Снова открыть"}));

      const input = screen.getByRole("searchbox") as HTMLInputElement;

      expect(input.value).toBe("");

      // Строчка сброшена сразу; старые результаты уходят после дебаунса движка.
      await waitFor(() => {
        expect(screen.queryByRole("option")).toBeNull();
      });
    });
  });
});
