import { NextRequest, NextResponse } from "next/server";
import { computeSuggestions, triggerTag } from "@/lib/suggestions";
import { dismissSuggestion, createPost, listBacklog } from "@/lib/db";
import { isEditorName } from "@/lib/editors";
export const dynamic = "force-dynamic";

export async function GET() {
  const suggestions = await computeSuggestions();
  return NextResponse.json(suggestions);
}

// Accept or dismiss a suggestion. Both are no-fuss actions with no
// consequence on dismiss (PRD §8, §11) — accepting creates a Planned post
// pre-filled from the idea backlog where one exists (editor picks which
// backlog item(s), possibly more than one, per the team's decision).
export async function POST(req: NextRequest) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can act on suggestions." }, { status: 403 });
  }
  const body = await req.json();
  const { action, key, title, date, regions, default_caption, backlog_item_ids } = body;

  if (action === "dismiss") {
    await dismissSuggestion(key);
    return NextResponse.json({ ok: true });
  }

  if (action === "accept") {
    const backlog = backlog_item_ids?.length ? await listBacklog() : [];
    const picked = backlog.filter((b) => backlog_item_ids?.includes(b.id));
    // Backlog idea(s) the editor explicitly picked win if present; otherwise
    // fall back to the suggestion's pre-written caption (e.g. "Wishing
    // everyone a happy Diwali!") rather than the bare occasion title — the
    // client always sends this for holiday suggestions, computed in
    // lib/suggestions.ts. Only a title-only suggestion (no backlog pick, no
    // default_caption — e.g. a regulatory or gap-fill trigger) falls all the
    // way through to the plain title.
    const captionSeed = picked.map((b) => b.title).join(" / ") || default_caption || title || "";
    const post = await createPost(
      {
        platforms: ["LinkedIn"],
        scheduled_date: date || new Date().toISOString().slice(0, 10),
        status: "Planned",
        caption: captionSeed,
        owner: actingUser,
        tags: [triggerTag(key)],
        region: regions?.[0] || null,
        backlog_item_ids: backlog_item_ids || [],
        notes: `Created from suggestion: ${title}`,
      },
      []
    );
    return NextResponse.json(post, { status: 201 });
  }

  return NextResponse.json({ error: "action must be 'accept' or 'dismiss'." }, { status: 400 });
}
