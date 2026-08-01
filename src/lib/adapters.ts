import { retell, vapi } from "model-atlas";
import type { Catalog, StatsCatalog } from "model-atlas";
import type { AdapterKey } from "./types";

interface AdapterEntry {
  kind: "catalog" | "stats";
  label: string;
  run(): Promise<Catalog | StatsCatalog>;
}

// A fresh adapter instance is constructed per call deliberately: each
// adapter caches internally per-instance (ttlMs), so reusing one instance
// across checks would silently return stale in-memory data instead of a
// real live fetch.
export const ADAPTERS: Record<AdapterKey, AdapterEntry> = {
  "vapi-catalog": {
    kind: "catalog",
    label: "VAPI catalog",
    run: () => vapi.createVapiCatalogAdapter().getCatalog(),
  },
  "vapi-stats": {
    kind: "stats",
    label: "VAPI stats",
    run: () => vapi.createVapiStatsAdapter().getStats(),
  },
  "retell-catalog": {
    kind: "catalog",
    label: "Retell catalog",
    run: () => retell.createRetellCatalogAdapter({ apiKey: process.env.RETELL_API_KEY }).getCatalog(),
  },
  "retell-stats": {
    kind: "stats",
    label: "Retell stats",
    run: () => retell.createRetellStatsAdapter().getStats(),
  },
};
