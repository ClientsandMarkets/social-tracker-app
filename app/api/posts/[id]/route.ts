import { NextRequest, NextResponse } from "next/server";
import { getPost, updatePost, deletePost, clonePost, markBacklogUsed } from "@/lib/db";
import { checkCaptionStyle } from "@/lib/style-check";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const post = await getPost(Number(params.id));
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can update posts." }, { status: 403 });
  }

  // Manual flip only — never auto-set by the scheduled date, and the flip
  // itself must name who did it (PRD §5, §7.2's "posted by" attribution).
  if (body.status === "Posted" && !body.posted_by) {
    body.posted_by = actingUser;
  }

  const warnings =
    typeof body.caption === "string" ? checkCaptionStyle(body.caption).map((w) => w.message) : null;

  const post = await updatePost(Number(params.id), body, warnings);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  for (const backlogId of body.backlog_item_ids || []) {
    await markBacklogUsed(backlogId, post.id);
  }

  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can delete posts." }, { status: 403 });
  }
  // Per the team's decision: hard delete is allowed, but only for entries
  // already in the archive — the active pipeline is never hard-deletable.
  const ok = await deletePost(Number(params.id));
  if (!ok) {
    return NextResponse.json(
      { error: "Not found, or not archived yet — only archived entries can be hard-deleted." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}

// Clone/duplicate (PRD §7.1).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const actingUser = req.headers.get("x-current-user") || body.owner;
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can clone posts." }, { status: 403 });
  }
  const clone = await clonePost(Number(params.id), actingUser);
  if (!clone) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(clone, { status: 201 });
}
