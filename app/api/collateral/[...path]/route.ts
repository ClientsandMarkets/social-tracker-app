import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";

// Vercel Blob on this plan only provisions private stores (no public-access
// option) — see app/api/upload/route.ts. Private blobs have no direct/signed
// URL a browser can hit unauthenticated; the SDK's own get() call requires
// BLOB_READ_WRITE_TOKEN server-side. So collateral links stored on posts
// point here instead of at *.blob.vercel-storage.com — this route holds the
// token and streams the file through, giving teammates an ordinary
// same-origin link that just works.
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { path: string[] } }) {
  const pathname = params.path.join("/");
  const result = await get(pathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(result.stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": result.blob.contentType || "application/octet-stream",
      "Content-Disposition": result.blob.contentDisposition || `inline; filename="${pathname}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
