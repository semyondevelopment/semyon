import { db, ensureDb } from "@/db/client";
import { leads } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { LEAD_STATUSES, type LeadStatus } from "@/db/schema";
import LeadCard from "@/components/LeadCard";
import LeadCreate from "@/components/LeadCreate";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_META: Record<LeadStatus, { label: string; tint: string; accent: string }> = {
  lead:        { label: "Lead",        tint: "from-slate-500/15",    accent: "#94a3b8" },
  qualified:   { label: "Qualified",   tint: "from-sky-500/15",      accent: "#38bdf8" },
  call_booked: { label: "Call booked", tint: "from-violet-500/15",   accent: "#a78bfa" },
  proposal:    { label: "Proposal",    tint: "from-amber-500/15",    accent: "#fbbf24" },
  signed:      { label: "Signed",      tint: "from-emerald-500/15",  accent: "#34d399" },
  lost:        { label: "Lost",        tint: "from-rose-500/15",     accent: "#fb7185" },
};

export default async function PipelinePage() {
  await ensureDb();
  const all = await db.select().from(leads).orderBy(asc(leads.id));
  const byStatus: Record<LeadStatus, typeof all> = Object.fromEntries(
    LEAD_STATUSES.map((s) => [s, [] as typeof all]),
  ) as any;
  for (const l of all) byStatus[l.status as LeadStatus]?.push(l);

  const [{ mrrSum }] = await db.select({
    mrrSum: sql<number>`COALESCE(SUM(${leads.mrr}), 0)`,
  }).from(leads).where(eq(leads.status, "signed"));

  const target = 10000;
  const pct = Math.min(100, Math.round((mrrSum / target) * 100));

  return (
    <div className="space-y-6">
      <Link href="/content" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Content
      </Link>

      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">Sales pipeline</div>
        <h1 className="mt-2 text-[40px] font-semibold leading-none tracking-tight">Pipeline</h1>
      </header>

      <div
        className="card relative overflow-hidden p-5"
        style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(20,20,22,0.6))" }}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
            <Target size={12} strokeWidth={2.5} />Current MRR
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">${mrrSum.toLocaleString()}</span>
            <span className="text-sub">/ ${target.toLocaleString()}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-xs text-sub tabular-nums">{pct}% to goal</div>
        </div>
      </div>

      <LeadCreate />

      <div className="space-y-4">
        {LEAD_STATUSES.map((status) => {
          if (status === "lost" && byStatus[status].length === 0) return null;
          const meta = STATUS_META[status];
          return (
            <section key={status} className="space-y-2">
              <h2 className="inline-flex items-center gap-2 text-sm font-medium">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.accent }} />
                {meta.label}
                <span className="text-sub tabular-nums">· {byStatus[status].length}</span>
              </h2>
              <div className="space-y-2">
                {byStatus[status].length === 0 ? (
                  <div className="text-xs text-sub px-3">—</div>
                ) : byStatus[status].map((l) => <LeadCard key={l.id} lead={l} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
