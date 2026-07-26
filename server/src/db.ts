import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CsfdCacheEntry, DatabaseShape, TitleRecord } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DB_PATH = path.join(DATA_DIR, "db.json");

function emptyDb(): DatabaseShape {
  return {
    titles: [],
    csfdCache: [],
    meta: { lastScanAt: null, lastScanStats: null },
  };
}

function ensureDb(): DatabaseShape {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const db = emptyDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
    return db;
  }
  const raw = fs.readFileSync(DB_PATH, "utf8");
  return JSON.parse(raw) as DatabaseShape;
}

function saveDb(db: DatabaseShape): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function normalizeTitle(t: TitleRecord): TitleRecord {
  return {
    ...t,
    seasonCount: t.seasonCount ?? null,
    latestSeason: t.latestSeason ?? null,
    eventType: t.eventType ?? null,
    eventAt: t.eventAt ?? null,
    feedEligible:
      typeof t.feedEligible === "boolean"
        ? t.feedEligible
        : Boolean(t.qualified && (t.type === "movie" || (t.year != null && t.year >= new Date().getFullYear() - 1))),
  };
}

export function getMeta() {
  return ensureDb().meta;
}

export function getTitle(justwatchId: string): TitleRecord | undefined {
  const found = ensureDb().titles.find((t) => t.justwatchId === justwatchId);
  return found ? normalizeTitle(found) : undefined;
}

export function listQualifiedTitles(minRating: number): TitleRecord[] {
  const db = ensureDb();
  return db.titles
    .map(normalizeTitle)
    .filter(
      (t) =>
        t.qualified &&
        t.feedEligible &&
        (t.csfdRating ?? 0) >= minRating &&
        (t.type === "movie" ||
          t.eventType === "new_series" ||
          t.eventType === "new_season")
    )
    .sort((a, b) => {
      const ae = a.eventAt ?? a.firstSeenAt;
      const be = b.eventAt ?? b.firstSeenAt;
      return be.localeCompare(ae);
    });
}

export function getCsfdCache(justwatchId: string): CsfdCacheEntry | undefined {
  return ensureDb().csfdCache.find((c) => c.justwatchId === justwatchId);
}

export function upsertCsfdCache(entry: CsfdCacheEntry): void {
  const db = ensureDb();
  const idx = db.csfdCache.findIndex((c) => c.justwatchId === entry.justwatchId);
  if (idx >= 0) db.csfdCache[idx] = entry;
  else db.csfdCache.push(entry);
  saveDb(db);
}

export function upsertTitle(title: TitleRecord): TitleRecord {
  const db = ensureDb();
  const idx = db.titles.findIndex((t) => t.justwatchId === title.justwatchId);
  if (idx >= 0) {
    const existing = normalizeTitle(db.titles[idx]);
    db.titles[idx] = {
      ...title,
      firstSeenAt: existing.firstSeenAt,
      providers: Array.from(new Set([...existing.providers, ...title.providers])),
    };
  } else {
    db.titles.push(title);
  }
  saveDb(db);
  return title;
}

/** Jednorázově vyčistí starý feed: staré seriály jen sledovat, ne ukazovat. */
export function migrateFeedEligibility(): number {
  const db = ensureDb();
  const yearCut = new Date().getFullYear() - 1;
  let changed = 0;
  db.titles = db.titles.map((raw) => {
    const t = normalizeTitle(raw);
    if (t.type === "movie") {
      const next = {
        ...t,
        eventType: t.eventType ?? ("new_movie" as const),
        eventAt: t.eventAt ?? t.firstSeenAt,
        feedEligible: t.qualified,
      };
      if (
        next.eventType !== t.eventType ||
        next.feedEligible !== t.feedEligible ||
        next.eventAt !== t.eventAt
      ) {
        changed += 1;
      }
      return next;
    }

    // Seriál: ve feedu jen nový seriál / nová řada.
    if (t.eventType === "new_series" || t.eventType === "new_season") {
      const next = { ...t, feedEligible: t.qualified };
      if (next.feedEligible !== t.feedEligible) changed += 1;
      return next;
    }

    // Legacy bez eventType — nech jen nedávné premiéry jako „nový seriál“.
    if (t.year != null && t.year >= yearCut) {
      const next = {
        ...t,
        eventType: "new_series" as const,
        eventAt: t.firstSeenAt,
        feedEligible: t.qualified,
      };
      changed += 1;
      return next;
    }

    const next = {
      ...t,
      eventType: null,
      eventAt: null,
      feedEligible: false,
    };
    if (t.feedEligible !== false || t.eventType != null) changed += 1;
    return next;
  });
  saveDb(db);
  return changed;
}

export function setScanMeta(stats: Record<string, number>): void {
  const db = ensureDb();
  db.meta.lastScanAt = new Date().toISOString();
  db.meta.lastScanStats = stats;
  saveDb(db);
}
