"use client";
import { useState, useTransition } from "react";
import { logSet } from "@/app/actions";
import type { SetLog } from "@/db/schema";
import { Plus, X, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  actionId: number;
  exercise: string;
  targetSetsText: string;             // e.g. "4 × 4–6 @ RPE 8"
  todaySets: SetLog[];                // sets already logged today for this exercise
  lastSession?: { date: string; sets: SetLog[] } | null;
};

function parseTargetSetCount(text: string): number {
  const m = text.match(/^(\d+)\s*[×x]/);
  return m ? Math.min(8, Math.max(1, parseInt(m[1], 10))) : 3;
}

export default function ExerciseLogger({ actionId, exercise, targetSetsText, todaySets, lastSession }: Props) {
  const target = parseTargetSetCount(targetSetsText);
  const existing = new Map(todaySets.map((s) => [s.setIndex, s]));
  const initialCount = Math.max(target, todaySets.length);
  const [rowCount, setRowCount] = useState(initialCount);
  const [pending, start] = useTransition();
  const [savedFlash, setSavedFlash] = useState<number | null>(null);

  function submit(idx: number, fd: FormData) {
    fd.set("actionId", String(actionId));
    fd.set("exercise", exercise);
    fd.set("setIndex", String(idx));
    start(async () => {
      await logSet(fd);
      setSavedFlash(idx);
      setTimeout(() => setSavedFlash((c) => (c === idx ? null : c)), 600);
    });
  }

  return (
    <div className="mt-2 space-y-1.5">
      {lastSession && lastSession.sets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-sub">
          <History size={10} />
          <span className="uppercase tracking-wide">Last ({lastSession.date}):</span>
          {lastSession.sets.map((s) => (
            <span key={s.id} className="chip">
              {s.weight ?? "—"}{s.weight ? "kg" : ""} × {s.reps ?? "—"}{s.rpe ? ` @${s.rpe}` : ""}
            </span>
          ))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {Array.from({ length: rowCount }).map((_, i) => {
          const idx = i + 1;
          const prior = existing.get(idx);
          return (
            <motion.form
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onBlur={(e) => {
                const fd = new FormData(e.currentTarget);
                submit(idx, fd);
              }}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                submit(idx, fd);
              }}
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition ${
                savedFlash === idx ? "border-accent/60 bg-accent/5" : "border-line bg-bg/40"
              }`}
            >
              <span className="w-5 text-center text-[11px] font-medium text-sub tabular-nums">{idx}</span>
              <input
                name="weight"
                defaultValue={prior?.weight ?? ""}
                placeholder="kg"
                inputMode="decimal"
                className="w-16 rounded-md bg-transparent px-1.5 py-1 text-sm placeholder:text-sub/60 focus:outline-none focus:bg-line/30"
              />
              <span className="text-sub">×</span>
              <input
                name="reps"
                defaultValue={prior?.reps ?? ""}
                placeholder="reps"
                inputMode="numeric"
                className="w-14 rounded-md bg-transparent px-1.5 py-1 text-sm placeholder:text-sub/60 focus:outline-none focus:bg-line/30"
              />
              <input
                name="rpe"
                defaultValue={prior?.rpe ?? ""}
                placeholder="RPE"
                inputMode="decimal"
                className="w-12 rounded-md bg-transparent px-1.5 py-1 text-sm placeholder:text-sub/60 focus:outline-none focus:bg-line/30"
              />
              <button type="submit" className="sr-only">Save</button>
              {rowCount > 1 && (
                <button
                  type="button"
                  aria-label="Remove set"
                  onClick={() => setRowCount((c) => Math.max(1, c - 1))}
                  className="ml-auto rounded-md p-1 text-sub transition hover:bg-line/40 hover:text-ink"
                >
                  <X size={12} />
                </button>
              )}
            </motion.form>
          );
        })}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setRowCount((c) => c + 1)}
        disabled={pending}
        className="mt-1 inline-flex items-center gap-1 text-[11px] text-sub transition hover:text-ink"
      >
        <Plus size={11} strokeWidth={2.5} />add set
      </button>
    </div>
  );
}
