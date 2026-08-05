// The final, pruned regulatory calendar from the PRD review conversation —
// only these five survived the keep/cut pass (PRD §13). Dates recur
// annually; this seed carries the 2026 instance of each. US SEC 10-Q is
// entered as three separate rows (one per 2026 quarter) since each has its
// own date, everything else is a single annual date.

import type { RegulatoryDate } from "./types";

export type RegulatorySeed = Omit<RegulatoryDate, "id">;

export const REGULATORY_SEED: RegulatorySeed[] = [
  {
    occasion: "US SEC Form 10-Q due (Q1, accelerated filers)",
    date: "2026-05-11",
    region: "USA",
    service_line: "ARC",
    product: "Reporting UniVerse",
    notes: "40 days after quarter end for large accelerated / accelerated filers.",
  },
  {
    occasion: "US SEC Form 10-Q due (Q2, accelerated filers)",
    date: "2026-08-10",
    region: "USA",
    service_line: "ARC",
    product: "Reporting UniVerse",
    notes: "40 days after quarter end for large accelerated / accelerated filers.",
  },
  {
    occasion: "US SEC Form 10-Q due (Q3, accelerated filers)",
    date: "2026-11-09",
    region: "USA",
    service_line: "ARC",
    product: "Reporting UniVerse",
    notes: "40 days after quarter end for large accelerated / accelerated filers.",
  },
  {
    occasion: "UAE Corporate Tax return due",
    date: "2026-09-30",
    region: "UAE",
    service_line: "ARC",
    product: null,
    notes: "9 months after FYE Dec 31, 2025 — the dominant deadline for calendar-year filers.",
  },
  {
    occasion: "CBAM definitive-phase annual declaration window opens",
    date: "2026-01-01",
    region: "Global", // applies to any client importing into the EU, not one of our 5 tracked regions
    service_line: "SCC",
    product: null,
    notes: "CBAM shifts from quarterly to annual declarations from this date.",
  },
  {
    occasion: "California SB 253 — Scope 1 & 2 emissions, first disclosure due",
    date: "2026-11-10",
    region: "USA",
    service_line: "SCC",
    product: "ESG UniVerse",
    notes: "Companies >$1B revenue doing business in California; covers FY2025 data. Deadline was postponed to this date.",
  },
  {
    occasion: "India DPDP Act — consent manager provisions effective",
    date: "2026-11-13",
    region: "India",
    service_line: "Tech Consulting",
    product: null,
    notes: "Phase II of the DPDP Rules, 2025 (12 months after Nov 13, 2025 notification).",
  },
];
