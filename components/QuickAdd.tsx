"use client";
import { createQuickTask } from "@/app/actions";
import { useRef, useTransition } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { Area } from "@/db/schema";

export default function QuickAdd({ area = "tasks", placeholder = "Add a task…" }: { area?: Area; placeholder?: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  return (
    <motion.form
      ref={ref}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      action={(fd) => start(async () => {
        await createQuickTask(fd);
        ref.current?.reset();
      })}
      className="flex gap-2 rounded-2xl border border-line bg-panel/80 p-2 backdrop-blur transition focus-within:border-accent/50"
    >
      <input type="hidden" name="area" value={area} />
      <input
        name="title"
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1 bg-transparent px-2 text-[15px] placeholder:text-sub focus:outline-none"
        disabled={pending}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-black transition active:scale-90 disabled:opacity-50"
        aria-label="Add"
      >
        <Plus size={18} strokeWidth={2.6} />
      </button>
    </motion.form>
  );
}
