// Teams notifications (PRD §7.3/§8). Delivery is a single incoming webhook
// for v1 (per the team's decision: fine for now that this means one shared
// channel with the owner named in plain text, not a real per-person ping —
// Graph API @mentions are the acknowledged v2 upgrade).

import { listPosts } from "./db";
import { computeSuggestions } from "./suggestions";
import type { Post } from "./types";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type AlertBatch = {
  dayBefore: Post[];
  atRisk: Post[];
  readyToPost: Post[];
  suggestionCount: number;
  lines: string[];
};

export async function computeAlertBatch(today: string): Promise<AlertBatch> {
  const posts = await listPosts();
  const active = posts.filter((p) => p.status !== "Posted" && !p.archived_at);

  const tomorrow = addDays(today, 1);
  const dayBefore = active.filter((p) => p.scheduled_date === tomorrow);

  const twoDaysOut = addDays(today, 2);
  const atRisk = active.filter(
    (p) => p.scheduled_date === twoDaysOut && (p.status === "Planned" || p.status === "In progress")
  );

  const readyToPost = active.filter((p) => p.scheduled_date === today && p.status === "Ready");

  const suggestions = await computeSuggestions();

  const lines: string[] = [];
  if (dayBefore.length) {
    lines.push("**Day-before reminders**");
    dayBefore.forEach((p) => lines.push(`- ${p.owner}: "${p.caption.slice(0, 60) || "(no caption yet)"}" is scheduled for tomorrow (${p.scheduled_date}), status: ${p.status}.`));
  }
  if (atRisk.length) {
    lines.push("**At-risk (2 days out, still Planned/In progress)**");
    atRisk.forEach((p) => lines.push(`- ${p.owner}: "${p.caption.slice(0, 60) || "(no caption yet)"}" due ${p.scheduled_date}, still ${p.status}.`));
  }
  if (readyToPost.length) {
    lines.push("**Ready to post today**");
    readyToPost.forEach((p) => lines.push(`- ${p.owner}: "${p.caption.slice(0, 60) || "(no caption yet)"}" is Ready and scheduled for today.`));
  }
  if (suggestions.length) {
    lines.push(`**${suggestions.length} open suggestion(s)** (gap-fill / holiday / regulatory) — review in the tracker.`);
  }

  return { dayBefore, atRisk, readyToPost, suggestionCount: suggestions.length, lines };
}

export async function sendTeamsMessage(text: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return { ok: false, error: "TEAMS_WEBHOOK_URL is not set." };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { ok: false, error: `Teams webhook returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function runDailyNotificationCheck(): Promise<{ sent: boolean; batch: AlertBatch; error?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const batch = await computeAlertBatch(today);
  if (!batch.lines.length) return { sent: false, batch };
  const result = await sendTeamsMessage(
    `**Social Content Tracker — daily check (${today})**\n\n${batch.lines.join("\n")}`
  );
  return { sent: result.ok, batch, error: result.error };
}
