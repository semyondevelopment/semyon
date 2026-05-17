import { NextResponse } from "next/server";
import { ensureDb, db } from "@/db/client";
import { goals } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasUrl = !!process.env.TURSO_DATABASE_URL;
  const hasToken = !!process.env.TURSO_AUTH_TOKEN;
  const env = {
    VERCEL: !!process.env.VERCEL,
    TURSO_DATABASE_URL_set: hasUrl,
    TURSO_AUTH_TOKEN_set: hasToken,
  };

  if (!hasUrl) {
    return NextResponse.json(
      { ok: false, env, error: "TURSO_DATABASE_URL is not set" },
      { status: 500 },
    );
  }

  try {
    await ensureDb();
    const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(goals);
    return NextResponse.json({ ok: true, env, goalCount: c });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json({ ok: false, env, error: msg, stack }, { status: 500 });
  }
}
