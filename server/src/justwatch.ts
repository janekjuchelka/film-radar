import { SimpleJustWatch } from "simple-justwatch-js";
import type { JustWatchCandidate, ProviderKey, TitleType } from "./types.js";

const COUNTRY = "CZ";
const LANGUAGE = "cs";

const PROVIDER_ALIASES: Record<ProviderKey, string[]> = {
  netflix: ["netflix", "nfx"],
  disney: ["disney", "disney plus", "disney+", "dnp"],
  oneplay: ["oneplay", "one play", "voyo", "oplay"],
};

const client = new SimpleJustWatch();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[+]/g, " plus ").replace(/\s+/g, " ").trim();
}

function mapProvider(shortName: string, clearName: string, technicalName: string): ProviderKey | null {
  const hay = [shortName, clearName, technicalName].map(normalizeName).join(" ");
  for (const [key, aliases] of Object.entries(PROVIDER_ALIASES) as [ProviderKey, string[]][]) {
    if (aliases.some((a) => hay.includes(normalizeName(a)) || shortName.toLowerCase() === a)) {
      return key;
    }
  }
  return null;
}

export async function resolveProviderShortNames(): Promise<Record<ProviderKey, string>> {
  const packages = await client.providers({ country: COUNTRY });
  const found: Partial<Record<ProviderKey, string>> = {};

  for (const pkg of packages as Array<{
    shortName?: string;
    clearName?: string;
    technicalName?: string;
    slug?: string;
  }>) {
    const shortName = pkg.shortName || "";
    const mapped = mapProvider(
      shortName,
      pkg.clearName || "",
      pkg.technicalName || pkg.slug || ""
    );
    if (mapped && !found[mapped]) {
      found[mapped] = shortName;
    }
  }

  const missing = (["netflix", "disney", "oneplay"] as ProviderKey[]).filter((k) => !found[k]);
  if (missing.length) {
    const listing = (packages as Array<{ shortName?: string; clearName?: string }>)
      .map((p) => `${p.shortName}=${p.clearName}`)
      .join(", ");
    throw new Error(
      `Missing JustWatch providers for CZ: ${missing.join(", ")}. Available: ${listing}`
    );
  }

  return found as Record<ProviderKey, string>;
}

function toType(objectType: string | undefined): TitleType {
  return objectType === "SHOW" ? "series" : "movie";
}

function extractNodes(connection: unknown): any[] {
  if (!connection || typeof connection !== "object") return [];
  const c = connection as { edges?: Array<{ node?: unknown }>; items?: unknown[] };
  if (Array.isArray(c.edges)) {
    return c.edges.map((e) => e.node).filter(Boolean);
  }
  if (Array.isArray(c.items)) return c.items;
  return [];
}

export async function fetchCandidates(perProvider: number): Promise<JustWatchCandidate[]> {
  const shortNames = await resolveProviderShortNames();
  const byId = new Map<string, JustWatchCandidate>();
  const yearCut = new Date().getFullYear() - 2;

  for (const [providerKey, shortName] of Object.entries(shortNames) as [ProviderKey, string][]) {
    // TRENDING/POPULAR = katalog ke sledování řad; RELEASE_YEAR = čerstvé premiéry.
    const passes: Array<{ sortBy: "TRENDING" | "POPULAR" | "RELEASE_YEAR"; minYear?: number }> = [
      { sortBy: "TRENDING" },
      { sortBy: "POPULAR" },
      { sortBy: "RELEASE_YEAR", minYear: yearCut },
    ];

    for (const pass of passes) {
      const connection = await client.popular({
        country: COUNTRY,
        language: LANGUAGE,
        count: perProvider,
        providers: [shortName],
        objectTypes: ["MOVIE", "SHOW"],
        sortBy: pass.sortBy,
        ...(pass.minYear != null ? { minReleaseYear: pass.minYear } : {}),
      });

      for (const node of extractNodes(connection)) {
        const id = String(node.id || node.objectId || "");
        if (!id) continue;
        const existing = byId.get(id);
        if (existing) {
          if (!existing.providers.includes(providerKey)) {
            existing.providers.push(providerKey);
          }
          continue;
        }
        byId.set(id, {
          justwatchId: id,
          title: String(node.title || "").trim(),
          year:
            typeof node.originalReleaseYear === "number"
              ? node.originalReleaseYear
              : typeof node.year === "number"
                ? node.year
                : null,
          type: toType(node.objectType),
          posterUrl: node.posterFullUrl || (node.posterUrl ? `https://images.justwatch.com${node.posterUrl}` : null),
          providers: [providerKey],
          seasonCount: null,
          latestSeason: null,
        });
      }
      await sleep(300);
    }
  }

  const candidates = Array.from(byId.values()).filter((c) => c.title.length > 0);

  // Pro seriály zjisti počet řad (díly ignorujeme — zajímá nás jen nová řada / nový seriál).
  for (const c of candidates) {
    if (c.type !== "series") continue;
    try {
      const seasons = await client.seasons(c.justwatchId, {
        country: COUNTRY,
        language: LANGUAGE,
      });
      const numbers = (seasons || [])
        .map((s: { seasonNumber?: number | null }) =>
          typeof s.seasonNumber === "number" ? s.seasonNumber : null
        )
        .filter((n: number | null): n is number => n != null);
      c.seasonCount = seasons?.length ?? 0;
      c.latestSeason = numbers.length ? Math.max(...numbers) : c.seasonCount;
      await sleep(250);
    } catch (err) {
      console.warn(`[justwatch] seasons failed for ${c.justwatchId}:`, err);
    }
  }

  return candidates;
}

export async function listCzProviders() {
  return client.providers({ country: COUNTRY });
}
