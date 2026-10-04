import type {CSSProperties} from "react";

import {act, cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {
  DEFAULT_EXIT_DURATION,
  DEFAULT_TOAST_TIMEOUT,
  Toast,
  ToastQueue,
  toast,
} from "@/components/toast";

describe("Toast", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    user = setupUser({advanceTimers: vi.advanceTimersByTime});
  });

  afterEach(() => {
    cleanup();
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("не рендерит ничего, пока в очереди нет тостов", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    expect(screen.queryByRole("region")).toBeNull();
  });

  it("рендерит регион с data-slot и доступной меткой количества уведомлений", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    const region = screen.getByRole("region");

    expect(region).toHaveAttribute("data-slot", "toast-region");
    expect(region).toHaveAttribute("aria-label", "1 notification.");
  });

  it("объединяет пользовательский стиль с переменными региона по умолчанию", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} style={{zIndex: 100_000}} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    expect(screen.getByRole("region")).toHaveStyle({
      "--gap": "12px",
      "--placement": "bottom",
      "--scale-factor": "0.05",
      "--toast-width": "460px",
      "z-index": "100000",
    });
  });

  it("позволяет переопределить переменную региона через пользовательский стиль", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} style={{"--toast-width": "320px"} as CSSProperties} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    expect(screen.getByRole("region")).toHaveStyle({
      "--gap": "12px",
      "--placement": "bottom",
      "--scale-factor": "0.05",
      "--toast-width": "320px",
    });
  });

  it("поддерживает проп width вместе с пользовательским стилем", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} style={{zIndex: 100_000}} width={520} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    expect(screen.getByRole("region")).toHaveStyle({
      "--toast-width": "520px",
      "z-index": "100000",
    });
  });

  it("поддерживает функцию стиля на регионе", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} style={() => ({zIndex: 100_000}) as CSSProperties} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    expect(screen.getByRole("region")).toHaveStyle({
      "--toast-width": "460px",
      "z-index": "100000",
    });
  });

  it("рендерит умолчательных детей с ролью alertdialog, заголовком, описанием и кнопкой закрытия", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({
        description: "Ваши изменения сохранены.",
        title: "Сохранено",
        variant: "success",
      });
    });

    const toastEl = screen.getByRole("alertdialog");

    expect(toastEl).toHaveAttribute("data-slot", "toast");
    expect(toastEl).toHaveAttribute("data-frontmost", "true");
    expect(toastEl.className).toEqual(expect.stringContaining("toast--success"));
    expect(screen.getByText("Сохранено")).toBeInTheDocument();
    expect(screen.getByText("Ваши изменения сохранены.")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="toast-indicator"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="toast-default-icon"]')).not.toBeNull();
    expect(screen.getByRole("button", {name: "Close"})).toBeInTheDocument();
  });

  it("не рендерит индикатор, когда indicator равен null", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({indicator: null, title: "Без иконки"});
    });

    expect(document.querySelector('[data-slot="toast-indicator"]')).toBeNull();
  });

  it("рендерит пользовательский индикатор вместо иконки по умолчанию", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({indicator: <span data-testid="custom-indicator" />, title: "Особый"});
    });

    expect(screen.getByTestId("custom-indicator")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="toast-default-icon"]')).toBeNull();
  });

  it("вызывает onClose по нажатию кнопки закрытия", async () => {
    const queue = new ToastQueue();
    const onClose = vi.fn();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Закрой меня"}, {onClose});
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", {name: "Close"}));

    // onClose срабатывает в момент закрытия, пока анимация выхода ещё играет.
    expect(onClose).toHaveBeenCalledTimes(1);

    // Закрытие указателем освобождает фокус, поэтому скрытие тоста не блокируется.
    expect(document.body).toHaveFocus();

    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("автоматически закрывает тост по умолчанному таймауту", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Автозакрытие"});
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT);
    });

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("обновляет постоянный тост, не запуская обратный отсчёт", () => {
    render(<Toast.Provider />);

    let id = "";

    act(() => {
      id = toast("Сохранение", {timeout: 0});
    });

    act(() => {
      toast.update(id, "Сохранено", {variant: "success"});
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT * 2);
    });

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Сохранено");

    act(() => {
      toast.clear();
    });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });
  });

  it("вызывает исходный onClose, когда обновление его не передаёт", () => {
    const onClose = vi.fn();

    render(<Toast.Provider />);

    let id = "";

    act(() => {
      id = toast("Сохранение", {onClose, timeout: 0});
    });

    act(() => {
      toast.update(id, "Сохранено");
    });

    act(() => {
      toast.close(id);
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });
  });

  it("запускает автозакрытие, когда promise-тост завершается", async () => {
    render(<Toast.Provider />);

    await act(async () => {
      toast.promise(Promise.resolve("ok"), {
        error: "Ошибка",
        loading: "Загрузка",
        success: "Загружено",
      });
    });

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Загружено");

    act(() => {
      vi.advanceTimersByTime(DEFAULT_TOAST_TIMEOUT);
    });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });

    expect(screen.queryByRole("alertdialog", {hidden: true})).toBeNull();
  });

  it("перезапускает идущий таймер через reset", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Автозакрытие"}, {timeout: 1_000});
    });

    // React Aria владеет таймерами и вызывает reset() при каждом изменении timeout,
    // поэтому reset обязан перезапустить отсчёт даже при уже идущем таймере.
    const {timer} = queue.getQueue().visibleToasts[0]! as unknown as {
      timer: {reset: (delay: number) => void};
    };

    act(() => {
      vi.advanceTimersByTime(500);
      timer.reset(4_000);
    });

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });

    expect(screen.queryByRole("alertdialog", {hidden: true})).toBeNull();
  });

  it("вызывает каждый onClose при закрытии и убирает все тосты после clear", () => {
    const queue = new ToastQueue();
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Первый"}, {onClose: onCloseA});
    });
    act(() => {
      queue.add({title: "Второй"}, {onClose: onCloseB});
    });

    act(() => {
      queue.clear();
    });

    // onClose срабатывает при закрытии; тосты остаются смонтированными (aria-hidden),
    // пока играет их анимация выхода.
    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).toHaveBeenCalledTimes(1);

    const exiting = screen.getAllByRole("alertdialog", {hidden: true});

    expect(exiting).toHaveLength(2);
    for (const toastEl of exiting) {
      expect(toastEl).toHaveAttribute("data-exiting", "true");
    }

    act(() => {
      vi.advanceTimersByTime(DEFAULT_EXIT_DURATION);
    });

    expect(screen.queryByRole("alertdialog", {hidden: true})).toBeNull();
    expect(onCloseA).toHaveBeenCalledTimes(1);
    expect(onCloseB).toHaveBeenCalledTimes(1);
  });

  it("отдаёт одно батчевое уведомление о состоянии выхода для clear", () => {
    const queue = new ToastQueue();
    const inner = queue.getQueue() as unknown as {
      getExitingKeys: () => ReadonlySet<string>;
      subscribeExiting: (fn: () => void) => () => void;
    };

    queue.add({title: "Один"});
    queue.add({title: "Два"});
    queue.add({title: "Три"});

    const onExitingChange = vi.fn();

    inner.subscribeExiting(onExitingChange);

    queue.clear();

    expect(onExitingChange).toHaveBeenCalledTimes(1);
    expect(inner.getExitingKeys().size).toBe(3);
  });

  it("выстраивает стек: новейший тост впереди, позиции проставлены", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
    });
    act(() => {
      queue.add({title: "Второй"});
    });

    const toasts = screen.getAllByRole("alertdialog");

    expect(toasts).toHaveLength(2);

    const frontmost = toasts.find((t) => t.getAttribute("data-frontmost") === "true");

    expect(frontmost).toHaveTextContent("Второй");
    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "2 notifications.");
  });

  it("помечает data-hidden тосты за пределами maxVisibleToasts", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider maxVisibleToasts={1} queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
    });
    act(() => {
      queue.add({title: "Второй"});
    });

    // Скрытые тосты aria-hidden, поэтому включаем их в запрос по роли.
    const toasts = screen.getAllByRole("alertdialog", {hidden: true});
    const hidden = toasts.find((t) => t.getAttribute("data-hidden") === "true");
    const visible = toasts.find((t) => !t.hasAttribute("data-hidden"));

    expect(hidden).toBeDefined();
    expect(visible).toBeDefined();
    expect(hidden).toHaveTextContent("Первый");
    expect(visible).toHaveTextContent("Второй");
    // Скрытые тосты inert: их контролы выпадают из порядка таба.
    expect(hidden).toHaveAttribute("inert");
    expect(visible).not.toHaveAttribute("inert");
  });

  it("переносит фокус клавиатуры на оставшийся тост при закрытии сфокусированного", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
    });
    act(() => {
      queue.add({title: "Второй"});
    });

    await user.tab();
    expect(document.activeElement).toHaveAttribute("role", "alertdialog");

    await user.tab();
    await user.keyboard("{Enter}");

    // Передний тост закрыт; фокус клавиатуры переходит на соседний.
    const remaining = screen.getByRole("alertdialog");

    expect(remaining).toHaveTextContent("Первый");
    expect(remaining).toHaveFocus();
  });

  it("Alt+T фокусирует и раскрывает стек, Escape сворачивает", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
    });
    act(() => {
      queue.add({title: "Второй"});
    });

    await user.keyboard("{Alt>}t{/Alt}");

    const region = screen.getByRole("region");

    expect(region).toHaveFocus();
    expect(region).toHaveAttribute("data-expanded", "true");

    await user.keyboard("{Escape}");

    expect(region).not.toHaveAttribute("data-expanded");
    expect(region).not.toHaveFocus();
  });

  it("держит метод react-stately, через который in-place обновления уведомляют React", () => {
    const inner = new ToastQueue().getQueue() as unknown as Record<string, unknown>;

    // update() мутирует поставленный в очередь тост и затем зовёт этот метод, чтобы React
    // перечитал очередь. Он TypeScript-private и нестабилен upstream, а его тихая потеря
    // превращает обновления в частичный ре-рендер, так что падаем на следующем бампе
    // React Aria, а не в приложении потребителя.
    expect(typeof inner["updateVisibleToasts"]).toBe("function");
  });

  it("выставляет data-swapped на индикаторе после promise-обновления", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    let key = "";

    act(() => {
      key = queue.add({isLoading: true, title: "Загрузка"});
    });

    const indicator = document.querySelector('[data-slot="toast-indicator"]');

    expect(indicator).not.toHaveAttribute("data-swapped");

    act(() => {
      queue.update(key, {title: "Загружено", variant: "success"});
    });

    expect(indicator).toHaveAttribute("data-swapped", "true");
    expect(document.querySelector('[data-slot="toast-default-icon"]')).not.toBeNull();
  });

  it("поддерживает пользовательский рендер через функцию в children провайдера", () => {
    const queue = new ToastQueue();

    render(
      <Toast.Provider queue={queue}>
        {({toast: toastItem}) => (
          <Toast data-testid="custom-toast" toast={toastItem}>
            <Toast.Content>
              <Toast.Title>Свой макет</Toast.Title>
            </Toast.Content>
          </Toast>
        )}
      </Toast.Provider>,
    );

    act(() => {
      queue.add({title: "ignored"});
    });

    expect(screen.getByTestId("custom-toast")).toBeInTheDocument();
    expect(screen.getByText("Свой макет")).toBeInTheDocument();
  });

  it("объединяет пользовательский стиль со стилями укладки тоста", () => {
    const queue = new ToastQueue();

    render(
      <Toast.Provider queue={queue}>
        {({toast: toastItem}) => (
          <Toast data-testid="custom-toast" style={{marginTop: 8}} toast={toastItem}>
            <Toast.Content>
              <Toast.Title>Свой макет</Toast.Title>
            </Toast.Content>
          </Toast>
        )}
      </Toast.Provider>,
    );

    act(() => {
      queue.add({title: "ignored"});
    });

    expect(screen.getByTestId("custom-toast")).toHaveStyle({
      "margin-top": "8px",
      opacity: "1",
      "pointer-events": "auto",
      "z-index": "1",
    });
  });

  it("выставляет BEM-модификаторы placement на регионе и тосте", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider placement="top end" queue={queue} />);

    act(() => {
      queue.add({title: "Сверху справа"});
    });

    expect(screen.getByRole("region").className).toEqual(
      expect.stringContaining("toast-region--top-end"),
    );
    expect(screen.getByRole("alertdialog").className).toEqual(
      expect.stringContaining("toast--top-end"),
    );
  });

  it("закрывает передний тост с клавиатуры", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Закрытие с клавиатуры"});
    });

    await user.tab();
    expect(document.activeElement).toHaveAttribute("role", "alertdialog");

    await user.tab();
    expect(screen.getByRole("button", {name: "Close"})).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("поддерживает пользовательский aria-label региона", () => {
    const queue = new ToastQueue();

    render(<Toast.Provider aria-label="Notifications" queue={queue} />);

    act(() => {
      queue.add({title: "Сохранено"});
    });

    expect(screen.getByRole("region")).toHaveAttribute("aria-label", "Notifications");
  });

  it("поддерживает настраиваемый hotkey", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider hotkey={["ctrlKey", "KeyN"]} queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
      queue.add({title: "Второй"});
    });

    // Умолчательный hotkey заменён, поэтому Alt+T больше не фокусирует регион.
    await user.keyboard("{Alt>}t{/Alt}");
    expect(screen.getByRole("region")).not.toHaveFocus();

    await user.keyboard("{Control>}n{/Control}");
    expect(screen.getByRole("region")).toHaveFocus();
    expect(screen.getByRole("region")).toHaveAttribute("data-expanded", "true");
  });

  it("не фокусирует регион при лишних зажатых модификаторах", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
      queue.add({title: "Второй"});
    });

    await user.keyboard("{Control>}{Alt>}t{/Alt}{/Control}");
    expect(screen.getByRole("region")).not.toHaveFocus();

    await user.keyboard("{Shift>}{Alt>}t{/Alt}{/Shift}");
    expect(screen.getByRole("region")).not.toHaveFocus();

    await user.keyboard("{Alt>}t{/Alt}");
    expect(screen.getByRole("region")).toHaveFocus();
  });

  it("не фокусирует регион, когда hotkey отключён", async () => {
    const queue = new ToastQueue();

    render(<Toast.Provider hotkey={[]} queue={queue} />);

    act(() => {
      queue.add({title: "Первый"});
      queue.add({title: "Второй"});
    });

    await user.keyboard("{Alt>}t{/Alt}");
    expect(screen.getByRole("region")).not.toHaveFocus();
  });
});
