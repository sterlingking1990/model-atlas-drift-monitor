import { NextResponse } from "next/server";
import { readAllSnapshots, readSnapshot } from "@/lib/storage";
import { ADAPTER_KEYS } from "@/lib/types";
import type { AdapterKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adapterParam = searchParams.get("adapter");

  if (adapterParam) {
    if (!ADAPTER_KEYS.includes(adapterParam as AdapterKey)) {
      return NextResponse.json({ error: `Unknown adapter: ${adapterParam}` }, { status: 400 });
    }
    const data = await readSnapshot(adapterParam as AdapterKey);
    return NextResponse.json({ adapter: adapterParam, data });
  }

  const snapshots = await readAllSnapshots();
  return NextResponse.json({ snapshots });
}
