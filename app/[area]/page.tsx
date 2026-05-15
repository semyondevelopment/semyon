import { db, ensureDb } from "@/db/client";
import { goals, actions, notes, milestones, people } from "@/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";
import { AREA_META, AREA_ORDER } from "@/lib/areas";
import GoalCard from "@/components/GoalCard";
import ActionRow from "@/components/ActionRow";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Area } from "@/db/schema";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import { Plus, CheckCheck, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  await ensureDb();
  const { area: areaParam } = await params;
  if (!AREA_ORDER.includes(areaParam as Area)) notFound();
  const area = areaParam as Area;
  const meta = AREA_META[area];

  const areaGoals = await db.select().from(goals).where(eq(goals.area, area)).orderBy(asc(goals.id));
  const goalIds = areaGoals.map((g) => g.id);

  let progress = new Map<number, { done: number; total: number }>();
  if (goalIds.length) {
    const ms = await db.select().from(milestones).where(sql`goal_id IN ${goalIds}`);
    for (const g of areaGoals) progress.set(g.id, { done: 0, total: 0 });
    for (const m of ms) {
      const p = progress.get(m.goalId)!;
      p.total += 1;
      if (m.doneAt) p.done += 1;
    }
  }

  const standaloneActions = await db.select().from(actions)
    .where(and(eq(actions.area, area), sql`goal_id IS NULL`, eq(actions.status, "active")))
    .orderBy(asc(actions.nextDueAt));

  const areaNotes = await db.select().from(notes).where(eq(notes.area, area)).orderBy(asc(notes.id));

  const areaPeople = area === "relationships" ? await db.select().from(people).orderBy(asc(people.id)) : [];

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>
      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line"
            style={{ background: `${meta.accent}1f`, color: meta.accent }}
          >
            <meta.Icon size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{meta.blurb}</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">{meta.label}</h1>
          </div>
        </div>
        <Link href={`/capture?area=${area}`} className="btn btn-accent gap-1.5"><Plus size={16} strokeWidth={2.5} />Add</Link>
      </header>

      {areaGoals.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Goals</h2>
          <StaggerList className="grid gap-3">
            {areaGoals.map((g) => (
              <StaggerItem key={g.id}><GoalCard g={g} progress={progress.get(g.id)} /></StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      {area === "relationships" && areaPeople.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">People</h2>
          <div className="space-y-2">
            {areaPeople.map((p) => {
              const daysSince = p.lastContactAt ? Math.floor((Date.now() / 1000 - p.lastContactAt) / 86400) : null;
              const overdue = daysSince === null || daysSince >= p.cadenceDays;
              return (
                <form key={p.id} action={async () => {
                  "use server";
                  const { logPersonContact } = await import("@/app/actions");
                  await logPersonContact(p.id);
                }} className="card flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm">{p.name}</div>
                    <div className="text-[11px] text-sub">{p.relationship || ""} · every {p.cadenceDays}d {daysSince !== null ? `· last ${daysSince}d ago` : "· never"}</div>
                  </div>
                  <button type="submit" className={`btn gap-1.5 ${overdue ? "btn-accent" : ""}`}><CheckCheck size={14} strokeWidth={2.5} />Logged</button>
                </form>
              );
            })}
          </div>
        </section>
      )}

      {standaloneActions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Recurring & one-offs</h2>
          <div className="space-y-2">
            {standaloneActions.map((a) => <ActionRow key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {areaNotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Notes & ideas</h2>
          <div className="space-y-2">
            {areaNotes.map((n) => (
              <div key={n.id} className="card p-3 text-sm whitespace-pre-wrap">{n.body}</div>
            ))}
          </div>
        </section>
      )}

      {areaGoals.length === 0 && standaloneActions.length === 0 && areaNotes.length === 0 && areaPeople.length === 0 && (
        <div className="card p-8 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-line"
            style={{ background: `${meta.accent}1a`, color: meta.accent }}
          >
            <meta.Icon size={26} strokeWidth={2} />
          </div>
          <div className="mt-3 font-medium">No {meta.label.toLowerCase()} yet.</div>
          <div className="mt-1 text-sm text-sub">Tap + Add to get started.</div>
        </div>
      )}
    </div>
  );
}
