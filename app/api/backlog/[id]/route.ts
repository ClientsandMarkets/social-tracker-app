import { NextRequest, NextResponse } from "next/server";
import { deleteBacklogItem } from "@/lib/db";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can remove backlog items." }, { status: 403 });
  }
  const ok = await deleteBacklogItem(Number(params.id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
