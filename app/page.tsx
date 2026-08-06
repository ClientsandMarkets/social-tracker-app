"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Gift, Scale, CalendarClock } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import PipelineHealthStrip from "@/components/PipelineHealthStrip";
import SuggestionsPanel from "@/components/SuggestionsPanel";
import PostForm from "@/components/PostForm";
import { groupHolidaysForCalendar } from "@/lib/holiday-display";
import type { Post, Holiday, RegulatoryDate, EventRow } from "@/lib/types";

const STATUS_DOT: Record<Post["status"], string> = {
  Planned: "bg-zinc-400",
  "In progress": "bg-amber-500",
  Ready: "bg-blue-500",
  Posted: "bg-green-500",
  Archived: "bg-zinc-300",
};

function monthLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
// Formats using the SAME local calendar fields the grid was built from
// (getFullYear/getMonth/getDate) — never .toISOString(), which converts to
// UTC and silently shifts the date back a day for any timezone ahead of UTC
// (e.g. IST). That mismatch was why every clicked date opened the form on
// the prior day, and why Aug 15 holidays visually landed under the Aug 16
// cell.
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const { isEditor } = useCurrentUser();
  const [cursor, setCursor] = useState(() => new Date());
  // Drives both the health strip's counts AND the grid below — previously
  // the strip had its own internal toggle that only changed its four
  // numbers while the grid kept showing the full month regardless, which
  // read as the toggle simply not working. `cursor` is the shared anchor
  // date for both modes: month mode grids the month containing it, week
  // mode grids the Sun–Sat week containing it. Prev/Next/Today below move
  // `cursor` by a month or by 7 days depending on the mode, so week view is
  // just as browsable as month view — not frozen on "this week" forever.
  const [viewMode, setViewMode] = useState<"week" | "month">("month");
  const [posts, setPosts] = useState<Post[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [regulatory, setRegulatory] = useState<RegulatoryDate[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, h, r, e] = await Promise.all([
      fetch("/api/posts").then((res) => res.json()),
      fetch("/api/holidays").then((res) => res.json()),
      fetch("/api/regulatory").then((res) => res.json()),
      fetch("/api/events").then((res) => res.json()),
    ]);
    setPosts(p);
    setHolidays(h);
    setRegulatory(r);
    setEvents(e);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => {
    if (viewMode === "week") {
      // The Sun–Sat week containing `cursor` — defaults to the real
      // current week (cursor starts as today), but pages with it.
      const weekStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - cursor.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
      });
    }
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = first.getDay(); // 0 = Sunday
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor, viewMode]);

  const displayHolidays = useMemo(() => groupHolidaysForCalendar(holidays), [holidays]);

  function entriesFor(dateStr: string) {
    return {
      posts: posts.filter((p) => p.scheduled_date === dateStr),
      holidays: displayHolidays.filter((h) => h.date === dateStr),
      regulatory: regulatory.filter((r) => r.date === dateStr),
      events: events.filter((e) => e.event_date === dateStr),
    };
  }

  function openNew(dateStr: string) {
    if (!isEditor) return;
    setEditing(null);
    setPrefillDate(dateStr);
    setFormOpen(true);
  }
  function openEdit(p: Post) {
    setEditing(p);
    setFormOpen(true);
  }

  const currentMonth = cursor.getMonth();
  const todayStr = toISODate(new Date());
  // In week mode every one of the 7 displayed days belongs to "this page"
  // by definition — nothing should be grayed out the way days from the
  // previous/next month are in the month grid.
  const weekRangeLabel =
    viewMode === "week" && days.length === 7
      ? `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : null;
  const isCurrentWeek = viewMode === "week" && days.some((d) => toISODate(d) === todayStr);

  function goPrev() {
    if (viewMode === "week") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 7));
    } else {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    }
  }
  function goNext() {
    if (viewMode === "week") {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7));
    } else {
      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-md border border-line p-1.5 hover:bg-zinc-50">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h1 className="font-heading w-56 text-center text-lg font-semibold text-ink">
            {viewMode === "month" ? (
              monthLabel(cursor)
            ) : (
              <>
                {weekRangeLabel}
                {isCurrentWeek && (
                  <span className="ml-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                    This week
                  </span>
                )}
              </>
            )}
          </h1>
          <button onClick={goNext} className="rounded-md border border-line p-1.5 hover:bg-zinc-50">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="ml-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Today
          </button>
        </div>
        {isEditor && (
          <button
            onClick={() => openNew(todayStr)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            New post
          </button>
        )}
      </div>

      <PipelineHealthStrip posts={posts} viewMode={viewMode} onViewModeChange={setViewMode} />
      <SuggestionsPanel onAccepted={load} />

      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-line bg-zinc-50 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d) => {
            const dateStr = toISODate(d);
            // Every one of week mode's 7 days is "in range" by definition,
            // unlike the month grid's leading/trailing days from adjacent
            // months.
            const inMonth = viewMode === "week" || d.getMonth() === currentMonth;
            const isToday = dateStr === todayStr;
            const { posts: dayPosts, holidays: dayHolidays, regulatory: dayReg, events: dayEvents } = entriesFor(dateStr);
            return (
              <div
                key={dateStr}
                onClick={() => openNew(dateStr)}
                className={`group ${viewMode === "week" ? "min-h-[220px]" : "min-h-[104px]"} border-b border-r border-line p-1.5 text-left align-top ${
                  inMonth ? "bg-white" : "bg-zinc-50/60"
                } ${isEditor ? "cursor-pointer hover:bg-brand/5" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isToday
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"
                        : inMonth
                        ? "text-zinc-600"
                        : "text-zinc-300"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {isEditor && (
                    <Plus className="h-3.5 w-3.5 text-zinc-300 opacity-0 group-hover:opacity-100" />
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayHolidays.map((h) => (
                    <div
                      key={h.key}
                      title={h.tooltip}
                      className="flex items-center gap-1 truncate rounded bg-violet-50 px-1 py-0.5 text-[10px] text-violet-700"
                    >
                      <Gift className="h-2.5 w-2.5 shrink-0" />
                      {h.occasion}
                    </div>
                  ))}
                  {dayReg.map((r) => (
                    <div
                      key={r.id}
                      title={r.notes || r.occasion}
                      className="flex items-center gap-1 truncate rounded bg-sky-50 px-1 py-0.5 text-[10px] text-sky-700"
                    >
                      <Scale className="h-2.5 w-2.5 shrink-0" />
                      {r.occasion}
                    </div>
                  ))}
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-1 truncate rounded bg-orange-50 px-1 py-0.5 text-[10px] text-orange-700"
                    >
                      <CalendarClock className="h-2.5 w-2.5 shrink-0" />
                      {ev.name}
                    </div>
                  ))}
                  {dayPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                      title={`${p.category ? `[${p.category}] ` : ""}${p.caption || "(no caption)"}`}
                      className="flex items-center gap-1 truncate rounded border border-line bg-zinc-50 px-1 py-0.5 text-[10px] text-ink hover:bg-zinc-100"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                      {p.category ? `[${p.category}] ` : ""}{p.caption || "(no caption)"}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><Gift className="h-3 w-3 text-violet-600" /> Holiday</span>
        <span className="flex items-center gap-1"><Scale className="h-3 w-3 text-sky-600" /> Regulatory</span>
        <span className="flex items-center gap-1"><CalendarClock className="h-3 w-3 text-orange-600" /> Event</span>
        {Object.entries(STATUS_DOT).filter(([s]) => s !== "Archived").map(([s, c]) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${c}`} /> {s}
          </span>
        ))}
      </div>

      {loading && <p className="mt-3 text-xs text-zinc-400">Loading…</p>}

      {formOpen && (
        <PostForm
          editing={editing}
          prefillDate={prefillDate}
          onClose={() => setFormOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}
