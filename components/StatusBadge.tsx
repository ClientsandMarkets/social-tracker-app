import type { PostStatus } from "@/lib/types";

const STYLES: Record<PostStatus, string> = {
  Planned: "bg-zinc-100 text-zinc-600",
  "In progress": "bg-amber-100 text-amber-700",
  Ready: "bg-blue-100 text-blue-700",
  Posted: "bg-green-100 text-green-700",
  Archived: "bg-zinc-100 text-zinc-500",
};

export default function StatusBadge({ status, atRisk }: { status: PostStatus; atRisk?: boolean }) {
  if (atRisk) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        At risk
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {status}
    </span>
  );
}
