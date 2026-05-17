import { db, ensureDb } from "./client";
import { goals, milestones, actions, people, notes } from "./schema";
import { sql } from "drizzle-orm";

const DAY = 86400;
const now = Math.floor(Date.now() / 1000);
const SIX_MONTHS = now + 180 * DAY;

// Anchor each weekday's session to its real day of week.
// JS getDay(): Sun 0, Mon 1, ..., Sat 6.
function nextOnDay(targetDow: number): number {
  const today = new Date();
  const todayDow = today.getDay();
  let delta = (targetDow - todayDow + 7) % 7;
  // If today is the target day, due now (not next week).
  return now + delta * DAY;
}
const MON = nextOnDay(1), TUE = nextOnDay(2), WED = nextOnDay(3),
      THU = nextOnDay(4), FRI = nextOnDay(5), SAT = nextOnDay(6), SUN = nextOnDay(0);

async function main() {
  await ensureDb();
  await db.run(sql`DELETE FROM action_log`);
  await db.run(sql`DELETE FROM actions`);
  await db.run(sql`DELETE FROM milestones`);
  await db.run(sql`DELETE FROM notes`);
  await db.run(sql`DELETE FROM people`);
  await db.run(sql`DELETE FROM goals`);

  const insertGoal = async (g: typeof goals.$inferInsert) => {
    const [row] = await db.insert(goals).values(g).returning();
    return row.id;
  };

  // ─── MONEY / CONTENT ──────────────────────────────────────────────
  const tenK = await insertGoal({
    area: "money",
    title: "$10k/mo from local-business content retainers",
    why: "Financial runway and freedom. Content services for local businesses scale with effort and get leverage fast.",
    targetMetric: "MRR",
    targetValue: "$10,000",
    targetDate: SIX_MONTHS,
    pinned: true,
  });
  await db.insert(milestones).values([
    { goalId: tenK, title: "First paid retainer signed", order: 1 },
    { goalId: tenK, title: "$2k MRR (2–3 retainers)", order: 2 },
    { goalId: tenK, title: "$5k MRR (5 retainers)", order: 3 },
    { goalId: tenK, title: "Productized offer + 3 case studies", order: 4 },
    { goalId: tenK, title: "$10k MRR (10 retainers or 5 premium)", order: 5 },
  ]);
  await db.insert(actions).values([
    { goalId: tenK, area: "money", title: "Outreach: 15 local businesses (DM/email/walk-in)", cadence: "daily", nextDueAt: now },
    { goalId: tenK, area: "money", title: "Film + post 1 spec reel (proof of work)", cadence: "daily", nextDueAt: now },
    { goalId: tenK, area: "money", title: "Edit & schedule tomorrow's content", cadence: "daily", nextDueAt: now },
    { goalId: tenK, area: "money", title: "Follow up with warm leads", cadence: "custom", intervalDays: 2, nextDueAt: now },
    { goalId: tenK, area: "money", title: "Sales calls booked this week", cadence: "weekly", nextDueAt: TUE },
    { goalId: tenK, area: "money", title: "Deliver client content (shoot/edit/post)", cadence: "weekly", intervalDays: 2, nextDueAt: now },
    { goalId: tenK, area: "money", title: "Log MRR + pipeline review", cadence: "weekly", nextDueAt: SUN },
  ]);
  await db.insert(notes).values([
    { area: "money", body: "Offer tiers:\n• Reels retainer — 8 short-form/mo, $500–$1k\n• Full content — reels + photo + posting, $1.5–$3k\n• Premium — strategy + paid ads bundle, $3k+" },
    { area: "money", body: "Niches to test:\n• Gyms / muay thai / BJJ academies (I speak the language)\n• Restaurants & cafés (visual, easy reels)\n• Dentists / clinics (high LTV, low content sophistication)\n• Real estate agents (need volume of listings)" },
    { area: "money", body: "Filming kit checklist: phone gimbal, lapel mic, 2x batteries, extra storage, tripod, ring light." },
    { area: "money", body: "Content templates: before/after, day-in-the-life, FAQ, testimonial, founder story, behind-the-scenes." },
    { area: "money", body: "Client tracker — add real leads here as they come in (name, niche, status, last touch, next step)." },
  ]);

  // ─── HEALTH ────────────────────────────────────────────────────────
  const mass = await insertGoal({
    area: "health",
    title: "+5kg lean muscle in 6 months",
    why: "Denser, stronger, more durable. Carries into striking power, grappling control, longevity.",
    targetMetric: "lean mass",
    targetValue: "+5kg",
    targetDate: SIX_MONTHS,
  });
  await db.insert(milestones).values([
    { goalId: mass, title: "Dial in surplus (+300–500 kcal/day) + 1.8g protein/kg", order: 1 },
    { goalId: mass, title: "+1.5kg bodyweight (month 1–2)", order: 2 },
    { goalId: mass, title: "+3kg bodyweight (month 3–4)", order: 3 },
    { goalId: mass, title: "+5kg bodyweight, BF held", order: 4 },
  ]);
  await db.insert(actions).values([
    { goalId: mass, area: "health", title: "Hit protein 1.8g/kg bodyweight", cadence: "daily", nextDueAt: now },
    { goalId: mass, area: "health", title: "Eat in surplus (track calories)", cadence: "daily", nextDueAt: now },
    { goalId: mass, area: "health", title: "Weigh in (AM, post-toilet)", cadence: "weekly", nextDueAt: MON },
    { goalId: mass, area: "health", title: "Progress photos (front / side / back)", cadence: "weekly", nextDueAt: SUN },
  ]);

  const strong = await insertGoal({
    area: "health",
    title: "Get as strong as possible (PRs across main lifts)",
    why: "Strength is the ceiling for athletic output. Heavy compounds + high-quality hypertrophy work.",
    targetMetric: "main lifts",
    targetValue: "S/B/D PRs",
    targetDate: SIX_MONTHS,
  });
  await db.insert(milestones).values([
    { goalId: strong, title: "Lock in 4-day Upper/Lower split for 4 weeks", order: 1 },
    { goalId: strong, title: "+10 kg on squat 5RM", order: 2 },
    { goalId: strong, title: "+10 kg on deadlift 5RM", order: 3 },
    { goalId: strong, title: "+5 kg on bench 5RM", order: 4 },
    { goalId: strong, title: "Hit one new rep PR every session for 4 weeks", order: 5 },
  ]);
  // The 4 weekly lift sessions, scheduled by day-of-week.
  await db.insert(actions).values([
    { goalId: strong, area: "health", title: "Upper A — Push focus",      cadence: "weekly", nextDueAt: MON },
    { goalId: strong, area: "health", title: "Lower A — Squat focus",     cadence: "weekly", nextDueAt: WED },
    { goalId: strong, area: "health", title: "Upper B — Pull focus",      cadence: "weekly", nextDueAt: FRI },
    { goalId: strong, area: "health", title: "Lower B — Deadlift focus",  cadence: "weekly", nextDueAt: SAT },
    { goalId: strong, area: "health", title: "Log every working set (weight × reps)", cadence: "weekly", intervalDays: 2, nextDueAt: now },
  ]);

  const muay = await insertGoal({
    area: "health",
    title: "Maintain muay thai sharpness",
    why: "Keep timing, conditioning, and ring instincts alive while bulking. Skill > intensity.",
    targetMetric: "sessions/week",
    targetValue: "2 @ Iron Fist",
  });
  await db.insert(actions).values([
    { goalId: muay, area: "health", title: "Muay Thai — Int/Adv class (5:30pm @ Iron Fist)", cadence: "weekly", nextDueAt: THU },
    { goalId: muay, area: "health", title: "Muay Thai — sparring (Sat 9am @ Iron Fist)",     cadence: "weekly", nextDueAt: SAT },
  ]);

  const bjj = await insertGoal({
    area: "health",
    title: "Learn BJJ — get rolling regularly",
    why: "Round out striking with grappling. Humility, problem-solving, longer fight-sport horizon.",
    targetMetric: "belt / mat time",
    targetValue: "White → 4 stripes",
    targetDate: SIX_MONTHS,
  });
  await db.insert(milestones).values([
    { goalId: bjj, title: "Sign up at Iron Fist + first 5 classes", order: 1 },
    { goalId: bjj, title: "Survive every roll for a full round", order: 2 },
    { goalId: bjj, title: "First submission from live roll", order: 3 },
    { goalId: bjj, title: "4 stripes on white belt", order: 4 },
  ]);
  await db.insert(actions).values([
    { goalId: bjj, area: "health", title: "BJJ No-Gi — fundamentals (Tue 6:30pm @ Iron Fist)",          cadence: "weekly", nextDueAt: TUE },
    { goalId: bjj, area: "health", title: "BJJ — open mat / rolling (Fri 5:30pm @ Iron Fist · No-Gi)", cadence: "weekly", nextDueAt: FRI },
  ]);

  const cardio = await insertGoal({
    area: "health",
    title: "Stay lean + cardio engine",
    why: "Keep BF in check and heart healthy while bulking. Easy aerobic only — never enough to steal recovery.",
    targetMetric: "Z2 min/week",
    targetValue: "30–80",
  });
  await db.insert(actions).values([
    { goalId: cardio, area: "health", title: "Z2 easy run (30–40 min)",          cadence: "weekly", nextDueAt: TUE },
    { goalId: cardio, area: "health", title: "Z2 easy run (30–40 min)",          cadence: "weekly", nextDueAt: THU },
    { goalId: cardio, area: "health", title: "Long Z2 run (45–60 min)",          cadence: "weekly", nextDueAt: SUN },
    { goalId: cardio, area: "health", title: "Long walk (60+ min)",              cadence: "weekly", nextDueAt: SUN },
    { goalId: cardio, area: "health", title: "10k steps",                        cadence: "daily",  nextDueAt: now },
  ]);

  // ─── TASKS (chores/errands seed) ──────────────────────────────────
  await db.insert(actions).values([
    { area: "tasks", title: "Meal prep — high-protein, surplus meals", cadence: "weekly", nextDueAt: SUN },
    { area: "tasks", title: "Groceries (protein, carbs, greens)", cadence: "weekly", nextDueAt: SAT },
    { area: "tasks", title: "Laundry", cadence: "weekly", nextDueAt: SUN },
    { area: "tasks", title: "Clean apartment", cadence: "weekly", nextDueAt: SAT },
    { area: "tasks", title: "Take out trash", cadence: "custom", intervalDays: 3, nextDueAt: now },
  ]);

  // ─── STUDY ─────────────────────────────────────────────────────────
  const uni = await insertGoal({
    area: "study",
    title: "Crush this uni semester",
    why: "Don't fall behind while chasing the business. Finish strong.",
    targetMetric: "avg grade",
    targetValue: "First",
  });
  await db.insert(milestones).values([
    { goalId: uni, title: "Stay current on lectures week-by-week", order: 1 },
    { goalId: uni, title: "Mid-term assignment submitted", order: 2 },
    { goalId: uni, title: "Final project submitted", order: 3 },
  ]);
  await db.insert(actions).values([
    { goalId: uni, area: "study", title: "Lecture review + notes", cadence: "weekly", intervalDays: 2, nextDueAt: now },
    { goalId: uni, area: "study", title: "Problem set / coursework block", cadence: "weekly", nextDueAt: WED },
  ]);
  await db.insert(notes).values([
    { area: "study", body: "Field of interest: short-form content strategy — dissect top local-biz creators." },
    { area: "study", body: "Field of interest: sales & persuasion — Cialdini, Hormozi $100M Offers, Sandler basics." },
    { area: "study", body: "Field of interest: hypertrophy programming — RP, Israetel, Helms, Schoenfeld." },
    { area: "study", body: "Field of interest: BJJ fundamentals — Danaher escapes, BJJ Fanatics basics." },
  ]);

  // ─── RELATIONSHIPS ─────────────────────────────────────────────────
  await db.insert(people).values([
    { name: "Mum",                          relationship: "family",   cadenceDays: 3,  lastContactAt: now - 2 * DAY },
    { name: "Dad",                          relationship: "family",   cadenceDays: 7,  lastContactAt: now - 4 * DAY },
    { name: "Best mate",                    relationship: "friend",   cadenceDays: 7,  lastContactAt: now - 10 * DAY },
    { name: "Training partners (gym group)", relationship: "training", cadenceDays: 4, lastContactAt: now - 1 * DAY },
    { name: "Uni group chat",               relationship: "friends",  cadenceDays: 7,  lastContactAt: now - 5 * DAY },
  ]);

  // ─── PROJECTS ──────────────────────────────────────────────────────
  const lifeOs = await insertGoal({
    area: "projects",
    title: "Ship & use Life OS daily",
    why: "If I don't use it, the goals are vibes. Daily check-ins keep me honest.",
    targetMetric: "daily use",
    targetValue: "live on phone",
  });
  await db.insert(actions).values([
    { goalId: lifeOs, area: "projects", title: "Open Life OS, clear Today view", cadence: "daily", nextDueAt: now },
  ]);

  // ─── HABITS ────────────────────────────────────────────────────────
  await db.insert(actions).values([
    { area: "habits", title: "Wake by 7am", cadence: "daily", nextDueAt: now },
    { area: "habits", title: "8 hrs in bed", cadence: "daily", nextDueAt: now },
    { area: "habits", title: "No phone first hour", cadence: "daily", nextDueAt: now },
    { area: "habits", title: "Stretch / mobility 10 min", cadence: "daily", nextDueAt: now },
    { area: "habits", title: "Read 20 min", cadence: "daily", nextDueAt: now },
  ]);

  console.log("Seeded with your real goals + scientific training program.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
