/**
 * Pomocné funkce pro rok premiéry.
 * Od 1.1.1 není rok jediným kritériem novinky — rozhoduje first-seen / nový provider.
 * Ponecháno pro případné budoucí řazení / filtry.
 */
export function premiereYearCut(): number {
  return new Date().getFullYear() - 1;
}

export function isRecentPremiere(year: number | null): boolean {
  if (year == null) return false;
  return year >= premiereYearCut();
}
