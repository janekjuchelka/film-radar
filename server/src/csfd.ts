import { csfd } from "node-csfd-api";
import { config } from "./config.js";
import { getCsfdCache, upsertCsfdCache } from "./db.js";
import type { JustWatchCandidate, TitleType } from "./types.js";

export interface CsfdMatch {
  csfdId: number;
  csfdRating: number;
  csfdUrl: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function typeMatches(candidateType: TitleType, csfdType: string): boolean {
  if (candidateType === "series") {
    return csfdType === "series" || csfdType === "tv-show";
  }
  return csfdType === "film" || csfdType === "tv-film" || csfdType === "theatrical";
}

export async function matchCsfd(candidate: JustWatchCandidate): Promise<CsfdMatch | null> {
  const cached = getCsfdCache(candidate.justwatchId);
  if (cached) {
    if (cached.csfdId && cached.csfdRating != null && cached.csfdUrl) {
      if (cached.csfdRating < config.minCsfdRating) return null;
      return {
        csfdId: cached.csfdId,
        csfdRating: cached.csfdRating,
        csfdUrl: cached.csfdUrl,
      };
    }
    return null;
  }

  await sleep(config.csfdDelayMs);

  let search;
  try {
    search = await csfd.search(candidate.title);
  } catch (err) {
    upsertCsfdCache({
      justwatchId: candidate.justwatchId,
      searchedAt: new Date().toISOString(),
      csfdId: null,
      csfdRating: null,
      csfdUrl: null,
      skipReason: `search_error:${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }

  const pool = [...(search.movies || []), ...(search.tvSeries || [])];
  const wanted = normalizeTitle(candidate.title);

  const scored = pool
    .map((item) => {
      const titleScore = normalizeTitle(item.title) === wanted ? 2 : normalizeTitle(item.title).includes(wanted) || wanted.includes(normalizeTitle(item.title)) ? 1 : 0;
      const yearScore =
        candidate.year && item.year
          ? item.year === candidate.year
            ? 2
            : Math.abs(item.year - candidate.year) <= 1
              ? 1
              : 0
          : 0;
      const typeScore = typeMatches(candidate.type, item.type) ? 1 : 0;
      return { item, score: titleScore * 10 + yearScore * 3 + typeScore };
    })
    .filter((x) => x.score >= 10)
    .sort((a, b) => b.score - a.score);

  // Prefer unambiguous match: exact title + year when possible.
  const best = scored[0];
  if (!best || (scored[1] && scored[1].score === best.score && best.score < 15)) {
    upsertCsfdCache({
      justwatchId: candidate.justwatchId,
      searchedAt: new Date().toISOString(),
      csfdId: null,
      csfdRating: null,
      csfdUrl: null,
      skipReason: "ambiguous_or_no_match",
    });
    return null;
  }

  // colorRating good ~= 70–100; still fetch exact % for display + hard filter.
  if (best.item.colorRating === "bad" || best.item.colorRating === "average") {
    upsertCsfdCache({
      justwatchId: candidate.justwatchId,
      searchedAt: new Date().toISOString(),
      csfdId: best.item.id,
      csfdRating: null,
      csfdUrl: best.item.url,
      skipReason: `color_${best.item.colorRating}`,
    });
    return null;
  }

  await sleep(config.csfdDelayMs);

  let movie;
  try {
    movie = await csfd.movie(best.item.id);
  } catch (err) {
    upsertCsfdCache({
      justwatchId: candidate.justwatchId,
      searchedAt: new Date().toISOString(),
      csfdId: best.item.id,
      csfdRating: null,
      csfdUrl: best.item.url,
      skipReason: `movie_error:${err instanceof Error ? err.message : String(err)}`,
    });
    return null;
  }

  const rating = movie.rating;
  const url = movie.url || best.item.url;

  upsertCsfdCache({
    justwatchId: candidate.justwatchId,
    searchedAt: new Date().toISOString(),
    csfdId: movie.id ?? best.item.id,
    csfdRating: rating,
    csfdUrl: url,
    skipReason: rating == null ? "no_rating" : rating < config.minCsfdRating ? "below_threshold" : undefined,
  });

  if (rating == null || rating < config.minCsfdRating) return null;

  return {
    csfdId: movie.id ?? best.item.id,
    csfdRating: rating,
    csfdUrl: url,
  };
}
