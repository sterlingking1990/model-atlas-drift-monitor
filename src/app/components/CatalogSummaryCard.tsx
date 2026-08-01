import type { Catalog } from "model-atlas";
import type { DiffRun, Kind } from "@/lib/types";

const KINDS: Kind[] = ["llm", "voice", "transcriber"];

function count(catalog: Catalog, kind: Kind) {
  const providers = catalog[kind].providers.length;
  const models = Object.values(catalog[kind].modelsByProvider).reduce((n, arr) => n + arr.length, 0);
  return { providers, models };
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

export function CatalogSummaryCard({
  label,
  catalog,
  lastRun,
}: {
  label: string;
  catalog: Catalog | null;
  lastRun: DiffRun | undefined;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{label}</h3>
        {catalog && <SourceBadge source={catalog.source} />}
      </div>
      {!catalog ? (
        <p className="mt-2 text-sm text-zinc-500">No data yet — click Check now.</p>
      ) : (
        <div className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          {KINDS.map((kind) => {
            const { providers, models } = count(catalog, kind);
            return (
              <div key={kind} className="flex justify-between">
                <span className="capitalize">{kind}</span>
                <span>
                  {providers} provider{providers === 1 ? "" : "s"} / {models} model{models === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-zinc-400">Fetched {new Date(catalog.fetchedAt).toLocaleString()}</p>
        </div>
      )}
      {lastRun && !lastRun.ok && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">Last check failed: {lastRun.error}</p>
      )}
    </div>
  );
}
