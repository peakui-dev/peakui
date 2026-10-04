import {expect, test} from "@playwright/test";

/*
 * Браузерный ярус ScrollShadow: всё, что jsdom подделывает нулями. Затемнение здесь выводится
 * не только атрибутами, но и scroll-driven анимацией из animation-timeline: scroll() — это
 * измеренная геометрия скролла, и только настоящий движок знает её значения. Атрибутный
 * фолбэк, контролируемый режим и RTL-переворот градиента проверяются здесь же.
 *
 * Идём по прямому адресу iframe.html: страница и есть документ превью, чтение вычисленных
 * стилей работает без поиска фрейма.
 */

const SHADOW_SIZE = 40;

const STORY = {
  controlled: "components-scrollshadow--controlled",
  default: "components-scrollshadow--default",
  orientation: "components-scrollshadow--orientation",
  rtl: "components-scrollshadow--rtl",
  size: "components-scrollshadow--custom-size",
  withoutOverflow: "components-scrollshadow--without-overflow",
} as const;

/** Значения затемнения, выведенные scroll-driven анимацией. */
const fadesOf = (el: Element) => {
  const computed = getComputedStyle(el);

  return {
    start: computed.getPropertyValue("--scroll-shadow-start-fade").trim(),
    end: computed.getPropertyValue("--scroll-shadow-end-fade").trim(),
  };
};

/** Две rAF-итерции: композитор применяет scroll-driven анимацию до чтения стилей. */
const settleFrames = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

/*
 * Холодный dev-сервер компилирует историю по первому запросу дольше, чем окно expect
 * из конфигурации, поэтому проверки геометрии получают собственное, widened-окно.
 */
const GEOMETRY_TIMEOUT = {timeout: 60_000} as const;

