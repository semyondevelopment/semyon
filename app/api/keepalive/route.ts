import { NextResponse } from "next/server";

// Tiny endpoint hit by a cron every 5 min to keep the function instance warm.
// First request after a cold start is ~800ms; warm hits are ~50ms.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}
