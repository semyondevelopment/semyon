import { db } from "@/db/client";
import { actions, dailyLog, leads, mindLog } from "@/db/schema";
import { and, eq, gte, lte, desc, sql, isNotNull } from "drizzle-orm";
import { todayKey } from "@/lib/dates";
import { sessionForAction } from "@/lib/program";
import { startOfTodayUnix } from "@/lib/scheduling";
import Link from "next/link";
import { Sunrise, Sun, Moon, ArrowRight, Dumbbell, Beef, Briefcase } from "lucide-react";

function periodOfDay(): "morning" | "midday" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 17) return "midday";
  if (h < 21) return "evening";
  return "night";
}

const GREETINGS: Record<string, string[]> = {
  morning: ["Good morning.", "Up early. Good.", "Day one of the rest.", "Let's go.", "Fresh start."],
  midday:  ["Halfway.", "Keep moving.", "Lock in.", "Don't drift."],
  evening: ["Last hours.", "Finish strong.", "Push to close.", "Earn the rest."],
  night:   ["Wind down.", "Sleep is the cheat code.", "Plan tomorrow. Close today.", "Lights out soon."],
};

export default async function MorningBrief() {
  const tkey = todayKey();
  const period = periodOfDay();
  const cutoff = startOfTodayUnix();
  const since3 = Math.floor(Date.now() / 1000) - 3 * 86400;

  const [today, recentSleep, recentSets, todayHealth, signedAgg] = await db.batch([
    db.select().from(dailyLog).where(eq(dailyLog.dateKey, tkey)),
    db.select({ sleepHours: dailyLog.sleepHours, dateKey: dailyLog.dateKey })
      .from(dailyLog).where(isNotNull(dailyLog.sleepHours)).orderBy(desc(dailyLog.dateKey)).limit(7),
    db.select({ updatedAt: dailyLog.updatedAt }).from(dailyLog).where(gte(dailyLog.updatedAt, since3)),
    db.select().from(actions).where(and(eq(actions.status, "active"), eq(actions.area, "health"), lte(actions.nextDueAt, cutoff))),
    db.select({ mrrSum: sql<number>`COALESCE(SUM(${leads.mrr}), 0)` }).from(leads).where(eq(leads.status, "signed")),
  ]);

  const todayRow = today[0];
  const proteinG = todayRow?.proteinG ?? 0;
  const weightStr = todayRow?.weightKg;
  const weight = weightStr ? parseFloat(weightStr) : NaN;
  const proteinTarget = !isNaN(weight) ? Math.round(weight * 1.8) : 160;
  const proteinGap = Math.max(0, proteinTarget - proteinG);

  // Sleep average over last 7 nights
  const sleepNums = recentSleep.map((r) => parseFloat(r.sleepHours ?? "")).filter((n) => !isNaN(n));
  const sleepAvg = sleepNums.length ? sleepNums.reduce((a, b) => a + b, 0) / sleepNums.length : 0;

  const mrr = signedAgg[0]?.mrrSum ?? 0;

  // Today's lift session if any
  const trainingAction = todayHealth.find((a) => sessionForAction(a.title));
  const trainingSession = trainingAction ? sessionForAction(trainingAction.title) : null;

  // Pick the primary call-to-action
  type Cta = { label: string; href: string; emoji: React.ReactNode };
  let primary: Cta;
  const greet = GREETINGS[period][Math.floor(Math.random() * GREETINGS[period].length)];

  if (period === "morning" && trainingSession) {
    primary = { label: `Today's lift: ${trainingSession.title}`, href: "/training", emoji: <Dumbbell size={14} /> };
  } else if (proteinGap > 40) {
    primary = { label: `Protein gap — ${proteinGap}g to hit ${proteinTarget}g`, href: "/", emoji: <Beef size={14} /> };
  } else if (trainingAction && !trainingAction.lastDoneAt) {
    primary = { label: `Lock in: ${trainingSession?.title ?? trainingAction.title}`, href: "/training", emoji: <Dumbbell size={14} /> };
  } else if (mrr < 10000) {
    primary = { label: `Outreach + spec content`, href: "/content", emoji: <Briefcase size={14} /> };
  } else {
    primary = { label: `Clear Today`, href: "/", emoji: <ArrowRight size={14} /> };
  }

  const PeriodIcon = period === "morning" ? Sunrise : period === "night" ? Moon : Sun;

  return (
    <div
      className="card relative overflow-hidden p-5"
      style={{ background: "linear-gradient(135deg, rgba(209,250,110,0.10), rgba(209,250,110,0.02) 60%, rgba(20,20,22,0.6))" }}
    >
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative space-y-4">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
          <PeriodIcon size={12} strokeWidth={2.5} />
          {greet}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Protein" value={`${proteinG}g`} sub={`/ ${proteinTarget}g`} accent="#fb7185" />
          <Stat label="Sleep · 7d" value={sleepAvg ? sleepAvg.toFixed(1) : "—"} sub="hrs" accent="#a78bfa" />
          <Stat label="MRR" value={`$${mrr}`} sub="/ $10k" accent="#34d399" />
          <Stat label="Today" value={String(todayHealth.length)} sub="training" accent="#fbbf24" />
        </div>

        <Link
          href={primary.href}
          className="group flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm font-medium transition hover:bg-accent/10 active:scale-[0.99]"
        >
          <span className="inline-flex items-center gap-2 text-accent">{primary.emoji}{primary.label}</span>
          <ArrowRight size={14} className="text-accent transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-sub">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] text-sub tabular-nums">{sub}</div>
    </div>
  );
}
