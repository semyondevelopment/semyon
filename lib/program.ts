// Research-backed training program.
// Hypertrophy: 12–18 working sets/muscle/week, 2x frequency, RIR 0–3, 4–20 reps.
// Strength: heavy primary (3–6 reps, RPE 7–9). Progressive overload tracked.
// Interference-aware: BJJ/MT separated from squat/DL days by ≥1 day where possible.

export type Block = {
  name: string;
  sets: string;
  rest?: string;
  notes?: string;
};

export type Session = {
  type: "lift" | "muay" | "bjj" | "run";
  emoji: string;
  title: string;
  duration: string;
  summary: string;
  blocks: Block[];
  cues?: string[];
};

export const SESSIONS: Session[] = [
  {
    type: "lift",
    emoji: "🏋️",
    title: "Upper A — Push focus",
    duration: "60–75 min",
    summary: "Heavy bench, vertical pull, shoulder & arm volume. Hit each upper-body muscle hard.",
    blocks: [
      { name: "Barbell Bench Press",       sets: "4 × 4–6 @ RPE 8",  rest: "3 min",   notes: "Main lift. Add 2.5kg when all sets hit 6 clean reps." },
      { name: "Weighted Pull-up",           sets: "4 × 6–8 @ RPE 8",  rest: "2–3 min", notes: "Use a belt. If <6 reps unweighted, do strict bodyweight pull-ups." },
      { name: "Seated DB Shoulder Press",   sets: "3 × 8–10",         rest: "2 min" },
      { name: "Chest-supported Row",        sets: "3 × 10–12",        rest: "90 s",    notes: "Pause at top. Squeeze the rhomboids." },
      { name: "Incline DB Press",           sets: "3 × 10–12",        rest: "90 s" },
      { name: "Cable Lateral Raise",        sets: "3 × 12–15",        rest: "60 s",    notes: "Lean away from cable. Slow eccentric." },
      { name: "EZ-bar Curl + Rope Pushdown (superset)", sets: "3 × 10–12 each", rest: "60 s" },
    ],
    cues: ["Log every working set", "RIR 0–2 on last set of each exercise"],
  },
  {
    type: "lift",
    emoji: "🦵",
    title: "Lower A — Squat focus",
    duration: "70–80 min",
    summary: "Heavy back squat + posterior chain support. Quad-dominant.",
    blocks: [
      { name: "Back Squat",                 sets: "4 × 4–6 @ RPE 8",  rest: "3–4 min", notes: "Belt above 80% 1RM. Brace hard." },
      { name: "Romanian Deadlift",          sets: "3 × 6–8",          rest: "2–3 min", notes: "Don't round. Feel hamstrings stretch." },
      { name: "Leg Press",                  sets: "3 × 10–12",        rest: "2 min",   notes: "Feet mid-platform. Full ROM." },
      { name: "Walking Lunge",              sets: "3 × 10/leg",       rest: "90 s" },
      { name: "Standing Calf Raise",        sets: "4 × 8–12",         rest: "75 s",    notes: "Pause at bottom and top." },
      { name: "Hanging Leg Raise",          sets: "3 × 10–15",        rest: "60 s" },
    ],
    cues: ["No grappling/sparring the day before", "Hydrate + carbs before"],
  },
  {
    type: "lift",
    emoji: "💪",
    title: "Upper B — Pull focus",
    duration: "60–75 min",
    summary: "Heavy vertical pull + horizontal volume. Back-dominant.",
    blocks: [
      { name: "Weighted Chin-up",           sets: "4 × 4–6 @ RPE 8",  rest: "3 min",   notes: "Supinated grip. Add weight progressively." },
      { name: "Incline Barbell Press",      sets: "4 × 6–8",          rest: "2–3 min" },
      { name: "Barbell Row (Pendlay)",      sets: "3 × 8–10",         rest: "2 min",   notes: "Pull to lower chest, dead-stop each rep." },
      { name: "Standing Overhead Press",    sets: "3 × 8–10",         rest: "2 min" },
      { name: "Face Pull",                  sets: "3 × 15–20",        rest: "60 s",    notes: "Pause at face, external rotation at peak." },
      { name: "Preacher Curl + Skullcrusher (superset)", sets: "3 × 10–12 each", rest: "60 s" },
    ],
  },
  {
    type: "lift",
    emoji: "🪨",
    title: "Lower B — Deadlift focus",
    duration: "70–80 min",
    summary: "Heavy conventional deadlift + posterior support. Hip-dominant.",
    blocks: [
      { name: "Conventional Deadlift",      sets: "4 × 3–5 @ RPE 8",  rest: "3–4 min", notes: "Reset every rep. No bounce." },
      { name: "Front Squat",                sets: "3 × 6–8",          rest: "2–3 min" },
      { name: "Hip Thrust",                 sets: "3 × 8–10",         rest: "2 min",   notes: "Pause + squeeze at top." },
      { name: "Seated Leg Curl",            sets: "3 × 10–12",        rest: "90 s" },
      { name: "Seated Calf Raise",          sets: "4 × 10–15",        rest: "75 s" },
      { name: "Cable Crunch",               sets: "3 × 12–15",        rest: "60 s" },
    ],
    cues: ["Lift earlier in day if sparring later", "Eat carbs pre-session"],
  },
  {
    type: "muay",
    emoji: "🥊",
    title: "Muay Thai — class",
    duration: "75–90 min",
    summary: "Pads + drills + light technical sparring. Sharpen tools without hammering recovery.",
    blocks: [
      { name: "Warm-up + skipping",         sets: "10 min" },
      { name: "Shadow boxing",              sets: "3 × 3 min",        rest: "60 s",    notes: "Move with intent. Visualize a live opponent." },
      { name: "Pad rounds",                 sets: "5 × 3 min",        rest: "60 s",    notes: "Combos under fatigue. Sharp shapes." },
      { name: "Technique drill (clinch / teep / kick)", sets: "10–15 min" },
      { name: "Conditioning finisher",      sets: "5 min",            notes: "Burpees / sprawls / knees on bag." },
    ],
    cues: ["Skill > intensity on bulk", "Don't go 100% — staying healthy > peaking"],
  },
  {
    type: "muay",
    emoji: "🥊",
    title: "Muay Thai — sparring",
    duration: "60–75 min",
    summary: "Technical sparring — timing, not power. Build ring IQ.",
    blocks: [
      { name: "Warm-up + shadow",           sets: "10 min" },
      { name: "Pad refresh",                sets: "2 × 3 min" },
      { name: "Technical sparring",         sets: "4–6 × 3 min",      rest: "60–90 s", notes: "50–70% power. Work specific scenarios (countering left kick, jab entries)." },
      { name: "Clinch sparring",            sets: "3 × 3 min",        rest: "60 s" },
      { name: "Cool-down + journal",        sets: "5 min",            notes: "Write 1 thing that worked, 1 to fix." },
    ],
    cues: ["Protect knees + head", "Lift was 24h+ ago so legs are fresh"],
  },
  {
    type: "bjj",
    emoji: "🥋",
    title: "BJJ — fundamentals",
    duration: "75–90 min",
    summary: "Drill the basic positions until they're automatic. Survival > offence at white belt.",
    blocks: [
      { name: "Warm-up + breakfalls",       sets: "10 min" },
      { name: "Technique of the day",       sets: "20 min",           notes: "Drill both sides. Slow then with resistance." },
      { name: "Positional rounds",          sets: "3–4 × 4 min",      rest: "60 s",    notes: "Start from specific position (mount escape, side control, guard pass)." },
      { name: "Live rolling",               sets: "2–3 × 5 min",      rest: "60 s",    notes: "Focus: don't tap to anything you can prevent." },
      { name: "Notes",                      sets: "5 min",            notes: "Write the technique and one failure mode." },
    ],
    cues: ["Tap early, learn", "Breathe through bad positions"],
  },
  {
    type: "bjj",
    emoji: "🥋",
    title: "BJJ — open mat",
    duration: "60–90 min",
    summary: "Roll with everyone. Volume of mat time → fastest progression.",
    blocks: [
      { name: "Light warm-up",              sets: "10 min" },
      { name: "Rolls",                      sets: "5–7 × 5 min",      rest: "60–90 s", notes: "Mix higher belts (survive) and own belts (work offence)." },
      { name: "Post-roll journal",          sets: "5 min",            notes: "What got me? What worked? One thing to study this week." },
    ],
  },
  {
    type: "run",
    emoji: "🏃",
    title: "Z2 easy run",
    duration: "30–40 min",
    summary: "Aerobic base. Low enough HR that you could hold a conversation. Don't steal lift recovery.",
    blocks: [
      { name: "Easy run",                   sets: "30–40 min",        notes: "HR 130–150 (or nasal-breathe test). If you can't, slow down." },
    ],
    cues: ["Day after lift, not before", "If legs feel beat → walk briskly instead"],
  },
];

