// Plain (non-"use client") module for isEditorName. It used to live in
// lib/current-user.tsx, but that file is "use client" — importing a
// function from a client-marked module into server-side API routes breaks
// in production bundling (the function gets replaced with a stub, throwing
// "is not a function" at request time, even though it worked in local dev).
// This caused every write endpoint — create/update/delete posts, and
// accept/dismiss on suggestions — to 500. Keeping the actual logic here,
// with no client directive, fixes that; lib/current-user.tsx re-exports it
// for existing client-side imports.

import { EDITORS, type Editor } from "./types";

export function isEditorName(name: string | null): name is Editor {
  return !!name && (EDITORS as readonly string[]).includes(name);
}
