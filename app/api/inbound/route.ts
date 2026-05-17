import { NextResponse } from "next/server";
import { db, ensureDb } from "@/db/client";
import { leads, notes, studyTopics, books, AREAS, type Area } from "@/db/schema";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Generic inbound webhook for scheduled Claude agents (Cowork / Claude.ai routines).
// Auth: `Authorization: Bearer ${INBOUND_SECRET}` header.
//
// Body shape:
// {
//   "source": "claude-cowork" (optional, free-form),
//   "items": [
//     { "kind": "lead",        "name": "Acme Dental", "niche": "dental", "nextStep": "...", "notes": "..." },
//     { "kind": "note",        "area": "money",       "body": "Idea: ..." },
//     { "kind": "study_topic", "name": "...",         "estHours": 5 },
//     { "kind": "book",        "title": "...",        "author": "...", "pagesTotal": 300 },
//     { "kind": "digest",      "title": "Daily ...",  "area": "study", "body": "...long markdown..." }
//   ]
// }

type Item =
  | { kind: "lead"; name: string; niche?: string; nextStep?: string; notes?: string }
  | { kind: "note"; area: Area; body: string }
  | { kind: "study_topic"; name: string; estHours?: number; notes?: string }
  | { kind: "book"; title: string; author?: string; pagesTotal?: number }
  | { kind: "digest"; title: string; area?: Area; body: string; source?: string };

function authorized(req: Request): boolean {
  const secret = process.env.INBOUND_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await ensureDb();

  let body: { source?: string; items?: Item[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }

  if (!body.items || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "missing items array" }, { status: 400 });
  }

  const stats = { lead: 0, note: 0, study_topic: 0, book: 0, digest: 0, skipped: 0 };
  const errors: string[] = [];
  const now = Math.floor(Date.now() / 1000);
  const tag = body.source ? `[${body.source}] ` : "";

  for (const raw of body.items) {
    try {
      const item = raw as Item;
      switch (item.kind) {
        case "lead": {
          if (!item.name) { stats.skipped++; break; }
          await db.insert(leads).values({
            name: item.name,
            niche: item.niche ?? null,
            nextStep: item.nextStep ?? null,
            notes: item.notes ? `${tag}${item.notes}` : null,
            lastTouchAt: now,
          });
          stats.lead++;
          break;
        }
        case "note": {
          if (!item.body || !AREAS.includes(item.area)) { stats.skipped++; break; }
          await db.insert(notes).values({ area: item.area, body: `${tag}${item.body}` });
          stats.note++;
          break;
        }
        case "study_topic": {
          if (!item.name) { stats.skipped++; break; }
          await db.insert(studyTopics).values({
            name: item.name,
            estHours: item.estHours ?? null,
            notes: item.notes ? `${tag}${item.notes}` : null,
            color: "#a78bfa",
          });
          stats.study_topic++;
          break;
        }
        case "book": {
          if (!item.title) { stats.skipped++; break; }
          await db.insert(books).values({
            title: item.title,
            author: item.author ?? null,
            pagesTotal: item.pagesTotal ?? null,
            status: "queued",
          });
          stats.book++;
          break;
        }
        case "digest": {
          if (!item.body) { stats.skipped++; break; }
          const area = item.area && AREAS.includes(item.area) ? item.area : "study";
          const titleLine = item.title ? `# ${item.title}\n\n` : "";
          await db.insert(notes).values({ area, body: `${tag}${titleLine}${item.body}` });
          stats.digest++;
          break;
        }
        default:
          stats.skipped++;
          errors.push(`unknown kind: ${(raw as any).kind}`);
      }
    } catch (e) {
      stats.skipped++;
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  // Refresh anything that might display new items.
  revalidatePath("/study");
  revalidatePath("/money");
  revalidatePath("/content");
  revalidatePath("/pipeline");
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, source: body.source ?? null, received: body.items.length, stats, errors });
}

export async function GET(req: Request) {
  // Health probe for the inbox.
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    expects: "POST with Authorization: Bearer INBOUND_SECRET and body { source?, items: [{ kind: ... }] }",
    kinds: ["lead", "note", "study_topic", "book", "digest"],
    areas: AREAS,
  });
}
