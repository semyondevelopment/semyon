import { db } from "@/db/client";
import { setLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Trophy } from "lucide-react";

// Lifts whose 1-rep best we track as PRs.
const PR_LIFTS = [
  "Barbell Bench Press",
  "Back Squat",
  "Conventional Deadlift",
  "Standing Overhead Press",
  "Weighted Pull-up",
  "Weighted Chin-up",
  "Incline Barbell Press",
  "Front Squat",
  "Romanian Deadlift",
];

// Estimated 1-rep max (Epley): 1RM ≈ w × (1 + reps/30)
function e1rm(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

export default async function PRBoard() {
  const rows = await db.select().from(setLog).orderBy(desc(setLog.doneAt)).limit(500);
  const best: Record<string, { weight: number; reps: number; date: string; e1rm: number }> = {};
  for (const r of rows) {
    const w = parseFloat(r.weight ?? "");
    const reps = r.reps ?? 0;
    if (!w || !reps) continue;
    const est = e1rm(w, reps);
    const cur = best[r.exercise];
    if (!cur || est > cur.e1rm) {
      best[r.exercise] = { weight: w, reps, date: r.sessionDate, e1rm: est };
    }
  }
  const items = PR_LIFTS.map((name) => ({ name, pr: best[name] })).filter((x) => x.pr);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
        <Trophy size={14} className="text-amber-400" />
        Personal records
      </h2>
      <div className="card p-4">
        {items.length === 0 ? (
          <div className="text-xs text-sub">Log working sets during your lifts — PRs auto-track here.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map(({ name, pr }) => (
              <div key={name} className="rounded-xl border border-line bg-bg/40 p-3">
                <div className="text-[10px] uppercase tracking-wide text-sub truncate">{name}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {pr!.weight} <span className="text-xs text-sub">kg ×</span> {pr!.reps}
                </div>
                <div className="mt-0.5 text-[10px] text-sub tabular-nums">e1RM {pr!.e1rm.toFixed(1)} · {pr!.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
