export type TitleType = "movie" | "series";

export type ProviderKey = "netflix" | "disney" | "oneplay";

/** Proč se titul objevil ve feedu — nikdy ne kvůli jednotlivému dílu. */
export type FeedEventType = "new_movie" | "new_series" | "new_season";

export interface TitleRecord {
  id: string;
  justwatchId: string;
  title: string;
  year: number | null;
  type: TitleType;
  csfdId: number | null;
  csfdRating: number | null;
  csfdUrl: string | null;
  posterUrl: string | null;
  providers: ProviderKey[];
  firstSeenAt: string;
  lastSeenAt: string;
  qualified: boolean;
  /** Počet řad (seriál). Filmy = null. */
  seasonCount: number | null;
  latestSeason: number | null;
  /** Poslední relevantní událost (nový film / seriál / řada). */
  eventType: FeedEventType | null;
  eventAt: string | null;
  /**
   * true = zobrazit ve feedu appky.
   * Staré seriály jen sledujeme kvůli detekci nové řady.
   */
  feedEligible: boolean;
}

export interface CsfdCacheEntry {
  justwatchId: string;
  searchedAt: string;
  csfdId: number | null;
  csfdRating: number | null;
  csfdUrl: string | null;
  skipReason?: string;
}

export interface DatabaseShape {
  titles: TitleRecord[];
  csfdCache: CsfdCacheEntry[];
  meta: {
    lastScanAt: string | null;
    lastScanStats: Record<string, number> | null;
  };
}

export interface JustWatchCandidate {
  justwatchId: string;
  title: string;
  year: number | null;
  type: TitleType;
  posterUrl: string | null;
  providers: ProviderKey[];
  seasonCount: number | null;
  latestSeason: number | null;
}
