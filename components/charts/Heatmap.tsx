"use client";
// 90-day activity heatmap (GitHub style). `days` = unix-second buckets of count per date_key.
export default function Heatmap({
  countByDate, // { "2026-05-12": 3, ... }
  weeks = 13,
  color = "#d1fa6e",
}: {
  countByDate: Record<string, number>;
  weeks?: number;
  color?: string;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days: { key: string; n: number; date: Date }[] = [];
  const totalDays = weeks * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ key, n: countByDate[key] ?? 0, date: d });
  }
  const max = Math.max(1, ...days.map((d) => d.n));
  const opacity = (n: number) => (n === 0 ? 0.06 : 0.25 + (n / max) * 0.75);

  // Build columns of 7 (each column = a week, top = Mon).
  const cols: { key: string; n: number; date: Date }[][] = [];
  // Start column on Monday of the earliest date.
  const startDow = (days[0].date.getDay() + 6) % 7;
  let col: typeof days = Array(startDow).fill({ key: "", n: -1, date: new Date(0) } as any);
  for (const d of days) {
    col.push(d);
    if (col.length === 7) { cols.push(col); col = []; }
  }
  if (col.length) {
    while (col.length < 7) col.push({ key: "", n: -1, date: new Date(0) } as any);
    cols.push(col);
  }

  return (
    <div className="flex gap-[3px]">
      {cols.map((c, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {c.map((d, j) => (
            <span
              key={j}
              title={d.n >= 0 ? `${d.key}: ${d.n}` : ""}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: d.n < 0 ? "transparent" : color, opacity: d.n < 0 ? 0 : opacity(d.n) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
