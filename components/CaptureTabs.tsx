"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { CheckCircle2, Target, Lightbulb, User, QrCode, type LucideIcon } from "lucide-react";

const tabs: { id: string; label: string; Icon: LucideIcon; href?: string }[] = [
  { id: "action", label: "Action", Icon: CheckCircle2 },
  { id: "goal", label: "Goal", Icon: Target },
  { id: "note", label: "Idea", Icon: Lightbulb },
  { id: "person", label: "Person", Icon: User },
  { id: "share", label: "Share", Icon: QrCode, href: "/card" },
];

export default function CaptureTabs({ type, defaultArea }: { type: string; defaultArea: string }) {
  return (
    <div className="grid grid-cols-5 gap-1.5 rounded-2xl border border-line bg-panel/60 p-1.5 backdrop-blur">
      {tabs.map((t) => {
        const active = t.id === type;
        return (
          <Link
            key={t.id}
            href={t.href ?? `/capture?type=${t.id}&area=${defaultArea}`}
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[12px] font-medium transition active:scale-95",
              active ? "text-black" : "text-sub hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="capture-pill"
                className="absolute inset-0 rounded-xl bg-accent shadow-[0_8px_24px_-10px_rgba(209,250,110,0.7)]"
                transition={{ type: "spring", stiffness: 460, damping: 32 }}
              />
            )}
            <t.Icon size={18} strokeWidth={active ? 2.4 : 1.9} className="relative" />
            <span className="relative">{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
