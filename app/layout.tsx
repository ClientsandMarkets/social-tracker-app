import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

// Only app/not-found.tsx (and any future page.tsx-based route) renders
// through this layout now — the main app lives at "/" via app/route.ts,
// which serves workspace.html directly and bypasses this tree entirely
// (Route Handlers aren't wrapped by layouts). TopNav/CurrentUserProvider
// were the old React page shell's chrome; workspace.html has its own.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const BASE_URL = "https://social-tracker-six.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Team Workspace",
    template: "%s · Team Workspace",
  },
  description: "Uniqus Team Workspace — Work Tracker and Marketing Tracker in one place, backed by live data.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Team Workspace",
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
    <html lang="en" className={spaceGrotesk.variable}>
      <body>{children}</body>
    </html>
  );
}
