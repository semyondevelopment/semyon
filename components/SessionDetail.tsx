"use client";
import { motion } from "framer-motion";
import { checkOffAction } from "@/app/actions";
import { useState, useTransition } from "react";
import type { Action, SetLog } from "@/db/schema";
import type { Session } from "@/lib/program";
import { Check, Clock, Repeat, Flame, Sparkles } from "lucide-react";
import { relativeDue } from "@/lib/scheduling";
import ExerciseLogger from "@/components/ExerciseLogger";

const TYPE_TINT: Record<Session["type"], string> = {
  lift: "from-rose-500/20",
  muay: "from-orange-500/20",
  bjj:  "from-violet-500/20",
  run:  "from-sky-500/20",
};
const TYPE_ACCENT: Record<Session["type"], string> = {
  lift: "#fb7185",
  muay: "#fb923c",
  bjj:  "#a78bfa",
  run:  "#38bdf8",
};

export default function SessionDetail({
  action,
  session,
  todayByExercise,
  lastByExercise,
}: {
  action: Action;
  session: Session;
  todayByExercise: Record<string, SetLog[]>;
  lastByExercise: Record<string, { date: string; sets: SetLog[] } | null>;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const accent = TYPE_ACCENT[session.type];

  async function complete(e: React.MouseEvent) {
    if (done || pending) return;
    if (navigator.vibrate) navigator.vibrate(20);
    setDone(true);
    setTimeout(() => start(() => checkOffAction(action.id, "done")), 380);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 60, spread: 80, startVelocity: 36, ticks: 110,
      origin: { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight },
      colors: ["#d1fa6e", accent, "#ffffff", "#facc15"],
      scalar: 0.95,
      disableForReducedMotion: true,
    });
  }

  const isLift = session.type === "lift";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`card relative overflow-hidden bg-gradient-to-br ${TYPE_TINT[session.type]} to-transparent`}
    >
      <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl" style={{ background: `${accent}33` }} />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]" style={{ color: accent }}>
              <Sparkles size={12} strokeWidth={2.5} />
              Today's session
            </div>
            <h2 className="mt-1 text-2xl font-semibold leading-tight">{session.title}</h2>
            <div className="mt-1 text-sm text-ink/80">{session.summary}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-sub">
              <span className="chip inline-flex items-center gap-1"><Clock size={11} />{session.duration}</span>
              <span className="chip inline-flex items-center gap-1"><Repeat size={11} />{action.cadence}</span>
              <span className="chip">{relativeDue(action.nextDueAt)}</span>
              {action.streak > 0 && (
                <span className="chip inline-flex items-center gap-1 border-accent/30 text-accent">
                  <Flame size={11} className="flicker" />{action.streak}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {session.blocks.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, type: "spring", stiffness: 300, damping: 24 }}
              className="rounded-xl border border-line bg-bg/40 p-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm font-medium">{b.name}</div>
                <div className="shrink-0 text-xs tabular-nums" style={{ color: accent }}>{b.sets}</div>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-sub">
                {b.rest && <span>rest {b.rest}</span>}
                {b.notes && <span className="opacity-90">· {b.notes}</span>}
              </div>
              {isLift && (
                <ExerciseLogger
                  actionId={action.id}
                  exercise={b.name}
                  targetSetsText={b.sets}
                  todaySets={todayByExercise[b.name] ?? []}
                  lastSession={lastByExercise[b.name] ?? null}
                />
              )}
            </motion.div>
          ))}
        </div>

        {session.cues && session.cues.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="label">Cues</div>
            <ul className="space-y-0.5 text-xs text-sub">
              {session.cues.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </div>
        )}

        <button
          onClick={complete}
          disabled={done || pending}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-black shadow-[0_10px_30px_-10px_rgba(209,250,110,0.7)] transition active:scale-[0.98] disabled:opacity-60"
        >
          <Check size={18} strokeWidth={3} />
          {done ? "Done!" : "Mark session complete"}
        </button>
      </div>
    </motion.div>
  );
}
