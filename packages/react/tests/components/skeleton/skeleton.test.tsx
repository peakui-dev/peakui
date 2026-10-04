import {render, screen} from "@peakui/testing/helpers";
import {createRef} from "react";

import {Skeleton, SkeletonRoot} from "@/components/skeleton";

describe("Skeleton", () => {
  it("рендерит div-заглушку с BEM-блоком и data-slot, не добавляя роли", () => {
    render(<Skeleton data-testid="skeleton" />);

    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton.tagName).toBe("DIV");
    expect(skeleton.className).toEqual(expect.stringContaining("skeleton"));
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
    /* Заглушка декоративна: семантику ей добавляет потребитель, не компонент. */
    expect(skeleton).not.toHaveAttribute("role");
  });

  it("по умолчанию применяет модификатор shimmer", () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton").className).toEqual(
      expect.stringContaining("skeleton--shimmer"),
    );
  });

  it("применяет модификатор каждого типа анимации", () => {
    render(
      <>
        <Skeleton animationType="pulse" data-testid="pulse" />
        <Skeleton animationType="none" data-testid="none" />
        <Skeleton animationType="shimmer" data-testid="shimmer" />
      </>,
    );

    expect(screen.getByTestId("pulse").className).toEqual(
      expect.stringContaining("skeleton--pulse"),
    );
    expect(screen.getByTestId("none").className).toEqual(expect.stringContaining("skeleton--none"));
    expect(screen.getByTestId("shimmer").className).toEqual(
      expect.stringContaining("skeleton--shimmer"),
    );
  });

  it("объединяет потребительский className с блоком", () => {
    render(<Skeleton className="h-3 w-24" data-testid="skeleton" />);

    const className = screen.getByTestId("skeleton").className;

    expect(className).toEqual(expect.stringContaining("skeleton"));
    expect(className).toEqual(expect.stringContaining("h-3"));
    expect(className).toEqual(expect.stringContaining("w-24"));
  });

  it("одинаково работает как Skeleton.Root и SkeletonRoot", () => {
    render(
      <>
        <Skeleton.Root data-testid="namespaced" />
        <SkeletonRoot data-testid="flat" />
      </>,
    );

    for (const testId of ["namespaced", "flat"]) {
      expect(screen.getByTestId(testId)).toHaveAttribute("data-slot", "skeleton");
    }
  });

  it("передаёт aria-hidden от потребителя без добавления своего", () => {
    render(<Skeleton aria-hidden="true" data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
  });

  it("пробрасывает ref на DOM-элемент", () => {
    const ref = createRef<HTMLDivElement>();

    render(<Skeleton ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("передаёт render-проп в рендерящийся элемент", () => {
    render(
      <Skeleton
        data-testid="skeleton"
        render={(props) => <div {...props} data-rendered="true" />}
      />,
    );

    const skeleton = screen.getByTestId("skeleton");

    expect(skeleton).toHaveAttribute("data-rendered", "true");
    expect(skeleton).toHaveAttribute("data-slot", "skeleton");
  });
});

describe("Skeleton: глобальная настройка через --skeleton-animation", () => {
  afterEach(() => {
    document.documentElement.style.removeProperty("--skeleton-animation");
  });

  it("читает тип анимации из CSS-переменной, когда проп не задан", async () => {
    /* Хук кеширует прочитанное значение на уровне модуля — нужен чистый реестр модулей. */
    vi.resetModules();
    const {Skeleton: FreshSkeleton} = await import("@/components/skeleton");

    document.documentElement.style.setProperty("--skeleton-animation", "pulse");
    render(<FreshSkeleton data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton").className).toEqual(
      expect.stringContaining("skeleton--pulse"),
    );
  });

  it("проп animationType сильнее CSS-переменной", () => {
    document.documentElement.style.setProperty("--skeleton-animation", "pulse");
    render(<Skeleton animationType="none" data-testid="skeleton" />);

    expect(screen.getByTestId("skeleton").className).toEqual(
      expect.stringContaining("skeleton--none"),
    );
  });
});
