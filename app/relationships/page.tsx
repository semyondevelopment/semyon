import { db, ensureDb } from "@/db/client";
import { people } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ArrowLeft, Plus, Cake, Users } from "lucide-react";
import Link from "next/link";
import SetupNeeded from "@/components/SetupNeeded";
import PersonCard from "@/components/PersonCard";
import { AREA_META } from "@/lib/areas";

export const revalidate = 30;

function daysUntilBirthday(mmdd: string | null): number | null {
  if (!mmdd) return null;
  const m = mmdd.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10) - 1;
  const day = parseInt(m[2], 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), month, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month, day);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export default async function RelationshipsPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const meta = AREA_META.relationships;
  const all = await db.select().from(people).orderBy(asc(people.id));

  const upcomingBirthdays = all
    .map((p) => ({ p, days: daysUntilBirthday(p.birthday ?? null) }))
    .filter((x): x is { p: typeof all[number]; days: number } => x.days !== null && x.days <= 30)
    .sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            <Users size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{meta.blurb}</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">Relationships</h1>
          </div>
        </div>
        <Link href="/capture?type=person&area=relationships" className="btn btn-accent gap-1.5"><Plus size={16} strokeWidth={2.5} />Add</Link>
      </header>

      {upcomingBirthdays.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
            <Cake size={14} className="text-pink-400" />Birthdays · next 30 days
          </h2>
          <div className="space-y-2">
            {upcomingBirthdays.map(({ p, days }) => (
              <div key={p.id} className="card flex items-center justify-between p-3">
                <div>
                  <div className="text-sm">{p.name}</div>
                  <div className="text-[11px] text-sub">{p.birthday} · {p.relationship}</div>
                </div>
                <div className={`text-xs tabular-nums ${days <= 7 ? "text-pink-400" : "text-sub"}`}>
                  {days === 0 ? "today!" : days === 1 ? "tomorrow" : `in ${days}d`}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub">People</h2>
        <div className="space-y-2">
          {all.map((p) => <PersonCard key={p.id} person={p} />)}
        </div>
      </section>
    </div>
  );
}
