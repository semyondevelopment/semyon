import Link from "next/link";
import { AREA_META, AREA_ORDER } from "@/lib/areas";
import { db, ensureDb } from "@/db/client";
import { goals, actions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { StaggerList, StaggerItem } from "@/components/Stagger";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AreasIndex() {
  await ensureDb();
  // Two queries total instead of 14 — group counts in one trip per table.
  const [goalRows, actionRows] = await Promise.all([
    db.select({ area: goals.area, c: sql<number>`count(*)` }).from(goals).groupBy(goals.area),
    db.select({ area: actions.area, c: sql<number>`count(*)` }).from(actions).groupBy(actions.area),
  ]);
  const goalMap = new Map(goalRows.map((r) => [r.area, r.c]));
  const actionMap = new Map(actionRows.map((r) => [r.area, r.c]));
  const counts = AREA_ORDER.map((area) => ({
    area,
    goalCount: goalMap.get(area) ?? 0,
    actionCount: actionMap.get(area) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[40px] leading-none font-semibold tracking-tight">Areas</h1>
        <p className="mt-2 text-sm text-sub">Your life, mapped.</p>
      </header>
      <StaggerList className="grid grid-cols-2 gap-3">
        {counts.map(({ area, goalCount, actionCount }) => {
          const meta = AREA_META[area];
          return (
            <StaggerItem key={area}>
              <Link
                href={`/${area}`}
                className={`card group relative block overflow-hidden bg-gradient-to-br ${meta.tint} to-transparent p-4 transition active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-line"
                    style={{ background: `${meta.accent}1f`, color: meta.accent }}
                  >
                    <meta.Icon size={22} strokeWidth={2} />
                  </div>
                  <ArrowUpRight size={14} className="text-sub opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </div>
                <div className="mt-3 text-[15px] font-semibold">{meta.label}</div>
                <div className="mt-0.5 line-clamp-1 text-[11px] text-sub">{meta.blurb}</div>
                <div className="mt-3 flex gap-1.5 text-[11px] text-sub">
                  <span className="chip tabular-nums">{goalCount} goals</span>
                  <span className="chip tabular-nums">{actionCount} actions</span>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </div>
  );
}
