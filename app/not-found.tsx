import Link from "next/link";
import { CalendarDays } from "lucide-react";

// Custom 404 — replaces Next.js's bare unstyled default. The main app lives
// at "/" via app/route.ts (a raw HTML response, not a page.tsx), so this is
// the only route that still renders through app/layout.tsx — still on-brand
// (fonts/colors) even though there's no shared nav to inherit from it.
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-accent shadow-sm">
        <CalendarDays className="h-7 w-7 text-white" strokeWidth={2.25} />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist, or the link is out of date.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to Team Workspace
      </Link>
    </div>
  );
}
