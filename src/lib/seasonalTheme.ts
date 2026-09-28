export type SeasonalTheme = {
  key: string;
  label: string;
};

const MONTH_THEMES: SeasonalTheme[] = [
  { key: "jan", label: "Deep Winter" },
  { key: "feb", label: "Ember" },
  { key: "mar", label: "Spring Signal" },
  { key: "apr", label: "Rainlight" },
  { key: "may", label: "Verdant" },
  { key: "jun", label: "Solstice" },
  { key: "jul", label: "Midnight Fire" },
  { key: "aug", label: "Heat Haze" },
  { key: "sep", label: "Harvest Shift" },
  { key: "oct", label: "Spooky Systems" },
  { key: "nov", label: "Cold Ember" },
  { key: "dec", label: "Long Night" },
];

export function applySeasonalTheme(date = new Date()): SeasonalTheme {
  const theme = MONTH_THEMES[date.getMonth()] ?? MONTH_THEMES[0];
  const root = document.documentElement;
  root.dataset.seasonalTheme = theme.key;
  root.dataset.seasonalThemeLabel = theme.label;
  return theme;
}