test.describe("ScrollShadow (браузер)", () => {
  /*
   * Первый тест воркера платит за холодную компиляцию превью dev-сервером целиком: 30 секунд
   * по умолчанию истекают раньше, чем история смонтируется, и роняют даже ожидания,
   * объявленные длиннее. Здесь окно теста расширено; в CI отдаётся статика и время не тратится.
   */
  test.setTimeout(150_000);

  /*
   * Scroll timelines остались без движка — атрибутный фолбэк обслуживает этот случай, и
   * числовые проверки градиента не имеют смысла. Пропуск виден в отчёте, а не проходит молча.
   *
   * Ожидание заголовка истории — знак того, что превью смонтировалось: без него проверка
   * поддержки уходит в пустой документ, а первая история компилируется на этом ожидании.
   */
  test.beforeEach(async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

    const supports = await page.evaluate(() => CSS.supports("animation-timeline", "scroll(self)"));

    test.skip(!supports, "движок без scroll timelines: проверяется атрибутным фолбэком");
  });

  test("в начале диапазона затемняет только нижний край", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    const scroller = page.getByTestId("vertical-scroller");

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    await expect
      .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
      .toEqual({
        start: "0px",
        end: `${SHADOW_SIZE}px`,
      });
  });

  test("в середине диапазона затемняет оба края", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    const scroller = page.getByTestId("vertical-scroller");

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    await scroller.evaluate((el) => {
      el.scrollTop = 400;
    });

    await expect
      .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
      .toEqual({
        start: `${SHADOW_SIZE}px`,
        end: `${SHADOW_SIZE}px`,
      });
  });

  test("в конце диапазона затемняет только верхний край", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    const scroller = page.getByTestId("vertical-scroller");

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    await scroller.evaluate((el) => {
      el.scrollTop = el.scrollHeight - el.clientHeight;
    });

    await expect
      .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
      .toEqual({
        start: `${SHADOW_SIZE}px`,
        end: "0px",
      });
  });

  /*
   * Интерполированные длины ложатся на пиксели устройства, поэтому сравниваем численно,
   * а не строкой.
   */
  test("перемещение на половину размера тени даёт половину затемнения", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    const scroller = page.getByTestId("vertical-scroller");

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    await scroller.evaluate((el, size) => {
      el.scrollTop = size / 2;
    }, SHADOW_SIZE);

    await expect
      .poll(
        () =>
          scroller.evaluate((el) =>
            Number.parseFloat(getComputedStyle(el).getPropertyValue("--scroll-shadow-start-fade")),
          ),
        GEOMETRY_TIMEOUT,
      )
      .toBeCloseTo(SHADOW_SIZE / 2, 0);
  });

  /*
   * Контейнер без переполнения держит неактивный таймлайн: оба затемнения обязаны остаться
   * на 0px, иначе градиент резал бы контент, который помещается целиком.
   */
  test("не затемняет контент, который помещается без скролла", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.withoutOverflow}`);
    const scroller = page.getByTestId("fitting-scroller");

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    await scroller.evaluate(settleFrames);

    expect(await scroller.evaluate(fadesOf)).toEqual({start: "0px", end: "0px"});
  });

  /*
   * Хук продолжает ставить атрибуты состояния, поэтому матчятся и атрибутные правила. Каскад
   * обязан решить спор в пользу scroll-driven градиента — тот открывается прозрачным стопом.
   */
  test("маску решает scroll-driven градиент, а не атрибутный фолбэк", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.default}`);
    const scroller = page.getByTestId("vertical-scroller");

    await expect
      .poll(() => scroller.getAttribute("data-bottom-scroll"), GEOMETRY_TIMEOUT)
      .toBe("true");

    const mask = await scroller.evaluate((el) => getComputedStyle(el).maskImage);

    expect(mask).toMatch(/^linear-gradient\(rgba\(0, 0, 0, 0\)/);
  });

  test("размер тени доезжает до вычисленного стиля", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY.size}`);

    const scroller = page.getByTestId("vertical-scroller").first();

    await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
    expect(
      await scroller.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--scroll-shadow-size").trim(),
      ),
    ).toBe("20px");
  });

  test.describe("горизонтальная ориентация", () => {
    test("в начале диапазона затемняет только дальний край", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.orientation}`);
      const scroller = page.getByTestId("horizontal-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await expect
        .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
        .toEqual({
          start: "0px",
          end: `${SHADOW_SIZE}px`,
        });
    });

    test("в конце диапазона затемняет только ближний край", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.orientation}`);
      const scroller = page.getByTestId("horizontal-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await scroller.evaluate((el) => {
        el.scrollLeft = el.scrollWidth - el.clientWidth;
      });

      await expect
        .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
        .toEqual({
          start: `${SHADOW_SIZE}px`,
          end: "0px",
        });
    });

    /*
     * Прогресс инлайн-оси в RTL идёт справа налево: физическое направление градиента обязано
     * перевернуться, иначе стартовое затемнение рисовалось бы не на том крае.
     */
    test("в RTL градиент направлен на правый край", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.rtl}`);
      const scroller = page.getByTestId("horizontal-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await scroller.evaluate(settleFrames);

      expect(await scroller.evaluate((el) => getComputedStyle(el).maskImage)).toContain("270deg");
    });

    test("в RTL в начале диапазона затемнён только конец оси", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.rtl}`);
      const scroller = page.getByTestId("horizontal-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await expect
        .poll(() => scroller.evaluate(fadesOf), GEOMETRY_TIMEOUT)
        .toEqual({
          start: "0px",
          end: `${SHADOW_SIZE}px`,
        });
    });
  });

  test.describe("ручной режим", () => {
    test("при выключенном детектировании маски нет вовсе", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.controlled}`);
      const scroller = page.getByTestId("disabled-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await expect(scroller).toHaveAttribute("data-scroll-shadow-mode", "manual");

      await scroller.evaluate(settleFrames);

      expect(await scroller.evaluate((el) => getComputedStyle(el).maskImage)).toBe("none");
    });

    /*
     * Атрибутный градиент открывается чёрным стопом; scroll-driven — прозрачным. Это
     * различие доказывает, что контролируемая видимость идёт через фолбэк-правила.
     */
    test("контролируемая видимость держит атрибутную маску", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.controlled}`);
      const scroller = page.getByTestId("controlled-scroller");

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await expect(scroller).toHaveAttribute("data-scroll-shadow-mode", "manual");

      const mask = await scroller.evaluate((el) => getComputedStyle(el).maskImage);

      expect(mask).toMatch(/^linear-gradient\(rgb\(0, 0, 0\)/);
    });
  });
});
