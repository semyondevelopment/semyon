import { db, ensureDb } from "@/db/client";
import { modules, assignments, announcements, syncState } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canvasConfigured, listCourses, listAssignments, listCourseAnnouncements } from "@/lib/canvas";

function stripHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function isoToUnix(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return isNaN(t) ? null : Math.floor(t / 1000);
}

export type SyncResult = {
  ok: boolean;
  stats: { courses: number; modules_added: number; assignments_added: number; assignments_updated: number; announcements_added: number };
  error?: string;
};

export async function syncCanvas(): Promise<SyncResult> {
  const stats = { courses: 0, modules_added: 0, assignments_added: 0, assignments_updated: 0, announcements_added: 0 };
  if (!canvasConfigured()) {
    return { ok: false, stats, error: "Canvas not configured (set CANVAS_BASE_URL and CANVAS_TOKEN)" };
  }
  await ensureDb();

  try {
    const courses = await listCourses();
    stats.courses = courses.length;

    for (const c of courses) {
      const existing = (await db.select().from(modules).where(eq(modules.canvasCourseId, c.id)))[0];
      let moduleId: number;
      if (!existing) {
        const [row] = await db.insert(modules).values({
          name: c.name,
          code: c.course_code ?? null,
          canvasCourseId: c.id,
          canvasUrl: `${process.env.CANVAS_BASE_URL}/courses/${c.id}`,
          color: "#a78bfa",
        }).returning();
        moduleId = row.id;
        stats.modules_added++;
      } else {
        moduleId = existing.id;
        await db.update(modules).set({ name: c.name, code: c.course_code ?? null }).where(eq(modules.id, moduleId));
      }

      const cAssigns = await listAssignments(c.id).catch(() => []);
      for (const a of cAssigns) {
        if (a.omit_from_final_grade) continue;
        const due = isoToUnix(a.due_at);
        const submitted = !!a.has_submitted_submissions;
        const existingA = (await db.select().from(assignments).where(eq(assignments.canvasId, a.id)))[0];
        if (!existingA) {
          await db.insert(assignments).values({
            moduleId,
            title: a.name,
            weightPct: a.points_possible ?? null,
            dueDate: due,
            canvasId: a.id,
            canvasUrl: a.html_url,
            submitted,
            doneAt: submitted ? Math.floor(Date.now() / 1000) : null,
          });
          stats.assignments_added++;
        } else {
          const patch: Record<string, unknown> = { title: a.name, dueDate: due, submitted };
          if (submitted && !existingA.doneAt) patch.doneAt = Math.floor(Date.now() / 1000);
          await db.update(assignments).set(patch).where(eq(assignments.id, existingA.id));
          stats.assignments_updated++;
        }
      }

      const cAnns = await listCourseAnnouncements(c.id).catch(() => []);
      for (const an of cAnns) {
        const existingAn = (await db.select().from(announcements).where(eq(announcements.canvasId, an.id)))[0];
        if (!existingAn) {
          await db.insert(announcements).values({
            canvasId: an.id,
            moduleId,
            title: an.title,
            body: stripHtml(an.message).slice(0, 2000),
            url: an.html_url,
            postedAt: isoToUnix(an.posted_at),
          });
          stats.announcements_added++;
        }
      }
    }

    await upsertSyncState("canvas", { lastRunAt: Math.floor(Date.now() / 1000), lastStatus: "ok", stats: JSON.stringify(stats), lastError: null });
    return { ok: true, stats };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await upsertSyncState("canvas", { lastRunAt: Math.floor(Date.now() / 1000), lastStatus: "error", stats: JSON.stringify(stats), lastError: msg });
    return { ok: false, stats, error: msg };
  }
}

async function upsertSyncState(service: string, patch: { lastRunAt: number; lastStatus: string; stats: string; lastError: string | null }) {
  const existing = (await db.select().from(syncState).where(eq(syncState.service, service)))[0];
  if (!existing) {
    await db.insert(syncState).values({ service, ...patch });
  } else {
    await db.update(syncState).set(patch).where(eq(syncState.service, service));
  }
}
