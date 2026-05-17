"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { motion } from "framer-motion";
import { CheckSquare, Dumbbell, Video, LayoutGrid, Plus, type LucideIcon } from "lucide-react";

type Item = { href: string; label: string; Icon: LucideIcon; match?: (p: string) => boolean };

const items: Item[] = [
  { href: "/",         label: "Today",    Icon: CheckSquare, match: (p) => p === "/" },
  { href: "/training", label: "Training", Icon: Dumbbell },
  { href: "/content",  label: "Content",  Icon: Video },
  { href: "/areas",    label: "Areas",    Icon: LayoutGrid,  match: (p) => p.startsWith("/areas") || p.startsWith("/health") || p.startsWith("/money") || p.startsWith("/tasks") || p.startsWith("/study") || p.startsWith("/relationships") || p.startsWith("/projects") || p.startsWith("/habits") || p.startsWith("/goal") || p.startsWith("/review") },
];

export default function BottomNav() {
  const path = usePathname();
  const captureActive = path.startsWith("/capture");

  return (
    <>
      {/* Floating capture button (FAB) — mobile only */}
      <Link
        href="/capture"
        aria-label="Add"
        className={cn(
          "fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl text-black transition active:scale-90 md:hidden",
          "bg-gradient-to-br from-accent to-[#a3e635]",
          "shadow-[0_14px_40px_-10px_rgba(209,250,110,0.7),0_2px_0_rgba(255,255,255,0.25)_inset]",
        )}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
      >
        <motion.span
          animate={captureActive ? { rotate: 45 } : { rotate: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </motion.span>
      </Link>

      {/* Nav bar — mobile only */}
      <nav className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto max-w-2xl px-3 pb-3">
          <div className="relative flex items-center justify-around rounded-2xl border border-line bg-bg/85 px-1 py-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            {items.map((it) => {
              const active = it.match ? it.match(path) : path.startsWith(it.href);
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "group relative flex w-1/4 flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition active:scale-90",
                    active ? "text-accent" : "text-sub hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-xl bg-accent/10"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <it.Icon size={20} strokeWidth={active ? 2.4 : 1.8} className="relative" />
                  <span className="relative text-[10px] font-medium tracking-wide">{it.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
