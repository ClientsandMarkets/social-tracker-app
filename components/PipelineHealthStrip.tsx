"use client";

import { useMemo } from "react";
import type { Post } from "@/lib/types";

// PRD §6.3 — a summary row at the top of the calendar: counts of Planned,
// In progress, Ready, and At risk for the current week or month, so status
// is visible without scrolling or counting manually.
//
// "This week" / "this month" mean the actual calendar week (Sun–Sat) and
// calendar month containing today — matching what the calendar grid below
// shows. The week/month toggle is controlled by the parent (app/page.tsx)
// rather than kept as local state here: the calendar grid itself needs to
// switch to a genuine week view when "this week" is selected, not just
// change these four numbers while the grid keeps showing the full month —
// that mismatch was confusing enough that it read as a bug. Local
// calendar-field math (getFullYear/getMonth/getDate) is used throughout,
// not UTC, for the same reason toISODate in app/page.tsx does — mixing
// local construction with UTC serialization is what caused the earlier
// date off-by-one bugs.
//
// "At risk" is a slightly wider net than the exact single-day webhook
// trigger in §8 (which fires only at exactly 2 days out): anything overdue
// or due within 2 days, and still Planned/In progress, counts — and unlike
// the Planned/In progress/Ready tiles, it's independent of the week/month
// toggle, since an overdue post is at risk no matter which window you're
// looking at.
function localMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function PipelineHealthStrip({
  posts,
  viewMode,
  onViewModeChange,
}: {
  posts: Post[];
  viewMode: "week" | "month";
  onViewModeChange: (v: "week" | "month") => void;
}) {
  const counts = useMemo(() => {
    const today = localMidnight(new Date());

    let rangeStart: Date;
    let rangeEnd: Date;
    if (viewMode === "week") {
      rangeStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
      rangeEnd = new Date(today.getFullYear(), today.getMonth(), rangeStart.getDate() + 6);
    } else {
      rangeStart = new Date(today.getFullYear(), today.getMonth(), 1);
      rangeEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const inRange = posts.filter((p) => {
      if (p.archived_at) return false;
      const scheduled = parseLocalDate(p.scheduled_date);
      return scheduled >= rangeStart && scheduled <= rangeEnd;
    });

    const atRisk = posts.filter((p) => {
      if (p.archived_at) return false;
      if (p.status !== "Planned" && p.status !== "In progress") return false;
      const scheduled = parseLocalDate(p.scheduled_date);
      const daysOut = (scheduled.getTime() - today.getTime()) / 86400000;
      return daysOut <= 2; // overdue (negative) or due within 2 days
    });

    return {
      planned: inRange.filter((p) => p.status === "Planned").length,
      inProgress: inRange.filter((p) => p.status === "In progress").length,
      ready: inRange.filter((p) => p.status === "Ready").length,
      atRisk: atRisk.length,
    };
  }, [posts, viewMode]);

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
            onClick={() => onViewModeChange(w)}
            className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
              viewMode === w ? "bg-white text-ink shadow-sm" : "text-zinc-500"
            }`}
          >
            this {w}
          </button>
        ))}
      </div>
    </div>
  );
}
