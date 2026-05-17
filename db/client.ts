import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Defer all filesystem + client creation until first use, so module import
// is safe at build time (Vercel build is read-only outside /tmp).
let _client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (_client) return _client;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl) {
    _client = createClient({ url: tursoUrl, authToken: tursoToken });
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        "Missing TURSO_DATABASE_URL. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project settings.",
      );
    }
    // Local dev: lazy-require node-only deps + create the sqlite dir.
    const path = require("node:path") as typeof import("node:path");
    const fs = require("node:fs") as typeof import("node:fs");
    const dbDir = path.join(process.cwd(), "db");
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, "data.sqlite");
    _client = createClient({ url: `file:${dbPath}` });
  }
  return _client;
}

// Proxy so existing `import { db } from "@/db/client"` still works.
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_t, prop) {
    if (!_db) _db = drizzle(getClient(), { schema });
    return (_db as any)[prop];
  },
});

export { schema };

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
  `CREATE TABLE IF NOT EXISTS mind_log (
    date_key TEXT PRIMARY KEY,
    mood INTEGER,
    energy INTEGER,
    gratitude TEXT,
    journal TEXT,
    stress TEXT,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    category TEXT,
    date_key TEXT NOT NULL,
    recurring INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date_key DESC)`,
  `CREATE TABLE IF NOT EXISTS modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT,
    credits INTEGER,
    current_grade TEXT,
    color TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    term TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    weight_pct INTEGER,
    due_date INTEGER,
    grade TEXT,
    done_at INTEGER,
    notes TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    pages_total INTEGER,
    pages_done INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER,
    finished_at INTEGER,
    notes TEXT,
    pinned INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS study_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    est_hours INTEGER,
    hours_logged INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active'
  )`,
  `CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module_id INTEGER REFERENCES modules(id) ON DELETE SET NULL,
    book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
    topic_id INTEGER REFERENCES study_topics(id) ON DELETE SET NULL,
    minutes INTEGER NOT NULL,
    summary TEXT,
    done_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    url TEXT,
    blob_key TEXT,
    date_key TEXT NOT NULL,
    notes TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canvas_id INTEGER UNIQUE,
    module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT,
    url TEXT,
    posted_at INTEGER,
    seen_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS idx_announcements_posted ON announcements(posted_at DESC)`,
  `CREATE TABLE IF NOT EXISTS sync_state (
    service TEXT PRIMARY KEY,
    last_run_at INTEGER,
    last_status TEXT,
    last_error TEXT,
    stats TEXT
  )`,
];

// Non-fatal ALTER statements for additive columns. SQLite has no IF NOT EXISTS for ADD COLUMN.
const ADD_COLUMNS: { table: string; column: string; type: string }[] = [
  { table: "goals", column: "project_status", type: "TEXT" },
  { table: "goals", column: "lessons",        type: "TEXT" },
  { table: "goals", column: "share_url",      type: "TEXT" },
  { table: "actions", column: "best_streak",  type: "INTEGER NOT NULL DEFAULT 0" },
  { table: "actions", column: "energy",       type: "TEXT" },
  { table: "people", column: "birthday",      type: "TEXT" },
  { table: "people", column: "gift_ideas",    type: "TEXT" },
  { table: "people", column: "last_conv_note", type: "TEXT" },
  { table: "daily_log", column: "sleep_hours", type: "TEXT" },
  { table: "modules",     column: "canvas_course_id", type: "INTEGER" },
  { table: "modules",     column: "canvas_url",       type: "TEXT" },
  { table: "assignments", column: "canvas_id",        type: "INTEGER" },
  { table: "assignments", column: "canvas_url",       type: "TEXT" },
  { table: "assignments", column: "submitted",        type: "INTEGER NOT NULL DEFAULT 0" },
];

let initPromise: Promise<void> | null = null;
export function ensureDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // In production we assume tables already exist (created by `npm run db:seed`).
      // Skipping DDL saves ~12 roundtrips per cold start.
      if (process.env.VERCEL && process.env.SKIP_DB_INIT !== "false") return;
      const c = getClient();
      const joined = DDL.map((s) => s.trim().replace(/;\s*$/, "")).join(";\n") + ";";
      await c.executeMultiple(joined);
      // Add new columns to existing tables. Ignore "duplicate column" errors.
      for (const a of ADD_COLUMNS) {
        try { await c.execute(`ALTER TABLE ${a.table} ADD COLUMN ${a.column} ${a.type}`); }
        catch { /* column already exists */ }
      }
    })();
  }
  return initPromise;
}

// Force-run the full DDL + ALTER pass. Used by the migration script and the seed.
export async function migrateDb(): Promise<void> {
  const c = getClient();
  const joined = DDL.map((s) => s.trim().replace(/;\s*$/, "")).join(";\n") + ";";
  await c.executeMultiple(joined);
  for (const a of ADD_COLUMNS) {
    try { await c.execute(`ALTER TABLE ${a.table} ADD COLUMN ${a.column} ${a.type}`); }
    catch { /* column already exists */ }
  }
}
