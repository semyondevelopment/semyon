"use client";
import { useTransition, useState } from "react";
import { bumpDaily, logWeight, logSleep, resetToday } from "@/app/actions";
import type { DailyLog } from "@/db/schema";
import { Beef, Flame, Scale, Plus, Minus, RotateCcw, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function DailyLogClient({
  today,
  latestWeightKg,
}: { today: DailyLog | null; latestWeightKg: string | null }) {
  const [pending, start] = useTransition();
  const [weightOpen, setWeightOpen] = useState(false);
  const protein = today?.proteinG ?? 0;
  const calories = today?.calories ?? 0;

  // Protein target: 1.8 g/kg from latest weight, fallback 160 g.
  const wKg = latestWeightKg ? parseFloat(latestWeightKg) : NaN;
  const proteinTarget = !isNaN(wKg) ? Math.round(wKg * 1.8) : 160;
  // Calorie target: maintenance ~ wKg*32, surplus +400 → ~wKg*32 + 400. Fallback 2800.
  const calTarget = !isNaN(wKg) ? Math.round(wKg * 32 + 400) : 2800;

  return (
    <div className="card relative overflow-hidden p-4">
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-rose-500/10 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className="text-sm font-medium">Fuel · today</div>
        <button
          onClick={() => start(() => resetToday())}
          className="inline-flex items-center gap-1 text-[11px] text-sub transition hover:text-ink"
          aria-label="Reset"
        >
          <RotateCcw size={11} />reset
        </button>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-3">
        <Counter
          icon={<Beef size={14} />}
          label="Protein"
          value={protein}
          target={proteinTarget}
          unit="g"
          accent="#fb7185"
          steps={[25, 40]}
          onBump={(d) => start(() => bumpDaily("protein_g", d))}
          disabled={pending}
        />
        <Counter
          icon={<Flame size={14} />}
          label="Calories"
          value={calories}
          target={calTarget}
          unit=""
          accent="#fbbf24"
          steps={[200, 500]}
          onBump={(d) => start(() => bumpDaily("calories", d))}
          disabled={pending}
        />
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-3">
        <InlineLog
          icon={<Scale size={14} className="text-sky-400" />}
          label="Weight"
          value={today?.weightKg ?? latestWeightKg ?? "—"}
          unit="kg"
          inputName="weight_kg"
          defaultValue={today?.weightKg ?? latestWeightKg ?? ""}
          placeholder="kg"
          onSubmit={(fd) => start(async () => { await logWeight(fd); })}
          isOpen={weightOpen}
          onOpenChange={setWeightOpen}
        />
        <SleepInline today={today} pending={pending} start={start} />
      </div>
    </div>
  );
}

function InlineLog({
  icon, label, value, unit, inputName, defaultValue, placeholder, onSubmit, isOpen, onOpenChange,
}: {
  icon: React.ReactNode; label: string; value: string; unit: string;
  inputName: string; defaultValue: string; placeholder: string;
  onSubmit: (fd: FormData) => void; isOpen: boolean; onOpenChange: (b: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-bg/40 px-3 py-2">
      <div className="inline-flex items-center gap-2 text-sm min-w-0">
        {icon}
        <span className="text-sub">{label}</span>
        <span className="text-ink tabular-nums truncate">{value}{value !== "—" ? ` ${unit}` : ""}</span>
      </div>
      {!isOpen ? (
        <button onClick={() => onOpenChange(true)} className="text-[11px] text-sub transition hover:text-ink shrink-0">log</button>
      ) : (
        <form
          action={(fd) => { onSubmit(fd); onOpenChange(false); }}
          className="flex items-center gap-1.5 shrink-0"
        >
          <input
            name={inputName}
            autoFocus
            defaultValue={defaultValue}
            placeholder={placeholder}
            inputMode="decimal"
            className="w-14 rounded-md border border-line bg-bg px-2 py-1 text-sm focus:outline-none focus:border-accent"
          />
          <button type="submit" className="rounded-md bg-accent px-2 py-1 text-xs font-medium text-black active:scale-95">✓</button>
          <button type="button" onClick={() => onOpenChange(false)} className="text-[11px] text-sub">×</button>
        </form>
      )}
    </div>
  );
}

function SleepInline({ today, pending, start }: { today: DailyLog | null; pending: boolean; start: (fn: () => void) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <InlineLog
      icon={<Moon size={14} className="text-violet-300" />}
      label="Sleep"
      value={today?.sleepHours ?? "—"}
      unit="hrs"
      inputName="sleep_hours"
      defaultValue={today?.sleepHours ?? ""}
      placeholder="hrs"
      onSubmit={(fd) => start(async () => { await logSleep(fd); })}
      isOpen={open}
      onOpenChange={setOpen}
    />
  );
}

function Counter({
  icon, label, value, target, unit, accent, steps, onBump, disabled,
}: {
  icon: React.ReactNode; label: string; value: number; target: number; unit: string; accent: string;
  steps: [number, number]; onBump: (d: number) => void; disabled: boolean;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div className="rounded-xl border border-line bg-bg/40 p-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-sub">
        <span style={{ color: accent }}>{icon}</span>{label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-sub">{unit} / {target}{unit}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <motion.div
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          className="h-full rounded-full"
          style={{ background: accent }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        <button disabled={disabled} onClick={() => onBump(steps[0])} className="inline-flex items-center gap-0.5 rounded-md border border-line px-2 py-1 text-[11px] transition hover:bg-line/40 active:scale-95">
          <Plus size={10} strokeWidth={2.5} />{steps[0]}
        </button>
        <button disabled={disabled} onClick={() => onBump(steps[1])} className="inline-flex items-center gap-0.5 rounded-md border border-line px-2 py-1 text-[11px] transition hover:bg-line/40 active:scale-95">
          <Plus size={10} strokeWidth={2.5} />{steps[1]}
        </button>
        <button disabled={disabled} onClick={() => onBump(-steps[0])} className="inline-flex items-center gap-0.5 rounded-md border border-line px-2 py-1 text-[11px] text-sub transition hover:bg-line/40 active:scale-95">
          <Minus size={10} strokeWidth={2.5} />{steps[0]}
        </button>
      </div>
    </div>
  );
}
