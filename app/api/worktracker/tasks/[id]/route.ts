import { NextRequest, NextResponse } from "next/server";

const WORK_TRACKER_BASE = "https://work-tracker-drab.vercel.app";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.text();
  const res = await fetch(`${WORK_TRACKER_BASE}/api/tasks/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${WORK_TRACKER_BASE}/api/tasks/${params.id}`, { method: "DELETE" });
  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
