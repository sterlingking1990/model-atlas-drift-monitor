"use client";

import { useState } from "react";
import { describeChange } from "@/lib/describe-change";
import { ADAPTER_LABELS } from "@/lib/types";
import type { DiffRun } from "@/lib/types";

export function HistoryFeed({ history }: { history: DiffRun[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (history.length === 0) {
    return <p className="text-sm text-zinc-500">No checks have run yet.</p>;
  }

  const grouped = new Map<string, DiffRun[]>();
  for (const run of history) {
    const group = grouped.get(run.runId) ?? [];
    group.push(run);
    grouped.set(run.runId, group);
  }

  function toggle(runId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) next.delete(runId);
      else next.add(runId);
      return next;
    });
  }

  return (
    <ul className="space-y-3">
      {[...grouped.entries()].map(([runId, runs]) => {
        const ranAt = runs[0].ranAt;
        const totalChanges = runs.reduce((n, r) => n + r.changes.length, 0);
        const anyBaseline = runs.some((r) => r.isBaseline);
        const anyFailed = runs.some((r) => !r.ok);
        const isOpen = expanded.has(runId);

        return (
          <li key={runId} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left text-sm"
              onClick={() => toggle(runId)}
            >
              <span>
                {new Date(ranAt).toLocaleString()} —{" "}
                {anyBaseline
                  ? "Initial snapshot captured"
                  : totalChanges > 0
                    ? `${totalChanges} change(s) detected`
                    : "No changes"}
                {anyFailed && <span className="ml-2 text-red-600 dark:text-red-400">(errors)</span>}
              </span>
              <span className="text-zinc-400">{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <ul className="mt-2 space-y-1 border-t border-zinc-100 pt-2 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                {runs.map((run) => {
                  if (!run.ok) {
                    return (
                      <li key={run.id} className="text-red-600 dark:text-red-400">
                        [{ADAPTER_LABELS[run.adapter]}] Failed: {run.error}
                      </li>
                    );
                  }
                  if (run.isBaseline) {
                    return <li key={run.id}>[{ADAPTER_LABELS[run.adapter]}] Initial snapshot captured</li>;
                  }
                  if (run.changes.length === 0) {
                    return <li key={run.id}>[{ADAPTER_LABELS[run.adapter]}] No changes</li>;
                  }
                  return run.changes.map((change, i) => (
                    <li key={`${run.id}-${i}`}>
                      [{ADAPTER_LABELS[run.adapter]}] {describeChange(change)}
                    </li>
                  ));
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
