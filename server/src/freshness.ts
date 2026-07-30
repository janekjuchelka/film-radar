/** Rok premiéry: tituly starší než tento práh nebereme jako „novinka ve feedu“. */
export function premiereYearCut(): number {
  return new Date().getFullYear() - 1;
}

/**
 * Je titul kandidát na „nový film / nový seriál“?
 * Počet řad sám o sobě nestačí (staré jednosezónové show).
 */
export function isRecentPremiere(year: number | null): boolean {
  if (year == null) return false;
  return year >= premiereYearCut();
}
