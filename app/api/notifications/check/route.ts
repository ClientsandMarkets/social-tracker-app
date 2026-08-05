import { NextRequest, NextResponse } from "next/server";
import { runDailyNotificationCheck } from "@/lib/notify";
export const dynamic = "force-dynamic";

// Hit daily by Vercel Cron (see vercel.json). Also safe to call by hand for
// testing — it's read-then-notify, no state mutation beyond the Teams post.
export async function GET(req: NextRequest) {
  // Vercel Cron requests carry this header; a stray public hit without the
  // matching secret is rejected so this can't be used to spam the channel.
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runDailyNotificationCheck();
  return NextResponse.json(result);
}
