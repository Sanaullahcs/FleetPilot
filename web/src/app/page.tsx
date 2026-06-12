"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { getDashboardHomePath } from "@/lib/portal";

export default function Home() {
  const router = useRouter();
  const { token, hydrated, user } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token && user ? getDashboardHomePath(user.role) : "/login");
  }, [hydrated, token, user, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">Loading FleetPilot…</p>
    </main>
  );
}
