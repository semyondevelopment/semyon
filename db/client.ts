import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

// Use Turso when env vars are set (production); fall back to local SQLite file (dev).
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let url: string;
let authToken: string | undefined;

if (tursoUrl) {
  url = tursoUrl;
  authToken = tursoToken;
} else {
  const dbDir = path.join(process.cwd(), "db");
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  url = `file:${path.join(dbDir, "data.sqlite")}`;
}

const client = createClient({ url, authToken });

const DDL = [
  `CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area TEXT NOT NULL,
    title TEXT NOT NULL,
    why TEXT,
    target_metric TEXT,
    target_value TEXT,
    target_date INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_date INTEGER,
    done_at INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    milestone_id INTEGER REFERENCES milestones(id) ON DELETE SET NULL,
    area TEXT NOT NULL,
    title TEXT NOT NULL,
    cadence TEXT NOT NULL DEFAULT 'once',
    interval_days INTEGER,
    next_due_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_done_at INTEGER,
    streak INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    done_at INTEGER NOT NULL DEFAULT (unixepoch()),
    outcome TEXT NOT NULL DEFAULT 'done',
    note TEXT,
    value TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    relationship TEXT,
    last_contact_at INTEGER,
    cadence_days INTEGER NOT NULL DEFAULT 30,
    notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area TEXT NOT NULL,
    goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS set_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id INTEGER NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
    exercise TEXT NOT NULL,
    set_index INTEGER NOT NULL,
    weight TEXT,
    reps INTEGER,
    rpe TEXT,
    session_date TEXT NOT NULL,
    done_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS idx_set_log_action_exercise ON set_log(action_id, exercise, session_date DESC)`,
  `CREATE TABLE IF NOT EXISTS daily_log (
    date_key TEXT PRIMARY KEY,
    protein_g INTEGER NOT NULL DEFAULT 0,
    calories INTEGER NOT NULL DEFAULT 0,
    weight_kg TEXT,
    notes TEXT,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    niche TEXT,
    status TEXT NOT NULL DEFAULT 'lead',
    mrr INTEGER,
    last_touch_at INTEGER,
    next_step TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS reflections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_starting INTEGER NOT NULL UNIQUE,
    worked TEXT,
    fix TEXT,
    change TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
];

let initPromise: Promise<void> | null = null;
export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      for (const stmt of DDL) await client.execute(stmt);
    })();
  }
  return initPromise;
}

export const db = drizzle(client, { schema });
export { schema };
