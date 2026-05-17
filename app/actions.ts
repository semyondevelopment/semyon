"use server";
import { db, ensureDb } from "@/db/client";
import { actions, actionLog, goals, milestones, notes, people, setLog, dailyLog, leads, reflections } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeNextDue } from "@/lib/scheduling";
import { redirect } from "next/navigation";
import type { Area, Cadence, LeadStatus } from "@/db/schema";
import { todayKey, weekStartUnix } from "@/lib/dates";

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

// ─── Workout logging ────────────────────────────────────────────────
export async function logSet(formData: FormData) {
  await ensureDb();
  const actionId = parseInt(formData.get("actionId") as string, 10);
  const exercise = (formData.get("exercise") as string)?.trim();
  const setIndex = parseInt(formData.get("setIndex") as string, 10);
  const weight = ((formData.get("weight") as string) || "").trim() || null;
  const repsRaw = formData.get("reps") as string;
  const reps = repsRaw ? parseInt(repsRaw, 10) : null;
  const rpe = ((formData.get("rpe") as string) || "").trim() || null;
  if (!actionId || !exercise || isNaN(setIndex)) return;
  const sessionDate = todayKey();

  // Upsert: delete this session's row for this exercise+setIndex, insert new.
  await db.delete(setLog).where(and(
    eq(setLog.actionId, actionId),
    eq(setLog.exercise, exercise),
    eq(setLog.setIndex, setIndex),
    eq(setLog.sessionDate, sessionDate),
  ));
  if (weight || reps || rpe) {
    await db.insert(setLog).values({ actionId, exercise, setIndex, weight, reps, rpe, sessionDate });
  }
  revalidatePath("/training");
}

// ─── Daily fuel log ─────────────────────────────────────────────────
export async function bumpDaily(field: "protein_g" | "calories", delta: number) {
  await ensureDb();
  const key = todayKey();
  const existing = (await db.select().from(dailyLog).where(eq(dailyLog.dateKey, key)))[0];
  const now = Math.floor(Date.now() / 1000);
  if (!existing) {
    await db.insert(dailyLog).values({
      dateKey: key,
      proteinG: field === "protein_g" ? Math.max(0, delta) : 0,
      calories: field === "calories" ? Math.max(0, delta) : 0,
      updatedAt: now,
    });
  } else {
    const next = Math.max(0, (field === "protein_g" ? existing.proteinG : existing.calories) + delta);
    if (field === "protein_g") {
      await db.update(dailyLog).set({ proteinG: next, updatedAt: now }).where(eq(dailyLog.dateKey, key));
    } else {
      await db.update(dailyLog).set({ calories: next, updatedAt: now }).where(eq(dailyLog.dateKey, key));
    }
  }
  revalidatePath("/", "layout");
}

export async function logWeight(formData: FormData) {
  await ensureDb();
  const kg = ((formData.get("weight_kg") as string) || "").trim();
  if (!kg) return;
  const key = todayKey();
  const existing = (await db.select().from(dailyLog).where(eq(dailyLog.dateKey, key)))[0];
  const now = Math.floor(Date.now() / 1000);
  if (!existing) {
    await db.insert(dailyLog).values({ dateKey: key, weightKg: kg, updatedAt: now });
  } else {
    await db.update(dailyLog).set({ weightKg: kg, updatedAt: now }).where(eq(dailyLog.dateKey, key));
  }
  revalidatePath("/", "layout");
}

export async function resetToday() {
  await ensureDb();
  await db.delete(dailyLog).where(eq(dailyLog.dateKey, todayKey()));
  revalidatePath("/", "layout");
}

// ─── Sales pipeline ─────────────────────────────────────────────────
export async function createLead(formData: FormData) {
  await ensureDb();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const niche = ((formData.get("niche") as string) || "").trim() || null;
  const nextStep = ((formData.get("nextStep") as string) || "").trim() || null;
  await db.insert(leads).values({ name, niche, nextStep, lastTouchAt: Math.floor(Date.now() / 1000) });
  revalidatePath("/pipeline");
}

export async function updateLead(formData: FormData) {
  await ensureDb();
  const id = parseInt(formData.get("id") as string, 10);
  if (!id) return;
  const status = (formData.get("status") as LeadStatus) || undefined;
  const mrrRaw = formData.get("mrr") as string;
  const mrr = mrrRaw ? parseInt(mrrRaw.replace(/[^0-9]/g, ""), 10) : undefined;
  const nextStep = formData.get("nextStep") as string | null;
  const notes = formData.get("notes") as string | null;
  const patch: Record<string, unknown> = {};
  if (status) patch.status = status;
  if (mrr !== undefined && !isNaN(mrr)) patch.mrr = mrr;
  if (nextStep !== null) patch.nextStep = nextStep.trim() || null;
  if (notes !== null) patch.notes = notes.trim() || null;
  patch.lastTouchAt = Math.floor(Date.now() / 1000);
  await db.update(leads).set(patch).where(eq(leads.id, id));
  revalidatePath("/pipeline");
}

export async function moveLead(id: number, status: LeadStatus) {
  await ensureDb();
  await db.update(leads).set({ status, lastTouchAt: Math.floor(Date.now() / 1000) }).where(eq(leads.id, id));
  revalidatePath("/pipeline");
}

export async function deleteLead(id: number) {
  await ensureDb();
  await db.delete(leads).where(eq(leads.id, id));
  revalidatePath("/pipeline");
}

export async function logLeadTouch(id: number) {
  await ensureDb();
  await db.update(leads).set({ lastTouchAt: Math.floor(Date.now() / 1000) }).where(eq(leads.id, id));
  revalidatePath("/pipeline");
}

// ─── Weekly reflection ──────────────────────────────────────────────
export async function saveReflection(formData: FormData) {
  await ensureDb();
  const weekStarting = weekStartUnix();
  const worked = (formData.get("worked") as string)?.trim() || null;
  const fix = (formData.get("fix") as string)?.trim() || null;
  const change = (formData.get("change") as string)?.trim() || null;
  const existing = (await db.select().from(reflections).where(eq(reflections.weekStarting, weekStarting)))[0];
  if (existing) {
    await db.update(reflections).set({ worked, fix, change }).where(eq(reflections.id, existing.id));
  } else {
    await db.insert(reflections).values({ weekStarting, worked, fix, change });
  }
  revalidatePath("/review");
}

export async function seedIfEmpty() {
  const [{ c }] = await db.select({ c: sql<number>`count(*)` }).from(goals);
  return c;
}
