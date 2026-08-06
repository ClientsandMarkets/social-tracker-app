import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Idea Backlog",
  description: "Content ideas not yet scheduled, ready to pull into a post when accepting a suggestion.",
  alternates: { canonical: "/backlog" },
};

export default function BacklogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
