/**
 * Разбирает CSS-время (`1500ms`, `1.5s`, `1500`) в миллисекунды для пропов RAC.
 * Возвращает undefined для пустой строки или неразбираемого значения.
 */
export const parseCSSTime = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  const val = Number.parseFloat(trimmed);

  if (Number.isNaN(val)) return undefined;
  if (trimmed.endsWith("ms")) return val;
  if (trimmed.endsWith("s")) return val * 1000;

  return val;
};
