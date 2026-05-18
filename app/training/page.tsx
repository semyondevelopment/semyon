import { db, ensureDb } from "@/db/client";
import { actions, setLog } from "@/db/schema";
import { and, eq, lte, asc, desc, ne } from "drizzle-orm";
import { startOfTodayUnix } from "@/lib/scheduling";
import { todayKey } from "@/lib/dates";
import ActionRow from "@/components/ActionRow";
import { sessionForAction, WEEK_SCHEDULE, type Session } from "@/lib/program";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import SessionDetail from "@/components/SessionDetail";
import DailyLog from "@/components/DailyLog";
import WeightTrend from "@/components/WeightTrend";
import PRBoard from "@/components/PRBoard";
import { ChartSkeleton, GridSkeleton } from "@/components/Skeletons";
import { Suspense } from "react";
import { Dumbbell, Calendar, Flame } from "lucide-react";
import type { SetLog } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  await ensureDb();
  const cutoff = startOfTodayUnix();

  const todayHealth = await db.select().from(actions)
    .where(and(eq(actions.status, "active"), eq(actions.area, "health"), lte(actions.nextDueAt, cutoff)))
    .orderBy(asc(actions.nextDueAt));

  const mainAction = todayHealth.find((a) => sessionForAction(a.title));
  const mainSession: Session | null = mainAction ? sessionForAction(mainAction.title) : null;
  const supports = todayHealth.filter((a) => a !== mainAction);

  // Load this session's logs + most recent prior session per exercise.
  let todayByExercise: Record<string, SetLog[]> = {};
  let lastByExercise: Record<string, { date: string; sets: SetLog[] } | null> = {};
  if (mainAction && mainSession) {
    const tkey = todayKey();
    // Single batch: 1 query for today's sets + N queries for each exercise's prior history.
    const todayQuery = db.select().from(setLog)
      .where(and(eq(setLog.actionId, mainAction.id), eq(setLog.sessionDate, tkey)))
      .orderBy(asc(setLog.setIndex));
    const priorQueries = mainSession.blocks.map((block) =>
      db.select().from(setLog)
        .where(and(
          eq(setLog.actionId, mainAction.id),
          eq(setLog.exercise, block.name),
          ne(setLog.sessionDate, tkey),
        ))
        .orderBy(desc(setLog.sessionDate), asc(setLog.setIndex))
    );
    const results = await db.batch([todayQuery, ...priorQueries]);
    const today = results[0];
    const priorResults = results.slice(1);

    todayByExercise = today.reduce<Record<string, SetLog[]>>((acc, s) => {
      (acc[s.exercise] ||= []).push(s);
      return acc;
    }, {});
    mainSession.blocks.forEach((block, i) => {
      const rows = priorResults[i];
      if (rows.length) {
        const date = rows[0].sessionDate;
        lastByExercise[block.name] = { date, sets: rows.filter((p) => p.sessionDate === date) };
      } else {
        lastByExercise[block.name] = null;
      }
    });
  }

  const todayDow = new Date().getDay();
  const todayLabel = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][todayDow];
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{date}</div>
        <h1 className="mt-2 text-[40px] font-semibold leading-none tracking-tight">Training</h1>
        <div className="mt-2 inline-flex items-center gap-2 text-sm text-sub">
          {mainSession
            ? <>Today: <span className="text-ink font-medium">{mainSession.title}</span></>
            : <>Recovery day. Steps + protein still count.</>}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {mainSession && mainAction && (
            <SessionDetail
              action={mainAction}
              session={mainSession}
              todayByExercise={todayByExercise}
              lastByExercise={lastByExercise}
            />
          )}

          {supports.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
                <Flame size={14} className="text-amber-400" />
                Also today
              </h2>
              <StaggerList className="space-y-2">
                {supports.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
              </StaggerList>
            </section>
          )}

          <Suspense fallback={<GridSkeleton cols={3} />}>
            <PRBoard />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<ChartSkeleton />}>
            <DailyLog />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <WeightTrend />
          </Suspense>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
          <Calendar size={14} />
          This week
        </h2>
        <div className="card divide-y divide-line overflow-hidden">
          {WEEK_SCHEDULE.map((d) => {
            const isToday = d.day === todayLabel;
            return (
              <div key={d.day} className={`flex items-center gap-3 px-4 py-3 ${isToday ? "bg-accent/5" : ""}`}>
                <div className={`w-10 text-[11px] font-semibold uppercase tracking-[0.12em] ${isToday ? "text-accent" : "text-sub"}`}>{d.day}</div>
                <div className="flex-1 text-sm">{d.session}</div>
                {isToday && <span className="chip text-accent border-accent/40">Today</span>}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
          <Dumbbell size={14} />
          Program principles
        </h2>
        <div className="card space-y-2 p-4 text-sm text-ink/85">
          <p><span className="text-accent">Lifting:</span> 4-day Upper/Lower split, 2× frequency per muscle, heavy primary (3–6 reps RPE 8) + hypertrophy work (8–15 reps, RIR 0–2). Add 2.5–5 kg or 1–2 reps whenever all sets clear the top of the range.</p>
          <p><span className="text-accent">Eating:</span> +300–500 kcal/day surplus. 1.8 g protein per kg bodyweight. Track weekly weigh-ins on Monday AM.</p>
          <p><span className="text-accent">Combat:</span> 2× Muay Thai + 2× BJJ. Skill &gt; intensity while bulking — sparring is technical, not war.</p>
          <p><span className="text-accent">Cardio:</span> 1× Z2 run (30–40 min, conversational HR) + 10k daily steps. Never enough to compete with lift recovery.</p>
          <p><span className="text-accent">Sleep:</span> 8 hrs in bed. The bulk doesn't work if recovery doesn't.</p>
        </div>
      </section>
    </div>
  );
}
