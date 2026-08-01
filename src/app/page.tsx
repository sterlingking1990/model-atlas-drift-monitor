import type { Catalog, StatsCatalog } from "model-atlas";
import { CatalogSummaryCard } from "./components/CatalogSummaryCard";
import { CheckNowButton } from "./components/CheckNowButton";
import { HistoryFeed } from "./components/HistoryFeed";
import { StatsSummaryCard } from "./components/StatsSummaryCard";
import { readAllSnapshots, readHistory } from "@/lib/storage";
import { ADAPTER_LABELS } from "@/lib/types";
import type { DiffRun } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [snapshots, history] = await Promise.all([readAllSnapshots(), readHistory({ limit: 100 })]);

  const lastRunByAdapter = new Map<string, DiffRun>();
  for (const run of history) {
    if (!lastRunByAdapter.has(run.adapter)) lastRunByAdapter.set(run.adapter, run);
  }

  const lastChecked = history[0]?.ranAt;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">model-atlas drift monitor</h1>
          <p className="text-sm text-zinc-500">
            {lastChecked ? `Last checked ${new Date(lastChecked).toLocaleString()}` : "Never checked"}
          </p>
        </div>
        <CheckNowButton />
      </header>

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CatalogSummaryCard
          label={ADAPTER_LABELS["vapi-catalog"]}
          catalog={snapshots["vapi-catalog"] as Catalog | null}
          lastRun={lastRunByAdapter.get("vapi-catalog")}
        />
        <CatalogSummaryCard
          label={ADAPTER_LABELS["retell-catalog"]}
          catalog={snapshots["retell-catalog"] as Catalog | null}
          lastRun={lastRunByAdapter.get("retell-catalog")}
        />
        <StatsSummaryCard
          label={ADAPTER_LABELS["vapi-stats"]}
          stats={snapshots["vapi-stats"] as StatsCatalog | null}
          lastRun={lastRunByAdapter.get("vapi-stats")}
        />
        <StatsSummaryCard
          label={ADAPTER_LABELS["retell-stats"]}
          stats={snapshots["retell-stats"] as StatsCatalog | null}
          lastRun={lastRunByAdapter.get("retell-stats")}
          note="Only LLM cost-per-minute is populated for Retell — no public per-model quality/latency data exists, and voice/STT pricing is provider-wide, not per-model."
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Change history</h2>
        <HistoryFeed history={history} />
      </section>
    </div>
  );
}
