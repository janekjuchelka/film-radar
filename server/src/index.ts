import cors from "cors";
import cron from "node-cron";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { getMeta, listQualifiedTitles } from "./db.js";
import { isScanning, scanDaily } from "./scan.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    scanning: isScanning(),
    meta: getMeta(),
    minCsfdRating: config.minCsfdRating,
  });
});

app.get("/titles", (req, res) => {
  const minRating = Number(req.query.minRating ?? config.minCsfdRating);
  const type = typeof req.query.type === "string" ? req.query.type : "all";
  const provider = typeof req.query.provider === "string" ? req.query.provider : "all";

  let titles = listQualifiedTitles(Number.isFinite(minRating) ? minRating : config.minCsfdRating);

  if (type === "movie" || type === "series") {
    titles = titles.filter((t) => t.type === type);
  }
  if (provider && provider !== "all") {
    titles = titles.filter((t) => t.providers.includes(provider as never));
  }

  res.json({
    count: titles.length,
    minRating: Number.isFinite(minRating) ? minRating : config.minCsfdRating,
    titles,
  });
});

app.post("/admin/run-scan", async (_req, res) => {
  if (isScanning()) {
    res.status(409).json({ ok: false, error: "Scan already in progress" });
    return;
  }
  try {
    const stats = await scanDaily();
    res.json({ ok: true, stats });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

if (!cron.validate(config.scanCron)) {
  throw new Error(`Invalid SCAN_CRON: ${config.scanCron}`);
}

cron.schedule(config.scanCron, () => {
  console.log(`[cron] starting scheduled scan (${config.scanCron})`);
  scanDaily().catch((err) => console.error("[cron] scan failed", err));
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(config.port, config.host, () => {
  console.log(`Film Radar UI  http://127.0.0.1:${config.port}/`);
  console.log(`Film Radar API http://${config.host}:${config.port}`);
  console.log(`Daily scan cron: ${config.scanCron}`);

  if (config.scanOnStart) {
    const existing = listQualifiedTitles(config.minCsfdRating);
    if (existing.length === 0) {
      console.log("[boot] empty DB — starting initial scan");
      scanDaily().catch((err) => console.error("[boot] initial scan failed", err));
    } else {
      console.log(`[boot] DB has ${existing.length} titles — skip initial scan`);
    }
  }
});
