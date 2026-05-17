"use client";
import { useState, useTransition } from "react";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { syncCanvasNow } from "@/app/actions";

export default function CanvasSyncButton({ lastRunAt, lastStatus }: { lastRunAt: number | null; lastStatus: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function sync() {
    start(async () => {
      setMsg(null);
      const r = await syncCanvasNow();
      if (!r.ok) {
        setMsg(r.error ?? "Sync failed");
      } else {
        const s = r.stats;
        setMsg(`+${s.modules_added} mods · +${s.assignments_added} assn · +${s.announcements_added} ann`);
        router.refresh();
      }
    });
  }

  const ago = lastRunAt ? humanAgo(lastRunAt) : "never";
  const ok = lastStatus === "ok";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={pending}
        className="btn gap-1.5 text-xs"
        aria-label="Sync Canvas"
      >
        <RefreshCw size={12} className={pending ? "animate-spin" : ""} />
        {pending ? "Syncing…" : "Sync Canvas"}
      </button>
      <div className="text-[10px] text-sub inline-flex items-center gap-1">
        {ok ? <Check size={9} className="text-emerald-400" /> : lastStatus === "error" ? <AlertTriangle size={9} className="text-rose-400" /> : null}
        {msg ?? `last: ${ago}`}
      </div>
    </div>
  );
}

function humanAgo(unix: number): string {
  const s = Math.floor(Date.now() / 1000) - unix;
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
