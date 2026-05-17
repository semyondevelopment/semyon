export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Monday 00:00 (local) of the week containing `d`. Returns unix seconds.
export function weekStartUnix(d = new Date()): number {
  const dow = d.getDay(); // Sun 0, Mon 1, ...
  const offset = (dow + 6) % 7; // days since Monday
  const mon = new Date(d);
  mon.setDate(d.getDate() - offset);
  mon.setHours(0, 0, 0, 0);
  return Math.floor(mon.getTime() / 1000);
}

export function fmtWeek(weekStarting: number): string {
  const start = new Date(weekStarting * 1000);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const f = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${f(start)} – ${f(end)}`;
}
