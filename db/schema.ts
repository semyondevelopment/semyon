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
  "mind",
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
  projectStatus: text("project_status"), // planning | building | shipped | paused | archived (projects area)
  lessons: text("lessons"),
  shareUrl: text("share_url"),
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
  bestStreak: integer("best_streak").notNull().default(0),
  status: text("status").notNull().default("active"),
  energy: text("energy"), // low | med | high
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
  birthday: text("birthday"), // "MM-DD"
  giftIdeas: text("gift_ideas"),
  lastConvNote: text("last_conv_note"),
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
  sleepHours: text("sleep_hours"),
  notes: text("notes"),
  updatedAt: integer("updated_at").notNull().default(now),
});

export const mindLog = sqliteTable("mind_log", {
  dateKey: text("date_key").primaryKey(),
  mood: integer("mood"), // 1-5
  energy: integer("energy"), // 1-5
  gratitude: text("gratitude"),
  journal: text("journal"),
  stress: text("stress"),
  updatedAt: integer("updated_at").notNull().default(now),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // cents
  category: text("category"),
  dateKey: text("date_key").notNull(),
  recurring: integer("recurring", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(now),
});

export const modules = sqliteTable("modules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code"),
  credits: integer("credits"),
  currentGrade: text("current_grade"),
  color: text("color"),
  status: text("status").notNull().default("active"), // active | done | dropped
  term: text("term"),
  canvasCourseId: integer("canvas_course_id").unique(),
  canvasUrl: text("canvas_url"),
  createdAt: integer("created_at").notNull().default(now),
});

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleId: integer("module_id").notNull().references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  weightPct: integer("weight_pct"),
  dueDate: integer("due_date"),
  grade: text("grade"),
  doneAt: integer("done_at"),
  notes: text("notes"),
  canvasId: integer("canvas_id").unique(),
  canvasUrl: text("canvas_url"),
  submitted: integer("submitted", { mode: "boolean" }).notNull().default(false),
});

export const announcements = sqliteTable("announcements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  canvasId: integer("canvas_id").unique(),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  url: text("url"),
  postedAt: integer("posted_at"),
  seenAt: integer("seen_at"),
  createdAt: integer("created_at").notNull().default(now),
});

export const syncState = sqliteTable("sync_state", {
  service: text("service").primaryKey(),
  lastRunAt: integer("last_run_at"),
  lastStatus: text("last_status"),
  lastError: text("last_error"),
  stats: text("stats"),
});

export const books = sqliteTable("books", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  author: text("author"),
  status: text("status").notNull().default("queued"), // queued | reading | done | dropped
  pagesTotal: integer("pages_total"),
  pagesDone: integer("pages_done").notNull().default(0),
  startedAt: integer("started_at"),
  finishedAt: integer("finished_at"),
  notes: text("notes"),
  pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
});

export const studyTopics = sqliteTable("study_topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  estHours: integer("est_hours"),
  hoursLogged: integer("hours_logged").notNull().default(0),
  color: text("color"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
});

export const studySessions = sqliteTable("study_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  moduleId: integer("module_id").references(() => modules.id, { onDelete: "set null" }),
  bookId: integer("book_id").references(() => books.id, { onDelete: "set null" }),
  topicId: integer("topic_id").references(() => studyTopics.id, { onDelete: "set null" }),
  minutes: integer("minutes").notNull(),
  summary: text("summary"),
  doneAt: integer("done_at").notNull().default(now),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(), // progress | other
  url: text("url"),
  blobKey: text("blob_key"),
  dateKey: text("date_key").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull().default(now),
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
export type MindLog = typeof mindLog.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Reflection = typeof reflections.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type SyncState = typeof syncState.$inferSelect;
export type Book = typeof books.$inferSelect;
export type StudyTopic = typeof studyTopics.$inferSelect;
export type StudySession = typeof studySessions.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Photo = typeof photos.$inferSelect;
