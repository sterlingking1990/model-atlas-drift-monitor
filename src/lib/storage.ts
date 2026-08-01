import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdapterKey, DiffRun, SnapshotOf } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const HISTORY_FILE = path.join(DATA_DIR, "history.jsonl");

async function ensureDirs(): Promise<void> {
  await mkdir(SNAPSHOTS_DIR, { recursive: true });
}

function snapshotPath(adapter: AdapterKey): string {
  return path.join(SNAPSHOTS_DIR, `${adapter}.json`);
}

export async function readSnapshot<K extends AdapterKey>(adapter: K): Promise<SnapshotOf<K> | null> {
  try {
    const raw = await readFile(snapshotPath(adapter), "utf8");
    return JSON.parse(raw) as SnapshotOf<K>;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function writeSnapshot<K extends AdapterKey>(adapter: K, data: SnapshotOf<K>): Promise<void> {
  await ensureDirs();
  const target = snapshotPath(adapter);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, target); // atomic on the same filesystem — never leaves a half-written snapshot
}

export async function readAllSnapshots(): Promise<Partial<Record<AdapterKey, unknown>>> {
  const keys: AdapterKey[] = ["vapi-catalog", "vapi-stats", "retell-catalog", "retell-stats"];
  const out: Partial<Record<AdapterKey, unknown>> = {};
  for (const key of keys) out[key] = await readSnapshot(key);
  return out;
}

export async function appendHistory(run: DiffRun): Promise<void> {
  await ensureDirs();
  await appendFile(HISTORY_FILE, `${JSON.stringify(run)}\n`, "utf8");
}

export async function readHistory(opts: { adapter?: AdapterKey; limit?: number } = {}): Promise<DiffRun[]> {
  let raw: string;
  try {
    raw = await readFile(HISTORY_FILE, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  const lines = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as DiffRun)
    .reverse(); // newest first

  const filtered = opts.adapter ? lines.filter((run) => run.adapter === opts.adapter) : lines;
  return opts.limit ? filtered.slice(0, opts.limit) : filtered;
}
