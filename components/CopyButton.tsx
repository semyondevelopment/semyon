"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/cn";

export default function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className={cn("inline-flex items-center gap-1.5 text-xs text-sub transition hover:text-ink", className)}
      aria-label={`Copy ${label || "value"}`}
    >
      {copied ? <Check size={12} className="text-accent" /> : <Copy size={12} />}
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
