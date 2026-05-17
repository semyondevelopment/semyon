import { db, ensureDb } from "@/db/client";
import { actions, actionLog } from "@/db/schema";
import { and, eq, gte, desc, asc } from "drizzle-orm";
import { ArrowLeft, Flame, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import ActionRow from "@/components/ActionRow";
import Heatmap from "@/components/charts/Heatmap";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import SetupNeeded from "@/components/SetupNeeded";
import { AREA_META } from "@/lib/areas";

export const dynamic = "force-dynamic";

function localDateKey(unix: number): string {
  const d = new Date(unix * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function HabitsPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const meta = AREA_META.habits;
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 86400;

  const [habits, logs] = await Promise.all([
    db.select().from(actions).where(and(eq(actions.area, "habits"), eq(actions.status, "active"))).orderBy(asc(actions.id)),
    db.select().from(actionLog).where(gte(actionLog.doneAt, ninetyDaysAgo)).orderBy(desc(actionLog.doneAt)),
  ]);

  const habitIds = new Set(habits.map((h) => h.id));
  const logsByHabit = new Map<number, Record<string, number>>();
  for (const l of logs) {
    if (!habitIds.has(l.actionId)) continue;
    if (l.outcome !== "done") continue;
    const k = localDateKey(l.doneAt);
    if (!logsByHabit.has(l.actionId)) logsByHabit.set(l.actionId, {});
    const map = logsByHabit.get(l.actionId)!;
    map[k] = (map[k] ?? 0) + 1;
  }

  // Aggregate all-habits heatmap
  const allMap: Record<string, number> = {};
  for (const m of logsByHabit.values()) {
    for (const [k, v] of Object.entries(m)) allMap[k] = (allMap[k] ?? 0) + v;
  }

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            <meta.Icon size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{meta.blurb}</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">Habits</h1>
          </div>
        </div>
        <Link href="/capture?area=habits" className="btn btn-accent gap-1.5"><Plus size={16} strokeWidth={2.5} />Add</Link>
      </header>

      <section className="card relative overflow-hidden p-5">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-amber-400">
            <Sparkles size={12} strokeWidth={2.5} />
            Activity · last 90 days
          </div>
          <div className="mt-3 overflow-x-auto">
            <Heatmap countByDate={allMap} color="#fbbf24" />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub">Daily habits</h2>
        <StaggerList className="space-y-3">
          {habits.map((h) => {
            const byDate = logsByHabit.get(h.id) ?? {};
            return (
              <StaggerItem key={h.id}>
                <div className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium">{h.title}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-sub">
                        <span className="chip inline-flex items-center gap-1"><Flame size={11} className="text-amber-400" />current {h.streak}</span>
                        <span className="chip">best {h.bestStreak ?? 0}</span>
                        <span className="chip">{h.cadence}</span>
                      </div>
                    </div>
                  </div>
                  <ActionRow a={h} />
                  <div className="overflow-x-auto">
                    <Heatmap countByDate={byDate} color="#fbbf24" weeks={13} />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>

        {habits.length === 0 && (
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <meta.Icon size={26} />
            </div>
            <div className="mt-3 font-medium">No habits yet.</div>
            <div className="mt-1 text-sm text-sub">Add a daily habit to start your first streak.</div>
          </div>
        )}
      </section>
    </div>
  );
}
