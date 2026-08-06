import type { Metadata } from "next";

// page.tsx in this route is a client component and can't export metadata
// itself — this thin server layout carries it instead, which is also what
// gives each route its own <title> instead of every page inheriting the
// same root title verbatim.
export const metadata: Metadata = {
  title: "All Entries",
  description: "Filter and manage every entry in the Social Content Tracker pipeline.",
  alternates: { canonical: "/list" },
};

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return children;
}
