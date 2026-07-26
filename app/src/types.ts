export type TitleTypeFilter = "all" | "movie" | "series";
export type ProviderFilter = "all" | "netflix" | "disney" | "oneplay";

export type FeedEventType = "new_movie" | "new_series" | "new_season";

export interface TitleItem {
  id: string;
  title: string;
  year: number | null;
  type: "movie" | "series";
  csfdRating: number | null;
  csfdUrl: string | null;
  posterUrl: string | null;
  providers: Array<"netflix" | "disney" | "oneplay">;
  firstSeenAt: string;
  eventType?: FeedEventType | null;
  eventAt?: string | null;
  seasonCount?: number | null;
  latestSeason?: number | null;
  feedEligible?: boolean;
}
