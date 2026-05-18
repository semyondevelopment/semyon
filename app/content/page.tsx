import { db, ensureDb } from "@/db/client";
import { actions, notes, goals } from "@/db/schema";
import { and, eq, lte, asc, desc } from "drizzle-orm";
import { startOfTodayUnix } from "@/lib/scheduling";
import ActionRow from "@/components/ActionRow";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import { Video, Lightbulb, Target, Send, ArrowUpRight, Briefcase } from "lucide-react";
import Link from "next/link";
import QuickAdd from "@/components/QuickAdd";
import { leads as leadsT } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  await ensureDb();
  const cutoff = startOfTodayUnix();

  const [dueMoney, moneyNotes, moneyGoals, mrrAgg, leadAgg] = await db.batch([
    db.select().from(actions)
      .where(and(eq(actions.status, "active"), eq(actions.area, "money"), lte(actions.nextDueAt, cutoff)))
      .orderBy(asc(actions.nextDueAt)),
    db.select().from(notes).where(eq(notes.area, "money")).orderBy(desc(notes.id)),
    db.select().from(goals).where(eq(goals.area, "money")).orderBy(asc(goals.id)),
    db.select({ mrrSum: sql<number>`COALESCE(SUM(${leadsT.mrr}), 0)` }).from(leadsT).where(eq(leadsT.status, "signed")),
    db.select({ activeLeads: sql<number>`COUNT(*)` }).from(leadsT),
  ]);
  const focusGoal = moneyGoals.find((g) => g.pinned) ?? moneyGoals[0];
  const mrrSum = mrrAgg[0].mrrSum;
  const activeLeads = leadAgg[0].activeLeads;

  const buckets = {
    create:   dueMoney.filter((a) => /film|post|edit|spec|content/i.test(a.title)),
    outreach: dueMoney.filter((a) => /outreach|dm|email|follow|call|pipeline|sales|mrr/i.test(a.title)),
    deliver:  dueMoney.filter((a) => /deliver|client/i.test(a.title)),
  };
  const claimed = new Set([...buckets.create, ...buckets.outreach, ...buckets.deliver].map((a) => a.id));
  const other = dueMoney.filter((a) => !claimed.has(a.id));

  const date = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] text-sub">{date}</div>
        <h1 className="mt-2 text-[40px] font-semibold leading-none tracking-tight">Content</h1>
        <div className="mt-2 text-sm text-sub">Sit down, hit record, send the next message.</div>
      </header>

      <Link href="/pipeline" className="card group flex items-center gap-3 p-4 transition hover:border-emerald-500/40 active:scale-[0.99]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <Briefcase size={20} />
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-[0.12em] text-sub">Sales pipeline</div>
          <div className="text-sm font-medium">${mrrSum.toLocaleString()} <span className="text-sub font-normal">/ $10,000 MRR</span></div>
          <div className="text-[11px] text-sub">{activeLeads} leads tracked</div>
        </div>
        <ArrowUpRight size={16} className="text-sub transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-400" />
      </Link>

      {focusGoal && (
        <Link
          href={`/goal/${focusGoal.id}`}
          className="group relative block overflow-hidden rounded-2xl border border-emerald-500/30 p-5"
          style={{
            background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.04) 60%, rgba(20,20,22,0.6))",
            boxShadow: "0 20px 50px -25px rgba(52,211,153,0.45)",
          }}
        >
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-emerald-400">
              <Target size={12} strokeWidth={2.5} />North-star goal
            </div>
            <ArrowUpRight size={18} className="text-emerald-400/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <div className="mt-2 text-xl font-semibold leading-tight">{focusGoal.title}</div>
          {focusGoal.targetValue && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-bg/60 px-3 py-1 text-xs">
              <span className="text-sub">{focusGoal.targetMetric}</span>
              <span className="font-medium text-emerald-400">{focusGoal.targetValue}</span>
            </div>
          )}
        </Link>
      )}

      {buckets.create.length > 0 && (
        <Section title="Film & post" Icon={Video}>
          <StaggerList className="space-y-2">
            {buckets.create.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
          </StaggerList>
        </Section>
      )}

      {buckets.outreach.length > 0 && (
        <Section title="Outreach & pipeline" Icon={Send}>
          <StaggerList className="space-y-2">
            {buckets.outreach.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
          </StaggerList>
        </Section>
      )}

      {buckets.deliver.length > 0 && (
        <Section title="Client delivery" Icon={Target}>
          <StaggerList className="space-y-2">
            {buckets.deliver.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
          </StaggerList>
        </Section>
      )}

      {other.length > 0 && (
        <Section title="Other">
          <StaggerList className="space-y-2">
            {other.map((a) => <StaggerItem key={a.id}><ActionRow a={a} /></StaggerItem>)}
          </StaggerList>
        </Section>
      )}

      <Section title="Idea bank" Icon={Lightbulb}>
        <QuickAdd area="money" placeholder="New content idea / niche / hook…" />
        <div className="space-y-2 mt-2">
          {moneyNotes.map((n) => (
            <div key={n.id} className="card whitespace-pre-wrap p-4 text-sm">{n.body}</div>
          ))}
        </div>
      </Section>

      {dueMoney.length === 0 && (
        <div className="card p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <Video size={26} strokeWidth={2} />
          </div>
          <div className="mt-3 font-medium">No content tasks for today.</div>
          <div className="mt-1 text-sm text-sub">Plan tomorrow — open the focus goal.</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, Icon, children }: { title: string; Icon?: any; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="inline-flex items-center gap-2 text-sm font-medium text-sub">
        {Icon && <Icon size={14} />}
        {title}
      </h2>
      {children}
    </section>
  );
}
