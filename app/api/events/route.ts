import { NextRequest, NextResponse } from "next/server";
import { listEvents, createEvent } from "@/lib/db";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await listEvents());
}

export async function POST(req: NextRequest) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can create events." }, { status: 403 });
  }
  const { name, event_date, creative_suggestion } = await req.json();
  if (!name || !event_date) {
    return NextResponse.json({ error: "name and event_date are required." }, { status: 400 });
  }
  // Creating an event auto-generates its pre-/post-event posts (PRD §10).
  const event = await createEvent(name, event_date, creative_suggestion || null, actingUser);
  return NextResponse.json(event, { status: 201 });
}
