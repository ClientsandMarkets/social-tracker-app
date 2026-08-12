import { NextRequest, NextResponse } from "next/server";
import { updateWorkTask, deleteWorkTask } from "@/lib/db";

// See app/api/worktracker/tasks/route.ts — Work Tracker tasks are now stored
// locally; the separate work-tracker-drab app has been retired.
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const updated = await updateWorkTask(Number(params.id), body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const ok = await deleteWorkTask(Number(params.id));
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
