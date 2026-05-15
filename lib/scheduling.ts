import type { Cadence } from "@/db/schema";

const DAY = 86400;

export function computeNextDue(cadence: Cadence, intervalDays: number | null, fromUnix: number): number {
  switch (cadence) {
    case "daily":
      return fromUnix + DAY;
    case "weekly":
      return fromUnix + 7 * DAY;
    case "custom":
      return fromUnix + Math.max(1, intervalDays ?? 1) * DAY;
    case "once":
    default:
      return fromUnix;
  }
}

export function startOfTodayUnix(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return Math.floor(d.getTime() / 1000);
}

export function fmtDate(unix: number | null | undefined): string {
  if (!unix) return "";
  const d = new Date(unix * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function daysFromNow(unix: number): number {
  const diff = unix - Math.floor(Date.now() / 1000);
  return Math.round(diff / DAY);
}

export function relativeDue(unix: number): string {
  const d = daysFromNow(unix);
  if (d < -1) return `${-d}d overdue`;
  if (d === -1) return "yesterday";
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  return `in ${d}d`;
}
