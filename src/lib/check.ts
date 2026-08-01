import { randomUUID } from "node:crypto";
import { ADAPTERS } from "./adapters";
import { diffCatalog, diffStats } from "./diff";
import { notifySlack } from "./slack";
import { appendHistory, readSnapshot, writeSnapshot } from "./storage";
import { ADAPTER_KEYS } from "./types";
import type { Change, DiffRun } from "./types";

// Guards against two concurrent `POST /api/check` calls racing snapshot
// writes — module state is fine here since Next.js keeps one Node process
// per server instance.
let checkInFlight = false;

export async function runCheck(): Promise<{ runId: string; results: DiffRun[] }> {
  if (checkInFlight) throw new Error("A check is already in progress");
  checkInFlight = true;

  const runId = randomUUID();
  const results: DiffRun[] = [];

  try {
    for (const key of ADAPTER_KEYS) {
      const entry = ADAPTERS[key];
      const prev = await readSnapshot(key);

      let run: DiffRun;
      try {
        const fresh = await entry.run();
        const changes: Change[] = prev
          ? entry.kind === "catalog"
            ? diffCatalog(prev as never, fresh as never)
            : diffStats(prev as never, fresh as never)
          : [];
        await writeSnapshot(key, fresh as never);
        run = {
          id: randomUUID(),
          runId,
          adapter: key,
          ranAt: new Date().toISOString(),
          ok: true,
          source: fresh.source,
          isBaseline: !prev,
          changes,
        };
      } catch (err) {
        run = {
          id: randomUUID(),
          runId,
          adapter: key,
          ranAt: new Date().toISOString(),
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          source: "snapshot",
          isBaseline: !prev,
          changes: [],
        };
      }

      await appendHistory(run);
      results.push(run);
    }

    const changed = results.filter((r) => r.ok && r.changes.length > 0);
    if (changed.length > 0) {
      await notifySlack(changed).catch(() => {
        // Best-effort — a Slack failure never fails the check itself.
      });
    }

    return { runId, results };
  } finally {
    checkInFlight = false;
  }
}
