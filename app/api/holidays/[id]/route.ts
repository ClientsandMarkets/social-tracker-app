import { NextRequest, NextResponse } from "next/server";
import { updateHoliday } from "@/lib/db";
import { isWeekendDate } from "@/lib/holiday-seed";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

// Used for two things: correcting a post_trigger editorial call, and filling
// in a TBC entry's real date once it's confirmed by the Ministry (PRD §12.3).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can edit holidays." }, { status: 403 });
  }
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if (body.date !== undefined) {
    patch.date = body.date;
    patch.is_weekend = isWeekendDate(body.date);
  }
  if (body.post_trigger !== undefined) patch.post_trigger = body.post_trigger;
  if (body.status_at_location !== undefined) patch.status_at_location = body.status_at_location;

  const holiday = await updateHoliday(Number(params.id), patch);
  if (!holiday) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(holiday);
}
