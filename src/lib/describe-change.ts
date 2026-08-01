import type { Change } from "./types";

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function describeChange(change: Change): string {
  if (change.domain === "catalog") {
    switch (change.type) {
      case "provider-added":
        return `${change.kind}: provider added — ${change.label} (${change.provider}), ${change.models.length} model(s)`;
      case "provider-removed":
        return `${change.kind}: provider removed — ${change.provider}`;
      case "model-added":
        return `${change.kind}/${change.provider}: model added (${change.modelId})`;
      case "model-removed":
        return `${change.kind}/${change.provider}: model removed (${change.modelId})`;
    }
  }

  switch (change.type) {
    case "model-stats-added":
      return `${change.kind}/${change.provider}/${change.modelId}: stats added`;
    case "model-stats-removed":
      return `${change.kind}/${change.provider}/${change.modelId}: stats removed`;
    case "field-added":
      return `${change.kind}/${change.provider}/${change.modelId}: ${change.field} added (${formatValue(change.newValue)})`;
    case "field-removed":
      return `${change.kind}/${change.provider}/${change.modelId}: ${change.field} removed (was ${formatValue(change.oldValue)})`;
    case "field-changed":
      return `${change.kind}/${change.provider}/${change.modelId}: ${change.field} ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
  }
}
