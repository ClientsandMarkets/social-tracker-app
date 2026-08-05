import {
  countHolidays,
  countRegulatoryDates,
  countRecurringRules,
  createHoliday,
  createRegulatoryDate,
  createRecurringRule,
} from "./db";
import { HOLIDAY_SEED, isWeekendDate } from "./holiday-seed";
import { REGULATORY_SEED } from "./regulatory-seed";
import { RECURRING_RULE_SEED } from "./recurring-rules-seed";

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
}
