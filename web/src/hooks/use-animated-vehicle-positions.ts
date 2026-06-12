"use client";

import { useEffect, useRef, useState } from "react";
import type { FleetLiveVehicle } from "@/lib/types";

export type AnimatedPosition = { lat: number; lng: number; heading: number };

function lerpHeading(from: number, to: number, t: number) {
  const delta = ((to - from + 540) % 360) - 180;
  return from + delta * t;
}

/** Smoothly interpolates GPS positions between poll ticks for live map feel. */
export function useAnimatedVehiclePositions(
  vehicles: FleetLiveVehicle[],
  durationMs = 3800,
  enabled = true,
): Map<string, AnimatedPosition> {
  const positionsRef = useRef<Map<string, AnimatedPosition>>(new Map());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const staticPositions = new Map(
      vehicles.map((v) => [v.id, { lat: v.latitude, lng: v.longitude, heading: v.heading }] as const),
    );
    positionsRef.current = staticPositions;
    setVersion((n) => n + 1);

    if (!enabled || vehicles.length === 0) {
      return;
    }

    const starts = new Map(staticPositions);
    const targets = staticPositions;
    const startTime = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const next = new Map<string, AnimatedPosition>();

      for (const v of vehicles) {
        const target = targets.get(v.id)!;
        const start = starts.get(v.id) ?? target;
        next.set(v.id, {
          lat: start.lat + (target.lat - start.lat) * eased,
          lng: start.lng + (target.lng - start.lng) * eased,
          heading: lerpHeading(start.heading, target.heading, eased),
        });
      }

      positionsRef.current = next;
      setVersion((n) => n + 1);

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [vehicles, durationMs, enabled]);

  void version;
  return positionsRef.current;
}
