import { NextRequest, NextResponse } from "next/server";
import { listPosts } from "@/lib/db";
import * as XLSX from "xlsx";
export const dynamic = "force-dynamic";

// PRD §15 — export spec: Date live (scheduled date, at the point marked
// Posted), Caption, Creator, Link (optional, not mandatory). Filterable by
// platform, tag, creator, region, status, and date range (PRD §7.4/§6.2).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const region = searchParams.get("region");
  const tag = searchParams.get("tag");
  const creator = searchParams.get("creator");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const all = await listPosts();
  const archived = all.filter((p) => {
    if (!p.archived_at) return false;
    if (platform && !(p.platforms || []).includes(platform as never)) return false;
    if (region && p.region !== region) return false;
    if (tag && !(p.tags || []).includes(tag)) return false;
    if (creator && p.owner !== creator && p.posted_by !== creator) return false;
    if (from && p.scheduled_date < from) return false;
    if (to && p.scheduled_date > to) return false;
    return true;
  });

  const rows = archived.map((p) => ({
    "Date live": p.scheduled_date,
    Caption: p.caption,
    Creator: p.owner,
    Link: p.post_live_link || "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Archive");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="social-content-archive-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
