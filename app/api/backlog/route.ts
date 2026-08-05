import { NextRequest, NextResponse } from "next/server";
import { listBacklog, createBacklogItem } from "@/lib/db";
import { isEditorName } from "@/lib/editors";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listBacklog());
}

export async function POST(req: NextRequest) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can add backlog items." }, { status: 403 });
  }
  const { title, description, tags } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }
  const item = await createBacklogItem(title, description || null, tags || []);
  return NextResponse.json(item, { status: 201 });
}
