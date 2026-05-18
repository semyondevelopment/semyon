import { db, ensureDb } from "@/db/client";
import { dailyLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { todayKey } from "@/lib/dates";
import DailyLogClient from "@/components/DailyLogClient";

export default async function DailyLog() {
  await ensureDb();
  const tkey = todayKey();
  const [todayRows, recentRows] = await db.batch([
    db.select().from(dailyLog).where(eq(dailyLog.dateKey, tkey)),
    db.select().from(dailyLog).orderBy(desc(dailyLog.updatedAt)).limit(10),
  ]);
  const today = todayRows[0] ?? null;
  const latestWeightKg =
    today?.weightKg ?? recentRows.find((r) => r.weightKg)?.weightKg ?? null;
  return <DailyLogClient today={today} latestWeightKg={latestWeightKg} />;
}
