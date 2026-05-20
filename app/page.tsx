import { db, ensureDb } from "@/db/client";
import { actions, actionLog, goals, people } from "@/db/schema";
import { and, eq, lte, asc, inArray, gte, sql } from "drizzle-orm";
import { startOfTodayUnix } from "@/lib/scheduling";
import HeroCard from "@/components/HeroCard";
import ActionRow from "@/components/ActionRow";
import Link from "next/link";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import QuickAdd from "@/components/QuickAdd";
import { Users } from "lucide-react";
import { AREA_META } from "@/lib/areas";
import DailyLog from "@/components/DailyLog";
import SetupNeeded from "@/components/SetupNeeded";
import Pomodoro from "@/components/Pomodoro";
import MorningBrief from "@/components/MorningBrief";
import WhyCallout from "@/components/WhyCallout";
import { Suspense } from "react";
import { ChartSkeleton, CardSkeleton } from "@/components/Skeletons";

export const revalidate = 30;

export default async function TodayPage() {
  try {
    await ensureDb();
  } catch (e: unknown) {
    return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />;
  }

  let due: typeof actions.$inferSelect[] = [];
  let allPeople: typeof people.$inferSelect[] = [];
  try {
    const cutoff = startOfTodayUnix();
    // Single roundtrip via libSQL batch instead of two parallel HTTP calls.
    const [d, p] = await db.batch([
      db.select().from(actions)
        .where(and(
          eq(actions.status, "active"),
          lte(actions.nextDueAt, cutoff),
          inArray(actions.area, ["tasks", "habits", "study", "projects"]),
        ))
        .orderBy(asc(actions.nextDueAt)),
      db.select().from(people),
    ]);
    due = d; allPeople = p;
  } catch (e: unknown) {
    return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />;
  }

  const tasks = due.filter((a) => a.area === "tasks" || a.area === "projects" || a.area === "study");
  const habits = due.filter((a) => a.area === "habits");

  // Hero: pick the single "next step" — prefer something with a linked goal, else first due.
  const hero = due.find((a) => a.goalId) ?? due[0] ?? null;
  let heroGoal: typeof goals.$inferSelect | null = null;
  let doneToday = 0;
  if (hero) {
    try {
      const startToday = startOfTodayUnix();
      const [g, c] = await db.batch([
        hero.goalId
          ? db.select().from(goals).where(eq(goals.id, hero.goalId)).limit(1)
          : db.select().from(goals).where(eq(goals.pinned, true)).limit(1),
        db.select({ n: sql<number>`count(*)` }).from(actionLog)
          .where(and(gte(actionLog.doneAt, startToday), eq(actionLog.outcome, "done"))),
      ]);
      heroGoal = g[0] ?? null;
      doneToday = Number(c[0]?.n ?? 0);
    } catch {}
  }

  const overduePeople = allPeople.filter((p) => {
    if (!p.lastContactAt) return true;
    const days = (Date.now() / 1000 - p.lastContactAt) / 86400;
    return days >= p.cadenceDays;
  });

  const total = tasks.length + habits.length + overduePeople.length;
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{date}</div>
        <h1 className="mt-2 text-[40px] font-semibold leading-none tracking-tight">Today</h1>
        <div className="mt-2 text-sm text-sub">
          {total === 0
            ? "Inbox zero."
            : <><span className="font-medium tabular-nums text-ink">{total}</span> things to clear.</>}
        </div>
      </header>

      {hero && (
        <HeroCard
          action={hero}
          goal={heroGoal}
          doneToday={doneToday}
          totalToday={tasks.length + habits.length + doneToday}
          streak={hero.streak}
        />
      )}

      <Suspense fallback={<CardSkeleton h="h-40" />}>
        <MorningBrief />
      </Suspense>

      <div className="flex items-stretch gap-2">
        <div className="flex-1"><QuickAdd area="tasks" placeholder="Add a task for today…" /></div>
        <Pomodoro />
      </div>

      <Suspense fallback={null}>
        <WhyCallout />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {tasks.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-sub">Tasks</h2>
              <StaggerList className="space-y-2">
                {tasks.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
              </StaggerList>
            </section>
          )}

          {habits.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
                <AREA_META.habits.Icon size={14} style={{ color: AREA_META.habits.accent }} />
                Daily habits
              </h2>
              <StaggerList className="space-y-2">
                {habits.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
              </StaggerList>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <Suspense fallback={<ChartSkeleton />}>
            <DailyLog />
          </Suspense>

          {overduePeople.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
                <Users size={14} style={{ color: AREA_META.relationships.accent }} />
                Reach out
                <span className="text-sub tabular-nums">· {overduePeople.length}</span>
              </h2>
              <div className="space-y-2">
                {overduePeople.map((p) => (
                  <Link key={p.id} href="/relationships" className="card flex items-center justify-between p-3 transition hover:border-sub active:scale-[0.99]">
                    <div>
                      <div className="text-sm">{p.name}</div>
                      <div className="text-[11px] text-sub">{p.relationship || ""}</div>
                    </div>
                    <div className="text-xs text-sub">every {p.cadenceDays}d</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {total === 0 && (
        <div className="card p-8 text-center">
          <div className="text-lg font-medium">Clean slate.</div>
          <div className="mt-1 text-sm text-sub">Add a task above, or rest.</div>
        </div>
      )}
    </div>
  );
}
