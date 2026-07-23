import { listCzProviders, resolveProviderShortNames } from "./justwatch.js";

const packages = await listCzProviders();
console.log("CZ providers:");
for (const p of packages as Array<{ shortName?: string; clearName?: string }>) {
  console.log(`- ${p.shortName}\t${p.clearName}`);
}

const resolved = await resolveProviderShortNames();
console.log("\nResolved targets:", resolved);
