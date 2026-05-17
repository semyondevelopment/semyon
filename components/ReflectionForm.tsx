"use client";
import { saveReflection } from "@/app/actions";
import { useTransition, useState } from "react";
import { motion } from "framer-motion";
import { Check, BookOpen } from "lucide-react";
import type { Reflection } from "@/db/schema";

export default function ReflectionForm({ existing, weekLabel }: { existing: Reflection | null; weekLabel: string }) {
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      action={(fd) => start(async () => { await saveReflection(fd); setSaved(true); setTimeout(() => setSaved(false), 1500); })}
      className="card relative overflow-hidden p-5"
    >
      <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-violet-300">
            <BookOpen size={12} strokeWidth={2.5} />Weekly reflection
          </div>
          <div className="text-[11px] text-sub">{weekLabel}</div>
        </div>
        <div className="mt-3 space-y-3">
          <Field label="What worked" name="worked" defaultValue={existing?.worked ?? ""} placeholder="One thing that pushed you forward." />
          <Field label="What didn't" name="fix" defaultValue={existing?.fix ?? ""} placeholder="The friction point. What stalled?" />
          <Field label="One change next week" name="change" defaultValue={existing?.change ?? ""} placeholder="Just one. Specific and small." />
        </div>
        <button disabled={pending} className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black transition active:scale-95 disabled:opacity-60">
          <Check size={14} strokeWidth={3} />
          {saved ? "Saved" : existing ? "Update" : "Save reflection"}
        </button>
      </div>
    </motion.form>
  );
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={2}
        placeholder={placeholder}
        className="input mt-1 resize-none"
      />
    </label>
  );
}
