"use client";
import { saveMind } from "@/app/actions";
import { useTransition, useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { MindLog } from "@/db/schema";

export default function MindEntry({ today }: { today: MindLog | null }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [mood, setMood] = useState<number | null>(today?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(today?.energy ?? null);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      action={(fd) => {
        if (mood != null) fd.set("mood", String(mood));
        if (energy != null) fd.set("energy", String(energy));
        start(async () => { await saveMind(fd); setSaved(true); setTimeout(() => setSaved(false), 1500); });
      }}
      className="card relative overflow-hidden p-5"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Rating label="Mood" value={mood} onChange={setMood} accent="#60a5fa" />
          <Rating label="Energy" value={energy} onChange={setEnergy} accent="#fbbf24" />
        </div>
        <Field label="Today, in 2 sentences">
          <textarea name="journal" defaultValue={today?.journal ?? ""} rows={3} placeholder="What happened. What I learned." className="input resize-none" />
        </Field>
        <Field label="Grateful for">
          <textarea name="gratitude" defaultValue={today?.gratitude ?? ""} rows={2} placeholder="Three things." className="input resize-none" />
        </Field>
        <Field label="On my mind / stress">
          <textarea name="stress" defaultValue={today?.stress ?? ""} rows={2} placeholder="Friction, worries, what's grinding." className="input resize-none" />
        </Field>
        <button disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black transition active:scale-95 disabled:opacity-60">
          <Check size={14} strokeWidth={3} />
          {saved ? "Saved" : today ? "Update" : "Save"}
        </button>
      </div>
    </motion.form>
  );
}

function Rating({ label, value, onChange, accent }: { label: string; value: number | null; onChange: (n: number) => void; accent: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-sm font-medium transition active:scale-90 ${
              value === n ? "text-black" : "text-sub border-line hover:border-sub"
            }`}
            style={value === n ? { background: accent, borderColor: accent } : {}}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
