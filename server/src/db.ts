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

export function getMeta() {
  return ensureDb().meta;
}

export function listQualifiedTitles(minRating: number): TitleRecord[] {
  const db = ensureDb();
  return db.titles
    .filter((t) => t.qualified && (t.csfdRating ?? 0) >= minRating)
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt));
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

export function upsertTitle(title: TitleRecord): void {
  const db = ensureDb();
  const idx = db.titles.findIndex((t) => t.justwatchId === title.justwatchId);
  if (idx >= 0) {
    const existing = db.titles[idx];
    db.titles[idx] = {
      ...title,
      firstSeenAt: existing.firstSeenAt,
      providers: Array.from(new Set([...existing.providers, ...title.providers])),
    };
  } else {
    db.titles.push(title);
  }
  saveDb(db);
}

export function setScanMeta(stats: Record<string, number>): void {
  const db = ensureDb();
  db.meta.lastScanAt = new Date().toISOString();
  db.meta.lastScanStats = stats;
  saveDb(db);
}
