// Seed data transcribed directly from the five uploaded 2026 holiday PDFs.
// India carries per-location status (state/city columns from the source
// table); the other four regions carry a single "Public" status.
//
// post_trigger is an editorial judgment call — which occasions are natural
// social-content moments vs. purely regional/observance dates that should
// stay visible on the calendar without prompting a post (PRD §12.2). It's
// stored per-row precisely so the team can correct any individual call via
// the Holidays admin list without touching code.
//
// Eid Al Fitr and Eid Al Adha for Qatar, KSA, and UAE load with date: null,
// tbc: true — the source PDFs don't publish even a provisional date, only a
// footnote that one is coming (PRD §12.3, per the team's decision).

import type { Holiday, Region } from "./types";

export type HolidaySeed = Omit<Holiday, "id" | "created_at" | "is_weekend">;

function dow(date: string): number {
  // UTC to avoid local-timezone off-by-one on the boundary dates.
  return new Date(date + "T00:00:00Z").getUTCDay();
}
export function isWeekendDate(date: string | null): boolean {
  if (!date) return false;
  const d = dow(date);
  return d === 0 || d === 6;
}

const INDIA_LOCATIONS = ["Gurugram/NCR", "Mumbai/Pune", "Bangalore", "Chennai", "Hyderabad"] as const;

function indiaRow(
  occasion: string,
  date: string,
  statuses: [string, string, string, string, string],
  post_trigger: boolean
): HolidaySeed[] {
  return INDIA_LOCATIONS.map((loc, i) => ({
    occasion,
    date,
    region: "India" as Region,
    location: loc,
    status_at_location: (statuses[i] === "M" ? "Mandatory" : statuses[i] === "F" ? "Floating" : "Not Applicable") as Holiday["status_at_location"],
    post_trigger,
    tbc: false,
    source: "upload" as const,
  }));
}

function simpleRow(
  occasion: string,
  date: string | null,
  region: Region,
  post_trigger: boolean,
  tbc = false
): HolidaySeed {
  return {
    occasion,
    date,
    region,
    location: null,
    status_at_location: "Public",
    post_trigger,
    tbc,
    source: "upload",
  };
}

