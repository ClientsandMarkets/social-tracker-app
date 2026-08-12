import { NextRequest, NextResponse } from "next/server";
import { listWorkTasks, createWorkTask } from "@/lib/db";

// Work Tracker tasks now live in this app's own database. The route paths
// (/api/worktracker/tasks) and payload shapes are unchanged from when this
// proxied to the separate work-tracker-drab.vercel.app app — that app has
// been retired, so this is the sole source of truth going forward.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const archived = searchParams.get("archived") === "1";
  return NextResponse.json(await listWorkTasks(archived));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.task || !String(body.task).trim()) {
    return NextResponse.json({ error: "task is required." }, { status: 400 });
  }
  const created = await createWorkTask(body);
  return NextResponse.json(created, { status: 201 });
}
