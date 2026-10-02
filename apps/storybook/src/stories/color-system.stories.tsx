import type {Meta, StoryObj} from "@storybook/react-vite";

import {useEffect, useState} from "react";

/*
 * Инвентаризация цветового слоя @peakui/styles: каждый токен со своей переменной и ВЫЧИСЛЕННЫМ
 * значением. Витрина ролей тройками base/hover/soft — отдельная страница, Foundations/Colors;
 * у них разная работа, и обе нужны.
 *
 * Состав сверен с themes/shared/theme.css: 77 токенов, без дублей и без потерь. Гейт полноты —
 * e2e/ColorSystem.spec.ts, он же ловит пустую плашку.
 *
 * Значение читается из СЫРОГО объявления (--surface), а не из Tailwind-имени (--color-surface).
 * Причина измерена, а не предположена: @theme inline emit-ит переменную только когда в
 * просканированных исходниках встретилась соответствующая утилита, поэтому на этой странице
 * getComputedStyle возвращал пустую строку для 54 токенов из 77 — у --color-border значение было
 * (кто-то пишет border-border), у --color-surface и --color-on-surface не было. Сырые токены
 * объявлены в variables.css безусловно.
 */

interface ColorSection {
  readonly title: string;
  readonly tokens: readonly string[];
}

const SECTIONS: readonly ColorSection[] = [
  {
    title: "Base",
    tokens: [
      "background",
      "background-secondary",
      "background-tertiary",
      "background-inverse",
      "foreground",
    ],
  },
  {
    title: "Surfaces",
    tokens: [
      "surface",
      "surface-foreground",
      "surface-hover",
      "surface-secondary",
      "surface-secondary-foreground",
      "surface-tertiary",
      "surface-tertiary-foreground",
      "overlay",
      "overlay-foreground",
    ],
  },
  {
    title: "On surface",
    tokens: [
      "on-surface",
      "on-surface-foreground",
      "on-surface-hover",
      "on-surface-secondary",
      "on-surface-secondary-foreground",
      "on-surface-secondary-hover",
      "on-surface-tertiary",
      "on-surface-tertiary-foreground",
      "on-surface-tertiary-hover",
    ],
  },
  {
    title: "Accent",
    tokens: [
      "accent",
      "accent-foreground",
      "accent-hover",
      "accent-soft",
      "accent-soft-foreground",
      "accent-soft-hover",
    ],
  },
  {
    title: "Status",
    tokens: [
      "success",
      "success-foreground",
      "success-hover",
      "warning",
      "warning-foreground",
      "warning-hover",
      "danger",
      "danger-foreground",
      "danger-hover",
      "success-soft",
      "success-soft-foreground",
      "success-soft-hover",
      "warning-soft",
      "warning-soft-foreground",
      "warning-soft-hover",
      "danger-soft",
      "danger-soft-foreground",
      "danger-soft-hover",
    ],
  },
  {
    title: "Neutral",
    tokens: [
      "muted",
      "segment",
      "segment-foreground",
      "default",
      "default-foreground",
      "default-hover",
      "default-soft",
      "default-soft-foreground",
      "default-soft-hover",
    ],
  },
  {
    title: "Lines and focus",
    tokens: [
      "border",
      "border-secondary",
      "border-tertiary",
      "separator",
      "separator-secondary",
      "separator-tertiary",
      "focus",
      "link",
    ],
  },
  {
    title: "Form fields",
    tokens: [
      "field",
      "field-hover",
      "field-focus",
      "field-foreground",
      "field-placeholder",
      "field-border",
      "field-border-hover",
      "field-border-focus",
    ],
  },
  {
    title: "Other",
    tokens: ["white", "black", "backdrop", "scrollbar-thumb", "scrollbar-track"],
  },
];

const ALL_TOKENS = SECTIONS.flatMap((section) => section.tokens);

/*
 * Единственный токен, чьё объявление названо иначе, чем его Tailwind-имя: theme.css отображает
 * --color-field на var(--field-background, …). Остальные 76 — один к одному.
 */
const RAW_NAME: Record<string, string> = {field: "field-background"};

const rawVariable = (token: string): string => `--${RAW_NAME[token] ?? token}`;

/** `accent-soft-foreground` → `Accent Soft Foreground`. Имя выводится, а не дублируется строкой. */
const label = (token: string): string =>
  token
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/*
 * Значения перечитываются по MutationObserver, а НЕ в эффекте истории.
 * Тему ставит декоратор withTheme своим эффектом, а в React эффекты дочернего компонента идут
 * раньше родительского — эффект внутри истории прочитал бы значения предыдущей темы. Наблюдатель
 * за data-theme/class от порядка эффектов не зависит.
 */
