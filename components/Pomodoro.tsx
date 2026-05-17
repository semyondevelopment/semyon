"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Timer, X } from "lucide-react";

const PRESETS = [
  { label: "25m", seconds: 25 * 60 },
  { label: "50m", seconds: 50 * 60 },
  { label: "5m break", seconds: 5 * 60 },
];

export default function Pomodoro() {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [target, setTarget] = useState(25 * 60);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([100, 60, 100]);
          if (typeof Audio !== "undefined") {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const o = ctx.createOscillator(); const g = ctx.createGain();
              o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
              g.gain.setValueAtTime(0.001, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.02);
              g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
              o.start(); o.stop(ctx.currentTime + 0.6);
            } catch {}
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [running]);

  function pick(t: number) {
    setSeconds(t); setTarget(t); setRunning(false);
  }
  function toggle() {
    if (seconds === 0) { setSeconds(target); }
    setRunning((r) => !r);
  }
  function reset() {
    setRunning(false); setSeconds(target);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = target > 0 ? 1 - seconds / target : 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card flex items-center gap-2 px-3 py-2 text-xs text-sub transition hover:text-ink"
        aria-label="Pomodoro timer"
      >
        <Timer size={14} />Focus timer
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur sm:items-center"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ y: 40, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="card relative w-full max-w-sm overflow-hidden p-6"
            >
              <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 text-sub hover:text-ink"><X size={16} /></button>
              <div className="text-[10px] uppercase tracking-[0.18em] text-accent">Focus</div>

              <div className="my-6 flex flex-col items-center">
                <div className="relative h-40 w-40">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#26262a" strokeWidth="6" />
                    <motion.circle
                      cx="50" cy="50" r="44" fill="none" stroke="#d1fa6e" strokeWidth="6" strokeLinecap="round"
                      pathLength={1}
                      animate={{ strokeDashoffset: 1 - pct }}
                      style={{ strokeDasharray: 1 }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-semibold tabular-nums">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</div>
                    <div className="text-[10px] uppercase tracking-wide text-sub">{running ? "running" : seconds === 0 ? "done" : "ready"}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.label} onClick={() => pick(p.seconds)} className={`rounded-md border px-2 py-1 text-xs transition ${target === p.seconds ? "border-accent/40 text-accent" : "border-line text-sub hover:text-ink"}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 flex justify-center gap-2">
                <button onClick={toggle} className="btn btn-accent gap-1.5">
                  {running ? <><Pause size={14} />Pause</> : <><Play size={14} />Start</>}
                </button>
                <button onClick={reset} className="btn gap-1.5"><RotateCcw size={14} />Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
