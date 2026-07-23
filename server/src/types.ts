export type TitleType = "movie" | "series";

export type ProviderKey = "netflix" | "disney" | "oneplay";

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
}
