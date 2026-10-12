/*
 * Гейт на директиву "use client" в выходных файлах сборки.
 *
 * Rolldown умеет терять директивы — https://github.com/rolldown/rolldown/issues/7809 — и потеря
 * проходит молча: сборка зелёная, тесты зелёные, падает потребитель на RSC в рантайме. Поэтому
 * проверка стоит в самой сборке, а не в ревью.
 *
 * check() вынесен отдельной чистой функцией и не трогает ни файловую систему, ни хуки бандлера:
 * иначе его нельзя проверить, не собрав пакет, а гейт без теста — это надежда.
 */

const DIRECTIVE = /^\s*(?:\/\*[\s\S]*?\*\/|\/\/[^\n]*|\n)*\s*["']use client["']/;

export interface EmittedChunk {
  code?: string;
  fileName: string;
  type: string;
}

export interface ClientDirectivePlugin {
  check: (bundle: Record<string, EmittedChunk>, clientModules: Set<string>) => void;
  name: string;
  transform: (code: string, id: string) => null;
  writeBundle: (options: unknown, bundle: Record<string, EmittedChunk>) => void;
}

/*
 * Source ids are absolute or config-relative and may carry Windows separators (tsdown.config.ts
 * builds entries with node:path join), while output file names are always posix and relative to
 * the `src/` root in unbundle mode — one module gives exactly one file. Matching therefore
 * normalizes separators and compares by the module path under `src/`. A bare suffix compare is
 * not enough: it misses Windows ids and collides (`index.js` would match every `<dir>/index`
 * module). Kept as a pure function because an empty result here would run the whole gate idle.
 */
export function matchDeclared(
  outputNames: readonly string[],
  clientModuleIds: readonly string[],
): Set<string> {
  const stems = clientModuleIds.map((id) => {
    const posix = id.replace(/\\/g, "/");
    const cut = posix.lastIndexOf("/src/");

    return (cut === -1 ? posix.replace(/^src\//, "") : posix.slice(cut + 5)).replace(
      /\.[cm]?[jt]sx?$/,
      "",
    );
  });
  const declared = new Set<string>();

  for (const name of outputNames) {
    const stem = name.replace(/\.[cm]?js$/, "");

    if (stems.includes(stem)) {
      declared.add(name);
    }
  }

  return declared;
}

export function requireClientDirectives(): ClientDirectivePlugin {
  const clientModules = new Set<string>();

  const check = (bundle: Record<string, EmittedChunk>, declared: Set<string>): void => {
    const offenders: string[] = [];

    for (const [name, chunk] of Object.entries(bundle)) {
      if (chunk.type !== "chunk" || !declared.has(name)) {
        continue;
      }

      if (!DIRECTIVE.test(chunk.code ?? "")) {
        offenders.push(name);
      }
    }

    if (offenders.length > 0) {
      throw new Error(
        'Сборка потеряла директиву "use client" в выходных файлах:\n' +
          offenders.map((name) => `  - ${name}`).join("\n") +
          "\n\nИсходные модули её объявляют. Это rolldown#7809 либо режим сборки не unbundle.",
      );
    }
  };

  return {
    check,
    name: "require-client-directives",
    transform(code: string, id: string) {
      if (DIRECTIVE.test(code)) {
        clientModules.add(id);
      }

      return null;
    },
    /* Rolldown передаёт в writeBundle два аргумента: сначала options, затем сам bundle. */
    writeBundle(_options: unknown, bundle: Record<string, EmittedChunk>) {
      const declared = matchDeclared(Object.keys(bundle), [...clientModules]);

      /*
       * Гейт не имеет права пройти вхолостую, и обойти его можно двумя способами.
       *
       * Первый: transform перестал наполнять набор. У rolldown хуки переезжают на объектную форму
       * {filter, handler}, а подпись writeBundle здесь однажды уже менялась — то есть это не
       * гипотеза. Пакет знает статически, что клиентские модули у него есть: "use client" стоит
       * на каждом компоненте, поэтому пустой набор означает сломанный хук, а не пакет без
       * клиентского кода.
       */
      if (clientModules.size === 0) {
        throw new Error(
          'Гейт "use client" не увидел ни одного модуля с директивой: хук transform не наполнил ' +
            "набор. В этом пакете клиентские модули есть по построению, поэтому пустой набор — " +
            "это сломанный хук, и проверка ниже прошла бы, ничего не проверив.",
        );
      }

      /*
       * Второй: набор наполнен, но сопоставление имён ничего не нашло — тогда проверка получила
       * бы пустое множество файлов и промолчала.
       */
      if (declared.size === 0) {
        throw new Error(
          `Гейт "use client" не сопоставил ни один выходной файл с ${clientModules.size} ` +
            "исходными модулями, которые директиву объявляют. Сломано сопоставление имён, " +
            "а не сборка: проверка прошла бы, ничего не проверив.",
        );
      }

      check(bundle, declared);
    },
  };
}
