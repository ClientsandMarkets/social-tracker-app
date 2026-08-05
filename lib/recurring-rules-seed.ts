import type { RecurringRule } from "./types";

export type RecurringRuleSeed = Omit<RecurringRule, "id">;

// PRD §9, with the KSA rule's region corrected to "KSA" rather than the
// broader "Middle East" tag (per the team's region-tagging decision — KSA,
// UAE, and Qatar stay distinct; "Middle East" is reserved for content that
// genuinely spans all three).
export const RECURRING_RULE_SEED: RecurringRuleSeed[] = [
  {
    content_type: "SCC monthly poll",
    cadence: "Monthly",
    target_day_rule: "1st or 2nd of month",
    finalize_by_rule: "Last 2 days of the prior month",
    region: "Global",
    gap_fill_interval_days: 15,
    last_post_date: null,
  },
  {
    content_type: "IPO update — India",
    cadence: "Quarterly",
    target_day_rule: "TBD",
    finalize_by_rule: "TBD",
    region: "India",
    gap_fill_interval_days: 15,
    // Reference anchor from the team: last quarterly IPO update was posted
    // July 22, 2026 — not a fixed rule, just where the gap-fill clock starts.
    last_post_date: "2026-07-22",
  },
  {
    content_type: "IPO update — KSA",
    cadence: "Quarterly",
    target_day_rule: "TBD",
    finalize_by_rule: "TBD",
    region: "KSA",
    gap_fill_interval_days: 15,
    last_post_date: null,
  },
  {
    content_type: "Thought leadership (TL)",
    cadence: "Ad hoc",
    target_day_rule: null,
    finalize_by_rule: null,
    region: "Global/regional specific",
    gap_fill_interval_days: 15,
    last_post_date: null,
  },
];
