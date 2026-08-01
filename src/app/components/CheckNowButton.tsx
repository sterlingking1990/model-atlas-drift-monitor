"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DiffRun } from "@/lib/types";

export function CheckNowButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/check", { method: "POST" });
      const body = (await res.json()) as { results?: DiffRun[]; error?: string };
      if (!res.ok || !body.results) {
        setMessage(body.error ?? "Check failed");
      } else {
        const totalChanges = body.results.reduce((n, r) => n + r.changes.length, 0);
        setMessage(totalChanges > 0 ? `${totalChanges} change(s) detected` : "No changes detected");
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "Checking…" : "Check now"}
      </button>
      {message && <span className="text-sm text-zinc-600 dark:text-zinc-400">{message}</span>}
    </div>
  );
}
