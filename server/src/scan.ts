import { config } from "./config.js";
import { matchCsfd } from "./csfd.js";
import { setScanMeta, upsertTitle } from "./db.js";
import { exportFeed } from "./export-feed.js";
import { fetchCandidates } from "./justwatch.js";

let scanning = false;

export function isScanning() {
  return scanning;
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
  };

  try {
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

        upsertTitle({
          id: candidate.justwatchId,
          justwatchId: candidate.justwatchId,
          title: candidate.title,
          year: candidate.year,
          type: candidate.type,
          csfdId: match.csfdId,
          csfdRating: match.csfdRating,
          csfdUrl: match.csfdUrl,
          posterUrl: candidate.posterUrl,
          providers: candidate.providers,
          firstSeenAt: now,
          lastSeenAt: now,
          qualified,
        });
        console.log(
          `[scan] + ${candidate.title} (${candidate.year ?? "?"}) CSFD ${match.csfdRating}% [${candidate.providers.join(",")}]`
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
