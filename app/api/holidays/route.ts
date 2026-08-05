import { NextRequest, NextResponse } from "next/server";
import { listHolidays, createHoliday } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { isWeekendDate } from "@/lib/holiday-seed";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  return NextResponse.json(await listHolidays());
}

// Manual holiday/important-date addition (PRD §12.5) — same fields as the
// uploaded lists: occasion, date, location, status, post-trigger flag.
export async function POST(req: NextRequest) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can add holidays." }, { status: 403 });
  }
  const body = await req.json();
  if (!body.occasion || !body.region) {
    return NextResponse.json({ error: "occasion and region are required." }, { status: 400 });
  }
  const holiday = await createHoliday({
    occasion: body.occasion,
    date: body.date || null,
    region: body.region,
    location: body.location || null,
    status_at_location: body.status_at_location || "Public",
    post_trigger: !!body.post_trigger,
    is_weekend: isWeekendDate(body.date || null),
    tbc: !body.date,
    source: "manual",
  });
  return NextResponse.json(holiday, { status: 201 });
}
