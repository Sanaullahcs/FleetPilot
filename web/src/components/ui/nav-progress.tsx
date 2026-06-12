"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";

/**
 * Snappy top progress bar on dashboard route changes.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setActive(true);
    setProgress(40);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setActive(false);
        setProgress(0);
      }, 120);
    }, 100);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!active && progress === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-slate-100/80">
      <div
        className="h-full transition-all duration-150 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${brand.primary}, ${brand.cyan}, ${brand.accent})`,
          boxShadow: `0 0 8px ${brand.accent}66`,
        }}
      />
    </div>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [pathname]);

  return (
    <div
      className="transition-all duration-200 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
      }}
    >
      {children}
    </div>
  );
}

export function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-12 w-12">
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
          style={{ borderTopColor: brand.primary, borderRightColor: brand.cyan }}
        />
      </div>
      <p className="text-sm font-medium text-slate-500">Loading…</p>
    </div>
  );
}
