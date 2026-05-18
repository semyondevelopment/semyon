"use client";
import { checkOffAction, deleteAction, snoozeAction, undoLastCheckOff } from "@/app/actions";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { relativeDue } from "@/lib/scheduling";
import { AREA_META } from "@/lib/areas";
import type { Action, Area } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, X, Flame, Repeat, Zap, Undo2 } from "lucide-react";
import { AreaIcon } from "@/components/AreaBadge";

const SNOOZE_OPTIONS = [
  { label: "tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "next week", days: 7 },
];

export default function ActionRow({ a, showArea = false }: { a: Action; showArea?: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [ring, setRing] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const overdue = a.nextDueAt < Math.floor(Date.now() / 1000) - 60;
  const meta = AREA_META[a.area as Area];

  async function celebrate(e: React.MouseEvent) {
    setRing(true);
    setTimeout(() => setRing(false), 600);
    if (navigator.vibrate) navigator.vibrate(10);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 26, spread: 65, startVelocity: 28, ticks: 90, origin,
      colors: ["#d1fa6e", "#ffffff", "#a3e635", "#facc15"], scalar: 0.85,
      disableForReducedMotion: true,
    });
  }

  function handleDone(e: React.MouseEvent) {
    if (done || pending) return;
    celebrate(e);
    setDone(true);
    setShowUndo(true);
    start(() => checkOffAction(a.id, "done"));
    setTimeout(() => setShowUndo(false), 6000);
  }

  function handleSnooze(days: number) {
    setSnoozeOpen(false);
    setDone(true);
    start(() => snoozeAction(a.id, days));
  }

  function handleUndo() {
    setShowUndo(false);
    setDone(false);
    start(() => undoLastCheckOff(a.id));
  }

  return (
    <>
      <AnimatePresence initial={false}>
        {!done && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.28 } }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            whileTap={{ scale: 0.985 }}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border border-line bg-panel/80 p-3 backdrop-blur",
              pending && "opacity-60",
            )}
          >
            <button
              aria-label="Mark done"
              onClick={handleDone}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-line text-transparent transition hover:border-accent hover:bg-accent/10 hover:text-accent active:scale-90"
            >
              <Check size={16} strokeWidth={3} />
              {ring && <span className="pop-ring" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] leading-tight">{a.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-sub">
                {showArea && meta && (
                  <span className="chip inline-flex items-center gap-1"><AreaIcon area={a.area as Area} size={11} />{meta.label}</span>
                )}
                <span className={cn("chip inline-flex items-center gap-1", overdue && "border-accent/40 text-accent")}>
                  <Clock size={11} strokeWidth={2} />{relativeDue(a.nextDueAt)}
                </span>
                {a.cadence !== "once" && (
                  <span className="chip inline-flex items-center gap-1">
                    <Repeat size={11} strokeWidth={2} />
                    {a.cadence}{a.cadence === "custom" && a.intervalDays ? ` ${a.intervalDays}d` : ""}
                  </span>
                )}
                {a.streak > 0 && (
                  <span className="chip inline-flex items-center gap-1 text-accent border-accent/30">
                    <Flame size={11} strokeWidth={2.2} className="flicker" />{a.streak}
                  </span>
                )}
                {a.energy && (
                  <span className="chip inline-flex items-center gap-1">
                    <Zap size={10} strokeWidth={2.2} className={a.energy === "high" ? "text-amber-400" : a.energy === "med" ? "text-sky-400" : "text-sub"} />
                    {a.energy}
                  </span>
                )}
              </div>
            </div>
            <div className="relative flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
              <button
                aria-label="Snooze"
                className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
                onClick={() => setSnoozeOpen((s) => !s)}
              >
                <Clock size={14} strokeWidth={2} />
              </button>
              <button
                aria-label="Delete"
                className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
                onClick={() => { if (confirm("Delete this action?")) start(() => deleteAction(a.id)); }}
              >
                <X size={14} strokeWidth={2} />
              </button>
              <AnimatePresence>
                {snoozeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute right-0 top-full z-20 mt-1 flex flex-col gap-1 rounded-xl border border-line bg-bg/95 p-1.5 shadow-xl backdrop-blur"
                  >
                    {SNOOZE_OPTIONS.map((o) => (
                      <button
                        key={o.days}
                        onClick={() => handleSnooze(o.days)}
                        className="rounded-md px-3 py-1.5 text-xs text-left text-sub transition hover:bg-line/40 hover:text-ink"
                      >
                        {o.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 md:bottom-6"
            role="status"
          >
            <button
              onClick={handleUndo}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-bg/90 px-4 py-2 text-xs font-medium text-ink shadow-xl backdrop-blur transition hover:bg-bg active:scale-95"
            >
              <Undo2 size={12} className="text-accent" />Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
