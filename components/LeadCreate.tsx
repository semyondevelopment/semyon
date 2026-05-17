"use client";
import { useRef, useState, useTransition } from "react";
import { createLead } from "@/app/actions";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LeadCreate() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line bg-panel/40 px-4 py-3 text-sm text-sub transition hover:border-accent/40 hover:text-ink"
        >
          <Plus size={14} strokeWidth={2.5} />Add lead
        </button>
      ) : (
        <AnimatePresence>
          <motion.form
            ref={ref}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            action={(fd) => start(async () => { await createLead(fd); ref.current?.reset(); setOpen(false); })}
            className="card space-y-2 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">New lead</div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-sub"><X size={14} /></button>
            </div>
            <input name="name" required autoFocus placeholder="Business name" className="input" />
            <div className="grid grid-cols-2 gap-2">
              <input name="niche" placeholder="Niche (gym, dental…)" className="input" />
              <input name="nextStep" placeholder="Next step" className="input" />
            </div>
            <button disabled={pending} className="btn btn-accent w-full">Add</button>
          </motion.form>
        </AnimatePresence>
      )}
    </div>
  );
}
