"use client";
import { useState, useTransition } from "react";
import { moveLead, deleteLead, updateLead, logLeadTouch } from "@/app/actions";
import type { Lead, LeadStatus } from "@/db/schema";
import { LEAD_STATUSES } from "@/db/schema";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, MessageSquare, Trash2, Edit3, Check } from "lucide-react";

const STATUS_LABEL: Record<LeadStatus, string> = {
  lead: "Lead", qualified: "Qualified", call_booked: "Call booked",
  proposal: "Proposal", signed: "Signed", lost: "Lost",
};

export default function LeadCard({ lead }: { lead: Lead }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const idx = LEAD_STATUSES.indexOf(lead.status as LeadStatus);
  const canForward = idx < LEAD_STATUSES.indexOf("signed");
  const canBack = idx > 0;
  const daysSince = lead.lastTouchAt ? Math.floor((Date.now() / 1000 - lead.lastTouchAt) / 86400) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="card p-3"
    >
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium">{lead.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sub">
                {lead.niche && <span className="chip">{lead.niche}</span>}
                {lead.mrr ? <span className="chip text-emerald-400 border-emerald-500/30">${lead.mrr}/mo</span> : null}
                {daysSince !== null && (
                  <span className={`chip ${daysSince >= 3 ? "border-amber-500/30 text-amber-400" : ""}`}>
                    {daysSince === 0 ? "today" : `${daysSince}d ago`}
                  </span>
                )}
              </div>
              {lead.nextStep && <div className="mt-1 text-xs text-ink/80">Next: {lead.nextStep}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                aria-label="Logged a touch"
                onClick={() => start(() => logLeadTouch(lead.id))}
                className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
              >
                <MessageSquare size={14} />
              </button>
              <button
                aria-label="Edit"
                onClick={() => setEditing(true)}
                className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
              >
                <Edit3 size={14} />
              </button>
              <button
                aria-label="Delete"
                onClick={() => { if (confirm(`Delete ${lead.name}?`)) start(() => deleteLead(lead.id)); }}
                className="rounded-md p-1.5 text-sub transition hover:bg-line/40 hover:text-ink active:scale-90"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1">
            {canBack && (
              <button
                disabled={pending}
                onClick={() => start(() => moveLead(lead.id, LEAD_STATUSES[idx - 1] as LeadStatus))}
                className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-[11px] text-sub transition hover:bg-line/40 active:scale-95"
              >
                <ChevronLeft size={12} />{STATUS_LABEL[LEAD_STATUSES[idx - 1] as LeadStatus]}
              </button>
            )}
            {canForward && (
              <button
                disabled={pending}
                onClick={() => start(() => moveLead(lead.id, LEAD_STATUSES[idx + 1] as LeadStatus))}
                className="inline-flex items-center gap-1 rounded-md bg-accent/15 border border-accent/30 px-2 py-1 text-[11px] text-accent transition hover:bg-accent/25 active:scale-95"
              >
                {STATUS_LABEL[LEAD_STATUSES[idx + 1] as LeadStatus]}<ChevronRight size={12} />
              </button>
            )}
            {lead.status !== "lost" && lead.status !== "signed" && (
              <button
                disabled={pending}
                onClick={() => start(() => moveLead(lead.id, "lost"))}
                className="ml-auto rounded-md px-2 py-1 text-[11px] text-sub transition hover:text-rose-400"
              >
                lost
              </button>
            )}
          </div>
        </>
      ) : (
        <form
          action={(fd) => start(async () => { await updateLead(fd); setEditing(false); })}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={lead.id} />
          <div className="text-sm font-medium">{lead.name}</div>
          <div className="grid grid-cols-2 gap-2">
            <input name="nextStep" defaultValue={lead.nextStep ?? ""} placeholder="Next step…" className="input text-sm" />
            <input name="mrr" defaultValue={lead.mrr ?? ""} placeholder="$/mo" inputMode="numeric" className="input text-sm" />
          </div>
          <textarea name="notes" defaultValue={lead.notes ?? ""} placeholder="Notes…" rows={2} className="input text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-accent gap-1.5"><Check size={14} strokeWidth={2.5} />Save</button>
            <button type="button" onClick={() => setEditing(false)} className="btn">Cancel</button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
