import { db, ensureDb } from "@/db/client";
import { actionLog, actions, goals, reflections } from "@/db/schema";
import { gte, eq, desc } from "drizzle-orm";
import { AREA_META, AREA_ORDER } from "@/lib/areas";
import Link from "next/link";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import CountUp from "@/components/CountUp";
import { Check, X as XIcon, ArrowUpRight } from "lucide-react";
import ReflectionForm from "@/components/ReflectionForm";
import { weekStartUnix, fmtWeek } from "@/lib/dates";
import NotificationsButton from "@/components/NotificationsButton";

export const revalidate = 30;

export default async function ReviewPage() {
  await ensureDb();
  const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;
  const weekStart = weekStartUnix();
  const [log, allActions, existingReflectionRow, pinned] = await db.batch([
    db.select().from(actionLog).where(gte(actionLog.doneAt, weekAgo)),
    db.select().from(actions),
    db.select().from(reflections).where(eq(reflections.weekStarting, weekStart)),
    db.select().from(goals).where(eq(goals.pinned, true)),
  ]);
  const existingReflection = existingReflectionRow[0] ?? null;
  const done = log.filter((l) => l.outcome === "done").length;
  const skipped = log.filter((l) => l.outcome === "skip").length;

  const actionsById = new Map(allActions.map((a) => [a.id, a]));
  const byArea: Record<string, { done: number; total: number }> = {};
  for (const a of allActions) {
    byArea[a.area] ||= { done: 0, total: 0 };
    byArea[a.area].total += 1;
  }
  for (const l of log) {
    if (l.outcome !== "done") continue;
    const a = actionsById.get(l.actionId);
    if (a) byArea[a.area].done += 1;
  }
  const recentDone = log.filter((l) => l.outcome === "done").sort((a, b) => b.doneAt - a.doneAt).slice(0, 12);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[40px] leading-none font-semibold tracking-tight">Review</h1>
        <p className="text-sub text-sm mt-2">Last 7 days at a glance.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="label">Completed</div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Check size={14} strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-2 text-4xl font-semibold text-accent"><CountUp to={done} /></div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="label">Skipped</div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-line/60 text-sub">
              <XIcon size={14} strokeWidth={2.5} />
            </span>
          </div>
          <div className="mt-2 text-4xl font-semibold"><CountUp to={skipped} /></div>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub">Momentum by area</h2>
        <StaggerList className="space-y-2">
          {AREA_ORDER.map((area) => {
            const stat = byArea[area] || { done: 0, total: 0 };
            const meta = AREA_META[area];
            const pct = stat.total ? Math.min(100, Math.round((stat.done / Math.max(1, stat.total)) * 100)) : 0;
            return (
              <StaggerItem key={area}>
                <Link href={`/${area}`} className="card group flex items-center gap-3 p-3 transition active:scale-[0.99]">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line"
                    style={{ background: `${meta.accent}1a`, color: meta.accent }}
                  >
                    <meta.Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">{meta.label}</div>
                      <div className="inline-flex items-center gap-1 text-xs text-sub tabular-nums">
                        {stat.done} / {stat.total}
                        <ArrowUpRight size={12} className="opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.accent}, #d1fa6e)` }} />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      </section>

      <ReflectionForm existing={existingReflection} weekLabel={fmtWeek(weekStart)} />

      <NotificationsButton />

      {pinned.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Focus goals</h2>
          {pinned.map((g) => (
            <Link key={g.id} href={`/goal/${g.id}`} className="card block p-3 hover:border-sub transition">
              <div className="text-sm">{g.title}</div>
            </Link>
          ))}
        </section>
      )}

      {recentDone.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Recent wins</h2>
          <div className="space-y-1 text-sm">
            {recentDone.map((l) => {
              const a = actionsById.get(l.actionId);
              return <div key={l.id} className="text-sub"><span className="text-accent">✓</span> {a?.title || "—"}</div>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
