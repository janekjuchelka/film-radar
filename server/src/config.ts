import "dotenv/config";

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: num("PORT", 3847),
  host: process.env.API_HOST || "0.0.0.0",
  minCsfdRating: num("MIN_CSFD_RATING", 60),
  scanCron: process.env.SCAN_CRON || "0 8 * * *",
  scanPerProvider: num("SCAN_PER_PROVIDER", 50),
  csfdDelayMs: num("CSFD_DELAY_MS", 1500),
  /** Spustí scan po startu, když je databáze prázdná (vhodné pro free cloud). */
  scanOnStart: (process.env.SCAN_ON_START || "true").toLowerCase() !== "false",
};
