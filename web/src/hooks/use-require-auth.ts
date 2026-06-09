"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { fetchMe } from "@/lib/auth-api";

/**
 * Client-side route guard. Waits for the persisted store to hydrate, then
 * revalidates the session against the API. Redirects to /login when missing.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { token, user, hydrated, setUser, clear } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;
    fetchMe()
      .then((fresh) => {
        if (active) setUser(fresh);
      })
      .catch(() => {
        if (active) {
          clear();
          router.replace("/login");
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [hydrated, token, router, setUser, clear]);

  return { user, loading: !hydrated || checking };
}
