"use client";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { checkOffAction } from "@/app/actions";
import { Flame, ArrowUpRight, Check } from "lucide-react";
import type { Action, Goal } from "@/db/schema";

type Props = {
  action: Action;
  goal: Goal | null;
  doneToday: number;
  totalToday: number;
  streak: number;
};

export default function HeroCard({ action, goal, doneToday, totalToday, streak }: Props) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [completed, setCompleted] = useState(doneToday);

  const denom = Math.max(totalToday, 1);
  const pct = Math.min(100, Math.round((completed / denom) * 100));
  const R = 54;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;

  async function handleDone(e: React.MouseEvent) {
    if (done || pending) return;
    setDone(true);
    setCompleted((c) => c + 1);
    if (navigator.vibrate) navigator.vibrate(12);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 60, spread: 80, startVelocity: 36, ticks: 120,
      origin: { x: cx / window.innerWidth, y: cy / window.innerHeight },
      colors: ["#d1fa6e", "#ffffff", "#a3e635", "#facc15"], scalar: 1,
      disableForReducedMotion: true,
    });
    start(() => checkOffAction(action.id, "done"));
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="relative overflow-hidden rounded-3xl border border-accent/30 p-6"
      style={{
        background:
          "radial-gradient(600px 200px at 80% -20%, rgba(209,250,110,0.22), transparent 70%), linear-gradient(160deg, rgba(209,250,110,0.10), rgba(20,20,22,0.6))",
        boxShadow: "0 30px 80px -40px rgba(209,250,110,0.6)",
      }}
    >
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {goal ? (
            <Link
              href={`/goal/${goal.id}`}
              className="group inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-accent"
            >
              <span className="opacity-80">Toward</span>
              <span className="font-medium">{goal.title}</span>
              <ArrowUpRight size={11} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <div className="text-[10px] uppercase tracking-[0.18em] text-accent/80">Next step</div>
          )}

          <div className="mt-3 text-[28px] font-semibold leading-tight tracking-tight">
            {action.title}
          </div>

          {goal?.why && (
            <div className="mt-2 max-w-md text-sm text-ink/70 italic">"{goal.why}"</div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <motion.button
              onClick={handleDone}
              disabled={done || pending}
              whileTap={{ scale: 0.94 }}
              className="btn-accent btn inline-flex items-center gap-2 px-5 py-3 text-base font-semibold"
              style={{ borderRadius: 14 }}
            >
              <Check size={18} strokeWidth={2.8} />
              {done ? "Done" : "Mark done"}
            </motion.button>

            {streak > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1.5 text-xs">
                <span className="flicker text-base">🔥</span>
                <span className="tabular-nums font-medium">{streak}</span>
                <span className="text-sub">day streak</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
            <motion.circle
              cx="64" cy="64" r={R}
              stroke="#d1fa6e" strokeWidth="10" fill="none" strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - dash }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-2xl font-semibold tabular-nums leading-none">{completed}<span className="text-sub">/{totalToday}</span></div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-sub">today</div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
