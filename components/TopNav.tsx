"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Table2, Lightbulb, Archive, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import { EDITORS } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Calendar", icon: CalendarDays },
  { href: "/list", label: "List", icon: Table2 },
  { href: "/backlog", label: "Idea backlog", icon: Lightbulb },
  { href: "/archive", label: "Archive", icon: Archive },
];

export default function TopNav() {
  const pathname = usePathname();
  const { user, isEditor, setUser } = useCurrentUser();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent shadow-sm">
              <CalendarDays className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
            </div>
            <span className="font-heading text-lg font-semibold tracking-tight text-ink">
              Social Content Tracker
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-brand text-white" : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative">
          <select
            value={user || ""}
            onChange={(e) => setUser(e.target.value || null)}
            className="appearance-none rounded-lg border border-line bg-white px-3 py-1.5 pr-8 text-sm font-medium text-zinc-700 shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            title="Who are you? Editors get edit access; anything else is view-only."
          >
            <option value="">Viewer (read-only)</option>
            {EDITORS.map((e) => (
              <option key={e} value={e}>
                {e} (editor)
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>
      {!isEditor && (
        <div className="bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-700">
          Viewing in read-only mode — pick your name above to edit.
        </div>
      )}
    </header>
  );
}
