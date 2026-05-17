import type { Area } from "@/db/schema";
import {
  Dumbbell,
  Wallet,
  ListChecks,
  GraduationCap,
  Users,
  Rocket,
  Flame,
  Brain,
  type LucideIcon,
} from "lucide-react";

export const AREA_META: Record<Area, { label: string; Icon: LucideIcon; blurb: string; accent: string; tint: string }> = {
  health:        { label: "Health",        Icon: Dumbbell,       blurb: "Muay thai, lifting, running, body", accent: "#fb7185", tint: "from-rose-500/15" },
  money:         { label: "Money",         Icon: Wallet,         blurb: "MRR, clients, business ideas",      accent: "#34d399", tint: "from-emerald-500/15" },
  tasks:         { label: "Tasks",         Icon: ListChecks,     blurb: "Chores, meal prep, errands",        accent: "#38bdf8", tint: "from-sky-500/15" },
  study:         { label: "Study",         Icon: GraduationCap,  blurb: "Uni, books, fields of interest",    accent: "#a78bfa", tint: "from-violet-500/15" },
  relationships: { label: "Relationships", Icon: Users,          blurb: "People to stay close with",         accent: "#fb923c", tint: "from-orange-500/15" },
  projects:      { label: "Projects",      Icon: Rocket,         blurb: "Side projects & hobbies",           accent: "#e879f9", tint: "from-fuchsia-500/15" },
  habits:        { label: "Habits",        Icon: Flame,          blurb: "Daily streaks",                     accent: "#fbbf24", tint: "from-amber-500/15" },
  mind:          { label: "Mind",          Icon: Brain,          blurb: "Journal, mood, gratitude",          accent: "#60a5fa", tint: "from-blue-500/15" },
};

export const AREA_ORDER: Area[] = [
  "health",
  "money",
  "tasks",
  "study",
  "relationships",
  "projects",
  "habits",
  "mind",
];
