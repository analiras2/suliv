const FRACTIONS: Array<[number, string]> = [
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [1 / 2, "½"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
];

const TOLERANCE = 0.02;

function findFraction(decimal: number): string | null {
  for (const [value, symbol] of FRACTIONS) {
    if (Math.abs(decimal - value) <= TOLERANCE) return symbol;
  }
  return null;
}

export function formatFraction(value: number): string {
  if (!isFinite(value)) return String(value);
  if (value < 0) return value.toFixed(1).replace(".", ",");

  const intPart = Math.floor(value);
  const decimalPart = value - intPart;

  if (decimalPart <= TOLERANCE) {
    return String(intPart);
  }

  const fraction = findFraction(decimalPart);
  if (fraction) {
    return intPart > 0 ? `${intPart}${fraction}` : fraction;
  }

  return value.toFixed(1).replace(".", ",");
}
