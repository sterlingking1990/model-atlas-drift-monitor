import { describeChange } from "./describe-change";
import { ADAPTER_LABELS } from "./types";
import type { DiffRun } from "./types";

export async function notifySlack(changed: DiffRun[]): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const totalChanges = changed.reduce((n, run) => n + run.changes.length, 0);
  const lines = changed.flatMap((run) =>
    run.changes.slice(0, 10).map((change) => `• [${ADAPTER_LABELS[run.adapter]}] ${describeChange(change)}`),
  );

  const text = `*model-atlas drift detected* (${totalChanges} change${totalChanges === 1 ? "" : "s"})\n${lines.join("\n")}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`Slack webhook responded ${res.status}`);
}
