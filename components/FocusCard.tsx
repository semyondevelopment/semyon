"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Goal } from "@/db/schema";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function FocusCard({ goal }: { goal: Goal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.05 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link
        href={`/goal/${goal.id}`}
        className="group relative block overflow-hidden rounded-2xl border border-accent/30 p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(209,250,110,0.20), rgba(209,250,110,0.04) 60%, rgba(20,20,22,0.6))",
          boxShadow: "0 20px 50px -25px rgba(209,250,110,0.45)",
        }}
      >
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent">
            <Sparkles size={12} strokeWidth={2.5} />
            Focus goal
          </div>
          <ArrowUpRight size={18} className="text-accent/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <div className="mt-2 text-xl font-semibold leading-tight">{goal.title}</div>
        {goal.why && <div className="mt-2 max-w-md text-sm text-ink/80">{goal.why}</div>}
        {(goal.targetMetric || goal.targetValue) && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-bg/60 px-3 py-1 text-xs">
            <span className="text-sub">{goal.targetMetric}</span>
            <span className="font-medium text-accent">{goal.targetValue || "—"}</span>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
