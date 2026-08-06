import { ImageResponse } from "next/og";

// Special Next.js file convention — this route (and its export config
// below) is all that's needed for Next.js to auto-inject the correct
// og:image / og:image:width / og:image:height / twitter:image meta tags on
// every page that doesn't define its own. Generated on demand from brand
// colors, no static image asset to keep in sync.
export const runtime = "edge";
export const alt = "Social Content Tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #48297A 0%, #B31E7D 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 52,
              height: 44,
              border: "4px solid #fff",
              borderRadius: 6,
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 12, left: -4, right: -4, height: 4, background: "#fff" }} />
          </div>
        </div>
        <div style={{ fontSize: 60, fontWeight: 700, color: "#fff", letterSpacing: -1 }}>
          Social Content Tracker
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.85)", marginTop: 18 }}>
          Planning, production, and archive tracker for social content
        </div>
      </div>
    ),
    { ...size }
  );
}
