import { NextRequest, NextResponse } from "next/server";
import { listPosts, createPost, markBacklogUsed } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { checkCaptionStyle } from "@/lib/style-check";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const posts = await listPosts();
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json();
  const { owner, scheduled_date, caption } = body;

  if (!isEditorName(owner)) {
    return NextResponse.json({ error: "owner must be one of the four editors." }, { status: 403 });
  }
  if (!scheduled_date) {
    return NextResponse.json({ error: "scheduled_date is required." }, { status: 400 });
  }

  const warnings = checkCaptionStyle(caption || "").map((w) => w.message);
  const post = await createPost(body, warnings);

  for (const backlogId of post.backlog_item_ids || []) {
    await markBacklogUsed(backlogId, post.id);
  }

  return NextResponse.json(post, { status: 201 });
}
