import { db } from "@/db/client";
import { goals } from "@/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { AREA_META } from "@/lib/areas";
import type { Area } from "@/db/schema";

export default async function WhyCallout() {
  // Random active goal that has a `why` set. Surfaces ~1/3 of the time on Today.
  if (Math.random() > 0.34) return null;

  const rows = await db.select().from(goals)
    .where(and(eq(goals.status, "active"), isNotNull(goals.why)))
    .orderBy(sql`random()`)
    .limit(1);

  const g = rows[0];
  if (!g || !g.why) return null;
  const meta = AREA_META[g.area as Area];

  return (
    <Link
      href={`/goal/${g.id}`}
      className="card group relative block overflow-hidden p-5 transition hover:border-sub"
      style={{ background: `linear-gradient(135deg, ${meta?.accent ?? "#d1fa6e"}1a, rgba(20,20,22,0.6))` }}
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl" style={{ background: `${meta?.accent ?? "#d1fa6e"}33` }} />
      <div className="relative">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: meta?.accent }}>
          <Sparkles size={11} strokeWidth={2.5} />Why
        </div>
        <div className="mt-1 text-[15px] font-medium">{g.title}</div>
        <blockquote className="mt-2 text-[15px] leading-relaxed text-ink/90 italic">
          {g.why}
        </blockquote>
        <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-sub transition group-hover:text-ink">
          Open goal <ArrowRight size={11} />
        </div>
      </div>
    </Link>
  );
}
