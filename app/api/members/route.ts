import { NextRequest, NextResponse } from "next/server";
import { listTeamMembers, createTeamMember } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

// Work Tracker's assignee/identity pool. Open to any current identity (same
// as the rest of Work Tracker -- no editor gate), since it's just a shared
// roster, not sensitive data.
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  return NextResponse.json(await listTeamMembers());
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required." }, { status: 400 });
  const existing = await listTeamMembers();
  if (existing.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: "That name is already in the list." }, { status: 409 });
  }
  const member = await createTeamMember({ name, color: body.color || null });
  return NextResponse.json(member, { status: 201 });
}
