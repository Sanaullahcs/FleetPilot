"use client";

import { useCallback, useEffect, useState } from "react";

export function useDashboardDismiss(userId: string, sectionId: string) {
  const storageKey = `fp-dashboard-dismiss-${userId}-${sectionId}`;
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, [storageKey]);

  const restore = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    setDismissed(false);
  }, [storageKey]);

  return { dismissed, dismiss, restore, ready };
}
