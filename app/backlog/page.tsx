"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Lightbulb } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import type { BacklogItem } from "@/lib/types";

export default function BacklogPage() {
  const { user, isEditor } = useCurrentUser();
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/backlog");
    setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !isEditor) return;
    setSaving(true);
    try {
      await fetch("/api/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-current-user": user || "" },
        body: JSON.stringify({
          title,
          description: description || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      setTitle("");
      setDescription("");
      setTags("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!isEditor) return;
    await fetch(`/api/backlog/${id}`, { method: "DELETE", headers: { "x-current-user": user || "" } });
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-brand" />
        <h1 className="font-heading text-lg font-semibold text-ink">Idea backlog</h1>
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        A running list of content ideas not yet scheduled — used to fill gaps when accepting a
        gap-fill, holiday, or regulatory suggestion from the calendar.
      </p>

      {isEditor && (
        <form onSubmit={handleAdd} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Title *
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client win: X onboarding milestone"
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Description
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Tags (comma separated)
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add idea
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {loading && <p className="text-sm text-zinc-400">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-zinc-400">No backlog items yet.</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-ink">{item.title}</p>
                {item.used_in_post_ids.length > 0 && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    used in {item.used_in_post_ids.length} post{item.used_in_post_ids.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
              {item.description && <p className="mt-0.5 text-sm text-zinc-500">{item.description}</p>}
              {item.tags.length > 0 && (
                <p className="mt-1 text-xs text-zinc-400">{item.tags.join(", ")}</p>
              )}
            </div>
            {isEditor && (
              <button onClick={() => handleDelete(item.id)} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