function useComputedColors(): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const root = document.documentElement;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const read = () => {
      if (cancelled) return;

      const style = getComputedStyle(root);

      /*
       * Слой токенов приходит ссылкой на таблицу стилей и в собранном Storybook может появиться
       * ПОЗЖЕ обоих эффектов, поэтому ждём его по сигнальному токену, а не по удаче. Без этого
       * страница ловила гонку: в светлой теме значения успевали прочитаться, в тёмной все 77
       * оставались пустыми, хотя сам CSS разрешался верно.
       */
      if (!style.getPropertyValue("--surface").trim() && attempts < 100) {
        attempts += 1;
        /*
         * setTimeout, а НЕ requestAnimationFrame: rAF не вызывается в скрытой вкладке, и первая
         * версия этой проверки из-за этого не доходила до чтения вовсе — страница оставалась пустой
         * в обеих темах при прогоне в фоновой панели.
         */
        timer = setTimeout(read, 50);

        return;
      }

      setValues(
        Object.fromEntries(
          ALL_TOKENS.map((token) => [token, style.getPropertyValue(rawVariable(token)).trim()]),
        ),
      );
    };

    read();

    /*
     * Наблюдатель, а не эффект с зависимостью от темы: тему ставит декоратор withTheme своим
     * эффектом, а в React эффекты дочернего компонента идут раньше родительского — эффект внутри
     * истории прочитал бы значения предыдущей темы.
     */
    const observer = new MutationObserver(() => {
      attempts = 0;
      clearTimeout(timer);
      read();
    });

    observer.observe(root, {attributeFilter: ["class", "data-theme"]});

    /*
     * Пробуждение по load: оно гарантированно наступает ПОСЛЕ применения таблиц стилей, тогда как
     * оба эффекта могут отработать до. Без него холодная загрузка успевала исчерпать ожидание и
     * зафиксировать пустые значения навсегда — разбудить их было больше нечем, и гейт флакал.
     */
    const onLoad = () => {
      attempts = 0;
      clearTimeout(timer);
      read();
    };

    if (document.readyState !== "complete") window.addEventListener("load", onLoad, {once: true});

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("load", onLoad);
      observer.disconnect();
    };
  }, []);

  return values;
}

interface RowProps {
  readonly token: string;
  readonly value: string | undefined;
}

function Row({token, value}: RowProps) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-surface p-4 shadow-surface">
      {/*
       * Двухтонная подложка под плашкой: четыре семьи *-soft и backdrop несут альфу, и на
       * однотонной карточке она не видна вовсе — accent-soft выглядел бы просто бледным.
       */}
      <div
        className="size-12 shrink-0 overflow-hidden rounded-xl border border-border"
        style={{
          background:
            "linear-gradient(90deg, var(--color-white) 0 50%, var(--color-black) 50% 100%)",
        }}
      >
        <div className="size-full" style={{backgroundColor: `var(--color-${token})`}} />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label(token)}</span>
        <code className="font-mono text-xs text-muted">--color-{token}</code>
      </div>

      <code className="font-mono text-xs text-muted" data-slot="computed-value" data-token={token}>
        {value}
      </code>
    </div>
  );
}

const meta = {
  title: "Foundations/Color System",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllColors: Story = {
  name: "All Colors",
  render: () => {
    const values = useComputedColors();

    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-10 bg-background p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Color System</h1>
          <p className="text-muted">
            Every colour token in @peakui/styles, with its CSS variable and the value the browser
            computes for the current theme. Switch the theme in the toolbar to see both.
          </p>
          <p className="text-sm text-muted">
            The name shown is the Tailwind theme name, which is what{" "}
            <code className="font-mono text-xs">bg-accent</code> and friends resolve against. It is
            emitted to the document only when a matching utility appears in scanned source, so
            reading <code className="font-mono text-xs">var(--color-surface)</code> in your own CSS
            can resolve to nothing. The declaration that is always present drops the{" "}
            <code className="font-mono text-xs">color-</code> prefix:{" "}
            <code className="font-mono text-xs">var(--surface)</code>. The values below are read
            from those declarations.
          </p>
        </header>

        {SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
            <div className="grid gap-3">
              {section.tokens.map((token) => (
                <Row key={token} token={token} value={values[token]} />
              ))}
            </div>
          </section>
        ))}

        <footer className="text-sm text-muted">
          Three tokens are deferred and therefore absent here on purpose:{" "}
          <code className="font-mono text-xs">--color-on-surface-focus</code>,{" "}
          <code className="font-mono text-xs">--color-on-surface-secondary-focus</code> and{" "}
          <code className="font-mono text-xs">--color-on-surface-tertiary-focus</code>. The focus
          ring does not reach 3:1 on the second and third surface levels in the dark theme, which is
          a defect in the existing ring derivation rather than in this family. Measurements and the
          reason are in section 6 of docs/superpowers/specs/2026-10-03-on-surface-tokens-design.md.
          Listing a token that does not exist is the defect this page exists to prevent.
        </footer>
      </div>
    );
  },
};
