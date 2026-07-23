import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getMeta, listQualifiedTitles } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEED_DIR = path.resolve(__dirname, "../../feed");
const FEED_PATH = path.join(FEED_DIR, "titles.json");

export function exportFeed(minRating = config.minCsfdRating): string {
  const titles = listQualifiedTitles(minRating);
  const meta = getMeta();
  const payload = {
    count: titles.length,
    minRating,
    updatedAt: meta.lastScanAt ?? new Date().toISOString(),
    meta,
    titles,
  };

  if (!fs.existsSync(FEED_DIR)) {
    fs.mkdirSync(FEED_DIR, { recursive: true });
  }
  fs.writeFileSync(FEED_PATH, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[feed] wrote ${titles.length} titles → ${FEED_PATH}`);
  return FEED_PATH;
}
