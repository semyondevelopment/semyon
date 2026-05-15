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
