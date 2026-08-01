import type { ModelStat, StatsCatalog } from "model-atlas";
import type { DiffRun, Kind } from "@/lib/types";

const KINDS: Kind[] = ["llm", "voice", "transcriber"];

function hasAnyField(stat: ModelStat): boolean {
  return Object.values(stat).some((v) => v !== undefined);
}

function count(stats: StatsCatalog, kind: Kind): number {
  return Object.values(stats[kind]).reduce(
    (n, models) => n + Object.values(models).filter(hasAnyField).length,
    0,
  );
}

function SourceBadge({ source }: { source: string }) {
  const isLive = source === "live";
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${
        isLive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      }`}
    >
      {source}
    </span>
  );
}

export function StatsSummaryCard({
  label,
  stats,
  lastRun,
  note,
}: {
  label: string;
  stats: StatsCatalog | null;
  lastRun: DiffRun | undefined;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        {stats && <SourceBadge source={stats.source} />}
      </div>
      {!stats ? (
        <p className="mt-2 text-sm text-zinc-500">No data yet — click Check now.</p>
      ) : (
        <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {KINDS.map((kind) => (
            <div key={kind} className="flex justify-between">
              <span className="capitalize">{kind}</span>
              <span>{count(stats, kind)} model(s) with stats</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-zinc-400">Captured {new Date(stats.capturedAt).toLocaleString()}</p>
        </div>
      )}
      {note && <p className="mt-2 text-xs text-zinc-400">{note}</p>}
      {lastRun && !lastRun.ok && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">Last check failed: {lastRun.error}</p>
      )}
    </div>
  );
}