// Match an action title to a program session.
export function sessionForAction(title: string): Session | null {
  const t = title.toLowerCase();
  if (t.startsWith("upper a")) return SESSIONS[0];
  if (t.startsWith("lower a")) return SESSIONS[1];
  if (t.startsWith("upper b")) return SESSIONS[2];
  if (t.startsWith("lower b")) return SESSIONS[3];
  if (t.includes("muay thai") && t.includes("class")) return SESSIONS[4];
  if (t.includes("muay thai") && t.includes("spar")) return SESSIONS[5];
  if (t.includes("bjj") && t.includes("fundamentals")) return SESSIONS[6];
  if (t.includes("bjj") && (t.includes("open mat") || t.includes("roll"))) return SESSIONS[7];
  if (t.includes("z2") || t.includes("easy run") || t.includes("run")) return SESSIONS[8];
  return null;
}

// Weekly schedule view (for "this week"). Aligned to Iron Fist (Brisbane) timetable.
export const WEEK_SCHEDULE = [
  { day: "Mon", session: "Upper A — Push (lift)",                              type: "lift" },
  { day: "Tue", session: "BJJ Gi — Fundamentals · 5:30pm",                     type: "bjj"  },
  { day: "Wed", session: "Lower A — Squat (lift)",                             type: "lift" },
  { day: "Thu", session: "Muay Thai — Int/Adv · 5:30pm",                       type: "muay" },
  { day: "Fri", session: "Upper B — Pull  +  BJJ Open Mat · 5:30pm",           type: "lift" },
  { day: "Sat", session: "MT Sparring · 9am  +  Lower B — Deadlift (PM)",      type: "lift" },
  { day: "Sun", session: "Z2 easy run  +  long walk",                          type: "run"  },
] as const;
