"use client";
import { checkOffAction, deleteAction } from "@/app/actions";
import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { relativeDue } from "@/lib/scheduling";
import { AREA_META } from "@/lib/areas";
import type { Action, Area } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Check, Clock, X, Flame, Repeat } from "lucide-react";
import { AreaIcon } from "@/components/AreaBadge";

export default function ActionRow({ a, showArea = false }: { a: Action; showArea?: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [ring, setRing] = useState(false);
  const overdue = a.nextDueAt < Math.floor(Date.now() / 1000) - 60;
  const meta = AREA_META[a.area as Area];

  function celebrate(e: React.MouseEvent) {
    setRing(true);
    setTimeout(() => setRing(false), 600);
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const origin = { x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight };
    confetti({
      particleCount: 26, spread: 65, startVelocity: 28, ticks: 90, origin,
      colors: ["#d1fa6e", "#ffffff", "#a3e635", "#facc15"], scalar: 0.85,
      disableForReducedMotion: true,
    });
    if (navigator.vibrate) navigator.vibrate(10);
  }

  function handleDone(e: React.MouseEvent) {
    if (done || pending) return;
    celebrate(e);
    setDone(true);
    setTimeout(() => start(() => checkOffAction(a.id, "done")), 380);
  }

  return (
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
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
            <button
              aria-label="Snooze"
              className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
              onClick={() => start(() => checkOffAction(a.id, "snooze"))}
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
