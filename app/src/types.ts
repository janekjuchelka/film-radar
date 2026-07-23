export type TitleTypeFilter = "all" | "movie" | "series";
export type ProviderFilter = "all" | "netflix" | "disney" | "oneplay";

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
}
