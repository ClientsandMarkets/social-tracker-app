import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CurrentUserProvider } from "@/lib/current-user";
import TopNav from "@/components/TopNav";

// Self-hosted via next/font instead of the old CSS @import — that import
// added an extra network round trip before the heading font could even
// start loading, and gave no control over font-display. next/font inlines
// the @font-face at build time and preloads it automatically.
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
    default: "Social Content Tracker",
    template: "%s · Social Content Tracker",
  },
  description: "Planning, production, and archive tracker for LinkedIn, Instagram, X, and YouTube content.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Social Content Tracker",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#48297A",
};

// Minimal WebApplication structured data — this is an internal ops tool,
// not an article/publication, so WebApplication is the accurate schema.org
// type rather than reaching for Article/BlogPosting just to have "some"
// structured data.
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Social Content Tracker",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any (web browser)",
  description: "Planning, production, and archive tracker for LinkedIn, Instagram, X, and YouTube content.",
  url: BASE_URL,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <CurrentUserProvider>
          <TopNav />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </CurrentUserProvider>
      </body>
    </html>
  );
}
