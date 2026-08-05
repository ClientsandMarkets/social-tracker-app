// Computes the three dismissible suggestion types from PRD §8/§11: gap-fill,
// holiday content-trigger, and regulatory content-trigger. All three are
// "accept (creates a Planned entry) or dismiss (no consequence)" — never a
// mandate.
//
// Holiday triggers merge across regions: if the same occasion falls on the
// same date in more than one tracked region (Diwali landing on Nov 8, 2026
// in both the India and USA lists is the real example that drove this), it
// surfaces as ONE suggestion tagged with every region it applies to, not one
// duplicate per region — per the team's explicit decision. Per that same
// conversation, a holiday still triggers a suggestion even when it falls on
// a weekend; §12.4's "weekend holidays are passive markers" only applies to
// holidays that aren't flagged post_trigger in the first place.

import { listPosts, listHolidays, listRegulatoryDates, listRecurringRules, listDismissed } from "./db";
import type { Holiday, RegulatoryDate, RecurringRule } from "./types";

export type Suggestion = {
  key: string;
  kind: "holiday" | "regulatory" | "gapfill";
  title: string;
  detail: string;
  date: string | null;
  regions: string[];
  defaultCaption?: string;
};

function hasAcceptedTrigger(posts: { tags: string[] }[], key: string): boolean {
  const tag = `trigger:${key}`;
  return posts.some((p) => (p.tags || []).includes(tag));
}

export function triggerTag(key: string): string {
  return `trigger:${key}`;
}

export async function computeSuggestions(): Promise<Suggestion[]> {
  const [posts, holidays, regulatory, rules, dismissed] = await Promise.all([
    listPosts(),
    listHolidays(),
    listRegulatoryDates(),
    listRecurringRules(),
    listDismissed(),
  ]);
  const dismissedSet = new Set(dismissed);
  const suggestions: Suggestion[] = [];

  // ---- Holiday triggers, grouped by (occasion, date) across regions ----
  const groups = new Map<string, Holiday[]>();
  for (const h of holidays) {
    if (!h.post_trigger || !h.date || h.tbc) continue; // dateless TBC entries can't trigger yet
    const gkey = `${h.occasion.trim().toLowerCase()}|${h.date}`;
    if (!groups.has(gkey)) groups.set(gkey, []);
    groups.get(gkey)!.push(h);
  }
  for (const [, group] of groups) {
    const first = group[0];
    const regions = Array.from(new Set(group.map((g) => g.region)));
    const key = `holiday:${first.occasion.trim().toLowerCase()}:${first.date}`;
    if (dismissedSet.has(key) || hasAcceptedTrigger(posts, key)) continue;
    suggestions.push({
      key,
      kind: "holiday",
      title: first.occasion,
      detail: `${first.date} — ${regions.join(", ")}${first.is_weekend ? " (falls on a weekend — still a post-trigger occasion)" : ""}`,
      date: first.date,
      regions,
      defaultCaption: `Wishing everyone a happy ${first.occasion}!`,
    });
  }

  // ---- Regulatory triggers ----
  for (const r of regulatory) {
    const key = `regulatory:${r.id}`;
    if (dismissedSet.has(key) || hasAcceptedTrigger(posts, key)) continue;
    suggestions.push({
      key,
      kind: "regulatory",
      title: r.occasion,
      detail: `${r.date} — ${r.service_line}${r.product ? ` · ${r.product}` : ""}${r.notes ? ` — ${r.notes}` : ""}`,
      date: r.date,
      regions: [r.region],
    });
  }

  // ---- Gap-fill: days since last post of a recurring content type exceeds its interval ----
  const today = new Date().toISOString().slice(0, 10);
  for (const rule of rules) {
    if (!rule.last_post_date) continue; // no baseline yet — nothing to measure gap against
    const elapsedDays = Math.floor(
      (new Date(today).getTime() - new Date(rule.last_post_date).getTime()) / 86400000
    );
    if (elapsedDays < rule.gap_fill_interval_days) continue;
    const key = `gapfill:${rule.content_type}:${rule.last_post_date}`;
    if (dismissedSet.has(key) || hasAcceptedTrigger(posts, key)) continue;
    suggestions.push({
      key,
      kind: "gapfill",
      title: `${rule.content_type} is overdue`,
      detail: `${elapsedDays} days since the last post (interval: ${rule.gap_fill_interval_days} days). Last posted ${rule.last_post_date}.`,
      date: null,
      regions: [String(rule.region)],
    });
  }

  return suggestions;
}
