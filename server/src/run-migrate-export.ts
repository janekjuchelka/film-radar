import { migrateFeedEligibility } from "./db.js";
import { exportFeed } from "./export-feed.js";
import { config } from "./config.js";

const changed = migrateFeedEligibility();
const out = exportFeed(config.minCsfdRating);
console.log(`migrated=${changed} exported=${out} minRating=${config.minCsfdRating}`);