export const HOLIDAY_SEED: HolidaySeed[] = [
  // ---------------- India (location-level: Haryana/Maharashtra/Karnataka/Tamil Nadu/Telangana) ----------------
  ...indiaRow("New Year", "2026-01-01", ["M", "M", "M", "M", "M"], true),
  ...indiaRow("Makar Sakranti/Pongal", "2026-01-14", ["F", "F", "NA", "NA", "M"], false),
  ...indiaRow("Pongal", "2026-01-15", ["NA", "NA", "M", "M", "NA"], false),
  ...indiaRow("Thiruvalluvar Day", "2026-01-16", ["NA", "NA", "NA", "M", "NA"], false),
  ...indiaRow("Republic Day", "2026-01-26", ["M", "M", "M", "M", "M"], true),
  ...indiaRow("Chatrapati Shivaji Jayanti", "2026-02-19", ["F", "F", "NA", "NA", "NA"], false),
  ...indiaRow("Holi", "2026-03-04", ["M", "M", "F", "F", "M"], true),
  ...indiaRow("Ugadi/Telugu New Year's Day/Gudi Padwa", "2026-03-19", ["F", "F", "M", "F", "M"], false),
  ...indiaRow("Ram Navami", "2026-03-27", ["M", "F", "F", "F", "F"], false),
  ...indiaRow("Mahavir Jayanti", "2026-03-31", ["F", "F", "F", "F", "F"], false),
  ...indiaRow("Good Friday", "2026-04-03", ["M", "M", "M", "M", "M"], true),
  ...indiaRow("Tamil New Year/Dr. B.R. Ambedkar Jayanti/Vishu", "2026-04-14", ["NA", "F", "F", "M", "NA"], false),
  ...indiaRow("May Day/Labour Day/Maharashtra Din/Buddha Pournima", "2026-05-01", ["F", "M", "M", "M", "F"], false),
  ...indiaRow("Eid al-Adha/Id-ul-Adha/Bakrid", "2026-05-27", ["F", "M", "F", "F", "F"], true),
  ...indiaRow("Telangana Day", "2026-06-02", ["NA", "NA", "NA", "NA", "F"], false),
  ...indiaRow("Muharram", "2026-06-26", ["F", "F", "NA", "F", "F"], false),
  ...indiaRow("Eid-e-Milad", "2026-08-25", ["F", "F", "F", "F", "F"], false),
  ...indiaRow("Onam", "2026-08-26", ["NA", "NA", "F", "NA", "NA"], false),
  ...indiaRow("Raksha Bandhan", "2026-08-28", ["F", "F", "F", "F", "F"], true),
  ...indiaRow("Krishna Janmashtami", "2026-09-04", ["M", "F", "F", "F", "F"], false),
  ...indiaRow("Vinayaka Chaturthi/Varasiddhi Vinayaka Vrata/Ganesh Chaturthi", "2026-09-14", ["F", "M", "F", "F", "F"], false),
  ...indiaRow("Ganesh Visarjan/Nimmarjan", "2026-09-23", ["NA", "NA", "NA", "NA", "M"], false),
  ...indiaRow("Mahatma Gandhi Jayanti", "2026-10-02", ["M", "M", "M", "M", "M"], true),
  ...indiaRow("Ayutha Pooja/Dussehra", "2026-10-20", ["M", "M", "M", "M", "M"], false),
  ...indiaRow("Vijayadashami", "2026-10-21", ["NA", "NA", "F", "NA", "NA"], false),
  ...indiaRow("Gowardhan Pooja", "2026-11-09", ["F", "F", "F", "F", "F"], false),
  ...indiaRow("Diwali (as per Karnataka circular)", "2026-11-10", ["NA", "NA", "M", "NA", "NA"], true),
  ...indiaRow("Bhai Duj", "2026-11-11", ["F", "F", "NA", "NA", "F"], false),
  ...indiaRow("Guru Nanak Dev Jayanti", "2026-11-24", ["M", "NA", "NA", "F", "NA"], true),
  ...indiaRow("Christmas", "2026-12-25", ["M", "M", "M", "M", "M"], true),
  // India — national, falls on a weekend this year (visible marker only per source table;
  // still post_trigger per the team's "weekend doesn't matter" decision for major occasions).
  simpleRow("Maha Shivratri", "2026-02-15", "India", false),
  simpleRow("Khutba-e-Ramzan/Eid al-Fitr/Id ul-Fitr", "2026-03-21", "India", true),
  simpleRow("Independence Day", "2026-08-15", "India", true),
  simpleRow("Haryana Day/Kannada Rajyothsava", "2026-11-01", "India", false),
  simpleRow("Diwali", "2026-11-08", "India", true),

  // ---------------- USA ----------------
  simpleRow("New Year", "2026-01-01", "USA", true),
  simpleRow("Martin Luther King Jr. Day", "2026-01-19", "USA", true),
  simpleRow("President's Day", "2026-02-16", "USA", false),
  simpleRow("Memorial Day", "2026-05-25", "USA", true),
  simpleRow("Juneteenth Day", "2026-06-19", "USA", true),
  simpleRow("Independence Day (observed)", "2026-07-03", "USA", true),
  simpleRow("Labor Day", "2026-09-07", "USA", true),
  simpleRow("Thanksgiving Day", "2026-11-26", "USA", true),
  simpleRow("Thanksgiving Day (after)", "2026-11-27", "USA", false),
  simpleRow("Christmas Eve", "2026-12-24", "USA", false),
  simpleRow("Christmas", "2026-12-25", "USA", true),
  // USA — falls on a weekend
  simpleRow("Independence Day", "2026-07-04", "USA", false),
  simpleRow("Halloween", "2026-10-31", "USA", false),
  simpleRow("Diwali", "2026-11-08", "USA", false),

  // ---------------- UAE ----------------
  simpleRow("New Year", "2026-01-01", "UAE", true),
  simpleRow("Arafat Day", "2026-05-26", "UAE", true),
  simpleRow("Islamic New Year/Muharram", "2026-06-15", "UAE", false),
  simpleRow("Prophet Muhammad's Birthday", "2026-08-25", "UAE", false),
  simpleRow("National Day", "2026-12-02", "UAE", true),
  simpleRow("National Day Holiday", "2026-12-03", "UAE", false),
  simpleRow("Eid Al Fitr", null, "UAE", true, true),
  simpleRow("Eid Al Adha", null, "UAE", true, true),

  // ---------------- KSA ----------------
  simpleRow("New Year", "2026-01-01", "KSA", true),
  simpleRow("Founding Day", "2026-02-22", "KSA", true),
  simpleRow("Arafat Day", "2026-05-26", "KSA", true),
  simpleRow("Saudi National Day", "2026-09-23", "KSA", true),
  simpleRow("Eid Al Fitr", null, "KSA", true, true),
  simpleRow("Eid Al Adha", null, "KSA", true, true),

  // ---------------- Qatar ----------------
  simpleRow("New Year", "2026-01-01", "Qatar", true),
  simpleRow("Qatar Sports Day", "2026-02-10", "Qatar", true),
  simpleRow("Eid Al Fitr", null, "Qatar", true, true),
  simpleRow("Eid Al Adha", null, "Qatar", true, true),
];
