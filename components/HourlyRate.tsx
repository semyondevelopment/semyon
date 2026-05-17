"use client";
import { useState, useMemo } from "react";
import { Calculator } from "lucide-react";

export default function HourlyRate({ currentMrr }: { currentMrr: number }) {
  const [hoursPerWeek, setHoursPerWeek] = useState(20);
  const [clientCount, setClientCount] = useState(3);

  const monthlyHours = hoursPerWeek * 4.33;
  const perClientHours = monthlyHours / Math.max(1, clientCount);
  const effectiveRate = currentMrr > 0 ? currentMrr / monthlyHours : 0;
  const targetRevenue = 10000;
  const targetRate = targetRevenue / monthlyHours;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
        <Calculator size={14} />Effective hourly rate
      </h2>
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Hours / week" min={5} max={60} step={1} value={hoursPerWeek} onChange={setHoursPerWeek} suffix="hrs" />
          <Slider label="Active clients" min={0} max={20} step={1} value={clientCount} onChange={setClientCount} suffix="" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Now" value={effectiveRate ? `$${effectiveRate.toFixed(0)}/hr` : "—"} sub={currentMrr ? `$${currentMrr}/mo` : "no MRR yet"} />
          <Stat label="At $10k" value={`$${targetRate.toFixed(0)}/hr`} sub={`${monthlyHours.toFixed(0)}h/mo`} accent />
          <Stat label="Hrs/client" value={`${perClientHours.toFixed(1)}h`} sub={`${(perClientHours / 4.33).toFixed(1)}h/wk`} />
        </div>
        <div className="text-[11px] text-sub">
          {effectiveRate >= targetRate
            ? "You're already above your target rate — scale clients, not hours."
            : `Need ${(targetRate - effectiveRate).toFixed(0)}/hr more to hit $10k. Raise prices, drop low-tier clients, or productize.`}
        </div>
      </div>
    </section>
  );
}

function Slider({ label, min, max, step, value, onChange, suffix }: { label: string; min: number; max: number; step: number; value: number; onChange: (n: number) => void; suffix: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span className="text-sm tabular-nums">{value} {suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#34d399]"
      />
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-bg/40 p-3">
      <div className="label">{label}</div>
      <div className={`mt-0.5 text-lg font-semibold tabular-nums ${accent ? "text-emerald-400" : ""}`}>{value}</div>
      <div className="text-[10px] text-sub">{sub}</div>
    </div>
  );
}
