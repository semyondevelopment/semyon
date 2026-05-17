import { db, ensureDb } from "@/db/client";
import { dailyLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { todayKey } from "@/lib/dates";
import DailyLogClient from "@/components/DailyLogClient";

export default async function DailyLog() {
  await ensureDb();
  const tkey = todayKey();
  const today = (await db.select().from(dailyLog).where(eq(dailyLog.dateKey, tkey)))[0] ?? null;
  // most recent weight (could be from today or earlier)
  const latestWeightRow = (await db.select().from(dailyLog)
    .where(eq(dailyLog.dateKey, tkey)).limit(1))[0];
  let latestWeightKg = latestWeightRow?.weightKg;
  if (!latestWeightKg) {
    const recent = (await db.select().from(dailyLog)
      .orderBy(desc(dailyLog.updatedAt)).limit(10))
      .find((r) => r.weightKg);
    latestWeightKg = recent?.weightKg ?? null;
  }
  return <DailyLogClient today={today} latestWeightKg={latestWeightKg ?? null} />;
}
