import { NextRequest, NextResponse } from "next/server";

// Work Tracker (https://work-tracker-drab.vercel.app) is a separate live
// Next.js + Postgres app with its own database — this route proxies to its
// public /api/tasks endpoint rather than duplicating DB credentials here.
// A same-origin proxy is required, not optional: work-tracker's API sends
// no Access-Control-Allow-Origin header, so a browser fetch() straight from
// this app's domain to work-tracker's domain is blocked by CORS. Routing
// through our own server (server-to-server fetches aren't subject to CORS)
// sidesteps that without touching work-tracker's code at all.
const WORK_TRACKER_BASE = "https://work-tracker-drab.vercel.app";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const res = await fetch(`${WORK_TRACKER_BASE}/api/tasks${search}`, { cache: "no-store" });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const res = await fetch(`${WORK_TRACKER_BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const responseBody = await res.text();
  return new NextResponse(responseBody, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
