import { db, ensureDb } from "@/db/client";
import { goals, milestones, actions, actionLog } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { AREA_META } from "@/lib/areas";
import type { Area } from "@/db/schema";
import ActionRow from "@/components/ActionRow";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAction, createMilestone, toggleMilestone, pinGoal, deleteGoal } from "@/app/actions";
import { fmtDate } from "@/lib/scheduling";
import { ArrowLeft, Pin, Trash2, Plus, Check, Target, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GoalPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureDb();
  const { id } = await params;
  const goalId = parseInt(id, 10);
  const [g] = await db.select().from(goals).where(eq(goals.id, goalId));
  if (!g) notFound();
  const meta = AREA_META[g.area as Area];

  const ms = await db.select().from(milestones).where(eq(milestones.goalId, goalId)).orderBy(asc(milestones.order), asc(milestones.id));
  const acts = await db.select().from(actions).where(eq(actions.goalId, goalId)).orderBy(asc(actions.nextDueAt));
  const log = await db.select().from(actionLog).orderBy(desc(actionLog.doneAt)).limit(10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link href={`/${g.area}`} className="inline-flex items-center gap-1.5 text-sub transition hover:text-ink">
          <ArrowLeft size={14} />{meta?.label}
        </Link>
        <div className="flex gap-2">
          <form action={async () => { "use server"; await pinGoal(g.id, !g.pinned); }}>
            <button className="btn gap-1.5"><Pin size={13} strokeWidth={2} />{g.pinned ? "Unpin" : "Pin"}</button>
          </form>
          <form action={async () => { "use server"; await deleteGoal(g.id); }}>
            <button className="btn gap-1.5 text-sub"><Trash2 size={13} strokeWidth={2} />Delete</button>
          </form>
        </div>
      </div>

      <header className="flex items-start gap-3">
        {meta && (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-line"
            style={{ background: `${meta.accent}1f`, color: meta.accent }}
          >
            <meta.Icon size={26} strokeWidth={2} />
          </div>
        )}
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-sub">
            <span>{meta?.label}</span>
            {g.pinned && <span className="inline-flex items-center gap-0.5 text-accent"><Pin size={9} strokeWidth={2.5} />Focus</span>}
          </div>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight">{g.title}</h1>
        {g.why && (
          <div className="mt-3 card p-4">
            <div className="label">Why</div>
            <div className="mt-1 text-sm whitespace-pre-wrap">{g.why}</div>
          </div>
        )}
          {(g.targetMetric || g.targetDate) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {g.targetMetric && (
                <span className="chip inline-flex items-center gap-1">
                  <Target size={11} strokeWidth={2} />{g.targetMetric}: {g.targetValue || "—"}
                </span>
              )}
              {g.targetDate && (
                <span className="chip inline-flex items-center gap-1">
                  <Calendar size={11} strokeWidth={2} />by {fmtDate(g.targetDate)}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub">Milestones</h2>
        <div className="space-y-2">
          {ms.map((m) => (
            <form key={m.id} action={async () => { "use server"; await toggleMilestone(m.id, !m.doneAt); }}
                  className="card flex items-center gap-3 p-3">
              <button type="submit" aria-label="toggle" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition active:scale-90 ${m.doneAt ? "border-accent bg-accent text-black" : "border-line text-transparent hover:border-accent/60"}`}>
                <Check size={14} strokeWidth={3} />
              </button>
              <div className={`text-sm flex-1 ${m.doneAt ? "line-through text-sub" : ""}`}>{m.title}</div>
            </form>
          ))}
        </div>
        <form action={createMilestone} className="flex gap-2">
          <input type="hidden" name="goalId" value={g.id} />
          <input name="title" placeholder="New milestone…" className="input" />
          <button className="btn gap-1.5"><Plus size={14} strokeWidth={2.5} />Add</button>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub">Actions</h2>
        <div className="space-y-2">
          {acts.map((a) => <ActionRow key={a.id} a={a} />)}
        </div>
        <form action={createAction} className="card p-3 space-y-2">
          <input type="hidden" name="goalId" value={g.id} />
          <input type="hidden" name="area" value={g.area} />
          <input name="title" placeholder="New action…" className="input" required />
          <div className="flex gap-2">
            <select name="cadence" className="input flex-1" defaultValue="weekly">
              <option value="once">once</option>
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="custom">custom (days)</option>
            </select>
            <input name="intervalDays" type="number" min="1" placeholder="every N days" className="input w-32" />
            <button className="btn btn-accent gap-1.5"><Plus size={14} strokeWidth={2.5} />Add</button>
          </div>
        </form>
      </section>

      {log.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Recent activity</h2>
          <div className="space-y-1 text-xs text-sub">
            {log.map((l) => <div key={l.id}>{fmtDate(l.doneAt)} — {l.outcome}</div>)}
          </div>
        </section>
      )}
    </div>
  );
}
