/**
 * Rok premiéry pro seriály: starší show jen sledujeme (kvůli nové řadě),
 * nebereme je jako „nový seriál“ jen proto, že se objevily v trendu JustWatch.
 * (Typicky Šógun 2024 na Disney+ už dlouho.)
 */
export function premiereYearCut(): number {
  return new Date().getFullYear() - 1;
}

export function isRecentPremiere(year: number | null): boolean {
  if (year == null) return false;
  return year >= premiereYearCut();
}
