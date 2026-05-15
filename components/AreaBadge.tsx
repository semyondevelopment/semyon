import { AREA_META } from "@/lib/areas";
import type { Area } from "@/db/schema";
import { cn } from "@/lib/cn";

export function AreaIcon({ area, size = 16, className }: { area: Area; size?: number; className?: string }) {
  const meta = AREA_META[area];
  if (!meta) return null;
  return <meta.Icon size={size} strokeWidth={1.9} className={className} style={{ color: meta.accent }} />;
}

export function AreaChip({ area }: { area: Area }) {
  const meta = AREA_META[area];
  return (
    <span className="chip inline-flex items-center gap-1">
      <AreaIcon area={area} size={12} />
      <span>{meta.label}</span>
    </span>
  );
}

export function AreaTitle({ area, className }: { area: Area; className?: string }) {
  const meta = AREA_META[area];
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line"
        style={{ background: `${meta.accent}1a`, color: meta.accent }}
      >
        <meta.Icon size={20} strokeWidth={2} />
      </span>
      <span>{meta.label}</span>
    </div>
  );
}
