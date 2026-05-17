import { db, ensureDb } from "@/db/client";
import { actions, people } from "@/db/schema";
import { and, eq, lte, asc, inArray } from "drizzle-orm";
import { startOfTodayUnix } from "@/lib/scheduling";
import ActionRow from "@/components/ActionRow";
import Link from "next/link";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import QuickAdd from "@/components/QuickAdd";
import { Users } from "lucide-react";
import { AREA_META } from "@/lib/areas";
import DailyLog from "@/components/DailyLog";
import SetupNeeded from "@/components/SetupNeeded";

export const dynamic = "force-dynamic";

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
    due = await db.select().from(actions)
      .where(and(
        eq(actions.status, "active"),
        lte(actions.nextDueAt, cutoff),
        inArray(actions.area, ["tasks", "habits", "study", "projects"]),
      ))
      .orderBy(asc(actions.nextDueAt));
    allPeople = await db.select().from(people);
  } catch (e: unknown) {
    return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />;
  }

  const tasks = due.filter((a) => a.area === "tasks" || a.area === "projects" || a.area === "study");
  const habits = due.filter((a) => a.area === "habits");

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

      <QuickAdd area="tasks" placeholder="Add a task for today…" />

      <DailyLog />

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

      {total === 0 && (
        <div className="card p-8 text-center">
          <div className="text-lg font-medium">Clean slate.</div>
          <div className="mt-1 text-sm text-sub">Add a task above, or rest.</div>
        </div>
      )}
    </div>
  );
}
