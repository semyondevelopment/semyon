import { db, ensureDb } from "@/db/client";
import { goals, actions } from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { ArrowLeft, Plus, Rocket, ExternalLink } from "lucide-react";
import Link from "next/link";
import SetupNeeded from "@/components/SetupNeeded";
import { AREA_META } from "@/lib/areas";

export const revalidate = 30;

const STATUSES = ["planning", "building", "shipped", "paused", "archived"] as const;
const STATUS_COLOR: Record<string, string> = {
  planning: "#94a3b8",
  building: "#38bdf8",
  shipped:  "#34d399",
  paused:   "#fbbf24",
  archived: "#6b7280",
};

export default async function ProjectsPage() {
  try { await ensureDb(); }
  catch (e) { return <SetupNeeded error={e instanceof Error ? e.message : String(e)} />; }

  const meta = AREA_META.projects;

  const [projects, projectActions] = await Promise.all([
    db.select().from(goals).where(eq(goals.area, "projects")).orderBy(asc(goals.id)),
    db.select().from(actions).where(and(eq(actions.area, "projects"), eq(actions.status, "active"))).orderBy(asc(actions.nextDueAt)),
  ]);

  const buckets: Record<string, typeof projects> = { planning: [], building: [], shipped: [], paused: [], archived: [] };
  for (const p of projects) {
    const k = (p.projectStatus ?? "building") as keyof typeof buckets;
    (buckets[k] ?? buckets.building).push(p);
  }

  return (
    <div className="space-y-6">
      <Link href="/areas" className="inline-flex items-center gap-1.5 text-sm text-sub transition hover:text-ink">
        <ArrowLeft size={14} />Areas
      </Link>

      <header className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line" style={{ background: `${meta.accent}1f`, color: meta.accent }}>
            <Rocket size={28} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{meta.blurb}</div>
            <h1 className="mt-1 text-[36px] font-semibold leading-none tracking-tight">Projects</h1>
          </div>
        </div>
        <Link href="/capture?type=goal&area=projects" className="btn btn-accent gap-1.5"><Plus size={16} strokeWidth={2.5} />Add</Link>
      </header>

      {STATUSES.map((s) => {
        if (buckets[s].length === 0) return null;
        return (
          <section key={s} className="space-y-2">
            <h2 className="text-sm font-medium inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
              <span className="capitalize">{s}</span>
              <span className="text-sub tabular-nums">· {buckets[s].length}</span>
            </h2>
            <div className="space-y-2">
              {buckets[s].map((p) => (
                <Link href={`/goal/${p.id}`} key={p.id} className="card group block p-3 transition hover:border-sub active:scale-[0.99]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{p.title}</div>
                      {p.why && <div className="mt-0.5 text-[11px] text-sub line-clamp-1">{p.why}</div>}
                      {p.lessons && (
                        <div className="mt-1 rounded-md border border-line bg-bg/40 p-2 text-[11px] text-ink/85">
                          <span className="text-sub uppercase tracking-wide text-[9px]">Lesson · </span>
                          <span className="line-clamp-2">{p.lessons}</span>
                        </div>
                      )}
                    </div>
                    {p.shareUrl && (
                      <a href={p.shareUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-sub hover:text-ink">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {projects.length === 0 && (
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400">
            <Rocket size={26} />
          </div>
          <div className="mt-3 font-medium">No projects yet.</div>
          <div className="mt-1 text-sm text-sub">Add a project from + → Goal.</div>
        </div>
      )}
    </div>
  );
}
