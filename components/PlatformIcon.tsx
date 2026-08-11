import type { Platform } from "@/lib/types";

// Small, recognizable per-platform marks. The lucide-react version pinned
// in this project (1.28.0) doesn't ship brand icons (Instagram/LinkedIn/
// YouTube/Twitter aren't exported — only generic UI glyphs), so these are
// simplified inline SVGs rather than a library import. Colors match each
// platform's real brand color; Website uses Uniqus purple since it isn't a
// third-party brand.
const PLATFORM_META: Record<Platform, { bg: string; svg: string }> = {
  LinkedIn: {
    bg: "#0A66C2",
    svg: `<rect x="3" y="9" width="3.2" height="11" rx="0.5"/><circle cx="4.6" cy="5" r="1.8"/><path d="M10 20V9h3.1v1.6c.6-1 1.7-1.9 3.4-1.9 2.6 0 4.5 1.7 4.5 5.3V20h-3.2v-5.6c0-1.6-.6-2.7-2-2.7-1.1 0-1.8.8-2.1 1.5-.1.3-.1.7-.1 1.1V20H10z"/>`,
  },
  Instagram: {
    bg: "linear-gradient(135deg,#F58529,#DD2A7B 55%,#8134AF)",
    svg: `<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="#fff"/>`,
  },
  X: {
    bg: "#0F1419",
    svg: `<path d="M6 5l12 14M18 5L6 19" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>`,
  },
  YouTube: {
    bg: "#FF0000",
    svg: `<rect x="2.5" y="6" width="19" height="12" rx="4" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M10.5 9.5l5 2.5-5 2.5z" fill="#fff"/>`,
  },
  Website: {
    bg: "#48297A",
    svg: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="#fff" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="3.6" ry="8.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M4 10h16M4 14h16" stroke="#fff" stroke-width="1.6"/>`,
  },
};

export default function PlatformIcon({
  platform,
  size = 14,
  className = "",
}: {
  platform: Platform;
  size?: number;
  className?: string;
}) {
  const meta = PLATFORM_META[platform];
  if (!meta) return null;
  return (
    <span
      title={platform}
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] ${className}`}
      style={{ width: size, height: size, background: meta.bg }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.72}
        height={size * 0.72}
        fill="#fff"
        dangerouslySetInnerHTML={{ __html: meta.svg }}
      />
    </span>
  );
}
