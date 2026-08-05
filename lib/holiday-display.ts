// Collapses India's per-location holiday rows into one calendar marker per
// occasion/date, the way any other consulting firm's holiday calendar reads
// (one line for "Independence Day", not five duplicate lines — one per
// office city). Per-location detail (which cities treat it as Mandatory vs
// Floating vs Not Applicable) moves into the tooltip instead of being five
// separate rows on the day cell.
import type { Holiday } from "./types";

export type DisplayHoliday = {
  key: string;
  occasion: string;
  date: string;
  tooltip: string;
};

export function groupHolidaysForCalendar(holidays: Holiday[]): DisplayHoliday[] {
  const groups = new Map<string, Holiday[]>();
  for (const h of holidays) {
    if (!h.date) continue; // dateless TBC entries (Eid) have nothing to place on the grid yet
    const key = `${h.occasion}|${h.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(h);
  }

  const result: DisplayHoliday[] = [];
  for (const [key, rows] of groups) {
    const first = rows[0];
    const indiaRows = rows.filter((r) => r.region === "India" && r.location);
    let tooltip = first.occasion;

    if (indiaRows.length > 0) {
      const byStatus = new Map<string, string[]>();
      for (const r of indiaRows) {
        if (r.status_at_location === "Not Applicable") continue; // not observed there — no point listing it
        if (!byStatus.has(r.status_at_location)) byStatus.set(r.status_at_location, []);
        byStatus.get(r.status_at_location)!.push(r.location!);
      }
      const parts = Array.from(byStatus.entries()).map(([status, locs]) => `${status}: ${locs.join(", ")}`);
      tooltip = `${first.occasion} — ${parts.length ? parts.join(" · ") : "not observed at any tracked location"}`;
    }

    const otherRegions = Array.from(new Set(rows.filter((r) => r.region !== "India").map((r) => r.region)));
    if (otherRegions.length) {
      tooltip += indiaRows.length > 0 ? ` (also ${otherRegions.join(", ")})` : ` (${otherRegions.join(", ")})`;
    }

    result.push({ key, occasion: first.occasion, date: first.date!, tooltip });
  }
  return result;
}
