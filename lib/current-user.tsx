"use client";

// Stand-in for real auth (matches work-tracker, which has no login at all).
// Picking one of the four editor names unlocks edit actions everywhere;
// anything else (including staying unselected) is read-only viewer access —
// the two-tier model from PRD §3, without building a login system for a
// four-person team with no approval workflow.

import { createContext, useContext, useEffect, useState } from "react";
import { EDITORS, type Editor } from "./types";

const STORAGE_KEY = "sct.currentUser";

type Ctx = {
  user: string | null;
  isEditor: boolean;
  setUser: (name: string | null) => void;
};

const CurrentUserContext = createContext<Ctx>({
  user: null,
  isEditor: false,
  setUser: () => {},
});

export function isEditorName(name: string | null): name is Editor {
  return !!name && (EDITORS as readonly string[]).includes(name);
}

export function CurrentUserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setUserState(stored);
    setHydrated(true);
  }, []);

  function setUser(name: string | null) {
    setUserState(name);
    if (name) window.localStorage.setItem(STORAGE_KEY, name);
    else window.localStorage.removeItem(STORAGE_KEY);
  }

  // Avoid a hydration flash where the server-rendered "viewer" state briefly
  // shows before localStorage loads.
  if (!hydrated) return <div className="min-h-screen" />;

  return (
    <CurrentUserContext.Provider value={{ user, isEditor: isEditorName(user), setUser }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(CurrentUserContext);
}
