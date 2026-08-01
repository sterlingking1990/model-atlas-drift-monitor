import { NextResponse } from "next/server";
import { runCheck } from "@/lib/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron invokes the configured path via GET; the "Check now" button
// in the UI uses POST. Both do the same thing.
async function handleCheck() {
  try {
    const result = await runCheck();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("already in progress") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// Only the cron path (GET, invoked by Vercel) is gated: if CRON_SECRET is
// set, the request must prove it actually came from Vercel's scheduler.
// The manual "Check now" button always uses POST, which is never gated.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handleCheck();
}

export async function POST() {
  return handleCheck();
}
