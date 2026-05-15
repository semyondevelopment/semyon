"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const lines = [
  "Inbox zero. Go live.",
  "Nothing due. Rest, or pull tomorrow forward.",
  "Clean slate. Take the win.",
  "Done. Touch grass.",
  "All clear. Earned it.",
];

export default function EmptyToday() {
  const line = lines[Math.floor(Math.random() * lines.length)];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className="card relative overflow-hidden p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.1 }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent"
      >
        <CheckCircle2 size={28} strokeWidth={2} />
      </motion.div>
      <div className="mt-3 text-lg font-medium">{line}</div>
      <div className="mt-1 text-sm text-sub">No actions due today.</div>
    </motion.div>
  );
}
