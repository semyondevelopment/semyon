import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const AREAS = [
  "health",
  "money",
  "tasks",
  "study",
  "relationships",
  "projects",
  "habits",
] as const;
export type Area = (typeof AREAS)[number];

export const CADENCES = ["once", "daily", "weekly", "custom"] as const;
export type Cadence = (typeof CADENCES)[number];

const now = sql`(unixepoch())`;

export const goals = sqliteTable("goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  area: text("area").notNull(),
  title: text("title").notNull(),
  why: text("why"),
  targetMetric: text("target_metric"),
  targetValue: text("target_value"),
  targetDate: integer("target_date"),
  status: text("status").notNull().default("active"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull().default(now),
});

export const milestones = sqliteTable("milestones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetDate: integer("target_date"),
  doneAt: integer("done_at"),
  order: integer("order").notNull().default(0),
});

export const actions = sqliteTable("actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "set null" }),
  milestoneId: integer("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
  area: text("area").notNull(),
  title: text("title").notNull(),
  cadence: text("cadence").notNull().default("once"),
  intervalDays: integer("interval_days"),
  nextDueAt: integer("next_due_at").notNull().default(now),
  lastDoneAt: integer("last_done_at"),
  streak: integer("streak").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: integer("created_at").notNull().default(now),
});

export const actionLog = sqliteTable("action_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actionId: integer("action_id").notNull().references(() => actions.id, { onDelete: "cascade" }),
  doneAt: integer("done_at").notNull().default(now),
  outcome: text("outcome").notNull().default("done"),
  note: text("note"),
  value: text("value"),
});

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  relationship: text("relationship"),
  lastContactAt: integer("last_contact_at"),
  cadenceDays: integer("cadence_days").notNull().default(30),
  notes: text("notes"),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  area: text("area").notNull(),
  goalId: integer("goal_id").references(() => goals.id, { onDelete: "set null" }),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull().default(now),
});

export const setLog = sqliteTable("set_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actionId: integer("action_id").notNull().references(() => actions.id, { onDelete: "cascade" }),
  exercise: text("exercise").notNull(),
  setIndex: integer("set_index").notNull(),
  weight: text("weight"),
  reps: integer("reps"),
  rpe: text("rpe"),
  sessionDate: text("session_date").notNull(),
  doneAt: integer("done_at").notNull().default(now),
});

export const dailyLog = sqliteTable("daily_log", {
  dateKey: text("date_key").primaryKey(),
  proteinG: integer("protein_g").notNull().default(0),
  calories: integer("calories").notNull().default(0),
  weightKg: text("weight_kg"),
  notes: text("notes"),
  updatedAt: integer("updated_at").notNull().default(now),
});

export const LEAD_STATUSES = ["lead", "qualified", "call_booked", "proposal", "signed", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leads = sqliteTable("leads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  niche: text("niche"),
  status: text("status").notNull().default("lead"),
  mrr: integer("mrr"),
  lastTouchAt: integer("last_touch_at"),
  nextStep: text("next_step"),
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(now),
});

export const reflections = sqliteTable("reflections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekStarting: integer("week_starting").notNull().unique(),
  worked: text("worked"),
  fix: text("fix"),
  change: text("change"),
  createdAt: integer("created_at").notNull().default(now),
});

export type Goal = typeof goals.$inferSelect;
export type Action = typeof actions.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type Person = typeof people.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type SetLog = typeof setLog.$inferSelect;
export type DailyLog = typeof dailyLog.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Reflection = typeof reflections.$inferSelect;
