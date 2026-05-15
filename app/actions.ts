"use server";
import { db, ensureDb } from "@/db/client";
import { actions, actionLog, goals, milestones, notes, people } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeNextDue } from "@/lib/scheduling";
import { redirect } from "next/navigation";
import type { Area, Cadence } from "@/db/schema";

export async function checkOffAction(actionId: number, outcome: "done" | "skip" | "snooze" = "done") {
  await ensureDb();
  const now = Math.floor(Date.now() / 1000);
  const [a] = await db.select().from(actions).where(eq(actions.id, actionId));
  if (!a) return;

  await db.insert(actionLog).values({ actionId, outcome, doneAt: now });

  if (outcome === "snooze") {
    await db.update(actions).set({ nextDueAt: now + 86400 }).where(eq(actions.id, actionId));
  } else if (a.cadence === "once") {
    await db.update(actions).set({
      status: outcome === "done" ? "done" : a.status,
      lastDoneAt: outcome === "done" ? now : a.lastDoneAt,
    }).where(eq(actions.id, actionId));
  } else {
    const next = computeNextDue(a.cadence as Cadence, a.intervalDays ?? null, now);
    const nextStreak = outcome === "done" ? a.streak + 1 : 0;
    await db.update(actions).set({
      nextDueAt: next,
      lastDoneAt: outcome === "done" ? now : a.lastDoneAt,
      streak: nextStreak,
    }).where(eq(actions.id, actionId));
  }
  revalidatePath("/", "layout");
}

export async function toggleMilestone(milestoneId: number, done: boolean) {
  await db.update(milestones)
    .set({ doneAt: done ? Math.floor(Date.now() / 1000) : null })
    .where(eq(milestones.id, milestoneId));
  revalidatePath("/", "layout");
}

export async function logPersonContact(personId: number) {
  await db.update(people).set({ lastContactAt: Math.floor(Date.now() / 1000) }).where(eq(people.id, personId));
  revalidatePath("/", "layout");
}

export async function createGoal(formData: FormData) {
  const area = formData.get("area") as Area;
  const title = (formData.get("title") as string)?.trim();
  const why = (formData.get("why") as string)?.trim() || null;
  const targetMetric = (formData.get("targetMetric") as string)?.trim() || null;
  const targetValue = (formData.get("targetValue") as string)?.trim() || null;
  if (!area || !title) return;
  const [g] = await db.insert(goals).values({ area, title, why, targetMetric, targetValue }).returning();
  revalidatePath("/", "layout");
  redirect(`/goal/${g.id}`);
}

export async function createQuickTask(formData: FormData) {
  await ensureDb();
  const title = (formData.get("title") as string)?.trim();
  const area = (formData.get("area") as Area) || "tasks";
  if (!title) return;
  await db.insert(actions).values({
    area, title, cadence: "once",
    nextDueAt: Math.floor(Date.now() / 1000),
  });
  revalidatePath("/", "layout");
}

export async function createAction(formData: FormData) {
  const area = formData.get("area") as Area;
  const title = (formData.get("title") as string)?.trim();
  const cadence = (formData.get("cadence") as Cadence) || "once";
  const intervalDaysRaw = formData.get("intervalDays") as string;
  const intervalDays = intervalDaysRaw ? parseInt(intervalDaysRaw, 10) : null;
  const goalIdRaw = formData.get("goalId") as string;
  const goalId = goalIdRaw ? parseInt(goalIdRaw, 10) : null;
  if (!area || !title) return;
  await db.insert(actions).values({
    area, title, cadence, intervalDays, goalId,
    nextDueAt: Math.floor(Date.now() / 1000),
  });
  revalidatePath("/", "layout");
  if (goalId) redirect(`/goal/${goalId}`);
  redirect(`/${area}`);
}

export async function createMilestone(formData: FormData) {
  const goalId = parseInt(formData.get("goalId") as string, 10);
  const title = (formData.get("title") as string)?.trim();
  if (!goalId || !title) return;
  await db.insert(milestones).values({ goalId, title });
  revalidatePath(`/goal/${goalId}`);
}

export async function createNote(formData: FormData) {
  const area = formData.get("area") as Area;
  const body = (formData.get("body") as string)?.trim();
  if (!area || !body) return;
  await db.insert(notes).values({ area, body });
  revalidatePath("/", "layout");
  redirect(`/${area}`);
}

export async function createPerson(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const relationship = (formData.get("relationship") as string)?.trim() || null;
  const cadenceDays = parseInt((formData.get("cadenceDays") as string) || "14", 10);
  if (!name) return;
  await db.insert(people).values({ name, relationship, cadenceDays });
  revalidatePath("/relationships");
  redirect("/relationships");
}

export async function pinGoal(goalId: number, pinned: boolean) {
  await db.update(goals).set({ pinned }).where(eq(goals.id, goalId));
  revalidatePath("/", "layout");
}

export async function deleteGoal(goalId: number) {
  await db.delete(goals).where(eq(goals.id, goalId));
  revalidatePath("/", "layout");
  redirect("/areas");
}

export async function deleteAction(actionId: number) {
  await db.delete(actions).where(eq(actions.id, actionId));
  revalidatePath("/", "layout");
}

export async function seedIfEmpty() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(goals);
  return c;
}
