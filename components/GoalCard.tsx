"use client";
import Link from "next/link";
import type { Goal } from "@/db/schema";
import { AREA_META } from "@/lib/areas";
import type { Area } from "@/db/schema";
import { motion } from "framer-motion";
import { Pin, ArrowUpRight } from "lucide-react";

export default function GoalCard({ g, progress }: { g: Goal; progress?: { done: number; total: number } }) {
  const meta = AREA_META[g.area as Area];
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : null;
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}>
      <Link href={`/goal/${g.id}`} className="group card block p-4 transition hover:border-sub/70">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line"
            style={{ background: `${meta.accent}1a`, color: meta.accent }}
          >
            <meta.Icon size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-sub">
              <span>{meta.label}</span>
              {g.pinned && (
                <span className="inline-flex items-center gap-0.5 text-accent">
                  <Pin size={9} strokeWidth={2.5} />Focus
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[15px] font-medium leading-tight">{g.title}</div>
            {g.targetMetric && (
              <div className="mt-0.5 text-xs text-sub">
                {g.targetMetric}: <span className="text-ink">{g.targetValue || "—"}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-xs text-sub">
            {pct !== null && <span className="tabular-nums">{pct}%</span>}
            <ArrowUpRight size={14} className="opacity-50 transition group-hover:opacity-100" />
          </div>
        </div>
        {pct !== null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: 0.05 }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${meta.accent}, #d1fa6e)` }}
            />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
