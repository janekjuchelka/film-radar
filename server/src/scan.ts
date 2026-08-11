import { config } from "./config.js";
import { matchCsfd } from "./csfd.js";
import { getTitle, migrateFeedEligibility, setScanMeta, upsertTitle } from "./db.js";
import { exportFeed } from "./export-feed.js";
import { isRecentPremiere } from "./freshness.js";
import { fetchCandidates } from "./justwatch.js";
import type { FeedEventType, ProviderKey, TitleRecord } from "./types.js";

let scanning = false;

export function isScanning() {
  return scanning;
}

function providersAdded(
  previous: ProviderKey[] | undefined,
  next: ProviderKey[]
): ProviderKey[] {
  const prev = new Set(previous || []);
  return next.filter((p) => !prev.has(p));
}

export async function scanDaily(): Promise<Record<string, number>> {
  if (scanning) {
    throw new Error("Scan already in progress");
  }
  scanning = true;
  const stats = {
    candidates: 0,
    matched: 0,
    qualified: 0,
    skipped: 0,
    errors: 0,
    newSeries: 0,
    newMovies: 0,
    newSeasons: 0,
    newOnProvider: 0,
    trackedOnly: 0,
  };

  try {
    const migrated = migrateFeedEligibility();
    if (migrated) console.log(`[scan] migrated ${migrated} legacy titles`);

    console.log("[scan] Fetching JustWatch candidates...");
    const candidates = await fetchCandidates(config.scanPerProvider);
    stats.candidates = candidates.length;
    console.log(`[scan] ${candidates.length} unique candidates`);

    for (const candidate of candidates) {
      try {
        const match = await matchCsfd(candidate);
        if (!match) {
          stats.skipped += 1;
          continue;
        }
        stats.matched += 1;
        const now = new Date().toISOString();
        const qualified = match.csfdRating >= config.minCsfdRating;
        if (qualified) stats.qualified += 1;

        const existing = getTitle(candidate.justwatchId);
        let eventType: FeedEventType | null = existing?.eventType ?? null;
        let eventAt: string | null = existing?.eventAt ?? null;
        let feedEligible = existing?.feedEligible ?? false;

        const mergedProviders = Array.from(
          new Set([...(existing?.providers || []), ...candidate.providers])
        ) as ProviderKey[];
        const addedProviders = providersAdded(existing?.providers, candidate.providers);

        if (candidate.type === "movie") {
          if (!existing) {
            // Film: poprvé ve skenu = novinka na službě (i starší premiéry, např. Zodiac).
            if (qualified) {
              eventType = "new_movie";
              eventAt = now;
              feedEligible = true;
              stats.newMovies += 1;
            } else {
              eventType = null;
              eventAt = null;
              feedEligible = false;
              stats.trackedOnly += 1;
            }
          } else if (addedProviders.length && qualified) {
            eventType = "new_movie";
            eventAt = now;
            feedEligible = true;
            stats.newOnProvider += 1;
          } else if (existing.eventType === "new_movie") {
            feedEligible = qualified;
          } else {
            feedEligible = Boolean(existing.feedEligible && qualified);
          }
        } else {
          const prevSeasons = existing?.seasonCount ?? null;
          const nextSeasons = candidate.seasonCount;

          if (!existing) {
            // Seriál: „nový seriál“ jen u nedávné premiéry.
            // Starší show (Šógun apod.) jen sledujeme kvůli nové řadě / novému provideru.
            if (qualified && isRecentPremiere(candidate.year)) {
              eventType = "new_series";
              eventAt = now;
              feedEligible = true;
              stats.newSeries += 1;
            } else {
              eventType = null;
              eventAt = null;
              feedEligible = false;
              stats.trackedOnly += 1;
            }
          } else if (
            nextSeasons != null &&
            prevSeasons != null &&
            nextSeasons > prevSeasons
          ) {
            eventType = "new_season";
            eventAt = now;
            feedEligible = qualified;
            stats.newSeasons += 1;
          } else if (addedProviders.length && qualified) {
            eventType = "new_series";
            eventAt = now;
            feedEligible = true;
            stats.newOnProvider += 1;
          } else if (existing.eventType === "new_season") {
            feedEligible = qualified;
          } else if (existing.eventType === "new_series") {
            feedEligible = qualified && isRecentPremiere(candidate.year);
            if (!feedEligible) {
              eventType = null;
              eventAt = null;
            }
          } else {
            feedEligible = false;
          }
        }

        const record: TitleRecord = {
          id: candidate.justwatchId,
          justwatchId: candidate.justwatchId,
          title: candidate.title,
          year: candidate.year,
          type: candidate.type,
          csfdId: match.csfdId,
          csfdRating: match.csfdRating,
          csfdUrl: match.csfdUrl,
          posterUrl: candidate.posterUrl,
          providers: mergedProviders.length ? mergedProviders : candidate.providers,
          firstSeenAt: now,
          lastSeenAt: now,
          qualified,
          seasonCount: candidate.seasonCount,
          latestSeason: candidate.latestSeason,
          eventType,
          eventAt,
          feedEligible,
        };

        upsertTitle(record);
        const tag = eventType ?? "track";
        console.log(
          `[scan] + ${candidate.title} (${candidate.year ?? "?"}) CSFD ${match.csfdRating}% [${record.providers.join(",")}] event=${tag} seasons=${candidate.seasonCount ?? "-"}${addedProviders.length ? ` +prov=${addedProviders.join(",")}` : ""}`
        );
      } catch (err) {
        stats.errors += 1;
        console.error(`[scan] error for ${candidate.title}:`, err);
      }
    }

    setScanMeta(stats);
    exportFeed(config.minCsfdRating);
    console.log("[scan] done", stats);
    return stats;
  } finally {
    scanning = false;
  }
}
