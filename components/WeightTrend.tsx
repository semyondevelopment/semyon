import { db } from "@/db/client";
import { dailyLog } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import Sparkline from "@/components/charts/Sparkline";
import { TrendingUp } from "lucide-react";
import { unstable_cache } from "next/cache";

const getWeightRows = unstable_cache(
  async () => {
    return db.select({ dateKey: dailyLog.dateKey, weightKg: dailyLog.weightKg })
      .from(dailyLog)
      .where(isNotNull(dailyLog.weightKg))
      .orderBy(desc(dailyLog.dateKey))
      .limit(60);
  },
  ["weight-trend-v1"],
  { revalidate: 300, tags: ["daily_log"] },
);

export default async function WeightTrend() {
  const rows = await getWeightRows();
  const data = rows
    .map((r) => ({ key: r.dateKey, y: parseFloat(r.weightKg ?? "") }))
    .filter((r) => !isNaN(r.y))
    .reverse()
    .map((r, i) => ({ x: i, y: r.y, label: `${r.y.toFixed(1)}kg` }));

  const delta = data.length >= 2 ? data[data.length - 1].y - data[0].y : 0;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-sub inline-flex items-center gap-2">
        <TrendingUp size={14} />
        Weight trend
      </h2>
      <div className="card p-4">
        {data.length < 2 ? (
          <div className="text-xs text-sub">Log your weight on Monday mornings — trend appears after the second log.</div>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-semibold tabular-nums">{data[data.length - 1].y.toFixed(1)}<span className="text-xs text-sub ml-1">kg</span></div>
              <div className={`text-xs tabular-nums ${delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {delta >= 0 ? "+" : ""}{delta.toFixed(1)} kg since {rows[rows.length - 1].dateKey}
              </div>
            </div>
            <div className="mt-2">
              <Sparkline data={data} color="#fb7185" />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
