const CATEGORY_META: Record<string, { label: string; iconName: string; bgColor: string }> = {
  cafe: { label: "Café", iconName: "coffee", bgColor: "#8E5233" },
  almoco: { label: "Almoço", iconName: "food", bgColor: "#4C7438" },
  jantar: { label: "Jantar", iconName: "weather-night", bgColor: "#544D28" },
  lanche: { label: "Lanches", iconName: "food-apple", bgColor: "#B4714D" },
  sobremesa: { label: "Doces", iconName: "cake-variant", bgColor: "#B0524E" },
};

const ACCENT_COLORS = ["#C79273", "#9EBB83", "#C4736E", "#BFB480", "#E8CBA9"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function getCategoryPresentation(categoryKey: string) {
  return CATEGORY_META[categoryKey] ?? {
    label: categoryKey,
    iconName: "silverware-fork-knife",
    bgColor: "#6F9458",
  };
}

export function getAccentColor(index: number, categoryKey?: string) {
  if (categoryKey && CATEGORY_META[categoryKey]) {
    return CATEGORY_META[categoryKey].bgColor;
  }

  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

export function formatRecipeMeta(totalTimeMin: number, descriptor: string) {
  return `${totalTimeMin} min · ${descriptor}`;
}

export function formatSavesCount(savesCount: number) {
  if (savesCount <= 0) return "Novo no app";
  if (savesCount >= 1000) return `${(savesCount / 1000).toFixed(1)}k salvaram`;
  return `${savesCount} salvaram`;
}

export function formatNewsDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}
