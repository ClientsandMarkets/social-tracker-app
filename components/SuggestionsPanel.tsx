"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Check, X as XIcon } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import type { BacklogItem } from "@/lib/types";

type Suggestion = {
  key: string;
  kind: "holiday" | "regulatory" | "gapfill";
  title: string;
  detail: string;
  date: string | null;
  regions: string[];
  defaultCaption?: string;
};

const KIND_LABEL: Record<Suggestion["kind"], string> = {
  holiday: "Holiday",
  regulatory: "Regulatory",
  gapfill: "Gap-fill",
};

// PRD §8/§11 — gap-fill, holiday, and regulatory suggestions. All
// dismissible with no consequence; accepting creates a Planned entry,
// optionally pre-filled from one or more backlog items the editor picks.
export default function SuggestionsPanel({ onAccepted }: { onAccepted?: () => void }) {
  const { user, isEditor } = useCurrentUser();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const [pickedIds, setPickedIds] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  async function load() {
    const [sRes, bRes] = await Promise.all([fetch("/api/suggestions"), fetch("/api/backlog")]);
    if (sRes.ok) setSuggestions(await sRes.json());
    if (bRes.ok) setBacklog(await bRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function act(s: Suggestion, action: "accept" | "dismiss") {
    if (!isEditor) return;
    setBusy(true);
    try {
      await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-current-user": user || "" },
        body: JSON.stringify({
          action,
          key: s.key,
          title: s.title,
          date: s.date,
          regions: s.regions,
          default_caption: s.defaultCaption,
          backlog_item_ids: action === "accept" ? Array.from(pickedIds) : [],
        }),
      });
      setPicking(null);
      setPickedIds(new Set());
      await load();
      onAccepted?.();
    } finally {
      setBusy(false);
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
        <Lightbulb className="h-4 w-4" />
        {suggestions.length} open suggestion{suggestions.length === 1 ? "" : "s"}
      </div>
      <div className="space-y-2">
        {suggestions.map((s) => (
          <div key={s.key} className="rounded-lg border border-amber-200 bg-white p-2.5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="mr-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  {KIND_LABEL[s.kind]}
                </span>
                <span className="font-medium text-ink">{s.title}</span>
                <p className="mt-0.5 text-xs text-zinc-500">{s.detail}</p>
              </div>
              {isEditor && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    disabled={busy}
                    onClick={() => setPicking(picking === s.key ? null : s.key)}
                    className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                    Accept
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => act(s, "dismiss")}
                    className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <XIcon className="h-3 w-3" />
                    Dismiss
                  </button>
                </div>
              )}
            </div>
            {picking === s.key && (
              <div className="mt-2 rounded-md border border-line bg-zinc-50 p-2">
                <p className="mb-1.5 text-xs font-medium text-zinc-600">
                  Pull in backlog idea(s) for this post (optional, pick as many as fit):
                </p>
                <div className="max-h-32 space-y-1 overflow-y-auto">
                  {backlog.length === 0 && (
                    <p className="text-xs text-zinc-400">No backlog items yet.</p>
                  )}
                  {backlog.map((b) => (
                    <label key={b.id} className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={pickedIds.has(b.id)}
                        onChange={(e) =>
                          setPickedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(b.id);
                            else next.delete(b.id);
                            return next;
                          })
                        }
                      />
                      {b.title}
                    </label>
                  ))}
                </div>
                <button
                  disabled={busy}
                  onClick={() => act(s, "accept")}
                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  Create Planned post
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
