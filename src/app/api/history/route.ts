import { NextResponse } from "next/server";
import { readHistory } from "@/lib/storage";
import { ADAPTER_KEYS } from "@/lib/types";
import type { AdapterKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adapterParam = searchParams.get("adapter");
  const limitParam = searchParams.get("limit");

  if (adapterParam && !ADAPTER_KEYS.includes(adapterParam as AdapterKey)) {
    return NextResponse.json({ error: `Unknown adapter: ${adapterParam}` }, { status: 400 });
  }

  const limit = limitParam ? Number(limitParam) : 50;
  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: "limit must be a positive number" }, { status: 400 });
  }

  const history = await readHistory({ adapter: adapterParam as AdapterKey | undefined, limit });
  return NextResponse.json({ history });
}
