"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Trash2, ExternalLink } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import { PLATFORMS, REGIONS, EDITORS, type Post } from "@/lib/types";

export default function ArchivePage() {
  const { user, isEditor } = useCurrentUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [platform, setPlatform] = useState("");
  const [region, setRegion] = useState("");
  const [tag, setTag] = useState("");
  const [creator, setCreator] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/posts");
    const all: Post[] = await res.json();
    setPosts(all.filter((p) => p.archived_at));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return posts
      .filter((p) => !platform || p.platforms.includes(platform as never))
      .filter((p) => !region || p.region === region)
      .filter((p) => !tag || p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())))
      .filter((p) => !creator || p.owner === creator || p.posted_by === creator)
      .filter((p) => !from || p.scheduled_date >= from)
      .filter((p) => !to || p.scheduled_date <= to)
      .sort((a, b) => (a.scheduled_date < b.scheduled_date ? 1 : -1));
  }, [posts, platform, region, tag, creator, from, to]);

  function exportUrl() {
    const params = new URLSearchParams();
    if (platform) params.set("platform", platform);
    if (region) params.set("region", region);
    if (tag) params.set("tag", tag);
    if (creator) params.set("creator", creator);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/archive/export?${params.toString()}`;
  }

  async function handleDelete(p: Post) {
    if (!isEditor) return;
    if (!window.confirm("Permanently delete this archived post? This can't be undone.")) return;
    const res = await fetch(`/api/posts/${p.id}`, { method: "DELETE", headers: { "x-current-user": user || "" } });
    if (res.ok) await load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-lg font-semibold text-ink">Archive</h1>
        <a
          href={exportUrl()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50"
        >
          <Download className="h-4 w-4" />
          Export to Excel
        </a>
      </div>
      <p className="mb-4 text-sm text-zinc-500">
        Soft-archived automatically when a post is marked Posted — retained and downloadable, never
        deleted automatically. Editors can permanently remove an individual entry here if needed.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-3 shadow-sm">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Platform
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Region
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Creator
          <select value={creator} onChange={(e) => setCreator(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="">All</option>
            {EDITORS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          Tag
          <input value={tag} onChange={(e) => setTag(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          From
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-500">
          To
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-line px-2 py-1.5 text-sm" />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2">Date live</th>
              <th className="px-3 py-2">Caption</th>
              <th className="px-3 py-2">Creator</th>
              <th className="px-3 py-2">Posted by</th>
              <th className="px-3 py-2">Link</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-3 py-6 text-center text-zinc-400">Loading…</td></tr>}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-zinc-400">Nothing archived yet.</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-zinc-50">
                <td className="whitespace-nowrap px-3 py-2">{p.scheduled_date}</td>
                <td className="max-w-md truncate px-3 py-2" title={p.caption}>{p.caption || "—"}</td>
                <td className="px-3 py-2">{p.owner}</td>
                <td className="px-3 py-2">{p.posted_by || "—"}</td>
                <td className="px-3 py-2">
                  {p.post_live_link ? (
                    <a href={p.post_live_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  ) : "—"}
                </td>
                <td className="px-3 py-2">
                  {isEditor && (
                    <button onClick={() => handleDelete(p)} className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600" title="Permanently delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
