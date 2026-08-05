import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { isEditorName } from "@/lib/current-user";
export const dynamic = "force-dynamic";

// Collateral attach (PRD §7.1, §16 — Vercel Blob for storage). Accepts a
// multipart form with a single "file" field and returns its public URL to
// store on the post's collateral_url field.
export async function POST(req: NextRequest) {
  const actingUser = req.headers.get("x-current-user");
  if (!isEditorName(actingUser)) {
    return NextResponse.json({ error: "Only editors can upload collateral." }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured — link to existing storage instead for now." },
      { status: 501 }
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "file is required." }, { status: 400 });
  }
  const filename = (file as File).name || `upload-${Date.now()}`;
  const blob = await put(filename, file, { access: "public", addRandomSuffix: true });
  return NextResponse.json({ url: blob.url, name: filename }, { status: 201 });
}
