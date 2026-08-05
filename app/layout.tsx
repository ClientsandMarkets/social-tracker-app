import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CurrentUserProvider } from "@/lib/current-user";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "📅 Social Content Tracker",
  description: "Planning, production, and archive tracker for LinkedIn, Instagram, and X content",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "📅 Social Content Tracker",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#48297A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CurrentUserProvider>
          <TopNav />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
