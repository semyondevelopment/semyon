import { db, ensureDb } from "@/db/client";
import { modules, assignments, books, studyTopics, notes } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { GraduationCap, BookOpen, Compass, ArrowLeft, AlarmClock, Plus, Pin } from "lucide-react";
import Link from "next/link";
import SetupNeeded from "@/components/SetupNeeded";
import {
  createModule, createAssignment, toggleAssignment, deleteAssignment, deleteModule, updateModule,
  createBook, updateBook, deleteBook,
  createTopic, deleteTopic,
} from "@/app/actions";
import { fmtDate } from "@/lib/scheduling";

export const dynamic = "force-dynamic";

export default async function StudyPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const [allModules, allAssignments, allBooks, allTopics, areaNotes] = await Promise.all([
    db.select().from(modules).orderBy(asc(modules.id)),
    db.select().from(assignments).orderBy(asc(assignments.dueDate)),
    db.select().from(books).orderBy(desc(books.pinned), asc(books.id)),
    db.select().from(studyTopics).orderBy(asc(studyTopics.id)),
    db.select().from(notes).where(eq(notes.area, "study")).orderBy(asc(notes.id)),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const upcoming = allAssignments
    .filter((a) => !a.doneAt && a.dueDate && a.dueDate > now - 86400)
    .slice(0, 5);

  const reading = allBooks.filter((b) => b.status === "reading");
  const queued = allBooks.filter((b) => b.status === "queued");
  const done = allBooks.filter((b) => b.status === "done");

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line" style={{ background: "#a78bfa1f", color: "#a78bfa" }}>
            <GraduationCap size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">Uni · books · fields of interest</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">Study</h1>
          </div>
        </div>
      </header>

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
            <AlarmClock size={14} className="text-rose-400" />
            Coming up
          </h2>
          <div className="space-y-2">
            {upcoming.map((a) => {
              const m = allModules.find((x) => x.id === a.moduleId);
              const days = a.dueDate ? Math.ceil((a.dueDate - now) / 86400) : null;
              const urgent = days !== null && days <= 7;
              return (
                <div key={a.id} className={`card flex items-center justify-between p-3 ${urgent ? "border-rose-500/40" : ""}`}>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{a.title}</div>
                    <div className="text-[11px] text-sub">{m?.code ?? m?.name ?? "—"} · {a.weightPct ? `${a.weightPct}% · ` : ""}due {fmtDate(a.dueDate ?? 0)}</div>
                  </div>
                  <div className={`text-xs tabular-nums ${urgent ? "text-rose-400" : "text-sub"}`}>{days! >= 0 ? `${days}d` : `${-days!}d late`}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
          <GraduationCap size={14} />
          Modules
        </h2>
        <div className="space-y-2">
          {allModules.map((m) => {
            const mas = allAssignments.filter((a) => a.moduleId === m.id);
            const doneN = mas.filter((a) => a.doneAt).length;
            const pct = mas.length ? Math.round((doneN / mas.length) * 100) : 0;
            return (
              <details key={m.id} className="card group p-3">
                <summary className="flex cursor-pointer items-center justify-between gap-2 list-none">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{m.name}</span>
                      {m.code && <span className="text-[11px] text-sub">{m.code}</span>}
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.color ?? "#a78bfa" }} />
                    </div>
                  </div>
                  <div className="text-xs text-sub tabular-nums shrink-0">{doneN}/{mas.length}{m.currentGrade ? ` · ${m.currentGrade}` : ""}</div>
                </summary>
                <div className="mt-3 space-y-2">
                  {mas.map((a) => (
                    <form
                      key={a.id}
                      action={async () => { "use server"; await toggleAssignment(a.id, !a.doneAt); }}
                      className="flex items-center gap-2 rounded-lg border border-line bg-bg/40 p-2"
                    >
                      <button type="submit" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${a.doneAt ? "border-accent bg-accent text-black" : "border-line text-transparent"}`}>✓</button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate ${a.doneAt ? "line-through text-sub" : ""}`}>{a.title}</div>
                        <div className="text-[11px] text-sub">{a.weightPct ? `${a.weightPct}%` : ""}{a.weightPct && a.dueDate ? " · " : ""}{a.dueDate ? `due ${fmtDate(a.dueDate)}` : ""}{a.grade ? ` · grade ${a.grade}` : ""}</div>
                      </div>
                    </form>
                  ))}
                  <form action={createAssignment} className="grid grid-cols-12 gap-2">
                    <input type="hidden" name="module_id" value={m.id} />
                    <input name="title" placeholder="New assignment…" required className="input col-span-6 text-sm" />
                    <input name="weight_pct" type="number" placeholder="%" className="input col-span-2 text-sm" />
                    <input name="due_date" type="date" className="input col-span-3 text-sm" />
                    <button className="btn col-span-1 px-2"><Plus size={12} /></button>
                  </form>
                  <div className="flex gap-2">
                    <form action={updateModule} className="flex flex-1 gap-1.5">
                      <input type="hidden" name="id" value={m.id} />
                      <input name="current_grade" defaultValue={m.currentGrade ?? ""} placeholder="Current grade" className="input flex-1 text-xs" />
                      <button className="btn text-xs">Save grade</button>
                    </form>
                    <form action={async () => { "use server"; await deleteModule(m.id); }}>
                      <button className="btn text-xs text-rose-400">Delete</button>
                    </form>
                  </div>
                </div>
              </details>
            );
          })}
          <form action={createModule} className="card grid grid-cols-12 gap-2 p-3">
            <input name="name" placeholder="Module name" required className="input col-span-6 text-sm" />
            <input name="code" placeholder="Code" className="input col-span-3 text-sm" />
            <input name="credits" type="number" placeholder="Cr" className="input col-span-2 text-sm" />
            <button className="btn btn-accent col-span-1 px-2"><Plus size={14} /></button>
          </form>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
          <BookOpen size={14} />
          Reading
        </h2>
        <div className="space-y-2">
          {reading.length > 0 && (
            <div className="space-y-2">
              <div className="label">Currently reading</div>
              {reading.map((b) => <BookRow key={b.id} b={b} />)}
            </div>
          )}
          {queued.length > 0 && (
            <div className="space-y-2">
              <div className="label">Queue</div>
              {queued.map((b) => <BookRow key={b.id} b={b} />)}
            </div>
          )}
          {done.length > 0 && (
            <details className="card p-3">
              <summary className="cursor-pointer text-xs text-sub">Finished · {done.length}</summary>
              <div className="mt-2 space-y-1">
                {done.map((b) => (
                  <div key={b.id} className="text-xs text-sub">✓ {b.title}{b.author ? ` — ${b.author}` : ""}</div>
                ))}
              </div>
            </details>
          )}
          <form action={createBook} className="card grid grid-cols-12 gap-2 p-3">
            <input name="title" placeholder="Book title" required className="input col-span-7 text-sm" />
            <input name="author" placeholder="Author" className="input col-span-4 text-sm" />
            <input name="pages_total" type="number" placeholder="Pages" className="input col-span-12 text-sm" />
            <button className="btn btn-accent col-span-12"><Plus size={14} />Add to queue</button>
          </form>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
          <Compass size={14} />
          Fields of interest
        </h2>
        <div className="space-y-2">
          {allTopics.map((t) => {
            const pct = t.estHours ? Math.min(100, Math.round(((t.hoursLogged ?? 0) / t.estHours) * 100)) : 0;
            return (
              <div key={t.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">{t.name}</div>
                  <form action={async () => { "use server"; await deleteTopic(t.id); }}>
                    <button className="text-[11px] text-sub hover:text-rose-400">×</button>
                  </form>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-sub">
                  <span className="tabular-nums">{t.hoursLogged ?? 0}h{t.estHours ? ` / ${t.estHours}h` : ""}</span>
                </div>
                {t.estHours ? (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color ?? "#a78bfa" }} />
                  </div>
                ) : null}
              </div>
            );
          })}
          <form action={createTopic} className="card grid grid-cols-12 gap-2 p-3">
            <input name="name" placeholder="Topic" required className="input col-span-9 text-sm" />
            <input name="est_hours" type="number" placeholder="hrs" className="input col-span-2 text-sm" />
            <button className="btn btn-accent col-span-1 px-2"><Plus size={14} /></button>
          </form>
        </div>
      </section>

      {areaNotes.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-sub">Notes</h2>
          <div className="space-y-2">
            {areaNotes.map((n) => (
              <div key={n.id} className="card p-3 text-sm whitespace-pre-wrap">{n.body}</div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BookRow({ b }: { b: { id: number; title: string; author: string | null; pagesDone: number; pagesTotal: number | null; status: string; pinned: boolean } }) {
  const pct = b.pagesTotal ? Math.min(100, Math.round((b.pagesDone / b.pagesTotal) * 100)) : 0;
  return (
    <details className="card p-3">
      <summary className="flex cursor-pointer items-center justify-between list-none gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {b.pinned && <Pin size={11} className="text-accent" />}
            <span className="text-sm font-medium truncate">{b.title}</span>
          </div>
          {b.author && <div className="text-[11px] text-sub">{b.author}</div>}
        </div>
        {b.pagesTotal && (
          <div className="text-xs text-sub tabular-nums shrink-0">{b.pagesDone}/{b.pagesTotal}</div>
        )}
      </summary>
      <div className="mt-2 space-y-2">
        {b.pagesTotal && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-violet-400" style={{ width: `${pct}%` }} />
          </div>
        )}
        <form action={updateBook} className="flex gap-1.5">
          <input type="hidden" name="id" value={b.id} />
          <input name="pages_done" type="number" defaultValue={b.pagesDone} placeholder="Pages" className="input flex-1 text-xs" />
          <select name="status" defaultValue={b.status} className="input text-xs">
            <option value="queued">queued</option>
            <option value="reading">reading</option>
            <option value="done">done</option>
            <option value="dropped">dropped</option>
          </select>
          <button className="btn text-xs">Save</button>
        </form>
        <div className="flex gap-2">
          <form action={updateBook}>
            <input type="hidden" name="id" value={b.id} />
            <input type="hidden" name="pinned" value={b.pinned ? "false" : "true"} />
            <button className="btn text-xs">{b.pinned ? "Unpin" : "Pin"}</button>
          </form>
          <form action={async () => { "use server"; await deleteBook(b.id); }}>
            <button className="btn text-xs text-rose-400">Delete</button>
          </form>
        </div>
      </div>
    </details>
  );
}
