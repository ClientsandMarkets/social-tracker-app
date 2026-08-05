"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Copy, Trash2, Plus, X } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import PostForm from "@/components/PostForm";
import StatusBadge from "@/components/StatusBadge";
import PipelineHealthStrip from "@/components/PipelineHealthStrip";
import { PLATFORMS, REGIONS, STATUSES, EDITORS, type Post } from "@/lib/types";

export default function ListPage() {
  const { user, isEditor } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);

  const [platform, setPlatform] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [creator, setCreator] = useState("");
  const [region, setRegion] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/posts");
    setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return posts
      .filter((p) => !p.archived_at) // archive lives on its own page
      .filter((p) => !platform || p.platforms.includes(platform as never))
      .filter((p) => !status || p.status === status)
      .filter((p) => !tag || p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())))
      .filter((p) => !creator || p.owner === creator)
      .filter((p) => !region || p.region === region)
      .filter((p) => !from || p.scheduled_date >= from)
      .filter((p) => !to || p.scheduled_date <= to)
      .sort((a, b) => (a.scheduled_date < b.scheduled_date ? -1 : 1));
  }, [posts, platform, status, tag, creator, region, from, to]);

  const hasFilters = platform || status || tag || creator || region || from || to;
  function clearFilters() {
    setPlatform("");
    setStatus("");
    setTag("");
    setCreator("");
    setRegion("");
    setFrom("");
    setTo("");
  }

  async function handleDuplicate(p: Post) {
    if (!isEditor) return;
    await fetch(`/api/posts/${p.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-current-user": user || "" },
      body: JSON.stringify({}),
    });
    await load();
  }

  async function handleDelete(p: Post) {
    if (!isEditor) return;
    if (!window.confirm("Permanently delete this post? This can't be undone.")) return;
    const res = await fetch(`/api/posts/${p.id}`, {
      method: "DELETE",
      headers: { "x-current-user": user || "" },
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      window.alert(j?.error || "Only archived posts can be permanently deleted.");
      return;
    }
    await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-ink">All entries</h1>
        {isEditor && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            New post
          </button>
        )}
      </div>

      <PipelineHealthStrip posts={posts} />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {STATUSES.filter((s) => s !== "Archived").map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Creator
          <select value={creator} onChange={(e) => setCreator(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {EDITORS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Tag
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="theme/campaign…" className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100">
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Platforms</th>
              <th className="px-3 py-2">Caption</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Region</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Tags</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-400">Loading…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-zinc-400">No entries match these filters.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-zinc-50">
                <td className="whitespace-nowrap px-3 py-2">{p.scheduled_date}</td>
                <td className="px-3 py-2">{p.platforms.join(", ") || "—"}</td>
                <td className="max-w-xs truncate px-3 py-2" title={p.caption}>{p.caption || <span className="text-zinc-400">(no caption)</span>}</td>
                <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                <td className="px-3 py-2">{p.region || "—"}</td>
                <td className="px-3 py-2">{p.owner}</td>
                <td className="px-3 py-2">{p.tags.join(", ") || "—"}</td>
                <td className="px-3 py-2">
                  {isEditor && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(p); setFormOpen(true); }} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDuplicate(p)} className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" title="Duplicate">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600" title="Delete (archived entries only)">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <PostForm editing={editing} onClose={() => setFormOpen(false)} onSaved={load} />
      )}
    </div>
  );
}
