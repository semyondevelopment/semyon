"use client";
import { useState, useTransition } from "react";
import { logPersonContact, updatePerson, deletePerson } from "@/app/actions";
import type { Person } from "@/db/schema";
import { MessageSquare, Gift, Cake, Trash2, Edit3, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function PersonCard({ person: p }: { person: Person }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const days = p.lastContactAt ? Math.floor((Date.now() / 1000 - p.lastContactAt) / 86400) : null;
  const overdue = days === null || days >= p.cadenceDays;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="card p-3"
    >
      {!editing ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-sub">
                {p.relationship && <span className="chip">{p.relationship}</span>}
                <span className="chip">every {p.cadenceDays}d</span>
                {p.birthday && <span className="chip inline-flex items-center gap-1"><Cake size={11} className="text-pink-400" />{p.birthday}</span>}
                <span className={`chip ${overdue ? "border-amber-500/40 text-amber-400" : ""}`}>
                  {days === null ? "never" : days === 0 ? "today" : `${days}d ago`}
                </span>
              </div>
              {p.lastConvNote && (
                <div className="mt-1 text-xs text-ink/85">
                  <span className="text-sub">Last talked about:</span> {p.lastConvNote}
                </div>
              )}
              {p.giftIdeas && (
                <div className="mt-1 inline-flex items-start gap-1 text-xs text-ink/85">
                  <Gift size={11} className="mt-0.5 shrink-0 text-pink-400" />
                  <span>{p.giftIdeas}</span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button onClick={() => start(() => logPersonContact(p.id))} className="rounded-md p-1.5 text-sub hover:bg-line/40 hover:text-ink active:scale-90" aria-label="Logged a chat">
                <MessageSquare size={14} />
              </button>
              <button onClick={() => setEditing(true)} className="rounded-md p-1.5 text-sub hover:bg-line/40 hover:text-ink active:scale-90" aria-label="Edit">
                <Edit3 size={14} />
              </button>
              <button onClick={() => { if (confirm(`Delete ${p.name}?`)) start(() => deletePerson(p.id)); }} className="rounded-md p-1.5 text-sub hover:bg-line/40 hover:text-rose-400 active:scale-90" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <form
          action={(fd) => start(async () => { await updatePerson(fd); setEditing(false); })}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={p.id} />
          <div className="text-sm font-medium">{p.name}</div>
          <div className="grid grid-cols-2 gap-2">
            <input name="birthday" defaultValue={p.birthday ?? ""} placeholder="MM-DD" className="input text-sm" />
            <input name="cadence_days" type="number" defaultValue={p.cadenceDays} placeholder="every N days" className="input text-sm" />
          </div>
          <textarea name="last_conv_note" defaultValue={p.lastConvNote ?? ""} rows={2} placeholder="Last conversation was about…" className="input text-sm resize-none" />
          <textarea name="gift_ideas" defaultValue={p.giftIdeas ?? ""} rows={2} placeholder="Gift ideas / things they like" className="input text-sm resize-none" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-accent gap-1.5"><Check size={14} strokeWidth={2.5} />Save</button>
            <button type="button" onClick={() => setEditing(false)} className="btn">Cancel</button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
