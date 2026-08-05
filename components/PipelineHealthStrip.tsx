"use client";

import { useMemo, useState } from "react";
import type { Post } from "@/lib/types";

// PRD §6.3 — a summary row at the top of the calendar: counts of Planned,
// In progress, Ready, and At risk for the current week or month, so status
// is visible without scrolling or counting manually.
//
// "At risk" here is a slightly wider net than the exact single-day webhook
// trigger in §8 (which fires only at exactly 2 days out) — for a glanceable
// health count, anything due within 2 days (or already overdue) and still
// Planned/In progress counts, otherwise the strip would read "0 at risk"
// almost all the time.
export default function PipelineHealthStrip({ posts }: { posts: Post[] }) {
  const [window_, setWindow] = useState<"week" | "month">("month");

  const counts = useMemo(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const rangeEnd = new Date(today);
    if (window_ === "week") rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 7);
    else rangeEnd.setUTCMonth(rangeEnd.getUTCMonth() + 1);

    const inRange = posts.filter((p) => {
      if (p.archived_at) return false;
      const d = new Date(p.scheduled_date + "T00:00:00Z");
      return d >= today && d <= rangeEnd;
    });

    const atRisk = inRange.filter((p) => {
      if (p.status !== "Planned" && p.status !== "In progress") return false;
      const d = new Date(p.scheduled_date + "T00:00:00Z");
      const daysOut = (d.getTime() - today.getTime()) / 86400000;
      return daysOut <= 2;
    });

    return {
      planned: inRange.filter((p) => p.status === "Planned").length,
      inProgress: inRange.filter((p) => p.status === "In progress").length,
      ready: inRange.filter((p) => p.status === "Ready").length,
      atRisk: atRisk.length,
    };
  }, [posts, window_]);

  const tiles = [
    { label: "Planned", value: counts.planned, color: "text-zinc-600" },
    { label: "In progress", value: counts.inProgress, color: "text-amber-600" },
    { label: "Ready", value: counts.ready, color: "text-blue-600" },
    { label: "At risk", value: counts.atRisk, color: "text-red-600" },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white p-3 shadow-sm sm:gap-6">
      {tiles.map((t) => (
        <div key={t.label} className="flex items-baseline gap-1.5">
          <span className={`font-heading text-xl font-semibold ${t.color}`}>{t.value}</span>
          <span className="text-xs font-medium text-zinc-500">{t.label}</span>
        </div>
      ))}
      <div className="ml-auto inline-flex rounded-lg border border-line bg-zinc-50 p-0.5 text-xs">
        {(["week", "month"] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
              window_ === w ? "bg-white text-ink shadow-sm" : "text-zinc-500"
            }`}
          >
            this {w}
          </button>
        ))}
      </div>
    </div>
  );
}
