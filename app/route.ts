import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { ensureSeeded } from "@/lib/seed";

// The unified "Team Workspace" page (Work Tracker + Marketing Tracker, both
// backed by live data) is a single self-contained HTML/CSS/JS document
// rather than a React page tree — a deliberate choice over a full component
// rebuild. A Route Handler at this exact path (no page.tsx alongside it)
// serves that document byte-for-byte, bypassing app/layout.tsx entirely, so
// there's no nested <html>/<body> conflict with the file's own document
// structure. Metadata (title, OG image, robots, JSON-LD) is therefore
// hand-written directly into workspace.html's <head> instead of coming from
// Next.js's metadata API, which only resolves for page.tsx trees.
export const dynamic = "force-dynamic";

export async function GET() {
  await ensureSeeded();
  const html = readFileSync(path.join(process.cwd(), "app", "workspace.html"), "utf8");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
