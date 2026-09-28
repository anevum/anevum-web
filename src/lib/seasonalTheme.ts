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

function themeIndexFor(date: Date) {
  // The seasonal system launched at the end of September 2026, so October
  // starts immediately for this first rollout. Future changes remain calendar-driven.
  const octoberLaunchPreview =
    date.getFullYear() === 2026 &&
    date.getMonth() === 8 &&
    date.getDate() >= 28;

  return octoberLaunchPreview ? 9 : date.getMonth();
}

export function applySeasonalTheme(date = new Date()): SeasonalTheme {
  const theme = MONTH_THEMES[themeIndexFor(date)] ?? MONTH_THEMES[0];
  const root = document.documentElement;
  root.dataset.seasonalTheme = theme.key;
  root.dataset.seasonalThemeLabel = theme.label;
  return theme;
}
