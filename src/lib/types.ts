import type { Catalog, ModelStat, StatsCatalog } from "model-atlas";

export type AdapterKey = "vapi-catalog" | "vapi-stats" | "retell-catalog" | "retell-stats";
export type Kind = "llm" | "voice" | "transcriber";
export type StatField = keyof ModelStat;

export const ADAPTER_KEYS: AdapterKey[] = ["vapi-catalog", "vapi-stats", "retell-catalog", "retell-stats"];

export type SnapshotOf<K extends AdapterKey> = K extends `${string}-catalog` ? Catalog : StatsCatalog;

export type CatalogChange =
  | { domain: "catalog"; kind: Kind; type: "provider-added"; provider: string; label: string; models: string[] }
  | { domain: "catalog"; kind: Kind; type: "provider-removed"; provider: string; models: string[] }
  | { domain: "catalog"; kind: Kind; type: "model-added"; provider: string; modelId: string }
  | { domain: "catalog"; kind: Kind; type: "model-removed"; provider: string; modelId: string };

export type StatsChange =
  | { domain: "stats"; kind: Kind; type: "model-stats-added"; provider: string; modelId: string; stat: ModelStat }
  | { domain: "stats"; kind: Kind; type: "model-stats-removed"; provider: string; modelId: string }
  | {
      domain: "stats";
      kind: Kind;
      type: "field-added";
      provider: string;
      modelId: string;
      field: StatField;
      newValue: number;
    }
  | {
      domain: "stats";
      kind: Kind;
      type: "field-removed";
      provider: string;
      modelId: string;
      field: StatField;
      oldValue: number;
    }
  | {
      domain: "stats";
      kind: Kind;
      type: "field-changed";
      provider: string;
      modelId: string;
      field: StatField;
      oldValue: number;
      newValue: number;
    };

export type Change = CatalogChange | StatsChange;

export interface DiffRun {
  id: string;
  runId: string;
  adapter: AdapterKey;
  ranAt: string;
  ok: boolean;
  error?: string;
  source: "live" | "fallback" | "snapshot";
  isBaseline: boolean;
  changes: Change[];
}

export const ADAPTER_LABELS: Record<AdapterKey, string> = {
  "vapi-catalog": "VAPI catalog",
  "vapi-stats": "VAPI stats",
  "retell-catalog": "Retell catalog",
  "retell-stats": "Retell stats",
};
