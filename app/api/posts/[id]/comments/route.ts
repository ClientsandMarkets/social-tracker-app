import { NextRequest, NextResponse } from "next/server";
import { listComments, addComment } from "@/lib/db";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await listComments(Number(params.id)));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can comment." }, { status: 403 });
  }
  const { body } = await req.json();
  if (!body || !String(body).trim()) {
    return NextResponse.json({ error: "body is required." }, { status: 400 });
  }
  const comment = await addComment(Number(params.id), actingUser, body);
  return NextResponse.json(comment, { status: 201 });
}
