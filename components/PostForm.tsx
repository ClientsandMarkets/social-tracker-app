"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Paperclip, X } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import { checkCaptionStyle } from "@/lib/style-check";
import { PLATFORMS, REGIONS, STATUSES, type Platform, type Post, type Region, type PostStatus, type BacklogItem } from "@/lib/types";

export type PostFormState = {
  platforms: Platform[];
  scheduled_date: string;
  status: PostStatus;
  caption: string;
  creative_notes: string;
  collateral_url: string;
  collateral_name: string;
  owner: string;
  tags: string; // comma-separated in the form, split on save
  region: Region | "";
  post_live_link: string;
  notes: string;
  backlog_item_ids: number[];
};

export function emptyPostForm(defaultOwner: string): PostFormState {
  return {
    platforms: [],
    scheduled_date: new Date().toISOString().slice(0, 10),
    status: "Planned",
    caption: "",
    creative_notes: "",
    collateral_url: "",
    collateral_name: "",
    owner: defaultOwner,
    tags: "",
    region: "",
    post_live_link: "",
    notes: "",
    backlog_item_ids: [],
  };
}

export function postToForm(p: Post): PostFormState {
  return {
    platforms: p.platforms || [],
    scheduled_date: p.scheduled_date,
    status: p.status,
    caption: p.caption || "",
    creative_notes: p.creative_notes || "",
    collateral_url: p.collateral_url || "",
    collateral_name: p.collateral_name || "",
    owner: p.owner,
    tags: (p.tags || []).join(", "),
    region: p.region || "",
    post_live_link: p.post_live_link || "",
    notes: p.notes || "",
    backlog_item_ids: p.backlog_item_ids || [],
  };
}

export default function PostForm({
  editing,
  prefillDate,
  onClose,
  onSaved,
}: {
  editing: Post | null;
  prefillDate?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, isEditor } = useCurrentUser();
  const [form, setForm] = useState<PostFormState>(() => {
    if (editing) return postToForm(editing);
    const base = emptyPostForm(user || "");
    return prefillDate ? { ...base, scheduled_date: prefillDate } : base;
  });
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/backlog")
      .then((r) => r.json())
      .then(setBacklog)
      .catch(() => {});
  }, []);

  const warnings = checkCaptionStyle(form.caption);

  function togglePlatform(p: Platform) {
    setForm((f) => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p],
    }));
  }

  function toggleBacklog(id: number) {
    setForm((f) => ({
      ...f,
      backlog_item_ids: f.backlog_item_ids.includes(id)
        ? f.backlog_item_ids.filter((x) => x !== id)
        : [...f.backlog_item_ids, id],
    }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-current-user": user || "" },
        body,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Upload failed.");
      }
      const { url, name } = await res.json();
      setForm((f) => ({ ...f, collateral_url: url, collateral_name: name }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEditor) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        region: form.region || null,
      };
      const url = editing ? `/api/posts/${editing.id}` : "/api/posts";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-current-user": user || "" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Couldn't save the post.");
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 p-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-xl border border-line bg-white p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-ink">
            {editing ? "Edit post" : "New post"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Platforms
            <div className="flex gap-3">
              {PLATFORMS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={form.platforms.includes(p)} onChange={() => togglePlatform(p)} />
                  {p}
                </label>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Scheduled date *
            <input
              type="date"
              required
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as PostStatus })}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {STATUSES.filter((s) => s !== "Archived").map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {form.status === "Posted" && (
              <span className="text-xs text-zinc-500">Manual flip only — this archives the post immediately.</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Caption
            <textarea
              rows={4}
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Post copy…"
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {warnings.length > 0 && (
              <div className="mt-1 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                {warnings.map((w) => (
                  <div key={w.rule} className="flex items-start gap-1">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {w.message}
                  </div>
                ))}
                <p className="text-[11px] italic text-amber-600">Soft warning — you can still save.</p>
              </div>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Creative / design notes
            <textarea
              rows={2}
              value={form.creative_notes}
              onChange={(e) => setForm({ ...form, creative_notes: e.target.value })}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Collateral (upload or link to existing storage)
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.collateral_url}
                onChange={(e) => setForm({ ...form, collateral_url: e.target.value })}
                placeholder="https://…"
                className="flex-1 rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                Upload
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Region
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value as Region })}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="">—</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tags (theme, campaign — comma separated)
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="thought-leadership, Q3-campaign"
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Owner (scheduled by) *
            <input
              type="text"
              value={form.owner}
              readOnly
              className="rounded-md border border-line bg-zinc-50 px-2 py-1.5 text-zinc-500"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Post-live link
            <input
              type="text"
              value={form.post_live_link}
              onChange={(e) => setForm({ ...form, post_live_link: e.target.value })}
              placeholder="Optional"
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>

          {backlog.length > 0 && (
            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              Idea backlog (optional, pick any that apply)
              <div className="max-h-24 space-y-1 overflow-y-auto rounded-md border border-line p-2">
                {backlog.map((b) => (
                  <label key={b.id} className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={form.backlog_item_ids.includes(b.id)}
                      onChange={() => toggleBacklog(b.id)}
                    />
                    {b.title}
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            Notes / brief
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-md border border-line px-2 py-1.5 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !isEditor}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create post"}
          </button>
        </div>
      </form>
    </div>
  );
}
