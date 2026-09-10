import {
  countHolidays,
  countRegulatoryDates,
  countRecurringRules,
  countTeamMembers,
  createHoliday,
  createRegulatoryDate,
  createRecurringRule,
  createTeamMember,
} from "./db";
import { HOLIDAY_SEED, isWeekendDate } from "./holiday-seed";
import { REGULATORY_SEED } from "./regulatory-seed";
import { RECURRING_RULE_SEED } from "./recurring-rules-seed";

// Starting roster + colors -- matches the hardcoded ASSIGNEES/PEOPLE_COLOR
// that used to live in workspace.html before the list became editable.
const TEAM_MEMBER_SEED: { name: string; color: string }[] = [
  { name: "Damini", color: "#B31E7D" },
  { name: "Harshada", color: "#0E8F7D" },
  { name: "Jimmy", color: "#7A4FBE" },
  { name: "Prachi", color: "#D97706" },
  { name: "Saniya", color: "#D9524B" },
  { name: "Simran", color: "#7C3AED" },
  { name: "Twinkle", color: "#2B8FD9" },
  { name: "Sonali", color: "#059669" },
];

let seeded = false;

// Idempotent: only inserts if the relevant table is empty, so re-deploys and
// dev restarts don't duplicate rows. This runs once per server process, not
// once per request.
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  if ((await countHolidays()) === 0) {
    for (const h of HOLIDAY_SEED) {
      await createHoliday({ ...h, is_weekend: isWeekendDate(h.date) });
    }
  }
  if ((await countRegulatoryDates()) === 0) {
    for (const r of REGULATORY_SEED) {
      await createRegulatoryDate(r);
    }
  }
  if ((await countRecurringRules()) === 0) {
    for (const r of RECURRING_RULE_SEED) {
      await createRecurringRule(r);
    }
  }
  if ((await countTeamMembers()) === 0) {
    for (const m of TEAM_MEMBER_SEED) {
      await createTeamMember(m);
    }
  }
}
