import { db, ensureDb } from "@/db/client";
import { mindLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { todayKey } from "@/lib/dates";
import MindEntry from "@/components/MindEntry";
import Sparkline from "@/components/charts/Sparkline";
import { Brain, BookOpen } from "lucide-react";
import SetupNeeded from "@/components/SetupNeeded";

export const revalidate = 30;

export default async function MindPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const tkey = todayKey();
  const [todayRow] = await db.select().from(mindLog).where(eq(mindLog.dateKey, tkey));
  const recent = await db.select().from(mindLog).orderBy(desc(mindLog.dateKey)).limit(30);

  const moodSeries = recent.filter((r) => r.mood != null).reverse().map((r, i) => ({ x: i, y: r.mood as number, label: `${r.mood}/5` }));
  const energySeries = recent.filter((r) => r.energy != null).reverse().map((r, i) => ({ x: i, y: r.energy as number, label: `${r.energy}/5` }));

  const journalEntries = recent.filter((r) => r.journal || r.gratitude || r.stress);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">Inner state</div>
        <h1 className="mt-2 text-[40px] font-semibold leading-none tracking-tight">Mind</h1>
        <p className="mt-2 text-sm text-sub">2 minutes a day. The interior log.</p>
      </header>

      <MindEntry today={todayRow ?? null} />

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="label inline-flex items-center gap-1"><Brain size={11} /> Mood · 30d</div>
          <div className="mt-2">
            {moodSeries.length >= 2
              ? <Sparkline data={moodSeries} color="#60a5fa" height={70} />
              : <div className="text-xs text-sub">Log mood for 2+ days to see trend.</div>}
          </div>
        </div>
        <div className="card p-4">
          <div className="label">Energy · 30d</div>
          <div className="mt-2">
            {energySeries.length >= 2
              ? <Sparkline data={energySeries} color="#fbbf24" height={70} />
              : <div className="text-xs text-sub">Log energy for 2+ days to see trend.</div>}
          </div>
        </div>
      </div>

      {journalEntries.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
            <BookOpen size={14} />
            Recent entries
          </h2>
          <div className="space-y-2">
            {journalEntries.slice(0, 14).map((r) => (
              <div key={r.dateKey} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-wide text-sub">{r.dateKey}</div>
                  <div className="flex gap-1.5 text-[11px] text-sub">
                    {r.mood != null && <span className="chip">mood {r.mood}/5</span>}
                    {r.energy != null && <span className="chip">energy {r.energy}/5</span>}
                  </div>
                </div>
                {r.journal && <div className="text-sm whitespace-pre-wrap">{r.journal}</div>}
                {r.gratitude && (
                  <div className="text-xs text-sub"><span className="text-accent">Grateful:</span> {r.gratitude}</div>
                )}
                {r.stress && (
                  <div className="text-xs text-sub"><span className="text-rose-400">Stress:</span> {r.stress}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
