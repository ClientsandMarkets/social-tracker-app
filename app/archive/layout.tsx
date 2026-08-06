import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive",
  description: "Published content history for the Social Content Tracker, with Excel export.",
  alternates: { canonical: "/archive" },
};

export default function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
