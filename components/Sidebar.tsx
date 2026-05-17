"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import {
  CheckSquare, Dumbbell, Video, LayoutGrid, Plus,
  Brain, BarChart3, Briefcase,
  type LucideIcon,
} from "lucide-react";
import { AREA_META, AREA_ORDER } from "@/lib/areas";

type Item = { href: string; label: string; Icon: LucideIcon; match?: (p: string) => boolean };

const main: Item[] = [
  { href: "/",         label: "Today",    Icon: CheckSquare, match: (p) => p === "/" },
  { href: "/training", label: "Training", Icon: Dumbbell },
  { href: "/content",  label: "Content",  Icon: Video },
  { href: "/pipeline", label: "Pipeline", Icon: Briefcase },
  { href: "/mind",     label: "Mind",     Icon: Brain },
  { href: "/review",   label: "Review",   Icon: BarChart3 },
];

export default function Sidebar() {
  const path = usePathname();
  const isActive = (it: Item) => (it.match ? it.match(path) : path.startsWith(it.href));

  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-60 md:flex-col md:border-r md:border-line md:bg-bg/80 md:px-3 md:py-5 md:backdrop-blur-xl z-20">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-black font-bold">L</div>
        <div className="text-sm font-semibold tracking-tight">Life OS</div>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5">
        {main.map((it) => {
          const active = isActive(it);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active ? "text-ink" : "text-sub hover:bg-line/30 hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-accent/10"
                  transition={{ type: "spring", stiffness: 500, damping: 34 }}
                />
              )}
              <it.Icon size={16} strokeWidth={active ? 2.4 : 1.8} className={cn("relative shrink-0", active && "text-accent")} />
              <span className="relative">{it.label}</span>
            </Link>
          );
        })}

        <div className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-[0.18em] text-sub">Areas</div>
        {AREA_ORDER.map((area) => {
          const meta = AREA_META[area];
          const href = `/${area}`;
          const active = path === href || path.startsWith(`/goal/`) && false;
          return (
            <Link
              key={area}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition",
                active ? "text-ink" : "text-sub hover:bg-line/30 hover:text-ink",
              )}
            >
              <meta.Icon size={14} strokeWidth={1.8} className="shrink-0" style={{ color: meta.accent }} />
              <span>{meta.label}</span>
            </Link>
          );
        })}
        <Link
          href="/areas"
          className="mt-1 inline-flex items-center gap-3 rounded-lg px-3 py-1.5 text-[12px] text-sub transition hover:text-ink"
        >
          <LayoutGrid size={12} />All areas
        </Link>
      </nav>

      <Link
        href="/capture"
        className="flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(209,250,110,0.6)] transition active:scale-95"
      >
        <Plus size={16} strokeWidth={2.5} />Capture
      </Link>
    </aside>
  );
}
