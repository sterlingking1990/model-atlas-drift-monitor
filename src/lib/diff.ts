import type { Catalog, ModelStat, StatsCatalog } from "model-atlas";
import type { CatalogChange, Kind, StatField, StatsChange } from "./types";

const KINDS: Kind[] = ["llm", "voice", "transcriber"];
const STAT_FIELDS: StatField[] = [
  "latencyMs",
  "wer",
  "costPerMin",
  "humannessElo",
  "costPerMChars",
  "intelligenceScore",
];

function setDiff<T>(a: Set<T>, b: Set<T>): { onlyInA: T[]; onlyInB: T[] } {
  return {
    onlyInA: [...a].filter((x) => !b.has(x)),
    onlyInB: [...b].filter((x) => !a.has(x)),
  };
}

// Providers and model lists come from independent live fetches with no
// ordering guarantee, so every comparison here is set-based — comparing the
// raw arrays would produce false-positive "changes" from reordering alone.
export function diffCatalog(prev: Catalog, next: Catalog): CatalogChange[] {
  const changes: CatalogChange[] = [];

  for (const kind of KINDS) {
    const prevProviders = new Map(prev[kind].providers.map((p) => [p.slug, p.label]));
    const nextProviders = new Map(next[kind].providers.map((p) => [p.slug, p.label]));
    const { onlyInA: removedProviders, onlyInB: addedProviders } = setDiff(
      new Set(prevProviders.keys()),
      new Set(nextProviders.keys()),
    );

    for (const slug of addedProviders) {
      changes.push({
        domain: "catalog",
        kind,
        type: "provider-added",
        provider: slug,
        label: nextProviders.get(slug)!,
        models: next[kind].modelsByProvider[slug] ?? [],
      });
    }
    for (const slug of removedProviders) {
      changes.push({
        domain: "catalog",
        kind,
        type: "provider-removed",
        provider: slug,
        models: prev[kind].modelsByProvider[slug] ?? [],
      });
    }

    for (const slug of prevProviders.keys()) {
      if (!nextProviders.has(slug)) continue; // already reported as provider-removed
      const { onlyInA: removedModels, onlyInB: addedModels } = setDiff(
        new Set(prev[kind].modelsByProvider[slug] ?? []),
        new Set(next[kind].modelsByProvider[slug] ?? []),
      );
      for (const modelId of addedModels) {
        changes.push({ domain: "catalog", kind, type: "model-added", provider: slug, modelId });
      }
      for (const modelId of removedModels) {
        changes.push({ domain: "catalog", kind, type: "model-removed", provider: slug, modelId });
      }
    }
  }

  return changes;
}

interface StatEntry {
  provider: string;
  modelId: string;
  stat: ModelStat;
}

function statPairs(section: StatsCatalog[Kind]): Map<string, StatEntry> {
  const out = new Map<string, StatEntry>();
  for (const [provider, models] of Object.entries(section)) {
    for (const [modelId, stat] of Object.entries(models)) {
      out.set(JSON.stringify([provider, modelId]), { provider, modelId, stat });
    }
  }
  return out;
}

export function diffStats(prev: StatsCatalog, next: StatsCatalog): StatsChange[] {
  const changes: StatsChange[] = [];

  for (const kind of KINDS) {
    const prevPairs = statPairs(prev[kind]);
    const nextPairs = statPairs(next[kind]);
    const allKeys = new Set([...prevPairs.keys(), ...nextPairs.keys()]);

    for (const key of allKeys) {
      const entry = (prevPairs.get(key) ?? nextPairs.get(key))!;
      const { provider, modelId } = entry;
      const prevStat = prevPairs.get(key)?.stat;
      const nextStat = nextPairs.get(key)?.stat;

      if (!prevStat && nextStat) {
        changes.push({ domain: "stats", kind, type: "model-stats-added", provider, modelId, stat: nextStat });
        continue;
      }
      if (prevStat && !nextStat) {
        changes.push({ domain: "stats", kind, type: "model-stats-removed", provider, modelId });
        continue;
      }
      if (!prevStat || !nextStat) continue;

      for (const field of STAT_FIELDS) {
        const oldValue = prevStat[field];
        const newValue = nextStat[field];
        if (oldValue === newValue) continue;
        if (oldValue === undefined && newValue !== undefined) {
          changes.push({ domain: "stats", kind, type: "field-added", provider, modelId, field, newValue });
        } else if (oldValue !== undefined && newValue === undefined) {
          changes.push({ domain: "stats", kind, type: "field-removed", provider, modelId, field, oldValue });
        } else if (oldValue !== undefined && newValue !== undefined) {
          changes.push({ domain: "stats", kind, type: "field-changed", provider, modelId, field, oldValue, newValue });
        }
      }
    }
  }

  return changes;
}
