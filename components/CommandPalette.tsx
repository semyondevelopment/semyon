"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, Target, Briefcase, FileText, GraduationCap, BookOpen, CheckSquare, Sparkles } from "lucide-react";
import { searchAll } from "@/app/actions";

type Result = {
  id: string;
  kind: "goal" | "lead" | "note" | "module" | "book" | "action" | "nav";
  title: string;
  sub?: string;
  href: string;
};

const NAV: Result[] = [
  { id: "nav-today",        kind: "nav", title: "Today",       href: "/" },
  { id: "nav-training",     kind: "nav", title: "Training",    href: "/training" },
  { id: "nav-content",      kind: "nav", title: "Content",     href: "/content" },
  { id: "nav-pipeline",     kind: "nav", title: "Pipeline",    href: "/pipeline" },
  { id: "nav-mind",         kind: "nav", title: "Mind",        href: "/mind" },
  { id: "nav-review",       kind: "nav", title: "Review",      href: "/review" },
  { id: "nav-areas",        kind: "nav", title: "All areas",   href: "/areas" },
  { id: "nav-health",       kind: "nav", title: "Health",      href: "/health" },
  { id: "nav-money",        kind: "nav", title: "Money",       href: "/money" },
  { id: "nav-tasks",        kind: "nav", title: "Tasks",       href: "/tasks" },
  { id: "nav-study",        kind: "nav", title: "Study",       href: "/study" },
  { id: "nav-relationships",kind: "nav", title: "Relationships", href: "/relationships" },
  { id: "nav-projects",     kind: "nav", title: "Projects",    href: "/projects" },
  { id: "nav-habits",       kind: "nav", title: "Habits",      href: "/habits" },
  { id: "nav-capture",      kind: "nav", title: "Capture (new)", href: "/capture" },
];

const ICONS: Record<Result["kind"], any> = {
  goal: Target, lead: Briefcase, note: FileText, module: GraduationCap, book: BookOpen, action: CheckSquare, nav: Sparkles,
};

function fuzzyScore(q: string, text: string): number {
  if (!q) return 0;
  const t = text.toLowerCase();
  const lq = q.toLowerCase();
  if (t.includes(lq)) return 100 - t.indexOf(lq);
  // Subsequence match
  let ti = 0, qi = 0, hits = 0;
  while (ti < t.length && qi < lq.length) {
    if (t[ti] === lq[qi]) { hits++; qi++; }
    ti++;
  }
  return qi === lq.length ? hits : -1;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [data, setData] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 50);
    setLoading(true);
    searchAll().then((d) => {
      const merged: Result[] = [
        ...NAV,
        ...d.goals.map((g) => ({ id: `g-${g.id}`, kind: "goal" as const, title: g.title, sub: g.area, href: `/goal/${g.id}` })),
        ...d.leads.map((l) => ({ id: `l-${l.id}`, kind: "lead" as const, title: l.name, sub: `${l.niche ?? ""} · ${l.status}`, href: `/pipeline` })),
        ...d.notes.map((n) => ({ id: `n-${n.id}`, kind: "note" as const, title: n.body.slice(0, 80), sub: n.area, href: `/${n.area}` })),
        ...d.modules.map((m) => ({ id: `m-${m.id}`, kind: "module" as const, title: m.name, sub: m.code ?? "module", href: `/study` })),
        ...d.books.map((b) => ({ id: `b-${b.id}`, kind: "book" as const, title: b.title, sub: b.author ?? "book", href: `/study` })),
        ...d.actions.map((a) => ({ id: `a-${a.id}`, kind: "action" as const, title: a.title, sub: a.area, href: `/${a.area}` })),
      ];
      setData(merged);
      setLoading(false);
    });
  }, [open]);

  const results = useMemo(() => {
    if (!q) return data.slice(0, 50);
    const scored = data.map((r) => ({ r, s: Math.max(fuzzyScore(q, r.title), fuzzyScore(q, r.sub ?? "") - 20) }))
      .filter((x) => x.s > -1)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map((x) => x.r);
    return scored;
  }, [data, q]);

  function go(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 backdrop-blur p-4 pt-[10vh]"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <motion.div
            initial={{ y: 20, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 20, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="card w-full max-w-xl overflow-hidden"
            role="dialog" aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <Search size={16} className="text-sub" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setActive(0); }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
                  else if (e.key === "Enter" && results[active]) { go(results[active]); }
                }}
                placeholder="Search goals, leads, notes, books… or jump to a page"
                className="flex-1 bg-transparent text-[15px] placeholder:text-sub focus:outline-none"
              />
              <kbd className="hidden sm:inline-block rounded border border-line px-1.5 py-0.5 text-[10px] text-sub">esc</kbd>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={14} className="text-sub" /></button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {loading && data.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-sub">Loading…</div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-sub">No matches.</div>
              )}
              {results.map((r, i) => {
                const Icon = ICONS[r.kind];
                return (
                  <button
                    key={r.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition ${i === active ? "bg-line/40" : "hover:bg-line/30"}`}
                  >
                    <Icon size={14} className={i === active ? "text-accent" : "text-sub"} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{r.title}</div>
                      {r.sub && <div className="truncate text-[11px] text-sub">{r.sub}</div>}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-sub">{r.kind}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 text-[10px] text-sub">
              <div className="flex gap-3">
                <span><kbd className="rounded border border-line px-1 py-0.5">↑↓</kbd> navigate</span>
                <span><kbd className="rounded border border-line px-1 py-0.5">↵</kbd> open</span>
              </div>
              <div><kbd className="rounded border border-line px-1 py-0.5">⌘K</kbd> toggle</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
