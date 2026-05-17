// Canvas LMS REST client. https://canvas.instructure.com/doc/api/

const BASE = (process.env.CANVAS_BASE_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.CANVAS_TOKEN;

export function canvasConfigured(): boolean {
  return !!BASE && !!TOKEN;
}

async function canvasFetch<T>(path: string): Promise<T> {
  if (!BASE || !TOKEN) throw new Error("Canvas not configured (CANVAS_BASE_URL / CANVAS_TOKEN missing)");
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Canvas ${r.status} ${r.statusText} on ${path}: ${(await r.text()).slice(0, 240)}`);
  return r.json();
}

// Paginated GET that follows Link: <...>; rel="next" until exhausted, capped at maxPages.
async function canvasFetchAll<T>(path: string, maxPages = 5): Promise<T[]> {
  if (!BASE || !TOKEN) throw new Error("Canvas not configured");
  const acc: T[] = [];
  let next: string | null = path.startsWith("http") ? path : `${BASE}${path}`;
  let pages = 0;
  while (next && pages < maxPages) {
    const r: Response = await fetch(next, {
      headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Canvas ${r.status} ${r.statusText}: ${(await r.text()).slice(0, 200)}`);
    const chunk = (await r.json()) as T[];
    acc.push(...chunk);
    const link = r.headers.get("link") ?? "";
    const m = link.split(",").map((s) => s.trim()).find((s) => s.endsWith('rel="next"'));
    next = m ? m.replace(/^<|>;.*$/g, "") : null;
    pages++;
  }
  return acc;
}

export type CanvasCourse = {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  enrollment_term_id?: number;
  start_at?: string | null;
  end_at?: string | null;
};

export type CanvasAssignment = {
  id: number;
  name: string;
  description?: string | null;
  due_at?: string | null;
  points_possible?: number | null;
  html_url: string;
  submission_types?: string[];
  has_submitted_submissions?: boolean;
  workflow_state?: string;
  omit_from_final_grade?: boolean;
};

export type CanvasAnnouncement = {
  id: number;
  title: string;
  message: string | null;
  posted_at?: string | null;
  html_url: string;
  context_code?: string;
};

export type CanvasTodo = {
  type: string;
  assignment?: CanvasAssignment;
  context_type?: string;
  course_id?: number;
  html_url?: string;
};

export async function listCourses(): Promise<CanvasCourse[]> {
  return canvasFetchAll<CanvasCourse>("/api/v1/courses?enrollment_state=active&per_page=50");
}

export async function listAssignments(courseId: number): Promise<CanvasAssignment[]> {
  return canvasFetchAll<CanvasAssignment>(`/api/v1/courses/${courseId}/assignments?per_page=100&order_by=due_at`);
}

export async function listCourseAnnouncements(courseId: number): Promise<CanvasAnnouncement[]> {
  return canvasFetchAll<CanvasAnnouncement>(`/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=20`);
}

export async function getTodo(): Promise<CanvasTodo[]> {
  return canvasFetch<CanvasTodo[]>("/api/v1/users/self/todo?per_page=50");
}
