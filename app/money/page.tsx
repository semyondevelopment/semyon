import { db, ensureDb } from "@/db/client";
import { goals, actions, notes, expenses, leads } from "@/db/schema";
import { eq, and, sql, asc, desc, gte } from "drizzle-orm";
import { ArrowLeft, Plus, Wallet, TrendingUp, Receipt, Calculator } from "lucide-react";
import Link from "next/link";
import SetupNeeded from "@/components/SetupNeeded";
import GoalCard from "@/components/GoalCard";
import Sparkline from "@/components/charts/Sparkline";
import ExpensesPanel from "@/components/ExpensesPanel";
import HourlyRate from "@/components/HourlyRate";
import { AREA_META } from "@/lib/areas";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const meta = AREA_META.money;

  const since = Math.floor(Date.now() / 1000) - 90 * 86400;
  const sinceKey = (() => {
    const d = new Date(since * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const [moneyGoals, moneyActions, moneyNotes, allExpenses, signedLeads, mrrAgg] = await db.batch([
    db.select().from(goals).where(eq(goals.area, "money")).orderBy(asc(goals.id)),
    db.select().from(actions).where(and(eq(actions.area, "money"), eq(actions.status, "active"))).orderBy(asc(actions.nextDueAt)),
    db.select().from(notes).where(eq(notes.area, "money")).orderBy(asc(notes.id)),
    db.select().from(expenses).where(gte(expenses.dateKey, sinceKey)).orderBy(desc(expenses.dateKey)),
    db.select().from(leads).where(eq(leads.status, "signed")),
    db.select({ mrrSum: sql<number>`COALESCE(SUM(${leads.mrr}), 0)` }).from(leads).where(eq(leads.status, "signed")),
  ]);

  const mrr = mrrAgg[0]?.mrrSum ?? 0;
  const target = 10000;
  const pct = Math.min(100, Math.round((mrr / target) * 100));

  // Revenue over time (cumulative MRR from signed leads, by month). Simple version: bucket signed leads by month signed.
  const byMonth: Record<string, number> = {};
  for (const l of signedLeads) {
    const d = new Date((l.lastTouchAt ?? l.createdAt) * 1000);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[k] = (byMonth[k] ?? 0) + (l.mrr ?? 0);
  }
  const monthKeys = Object.keys(byMonth).sort();
  let running = 0;
  const revenueSeries = monthKeys.map((k, i) => {
    running += byMonth[k];
    return { x: i, y: running, label: `$${running}` };
  });

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            <Wallet size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{meta.blurb}</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">Money</h1>
          </div>
        </div>
        <Link href="/capture?area=money" className="btn btn-accent gap-1.5"><Plus size={16} strokeWidth={2.5} />Add</Link>
      </header>

      <div className="card relative overflow-hidden p-5" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(20,20,22,0.6))" }}>
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
            <TrendingUp size={12} strokeWidth={2.5} />Current MRR
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums">${mrr.toLocaleString()}</span>
            <span className="text-sub">/ ${target.toLocaleString()}</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-accent" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-xs text-sub tabular-nums">{pct}% to goal</div>
          {revenueSeries.length >= 2 && (
            <div className="mt-4"><Sparkline data={revenueSeries} color="#34d399" height={70} label="Cumulative MRR" /></div>
          )}
          <Link href="/pipeline" className="mt-3 inline-block text-xs text-emerald-400 hover:underline">Open pipeline →</Link>
        </div>
      </div>

      <HourlyRate currentMrr={mrr} />

      <ExpensesPanel expenses={allExpenses} />

      {moneyGoals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Goals</h2>
          <div className="space-y-2">
            {moneyGoals.map((g) => <GoalCard key={g.id} g={g} />)}
          </div>
        </section>
      )}

      {moneyNotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Notes & ideas</h2>
          <div className="space-y-2">
            {moneyNotes.map((n) => <div key={n.id} className="card p-3 text-sm whitespace-pre-wrap">{n.body}</div>)}
          </div>
        </section>
      )}
    </div>
  );
}
