"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/brand";
import { useNavLoading } from "@/hooks/use-nav-loading";

/**
 * Top progress bar — starts immediately on nav click, completes when route settles.
 */
export function NavProgress() {
  const pathname = usePathname();
  const { isPending } = useNavLoading();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (creepRef.current) clearInterval(creepRef.current);
    timerRef.current = null;
    creepRef.current = null;
  };

  const begin = () => {
    clearTimers();
    setActive(true);
    setProgress(18);

    creepRef.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 6 : p));
    }, 180);
  };

  const finish = () => {
    clearTimers();
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 140);
  };

  useEffect(() => {
    if (isPending) begin();
  }, [isPending]);

  useEffect(() => {
    if (isPending) finish();
    else if (active) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => () => clearTimers(), []);

  if (!active && progress === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[2px] overflow-hidden bg-slate-100/80">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${brand.primary}, ${brand.cyan}, ${brand.accent})`,
          boxShadow: `0 0 8px ${brand.accent}66`,
        }}
      />
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
